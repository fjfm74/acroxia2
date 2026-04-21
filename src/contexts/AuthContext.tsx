import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  credits: number;
  user_type: "inquilino" | "propietario" | "profesional" | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Reconcilia los analisis anonimos PAGADOS con la cuenta del usuario.
 * Busca por (session_id local OR email del usuario) para cubrir el caso
 * donde el usuario paga anonimo, pierde el session_id (otra pestaña/dispositivo)
 * y vuelve a registrarse con el mismo email.
 * Idempotente: si el contract ya existe (creado por el webhook), solo actualiza
 * converted_to_user_id; no duplica.
 */
const linkAnonymousAnalyses = async (userId: string, userEmail: string) => {
  try {
    const sessionId = localStorage.getItem("acroxia_session_id");
    const normalizedEmail = (userEmail || "").trim().toLowerCase();

    // Construir filtro: (session_id = X OR email = Y) AND paid = true AND converted_to_user_id IS NULL
    const orFilters: string[] = [];
    if (sessionId) orFilters.push(`session_id.eq.${sessionId}`);
    if (normalizedEmail) orFilters.push(`email.eq.${normalizedEmail}`);

    if (orFilters.length === 0) {
      console.log("[reconcile] sin session_id ni email, nada que reconciliar");
      return;
    }

    const { data: analyses, error: queryError } = await supabase
      .from("anonymous_analyses")
      .select("*")
      .or(orFilters.join(","))
      .eq("paid", true)
      .is("converted_to_user_id", null);

    if (queryError) {
      console.error("[reconcile] error consultando anonymous_analyses:", queryError);
      return;
    }

    if (!analyses || analyses.length === 0) {
      console.log(`[reconcile] ningun analisis pendiente de reconciliar (email=${normalizedEmail})`);
      localStorage.removeItem("acroxia_session_id");
      localStorage.removeItem("acroxia_user_type");
      return;
    }

    console.log(`[reconcile] reconciliando ${analyses.length} analisis pagados por email ${normalizedEmail}`);

    for (const analysis of analyses) {
      // 1) Comprobar si el webhook ya creo el contract
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("source_analysis_id", analysis.id)
        .maybeSingle();

      if (existingContract) {
        console.log(
          `[reconcile] contract ya existente (${existingContract.id}) para analysis ${analysis.id}, solo actualizo converted_to_user_id`
        );
        await supabase
          .from("anonymous_analyses")
          .update({ converted_to_user_id: userId, email: normalizedEmail })
          .eq("id", analysis.id);
        continue;
      }

      // 2) No existe contract: crearlo vinculado al analysis original
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          user_id: userId,
          file_name: analysis.file_name,
          file_path: analysis.file_path || "",
          status: "completed",
          source_analysis_id: analysis.id,
          full_access: true,
        })
        .select()
        .single();

      if (contractError || !contract) {
        console.error(`[reconcile] error creando contract para analysis ${analysis.id}:`, contractError);
        continue;
      }

      console.log(`[reconcile] contract nuevo creado ${contract.id} con source_analysis_id=${analysis.id}`);

      // 3) Copiar resultado del analisis si existe
      if (analysis.analysis_result) {
        const report = analysis.analysis_result as any;
        const clauses = report?.clauses || [];

        await supabase.from("analysis_results").insert({
          contract_id: contract.id,
          full_report: report,
          total_clauses: clauses.length,
          valid_clauses: report?.summary?.valid_count ?? clauses.filter((c: any) => c.type === "valid").length,
          suspicious_clauses:
            report?.summary?.suspicious_count ?? clauses.filter((c: any) => c.type === "suspicious").length,
          illegal_clauses:
            report?.summary?.illegal_count ?? clauses.filter((c: any) => c.type === "illegal").length,
          summary: report?.summary?.executive_summary || "",
        });
      }

      // 4) Marcar como convertido
      await supabase
        .from("anonymous_analyses")
        .update({ converted_to_user_id: userId, email: normalizedEmail })
        .eq("id", analysis.id);
    }

    localStorage.removeItem("acroxia_session_id");
    localStorage.removeItem("acroxia_user_type");

    console.log(`[reconcile] completado: ${analyses.length} analisis procesados para user ${userId}`);
  } catch (error) {
    console.error("[reconcile] error inesperado:", error);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track previous email_confirmed_at to detect verification transition (null -> timestamp)
  const prevEmailConfirmedAtRef = useRef<string | null | undefined>(undefined);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    prevEmailConfirmedAtRef.current = undefined;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const currentConfirmedAt = (session.user as any).email_confirmed_at ?? null;
        const prevConfirmedAt = prevEmailConfirmedAtRef.current;
        // Detect freshly verified email: previously null/undefined, now a timestamp
        const justVerified =
          (prevConfirmedAt === null || prevConfirmedAt === undefined) && !!currentConfirmedAt;

        // Use setTimeout to avoid potential race conditions
        setTimeout(async () => {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);

          // Reconciliar en login, en USER_UPDATED, o cuando detectamos verificacion de email
          if (event === "SIGNED_IN" || event === "USER_UPDATED" || justVerified) {
            if (justVerified) {
              console.log("[reconcile] disparado por verificacion de email recien confirmada");
            }
            await linkAnonymousAnalyses(session.user.id, session.user.email || "");
          }
        }, 0);

        prevEmailConfirmedAtRef.current = currentConfirmedAt;
      } else {
        setProfile(null);
        prevEmailConfirmedAtRef.current = undefined;
      }

      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        prevEmailConfirmedAtRef.current = (session.user as any).email_confirmed_at ?? null;
        fetchProfile(session.user.id).then(setProfile);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

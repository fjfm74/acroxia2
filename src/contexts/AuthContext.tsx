import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
 * Vincula los analisis anonimos de la sesion actual con la cuenta del usuario.
 * Lee el session_id de localStorage, busca analisis no convertidos,
 * los marca como convertidos y copia los datos a las tablas del usuario.
 */
const linkAnonymousAnalyses = async (userId: string, userEmail: string) => {
  try {
    const sessionId = localStorage.getItem("acroxia_session_id");
    if (!sessionId) return;

    const { data: analyses } = await supabase
      .from("anonymous_analyses")
      .select("*")
      .eq("session_id", sessionId)
      .is("converted_to_user_id", null);

    if (!analyses || analyses.length === 0) return;

    for (const analysis of analyses) {
      // Marcar como convertido
      await supabase
        .from("anonymous_analyses")
        .update({ converted_to_user_id: userId, email: userEmail })
        .eq("id", analysis.id);

      // Crear contrato en la tabla del usuario
      const { data: contract } = await supabase
        .from("contracts")
        .insert({
          user_id: userId,
          file_name: analysis.file_name,
          file_path: analysis.file_path,
          status: "completed",
        })
        .select()
        .single();

      // Copiar resultado del analisis si existe
      if (contract && analysis.analysis_result) {
        const report = analysis.analysis_result as any;
        const clauses = report?.clauses || [];

        await supabase.from("analysis_results").insert({
          contract_id: contract.id,
          full_report: report,
          total_clauses: clauses.length,
          valid_clauses: report?.summary?.valid_count ?? clauses.filter((c: any) => c.type === "valid").length,
          suspicious_clauses:
            report?.summary?.suspicious_count ?? clauses.filter((c: any) => c.type === "suspicious").length,
          illegal_clauses: report?.summary?.illegal_count ?? clauses.filter((c: any) => c.type === "illegal").length,
          summary: report?.summary?.executive_summary || "",
        });
      }
    }

    // Limpiar localStorage
    localStorage.removeItem("acroxia_session_id");
    localStorage.removeItem("acroxia_user_type");

    console.log(`Linked ${analyses.length} anonymous analyses to user ${userId}`);
  } catch (error) {
    console.error("Error linking anonymous analyses:", error);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid potential race conditions
        setTimeout(async () => {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);

          // Vincular analisis anonimos en login o registro
          if (event === "SIGNED_IN" || event === "USER_UPDATED") {
            await linkAnonymousAnalyses(session.user.id, session.user.email || "");
          }
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
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

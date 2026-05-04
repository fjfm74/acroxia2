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

// Shape devuelto por la RPC link_paid_anonymous_to_user.
// Tipado manual: los tipos auto-generados de Supabase aun no conocen esta RPC
// hasta que se regenere src/integrations/supabase/types.ts.
type LinkPaidAnonymousResult = {
  analysis_id: string;
  contract_id: string;
  was_already_linked: boolean;
};

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
 * Llama a la RPC `link_paid_anonymous_to_user` (SECURITY DEFINER) que esquiva
 * el RLS de anonymous_analyses. La RPC busca por session_id (de localStorage)
 * y/o por email del JWT, crea contracts/analysis_results idempotentemente y
 * marca converted_to_user_id.
 */
const linkAnonymousAnalyses = async (userId: string, userEmail: string) => {
  try {
    const sessionId = localStorage.getItem("acroxia_session_id");
    const normalizedEmail = (userEmail || "").trim().toLowerCase();

    if (!sessionId && !normalizedEmail) {
      console.log("[reconcile] sin session_id ni email, nada que reconciliar");
      return;
    }

    // Cast del nombre de la RPC porque types.ts auto-generado aun no la incluye.
    const { data, error: rpcError } = await supabase.rpc("link_paid_anonymous_to_user" as any, {
      p_session_id: sessionId || null,
    });

    if (rpcError) {
      console.error("[reconcile] error llamando link_paid_anonymous_to_user:", rpcError);
      return;
    }

    const linked = (data ?? []) as LinkPaidAnonymousResult[];

    if (linked.length === 0) {
      console.log(
        `[reconcile] ningun analisis pendiente de reconciliar (user ${userId}, email=${normalizedEmail}) — conservo session_id para reintentar en proximo SIGNED_IN/USER_UPDATED`,
      );
      return;
    }

    console.log(`[reconcile] reconciliados ${linked.length} analisis para user ${userId}:`, linked);

    // Limpiar localStorage solo cuando hubo reconciliacion exitosa
    localStorage.removeItem("acroxia_session_id");
    localStorage.removeItem("acroxia_user_type");
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
        const justVerified = (prevConfirmedAt === null || prevConfirmedAt === undefined) && !!currentConfirmedAt;

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

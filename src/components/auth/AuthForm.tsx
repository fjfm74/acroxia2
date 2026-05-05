import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { checkUserIsAdmin } from "@/hooks/useIsAdmin";
import { checkUserIsLandlord } from "@/hooks/useIsLandlord";
import { trackConversion, identifyUser } from "@/lib/analytics";
import { emailSchema, passwordSchema, fullNameSchema } from "@/lib/validations";

type UserType = "inquilino" | "propietario" | "profesional";

interface AuthFormProps {
  mode: "login" | "register";
  prefilledEmail?: string;
  prefilledUserType?: UserType;
}

const getPostAuthRedirect = async (
  userId: string,
  userType: UserType | null,
  fromPath: string | null,
): Promise<string> => {
  const returnUrl = localStorage.getItem("acroxia_return_url");
  if (returnUrl) {
    localStorage.removeItem("acroxia_return_url");
    return returnUrl;
  }
  if (fromPath && fromPath !== "/login" && fromPath !== "/registro") {
    return fromPath;
  }
  const isAdmin = await checkUserIsAdmin(userId);
  if (isAdmin) return "/admin";
  const isLandlord = await checkUserIsLandlord(userId);
  if (isLandlord || userType === "propietario") return "/propietario";
  if (userType === "profesional") return "/pro";
  return "/dashboard";
};

const AuthForm = ({ mode, prefilledEmail, prefilledUserType }: AuthFormProps) => {
  const [email, setEmail] = useState(prefilledEmail || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const savedUserType = localStorage.getItem("acroxia_user_type") as UserType | null;
  const [userType, setUserType] = useState<UserType | null>(
    prefilledUserType ||
      (savedUserType && ["inquilino", "propietario", "profesional"].includes(savedUserType)
        ? (savedUserType as UserType)
        : null),
  );
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Sync prefilled values cuando llegan tras un fetch async
  useEffect(() => {
    if (prefilledEmail && !email) setEmail(prefilledEmail);
  }, [prefilledEmail, email]);
  useEffect(() => {
    if (prefilledUserType && !userType) setUserType(prefilledUserType);
  }, [prefilledUserType, userType]);

  const fromPath = (location.state as any)?.from?.pathname || null;
  const isEmailPrefilled = mode === "register" && !!prefilledEmail && email === prefilledEmail;

  const handleResendVerification = async (targetEmail: string) => {
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: targetEmail });
      if (error) throw error;
      toast({
        title: "Email reenviado",
        description: "Revisa tu bandeja de entrada (también en spam).",
      });
    } catch (err: any) {
      toast({
        title: "No pudimos reenviar el email",
        description: err?.message || "Inténtalo en unos minutos.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Email invalido",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const validatedEmail = emailResult.data;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "Contrasena invalida",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
        const nameResult = fullNameSchema.safeParse(fullName);
        if (!nameResult.success) {
          toast({
            title: "Nombre invalido",
            description: nameResult.error.errors[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const validatedName = nameResult.data;

        if (!acceptedTerms) {
          toast({
            title: "Terminos requeridos",
            description: "Debes aceptar los Terminos y la Politica de Privacidad para continuar.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!userType) {
          toast({
            title: "Tipo de usuario requerido",
            description: "Por favor, indica si eres inquilino, propietario o profesional.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: validatedEmail,
          password,
          options: {
            emailRedirectTo: "https://acroxia.com/verificado",
            data: {
              full_name: validatedName,
              user_type: userType,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const now = new Date().toISOString();

          await supabase
            .from("profiles")
            .update({
              terms_accepted_at: now,
              privacy_accepted_at: now,
              user_type: userType,
              marketing_consent: marketingConsent,
              marketing_consent_at: marketingConsent ? now : null,
            })
            .eq("id", data.user.id);

          if (userType === "propietario") {
            await supabase.from("user_roles").insert({
              user_id: data.user.id,
              role: "landlord",
            });
          } else if (userType === "profesional") {
            await supabase.from("user_roles").insert({
              user_id: data.user.id,
              role: "professional",
            });
          }

          await supabase.from("consent_logs").insert({
            user_id: data.user.id,
            consent_type: "terms_and_privacy",
            accepted: true,
            user_agent: navigator.userAgent,
            document_version: "2026-01-18",
            metadata: {
              terms_version: "2026-01-18",
              privacy_version: "2026-01-18",
              registration_email: email,
              user_type: userType,
            },
          });

          if (marketingConsent) {
            await supabase.from("consent_logs").insert({
              user_id: data.user.id,
              consent_type: "marketing_consent",
              accepted: true,
              user_agent: navigator.userAgent,
              document_version: "2026-01-18",
              metadata: {
                user_type: userType,
                registration_email: email,
              },
            });
          }
        }

        trackConversion("sign_up", {
          method: "email",
          user_id: data.user?.id,
          user_type: userType,
        });
        if (data.user) identifyUser(data.user.id);

        toast({
          title: "Cuenta creada!",
          description: data.session
            ? "Tu cuenta ha sido creada exitosamente. Ya puedes acceder."
            : "Te hemos enviado un email para verificar tu cuenta.",
        });

        // Si Supabase requiere email verification, data.session será null.
        // En ese caso, si venimos del flujo de checkout, navegar a la página de
        // "verificación pendiente" con el contexto del análisis para no dejar al
        // user en la pantalla de "Crea cuenta" otra vez.
        if (data.user && !data.session) {
          const params = new URLSearchParams(window.location.search);
          const checkoutSuccess = params.get("checkout") === "success";
          const analysisId = params.get("analysisId");
          if (checkoutSuccess) {
            const target = `/verificacion-pendiente?email=${encodeURIComponent(data.user.email || email)}${
              analysisId ? `&analysisId=${analysisId}` : ""
            }`;
            navigate(target);
            return;
          }
          // Sin contexto de checkout, mandamos también a verificación pendiente
          // para que el user no quede atrapado intentando login con error.
          navigate(`/verificacion-pendiente?email=${encodeURIComponent(data.user.email || email)}`);
          return;
        }

        if (data.user && data.session) {
          const redirectPath = await getPostAuthRedirect(data.user.id, userType, fromPath);
          navigate(redirectPath);
        } else {
          navigate("/dashboard");
        }
      } else {
        // mode === "login"
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validatedEmail,
          password,
        });

        if (error) {
          // Traducción y CTA reenvío para "Email not confirmed"
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("email not confirmed")) {
            toast({
              title: "Verifica tu email primero",
              description:
                "Tu cuenta existe pero el email aún no está verificado. Revisa tu bandeja de entrada (o spam).",
              variant: "destructive",
            });
            await handleResendVerification(validatedEmail);
            setLoading(false);
            return;
          }
          throw error;
        }

        trackConversion("login", { method: "email", user_id: data.user.id });
        identifyUser(data.user.id);

        toast({
          title: "Bienvenido!",
          description: "Has iniciado sesion correctamente.",
        });

        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        const redirectPath = await getPostAuthRedirect(
          data.user.id,
          (profileData?.user_type as UserType) || null,
          fromPath,
        );
        navigate(redirectPath);
      }
    } catch (error: any) {
      const rawMsg = (error?.message || "").toString();
      const lower = rawMsg.toLowerCase();
      let translated = rawMsg || "Ha ocurrido un error. Inténtalo de nuevo.";
      if (lower.includes("password is known to be weak") || lower.includes("breached") || lower.includes("pwned")) {
        translated =
          "Esa contraseña aparece en filtraciones públicas conocidas. Por seguridad, usa una distinta (mínimo 8 caracteres, con letras y números, que no hayas reutilizado).";
      } else if (lower.includes("password should be at least")) {
        translated = "La contraseña es demasiado corta. Usa al menos 8 caracteres con letras y números.";
      } else if (lower.includes("user already registered") || lower.includes("already exists")) {
        translated = "Ya existe una cuenta con ese email. Prueba a iniciar sesión.";
      }
      toast({
        title: "Error",
        description: translated,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesion con Google.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesion con Apple.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const userTypeOptions: { value: UserType; label: string }[] = [
    { value: "inquilino", label: "Inquilino" },
    { value: "propietario", label: "Propietario" },
    { value: "profesional", label: "Profesional" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
            required
            className="bg-background"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Correo electronico</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="bg-background"
        />
        {isEmailPrefilled && (
          <p className="text-xs text-muted-foreground">
            Hemos prerrellenado tu email del pago. Si quieres usar otro, edítalo (el email debe coincidir con el del
            pago para vincular tu informe).
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contrasena</Label>
          {mode === "login" && (
            <Link
              to="/recuperar-contrasena"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Olvidaste tu contrasena?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="bg-background pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {mode === "register" && (
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres, con letras y números. Evita contraseñas obvias o reutilizadas.
          </p>
        )}
      </div>

      {mode === "register" && (
        <>
          <div className="space-y-3">
            <Label>Soy principalmente...</Label>
            <div className="flex flex-wrap gap-2">
              {userTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUserType(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    userType === option.value
                      ? "bg-foreground text-background"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              He leido y acepto los{" "}
              <Link to="/terminos" className="text-primary hover:underline" target="_blank">
                Terminos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link to="/privacidad" className="text-primary hover:underline" target="_blank">
                Politica de Privacidad
              </Link>
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Acepto recibir comunicaciones comerciales y novedades de ACROXIA por email. Puedo darme de baja en
              cualquier momento.
            </Label>
          </div>
        </>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || (mode === "register" && (!acceptedTerms || !userType))}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "login" ? "Iniciar sesion" : "Crear cuenta"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">O continua con</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>

      <Button type="button" variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={loading}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        Apple
      </Button>
    </form>
  );
};

export default AuthForm;

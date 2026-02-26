import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { checkUserIsAdmin } from "@/hooks/useIsAdmin";
import { trackConversion, identifyUser } from "@/lib/analytics";
import { emailSchema, passwordSchema, fullNameSchema } from "@/lib/validations";

interface AuthFormProps {
  mode: "login" | "register";
}

type UserType = "inquilino" | "propietario" | "profesional";

const AuthForm = ({ mode }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email with Zod
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Email inválido",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const validatedEmail = emailResult.data;

    // Validate password with Zod
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "Contraseña inválida",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
        // Validate full name for registration
        const nameResult = fullNameSchema.safeParse(fullName);
        if (!nameResult.success) {
          toast({
            title: "Nombre inválido",
            description: nameResult.error.errors[0].message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const validatedName = nameResult.data;

        if (!acceptedTerms) {
          toast({
            title: "Términos requeridos",
            description: "Debes aceptar los Términos y la Política de Privacidad para continuar.",
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
            emailRedirectTo: window.location.origin,
            data: {
              full_name: validatedName,
            },
          },
        });

        if (error) throw error;

        // Save terms acceptance timestamp, user type, marketing consent and log consent
        if (data.user) {
          const now = new Date().toISOString();
          
          // Update profile with acceptance timestamps and user segmentation
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

          // Log terms and privacy consent in audit log
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

          // Log marketing consent separately if accepted
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

        // Track sign_up conversion
        trackConversion('sign_up', {
          method: 'email',
          user_id: data.user?.id,
          user_type: userType,
        });
        if (data.user) {
          identifyUser(data.user.id);
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Tu cuenta ha sido creada exitosamente. Ya puedes acceder.",
        });

        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validatedEmail,
          password,
        });

        if (error) throw error;

        // Track login conversion
        trackConversion('login', {
          method: 'email',
          user_id: data.user.id,
        });
        identifyUser(data.user.id);

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        // Check if user is admin and redirect accordingly
        const isAdmin = await checkUserIsAdmin(data.user.id);
        navigate(isAdmin ? "/admin" : "/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error. Inténtalo de nuevo.",
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
        description: error.message || "Error al iniciar sesión con Google.",
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
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          {mode === "login" && (
            <Link 
              to="/recuperar-contrasena" 
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              ¿Olvidaste tu contraseña?
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
      </div>

      {mode === "register" && (
        <>
          {/* User Type Selector */}
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

          {/* Terms and Privacy Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              He leído y acepto los{" "}
              <Link to="/terminos" className="text-primary hover:underline" target="_blank">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link to="/privacidad" className="text-primary hover:underline" target="_blank">
                Política de Privacidad
              </Link>
            </Label>
          </div>

          {/* Marketing Consent Checkbox (optional) */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Acepto recibir comunicaciones comerciales y novedades de ACROXIA por email. Puedo darme de baja en cualquier momento.
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
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
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
    </form>
  );
};

export default AuthForm;

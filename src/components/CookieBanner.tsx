import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  acceptedAt: string | null;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  acceptedAt: null,
};

const COOKIE_KEY = "cookie-consent";

const CookieBanner = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const logCookieConsent = async (prefs: CookiePreferences) => {
    if (!user) return;
    
    try {
      // Log analytics consent
      if (prefs.analytics) {
        await supabase.from("consent_logs").insert({
          user_id: user.id,
          consent_type: "cookies_analytics",
          accepted: true,
          user_agent: navigator.userAgent,
          document_version: "2026-01-08",
          metadata: {
            functional: prefs.functional,
            analytics: prefs.analytics,
          },
        });
      }
      
      // Update profile with cookie preferences
      await supabase
        .from("profiles")
        .update({
          cookies_consent: {
            essential: true,
            functional: prefs.functional,
            analytics: prefs.analytics,
            acceptedAt: new Date().toISOString(),
          },
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error logging cookie consent:", error);
    }
  };

  const savePreferences = (prefs: CookiePreferences) => {
    const withTimestamp = { ...prefs, acceptedAt: new Date().toISOString() };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(withTimestamp));
    setPreferences(withTimestamp);
    setShowBanner(false);
    setShowSettings(false);
    
    // Log consent to database if user is logged in
    logCookieConsent(withTimestamp);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      acceptedAt: null,
    });
  };

  const rejectNonEssential = () => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      acceptedAt: null,
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Banner */}
      {showBanner && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-background border border-border rounded-2xl shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold mb-2">
                    Utilizamos cookies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Usamos cookies esenciales para el funcionamiento del sitio y otras opcionales 
                    para mejorar tu experiencia. Puedes aceptar todas, rechazar las no esenciales 
                    o configurar tus preferencias.{" "}
                    <Link to="/cookies" className="text-primary hover:underline">
                      Más información
                    </Link>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={acceptAll} size="sm">
                      Aceptar todas
                    </Button>
                    <Button onClick={rejectNonEssential} variant="outline" size="sm">
                      Rechazar no esenciales
                    </Button>
                    <Button 
                      onClick={() => setShowSettings(true)} 
                      variant="ghost" 
                      size="sm"
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Configuración de cookies</DialogTitle>
            <DialogDescription>
              Personaliza qué cookies deseas permitir. Las cookies esenciales no pueden desactivarse.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Essential */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies esenciales</Label>
                <p className="text-sm text-muted-foreground">
                  Necesarias para el funcionamiento básico del sitio: autenticación, seguridad y 
                  preferencias de cookies.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies funcionales</Label>
                <p className="text-sm text-muted-foreground">
                  Permiten recordar tus preferencias como el estado del menú lateral o el tema visual.
                </p>
              </div>
              <Switch 
                checked={preferences.functional}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, functional: checked }))
                }
              />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">Cookies analíticas</Label>
                <p className="text-sm text-muted-foreground">
                  Nos ayudan a entender cómo interactúas con el sitio para mejorarlo. 
                  Actualmente no utilizamos cookies analíticas.
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={saveCustomPreferences} className="flex-1">
              Guardar preferencias
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Consulta nuestra{" "}
            <Link to="/cookies" className="underline" onClick={() => setShowSettings(false)}>
              Política de Cookies
            </Link>{" "}
            para más información.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;

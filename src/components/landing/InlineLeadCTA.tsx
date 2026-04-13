import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import { trackConversion } from "@/lib/analytics";

const SESSION_KEY = "acroxia_session_id";

const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const InlineLeadCTA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const sessionId = getOrCreateSessionId();

      await supabase.from("leads").insert({
        email,
        session_id: sessionId,
        source: "homepage_inline_cta",
      });

      trackConversion("lead_captured", { source: "homepage_inline_cta" });
      navigate("/analizar-gratis");
    } catch {
      toast({
        title: "Error",
        description: "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="h-4 w-4" />
              <span>+2.800 inquilinos ya analizaron su contrato</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">¿Tu contrato es legal?</h2>
            <p className="text-muted-foreground mb-8">
              Descúbrelo en menos de 2 minutos. Introduce tu email y analiza tu contrato gratis.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !email}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6"
              >
                {loading ? "..." : "Analizar gratis"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3">100% confidencial · Basado en la LAU 2026</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default InlineLeadCTA;

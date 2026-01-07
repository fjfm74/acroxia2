import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const MarketplaceTeaser = () => {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-charcoal/10 text-charcoal border-0 font-medium">
            Próximamente
          </Badge>
          
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-charcoal mb-4">
            Marketplace Legal
          </h2>
          
          <p className="text-charcoal/70 mb-8 max-w-xl mx-auto">
            ¿Tu contrato necesita revisión profesional? Pronto podrás conectar directamente 
            con abogados especializados en derecho inmobiliario.
          </p>
          
          <div className="inline-flex items-center gap-2 text-charcoal/60 text-sm">
            <span>Consultas desde €49</span>
            <span className="w-1 h-1 bg-charcoal/30 rounded-full" />
            <span>Abogados verificados</span>
            <span className="w-1 h-1 bg-charcoal/30 rounded-full" />
            <span>Respuesta en 24h</span>
          </div>

          <button className="mt-8 inline-flex items-center gap-2 text-charcoal font-medium hover:gap-3 transition-all">
            Únete a la lista de espera
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceTeaser;

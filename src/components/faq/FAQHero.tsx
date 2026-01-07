import { Shield, CheckCircle } from "lucide-react";

const FAQHero = () => {
  return (
    <section className="bg-muted py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Respuestas verificadas por expertos legales
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
            Preguntas frecuentes sobre{" "}
            <span className="text-primary">alquiler en España</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Todo lo que necesitas saber sobre tus derechos como inquilino, 
            cláusulas abusivas, fianzas y mucho más.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>+30 preguntas resueltas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Actualizado 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Basado en la LAU</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQHero;

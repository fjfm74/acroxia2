import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Home, HelpCircle, BookOpen, Mail, ArrowRight } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const helpfulLinks = [
    {
      icon: Home,
      label: "Página principal",
      description: "Vuelve al inicio de ACROXIA",
      href: "/",
    },
    {
      icon: BookOpen,
      label: "Blog",
      description: "Guías sobre alquiler en España",
      href: "/blog",
    },
    {
      icon: HelpCircle,
      label: "Preguntas frecuentes",
      description: "Resuelve tus dudas",
      href: "/faq",
    },
    {
      icon: Mail,
      label: "Contacto",
      description: "Escríbenos y te ayudamos",
      href: "/contacto",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Página no encontrada | ACROXIA</title>
        <meta 
          name="description" 
          content="Lo sentimos, la página que buscas no existe. Explora nuestras guías sobre alquiler o vuelve a la página principal de ACROXIA." 
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center bg-muted pt-28 pb-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-2xl mx-auto text-center">
                {/* Error Code */}
                <span className="font-serif text-8xl md:text-9xl font-medium text-foreground/10">
                  404
                </span>
                
                {/* Message */}
                <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground -mt-6 mb-4">
                  Página no encontrada
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Lo sentimos, la página que buscas no existe o ha sido movida. 
                  Te sugerimos explorar los siguientes enlaces.
                </p>

                {/* Primary CTA */}
                <Button asChild size="lg" className="rounded-full mb-12">
                  <Link to="/">
                    <Home className="mr-2 h-5 w-5" />
                    Volver al inicio
                  </Link>
                </Button>

                {/* Helpful Links Grid */}
                <div className="grid sm:grid-cols-2 gap-4 text-left">
                  {helpfulLinks.map((link, index) => (
                    <FadeIn key={link.href} delay={0.1 + index * 0.05}>
                      <Link
                        to={link.href}
                        className="group flex items-start gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-foreground/20 transition-colors"
                      >
                        <div className="p-2 rounded-xl bg-muted group-hover:bg-foreground/5 transition-colors">
                          <link.icon className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground group-hover:underline">
                            {link.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground mt-1 transition-colors" />
                      </Link>
                    </FadeIn>
                  ))}
                </div>

                {/* Analyze CTA */}
                <FadeIn delay={0.4}>
                  <div className="mt-12 p-6 bg-background rounded-2xl border border-border/50">
                    <p className="text-muted-foreground mb-4">
                      ¿Buscabas analizar tu contrato de alquiler?
                    </p>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to="/analizar-gratis">
                        Analizar contrato gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </FadeIn>
              </div>
            </FadeIn>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;

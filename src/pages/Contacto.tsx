import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/animations/FadeIn";
import { MapPin, Clock, Mail, Phone, MessageSquare } from "lucide-react";

const Contacto = () => {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contacto - ACROXIA",
    "description": "Contacta con el equipo de ACROXIA para resolver tus dudas sobre análisis de contratos de alquiler",
    "mainEntity": {
      "@type": "Organization",
      "name": "ACROXIA TECH S.L.",
      "email": "contacto@acroxia.com",
      "telephone": "+34 900 000 000",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Barcelona",
        "addressCountry": "ES"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto - ACROXIA | Atención al Cliente</title>
        <meta 
          name="description" 
          content="Contacta con el equipo de ACROXIA. Resolvemos tus dudas sobre análisis de contratos de alquiler. Respuesta en 24-48 horas." 
        />
        <link rel="canonical" href="https://acroxia.com/contacto" />
        <meta property="og:title" content="Contacto - ACROXIA | Atención al Cliente" />
        <meta property="og:description" content="Resolvemos tus dudas sobre análisis de contratos de alquiler. Respuesta en 24-48 horas." />
        <meta property="og:url" content="https://acroxia.com/contacto" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <script type="application/ld+json">
          {JSON.stringify(contactSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-28">
          {/* Hero Section */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <FadeIn>
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6">
                    ¿En qué podemos ayudarte?
                  </h1>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Estamos aquí para resolver tus dudas. Escríbenos y te responderemos 
                    en un plazo máximo de 24-48 horas laborables.
                  </p>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="pb-20 md:pb-28">
            <div className="container mx-auto px-6">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
                  
                  {/* Contact Info */}
                  <div className="lg:col-span-2 space-y-8">
                    <FadeIn delay={0.2}>
                      <div>
                        <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                          Información de contacto
                        </h2>
                        
                        <div className="space-y-6">
                          {/* Email */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                              <Mail className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">Email general</p>
                              <a 
                                href="mailto:contacto@acroxia.com" 
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                contacto@acroxia.com
                              </a>
                            </div>
                          </div>

                          {/* Legal Email */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">Consultas legales y privacidad</p>
                              <a 
                                href="mailto:legal@acroxia.com" 
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                legal@acroxia.com
                              </a>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                              <Phone className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">Teléfono</p>
                              <p className="text-muted-foreground">+34 900 000 000</p>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground mb-1">Ubicación</p>
                              <p className="text-muted-foreground">
                                Calle Diagonal 456, 4ª Planta<br />
                                08006 Barcelona, España
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FadeIn>

                    {/* Business Hours */}
                    <FadeIn delay={0.3}>
                      <div className="bg-muted rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Clock className="w-5 h-5 text-foreground" />
                          <h3 className="font-semibold text-foreground">Horario de atención</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lunes - Viernes</span>
                            <span className="text-foreground font-medium">09:00 - 18:00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sábados</span>
                            <span className="text-foreground font-medium">10:00 - 14:00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Domingos y festivos</span>
                            <span className="text-foreground font-medium">Cerrado</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            * Respondemos emails fuera de horario en un máximo de 48 horas laborables.
                          </p>
                        </div>
                      </div>
                    </FadeIn>

                    {/* Response Time */}
                    <FadeIn delay={0.4}>
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <p className="text-sm text-green-800">
                          <strong className="block mb-1">⚡ Tiempo medio de respuesta</strong>
                          Respondemos la mayoría de consultas en menos de 24 horas durante días laborables.
                        </p>
                      </div>
                    </FadeIn>
                  </div>

                  {/* Contact Form */}
                  <div className="lg:col-span-3">
                    <FadeIn delay={0.3}>
                      <div className="mb-6">
                        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Envíanos un mensaje
                        </h2>
                        <p className="text-muted-foreground">
                          Completa el formulario y nos pondremos en contacto contigo lo antes posible.
                        </p>
                      </div>
                      <ContactForm />
                    </FadeIn>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Teaser */}
          <section className="py-16 bg-muted">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl mx-auto text-center">
                <FadeIn>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4">
                    ¿Buscas respuestas rápidas?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Consulta nuestra sección de preguntas frecuentes donde resolvemos 
                    las dudas más comunes sobre contratos de alquiler.
                  </p>
                  <a 
                    href="/faq" 
                    className="inline-flex items-center gap-2 text-foreground font-medium hover:underline"
                  >
                    Ver preguntas frecuentes
                    <span aria-hidden="true">→</span>
                  </a>
                </FadeIn>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contacto;

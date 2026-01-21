import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import FooterSubscriptionForm from "@/components/blog/FooterSubscriptionForm";
import FadeIn from "@/components/animations/FadeIn";

interface FooterProps {
  hideSubscription?: boolean;
}

const Footer = ({ hideSubscription = false }: FooterProps) => {
  return (
    <footer className="bg-muted">
      <div className="container mx-auto px-6 py-20">
        {/* Newsletter Subscription - Solo en páginas públicas */}
        {!hideSubscription && (
          <FadeIn>
            <div className="pb-12 mb-12 border-b border-border">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  Suscríbete a nuestro newsletter
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Recibe artículos y novedades legales según tu perfil
                </p>
                <FooterSubscriptionForm />
              </div>
            </div>
          </FadeIn>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-semibold text-foreground block mb-4">
              ACROXIA
            </span>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Herramienta de análisis de contratos de alquiler con IA. 
              Identifica cláusulas potencialmente problemáticas en menos de 2 minutos.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
            {/* Datos de contacto - solo visible en desktop */}
            <ul className="hidden lg:block space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                <span>contacto@acroxia.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <span>+34 900 000 000</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Barcelona, España</span>
              </li>
            </ul>
          </div>
          
          {/* Producto */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Producto</h4>
            <ul className="space-y-3">
              <li><a href="/#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cómo funciona</a></li>
              <li><Link to="/analizar-gratis" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Para Inquilinos</Link></li>
              <li><Link to="/propietarios" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Para Propietarios</Link></li>
              <li><Link to="/precios" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Precios</Link></li>
              <li><Link to="/contacto" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contacto</Link></li>
            </ul>
          </div>

          {/* Para Profesionales */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Para Profesionales</h4>
            <ul className="space-y-3">
              <li><Link to="/profesionales/inmobiliarias" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Inmobiliarias y APIs</Link></li>
              <li><Link to="/profesionales/gestorias" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Gestorías y Administradores</Link></li>
              <li><a href="/precios#b2b" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Planes empresariales</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Recursos</h4>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Preguntas frecuentes</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Blog</Link></li>
              <li><Link to="/clausulas-abusivas-alquiler" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cláusulas abusivas</Link></li>
              <li><Link to="/devolucion-fianza-alquiler" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Devolución de fianza</Link></li>
              <li><Link to="/subida-alquiler-2026" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Subida alquiler 2026</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/aviso-legal" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Aviso Legal</Link></li>
              <li><Link to="/privacidad" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Política de Privacidad</Link></li>
              <li><Link to="/terminos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Términos y Condiciones</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Política de Cookies</Link></li>
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent("openCookieSettings"))}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left"
                >
                  Configurar cookies
                </button>
              </li>
              <li><Link to="/transparencia-ia" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Transparencia IA</Link></li>
              <li><Link to="/desistimiento" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Desistimiento</Link></li>
              <li><Link to="/accesibilidad" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Accesibilidad</Link></li>
            </ul>
          </div>
          
          {/* Contact - solo visible en tablet y móvil */}
          <div className="lg:hidden">
            <h4 className="font-medium text-foreground mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                <span>contacto@acroxia.com</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <span>+34 900 000 000</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Barcelona, España</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 ACROXIA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Todos los sistemas operativos
          </div>
        </div>
        
        {/* ODR Platform - Consumer Rights */}
        <div className="border-t border-border mt-6 pt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Todos los precios incluyen IVA
          </p>
          <p className="text-xs text-muted-foreground">
            Resolución de litigios en línea de la UE:{" "}
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

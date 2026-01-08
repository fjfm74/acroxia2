import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { Accessibility, CheckCircle2, AlertCircle, Mail } from "lucide-react";

const Accesibilidad = () => {
  return (
    <LegalPageLayout
      title="Declaración de Accesibilidad"
      metaDescription="Compromiso de accesibilidad web de ACROXIA. Objetivo WCAG 2.1 nivel AA."
      lastUpdated="8 de enero de 2026"
    >
      <div className="space-y-8">
        {/* Introducción destacada */}
        <div className="p-6 bg-muted rounded-xl border border-border">
          <div className="flex items-start gap-4">
            <Accessibility className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-xl font-semibold mb-2">
                Nuestro compromiso con la accesibilidad
              </h2>
              <p className="text-muted-foreground">
                ACROXIA se compromete a garantizar la accesibilidad digital de su sitio web para 
                personas con discapacidad. Trabajamos continuamente para mejorar la experiencia 
                de usuario para todos y aplicar las normas de accesibilidad pertinentes.
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">1. Nivel de conformidad</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA se esfuerza por cumplir con las <strong>Pautas de Accesibilidad para el 
            Contenido Web (WCAG) 2.1 nivel AA</strong>, publicadas por el World Wide Web Consortium (W3C).
          </p>
          <p className="text-muted-foreground mb-4">
            Estas pautas explican cómo hacer el contenido web más accesible para personas con 
            discapacidad y más usable para todos los usuarios.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">2. Medidas de accesibilidad adoptadas</h2>
          
          <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Implementadas
          </h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
            <li><strong>Texto alternativo:</strong> Las imágenes incluyen descripciones alternativas.</li>
            <li><strong>Contraste de colores:</strong> Mantenemos una ratio de contraste adecuada entre texto y fondo.</li>
            <li><strong>Navegación por teclado:</strong> El sitio es navegable utilizando solo el teclado.</li>
            <li><strong>Estructura semántica:</strong> Utilizamos encabezados y elementos HTML semánticos correctamente.</li>
            <li><strong>Etiquetas de formulario:</strong> Los campos de formulario están correctamente etiquetados.</li>
            <li><strong>Diseño responsive:</strong> El sitio se adapta a diferentes tamaños de pantalla.</li>
            <li><strong>Focus visible:</strong> Los elementos interactivos muestran un indicador de foco claro.</li>
            <li><strong>Tamaño de texto ajustable:</strong> El texto puede ampliarse sin pérdida de funcionalidad.</li>
          </ul>

          <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            En proceso de mejora
          </h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Documentos PDF:</strong> Estamos trabajando para que los informes generados sean plenamente accesibles.</li>
            <li><strong>Lectores de pantalla:</strong> Optimizando la experiencia con tecnologías de asistencia.</li>
            <li><strong>Animaciones:</strong> Implementando opciones para reducir el movimiento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">3. Limitaciones conocidas</h2>
          <p className="text-muted-foreground mb-4">
            A pesar de nuestros esfuerzos, pueden existir algunas limitaciones de accesibilidad:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>
              <strong>Contenido de terceros:</strong> Algunas funcionalidades integradas de terceros 
              (como el inicio de sesión con Google) pueden tener limitaciones de accesibilidad 
              fuera de nuestro control.
            </li>
            <li>
              <strong>Documentos subidos:</strong> Los contratos que los usuarios suben mantienen 
              su formato original, que puede no ser accesible.
            </li>
            <li>
              <strong>Contenido generado por IA:</strong> Los informes generados automáticamente 
              pueden no estar completamente optimizados para lectores de pantalla.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">4. Tecnologías compatibles</h2>
          <p className="text-muted-foreground mb-4">
            La accesibilidad de ACROXIA depende de las siguientes tecnologías para funcionar:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>HTML5</li>
            <li>CSS3</li>
            <li>JavaScript</li>
            <li>WAI-ARIA</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Estas tecnologías se basan en la conformidad de los navegadores web y tecnologías 
            de asistencia utilizadas.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">5. Navegadores y tecnologías de asistencia</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA es compatible con los siguientes navegadores y tecnologías de asistencia:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>Google Chrome (últimas 2 versiones)</li>
            <li>Mozilla Firefox (últimas 2 versiones)</li>
            <li>Safari (últimas 2 versiones)</li>
            <li>Microsoft Edge (últimas 2 versiones)</li>
            <li>NVDA (lector de pantalla)</li>
            <li>VoiceOver (macOS e iOS)</li>
            <li>JAWS (en proceso de optimización)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">6. Evaluación y auditoría</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA evalúa la accesibilidad de su sitio web mediante:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Autoevaluación:</strong> Revisiones internas periódicas utilizando herramientas automatizadas.</li>
            <li><strong>Herramientas automáticas:</strong> Lighthouse, axe DevTools, WAVE.</li>
            <li><strong>Pruebas manuales:</strong> Navegación por teclado y pruebas con lectores de pantalla.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            <strong>Última revisión de accesibilidad:</strong> Enero 2026
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">7. Comentarios y contacto</h2>
          <p className="text-muted-foreground mb-4">
            Agradecemos tus comentarios sobre la accesibilidad de ACROXIA. Si encuentras 
            barreras de accesibilidad o tienes sugerencias de mejora, por favor contacta con nosotros:
          </p>
          
          <div className="flex items-start gap-3 p-4 border border-border rounded-lg mb-4">
            <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Email de accesibilidad</p>
              <a href="mailto:contacto@acroxia.com" className="text-primary hover:underline">
                contacto@acroxia.com
              </a>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">
            Al contactarnos, por favor incluye:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>La URL de la página web donde encontraste el problema</li>
            <li>Una descripción del problema de accesibilidad</li>
            <li>El navegador y tecnología de asistencia que utilizas (si aplica)</li>
            <li>Tu información de contacto para que podamos responder</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Nos comprometemos a responder a las consultas de accesibilidad en un plazo 
            de <strong>5 días laborables</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">8. Procedimiento de aplicación</h2>
          <p className="text-muted-foreground mb-4">
            Si no estás satisfecho con nuestra respuesta a tu queja de accesibilidad, 
            puedes presentar una reclamación ante:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>
              <strong>Ministerio de Asuntos Económicos y Transformación Digital:</strong>{" "}
              A través del procedimiento de reclamación de accesibilidad web.
            </li>
            <li>
              <strong>CERMI (Comité Español de Representantes de Personas con Discapacidad):</strong>{" "}
              Para orientación y asesoramiento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">9. Marco legal</h2>
          <p className="text-muted-foreground mb-4">
            Esta declaración de accesibilidad se proporciona en cumplimiento de:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Real Decreto 1112/2018</strong>, de 7 de septiembre, sobre accesibilidad de los sitios web y aplicaciones para dispositivos móviles del sector público (referencia para buenas prácticas).</li>
            <li><strong>Directiva (UE) 2016/2102</strong> sobre la accesibilidad de los sitios web y aplicaciones para dispositivos móviles.</li>
            <li><strong>EN 301 549 V3.2.1 (2021-03)</strong> - Requisitos de accesibilidad para productos y servicios TIC.</li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Accesibilidad;

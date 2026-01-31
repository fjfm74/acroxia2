import LegalPageLayout from "@/components/legal/LegalPageLayout";

const Cookies = () => {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      metaDescription="Política de cookies de ACROXIA. Conoce qué cookies utilizamos y cómo gestionarlas."
      lastUpdated="8 de enero de 2026"
      allowIndex={true}
    >
      <div className="space-y-8">
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">1. ¿Qué son las cookies?</h2>
          <p className="text-muted-foreground mb-4">
            Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo 
            (ordenador, tablet o móvil) cuando los visitas. Se utilizan ampliamente para hacer que 
            los sitios web funcionen de manera más eficiente, así como para proporcionar información 
            a los propietarios del sitio.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">2. Tipos de cookies que utilizamos</h2>
          
          <h3 className="font-medium text-lg mb-3 mt-6">2.1 Cookies esenciales (estrictamente necesarias)</h3>
          <p className="text-muted-foreground mb-4">
            Estas cookies son imprescindibles para el funcionamiento del sitio web y no pueden 
            desactivarse. Se establecen en respuesta a acciones realizadas por ti, como configurar 
            tus preferencias de privacidad, iniciar sesión o completar formularios.
          </p>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">Finalidad</th>
                  <th className="px-4 py-3 text-left font-medium">Duración</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="px-4 py-3">sb-*-auth-token</td>
                  <td className="px-4 py-3">ACROXIA</td>
                  <td className="px-4 py-3">Autenticación de usuario</td>
                  <td className="px-4 py-3">Sesión</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">cookie-consent</td>
                  <td className="px-4 py-3">ACROXIA</td>
                  <td className="px-4 py-3">Guardar preferencias de cookies</td>
                  <td className="px-4 py-3">1 año</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-medium text-lg mb-3">2.2 Cookies funcionales</h3>
          <p className="text-muted-foreground mb-4">
            Estas cookies permiten que el sitio proporcione una funcionalidad y personalización mejoradas. 
            Pueden ser establecidas por nosotros o por terceros cuyos servicios hemos añadido a nuestras páginas.
          </p>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">Finalidad</th>
                  <th className="px-4 py-3 text-left font-medium">Duración</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="px-4 py-3">sidebar-collapsed</td>
                  <td className="px-4 py-3">ACROXIA</td>
                  <td className="px-4 py-3">Recordar estado del menú lateral</td>
                  <td className="px-4 py-3">Persistente</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">theme</td>
                  <td className="px-4 py-3">ACROXIA</td>
                  <td className="px-4 py-3">Preferencia de tema claro/oscuro</td>
                  <td className="px-4 py-3">Persistente</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-medium text-lg mb-3">2.3 Cookies analíticas</h3>
          <p className="text-muted-foreground mb-4">
            Actualmente, ACROXIA no utiliza cookies analíticas de terceros. Si en el futuro 
            implementáramos herramientas de análisis, actualizaríamos esta política y solicitaríamos 
            tu consentimiento previo.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">3. Base legal para el uso de cookies</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Cookies esenciales:</strong> Se basan en nuestro interés legítimo de proporcionar 
            un servicio funcional y seguro (art. 6.1.f RGPD).
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Cookies funcionales y analíticas:</strong> Se basan en tu consentimiento previo 
            (art. 6.1.a RGPD), que puedes otorgar o retirar en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">4. Cómo gestionar las cookies</h2>
          
          <h3 className="font-medium text-lg mb-3">4.1 Mediante nuestro banner de cookies</h3>
          <p className="text-muted-foreground mb-4">
            La primera vez que visites nuestro sitio, te mostraremos un banner donde podrás aceptar 
            todas las cookies, rechazar las no esenciales, o configurar tus preferencias detalladamente.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Para modificar tus preferencias en cualquier momento:</strong> Haz clic en el icono 
            de cookie (🍪) situado en la esquina inferior izquierda de la pantalla, o utiliza el enlace 
            "Configurar cookies" en el pie de página. Podrás cambiar tu selección las veces que necesites.
          </p>

          <h3 className="font-medium text-lg mb-3">4.2 Mediante tu navegador</h3>
          <p className="text-muted-foreground mb-4">
            Puedes configurar tu navegador para que bloquee o elimine las cookies. A continuación, 
            te proporcionamos enlaces a las instrucciones de los navegadores más comunes:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Ten en cuenta que si bloqueas todas las cookies, algunas funcionalidades del sitio 
            podrían no funcionar correctamente.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">5. Cookies de terceros</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA utiliza servicios de terceros que pueden establecer sus propias cookies:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Google (OAuth):</strong> Para el inicio de sesión con Google, sujeto a la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">política de privacidad de Google</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">6. Actualizaciones de esta política</h2>
          <p className="text-muted-foreground mb-4">
            Podemos actualizar esta Política de Cookies periódicamente. Te recomendamos revisarla 
            regularmente para estar informado sobre cómo protegemos tu información. La fecha de 
            última actualización se indica al principio de este documento.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">7. Contacto</h2>
          <p className="text-muted-foreground">
            Si tienes alguna pregunta sobre nuestra Política de Cookies, puedes contactarnos en:{" "}
            <a href="mailto:legal@acroxia.com" className="text-primary hover:underline">
              legal@acroxia.com
            </a>
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Cookies;

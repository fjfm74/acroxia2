import LegalPageLayout from "@/components/legal/LegalPageLayout";

const Privacidad = () => {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      metaDescription="Política de privacidad de ACROXIA. Información sobre el tratamiento de datos personales conforme al RGPD y LOPDGDD."
      lastUpdated="8 de enero de 2026"
    >
      <div className="space-y-10 text-foreground/80">
        {/* Introducción */}
        <section>
          <p className="leading-relaxed">
            En ACROXIA TECH S.L. (en adelante, "ACROXIA") nos comprometemos a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información personal que nos proporcionas al utilizar nuestros servicios, de conformidad con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
          </p>
        </section>

        {/* Responsable del tratamiento */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            1. Responsable del Tratamiento
          </h2>
          <div className="bg-muted rounded-2xl p-6 space-y-2">
            <p><strong className="text-foreground">Responsable:</strong> ACROXIA TECH S.L.</p>
            <p><strong className="text-foreground">CIF:</strong> B-12345678</p>
            <p><strong className="text-foreground">Domicilio:</strong> Calle Diagonal 456, 4ª Planta, 08006 Barcelona, España</p>
            <p><strong className="text-foreground">Email de contacto:</strong> legal@acroxia.com</p>
            <p><strong className="text-foreground">Delegado de Protección de Datos (DPO):</strong> dpo@acroxia.com</p>
          </div>
        </section>

        {/* Datos que recopilamos */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            2. Datos Personales que Recopilamos
          </h2>
          <p className="mb-4 leading-relaxed">
            Podemos recopilar las siguientes categorías de datos personales:
          </p>
          
          <h3 className="font-semibold text-foreground mt-6 mb-3">2.1. Datos de identificación y contacto</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Nombre y apellidos</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">2.2. Datos de registro y cuenta</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Credenciales de acceso (email y contraseña cifrada)</li>
            <li>Historial de análisis de contratos</li>
            <li>Preferencias de usuario</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">2.3. Datos de los documentos analizados</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Contenido de los contratos de alquiler subidos para análisis</li>
            <li>Resultados del análisis automatizado</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">2.4. Datos técnicos y de navegación</h3>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Dirección IP</li>
            <li>Tipo de navegador y dispositivo</li>
            <li>Páginas visitadas y tiempo de permanencia</li>
            <li>Datos de cookies (según nuestra política de cookies)</li>
          </ul>
        </section>

        {/* Finalidad del tratamiento */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            3. Finalidad del Tratamiento
          </h2>
          <p className="mb-4 leading-relaxed">
            Tratamos tus datos personales para las siguientes finalidades:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-foreground">Prestación del servicio:</strong> Analizar los contratos de alquiler que nos proporcionas y generar informes sobre posibles cláusulas abusivas.</li>
            <li><strong className="text-foreground">Gestión de la cuenta de usuario:</strong> Crear y mantener tu cuenta, gestionar tu suscripción y créditos.</li>
            <li><strong className="text-foreground">Comunicaciones:</strong> Enviarte información sobre tu cuenta, resultados de análisis y, si lo autorizas, comunicaciones comerciales.</li>
            <li><strong className="text-foreground">Mejora del servicio:</strong> Analizar el uso de la plataforma para mejorar nuestros algoritmos y experiencia de usuario.</li>
            <li><strong className="text-foreground">Cumplimiento legal:</strong> Cumplir con nuestras obligaciones legales y responder a requerimientos de autoridades competentes.</li>
          </ul>
        </section>

        {/* Base legal */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            4. Base Legal del Tratamiento
          </h2>
          <p className="mb-4 leading-relaxed">
            El tratamiento de tus datos personales se fundamenta en las siguientes bases legales:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-foreground">Ejecución del contrato:</strong> El tratamiento es necesario para la prestación del servicio contratado (Art. 6.1.b RGPD).</li>
            <li><strong className="text-foreground">Consentimiento:</strong> Para el envío de comunicaciones comerciales y el tratamiento de cookies no esenciales (Art. 6.1.a RGPD).</li>
            <li><strong className="text-foreground">Interés legítimo:</strong> Para la mejora de nuestros servicios y la prevención del fraude (Art. 6.1.f RGPD).</li>
            <li><strong className="text-foreground">Obligación legal:</strong> Para cumplir con obligaciones fiscales y legales aplicables (Art. 6.1.c RGPD).</li>
          </ul>
        </section>

        {/* Conservación */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            5. Conservación de los Datos
          </h2>
          <p className="mb-4 leading-relaxed">
            Conservaremos tus datos personales durante los siguientes plazos:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-foreground">Datos de cuenta:</strong> Mientras mantengas tu cuenta activa y durante los 3 años siguientes a la baja.</li>
            <li><strong className="text-foreground">Documentos analizados:</strong> 90 días desde el análisis, salvo que solicites su eliminación anticipada.</li>
            <li><strong className="text-foreground">Resultados de análisis:</strong> Mientras mantengas tu cuenta activa.</li>
            <li><strong className="text-foreground">Datos de facturación:</strong> 5 años conforme a la legislación fiscal.</li>
          </ul>
        </section>

        {/* Datos de terceros en documentos */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            6. Datos de Terceros Contenidos en Documentos
          </h2>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-6">
            <p className="font-semibold text-foreground mb-3">⚠️ INFORMACIÓN IMPORTANTE</p>
            <p className="leading-relaxed">
              Los contratos de alquiler que subas a nuestra plataforma pueden contener datos personales de <strong className="text-foreground">terceras personas</strong> (arrendadores, propietarios, inmobiliarias, avalistas, etc.), como nombres, DNI, direcciones, teléfonos o datos bancarios.
            </p>
          </div>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.1. Base legal del tratamiento</h3>
          <p className="mb-4 leading-relaxed">
            El tratamiento de estos datos de terceros se realiza en base a:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li><strong className="text-foreground">Interés legítimo del usuario</strong> (Art. 6.1.f RGPD): Tienes un interés legítimo en analizar un contrato del que eres parte para conocer tus derechos.</li>
            <li><strong className="text-foreground">Ejecución del servicio</strong> (Art. 6.1.b RGPD): El análisis del contrato completo es necesario para prestarte el servicio solicitado.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.2. Tipos de datos de terceros que pueden tratarse</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Nombre y apellidos del arrendador/propietario</li>
            <li>DNI/NIE/CIF</li>
            <li>Dirección postal</li>
            <li>Datos bancarios (IBAN, número de cuenta)</li>
            <li>Teléfono y email de contacto</li>
            <li>Datos de representantes legales o inmobiliarias</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.3. Medidas de protección aplicadas</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li><strong className="text-foreground">Anonimización previa al procesamiento por IA:</strong> Antes de enviar el texto del contrato a nuestros sistemas de inteligencia artificial, aplicamos técnicas de anonimización automática para ocultar DNI, IBAN y números de teléfono.</li>
            <li><strong className="text-foreground">Cifrado en reposo y tránsito:</strong> Todos los documentos se almacenan cifrados.</li>
            <li><strong className="text-foreground">Retención limitada:</strong> Los documentos originales se eliminan automáticamente a los 30 días.</li>
            <li><strong className="text-foreground">Acceso restringido:</strong> Solo tú y los sistemas automatizados tienen acceso a tus documentos.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.4. Lo que NO hacemos con datos de terceros</h3>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>NO los utilizamos para marketing o perfilado</li>
            <li>NO los cedemos a terceros (salvo obligación legal)</li>
            <li>NO los utilizamos para entrenar modelos de IA</li>
            <li>NO creamos perfiles de arrendadores o inmobiliarias</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.5. Información a los terceros afectados</h3>
          <p className="mb-4 leading-relaxed">
            Conforme al artículo 14.5.b) del RGPD, no informamos directamente a los terceros cuyos datos aparecen en los contratos debido a que:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Supondría un esfuerzo desproporcionado dado el volumen de documentos</li>
            <li>El tratamiento es mínimo (solo análisis automatizado puntual)</li>
            <li>Los datos se anonimizan y eliminan en plazos cortos</li>
            <li>No existe perjuicio para los intereses del tercero</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.6. Recomendaciones para el usuario</h3>
          <p className="leading-relaxed">
            Aunque no es obligatorio, te recomendamos informar a la otra parte del contrato de que vas a utilizar herramientas de análisis automatizado. Esto refuerza la transparencia en vuestra relación contractual.
          </p>
        </section>

        {/* Destinatarios */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            6. Destinatarios de los Datos
          </h2>
          <p className="mb-4 leading-relaxed">
            Tus datos personales podrán ser comunicados a:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-foreground">Proveedores de servicios:</strong> Empresas que nos prestan servicios de hosting, procesamiento de pagos, envío de emails y análisis.</li>
            <li><strong className="text-foreground">Autoridades competentes:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            No vendemos ni compartimos tus datos personales con terceros para fines de marketing.
          </p>
        </section>

        {/* Transferencias internacionales */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            7. Transferencias Internacionales
          </h2>
          <p className="leading-relaxed">
            Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo. En estos casos, nos aseguramos de que existan garantías adecuadas, como cláusulas contractuales tipo aprobadas por la Comisión Europea o que el país de destino cuente con una decisión de adecuación.
          </p>
        </section>

        {/* Derechos */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            8. Tus Derechos
          </h2>
          <p className="mb-4 leading-relaxed">
            Conforme al RGPD, tienes derecho a:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
            <li><strong className="text-foreground">Acceso:</strong> Conocer qué datos personales tratamos sobre ti.</li>
            <li><strong className="text-foreground">Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
            <li><strong className="text-foreground">Supresión:</strong> Solicitar la eliminación de tus datos ("derecho al olvido").</li>
            <li><strong className="text-foreground">Oposición:</strong> Oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
            <li><strong className="text-foreground">Limitación:</strong> Solicitar la limitación del tratamiento de tus datos.</li>
            <li><strong className="text-foreground">Portabilidad:</strong> Recibir tus datos en un formato estructurado y de uso común.</li>
            <li><strong className="text-foreground">Retirada del consentimiento:</strong> Retirar tu consentimiento en cualquier momento.</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Para ejercer estos derechos, puedes contactarnos en <strong className="text-foreground">dpo@acroxia.com</strong> adjuntando una copia de tu documento de identidad.
          </p>
          <p className="leading-relaxed">
            Asimismo, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) si consideras que tus derechos han sido vulnerados: <a href="https://www.aepd.es" className="text-foreground underline hover:no-underline" target="_blank" rel="noopener noreferrer">www.aepd.es</a>
          </p>
        </section>

        {/* Seguridad */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            9. Medidas de Seguridad
          </h2>
          <p className="leading-relaxed">
            Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos personales contra el acceso no autorizado, alteración, divulgación o destrucción. Estas medidas incluyen cifrado de datos en tránsito y en reposo, controles de acceso estrictos, y auditorías de seguridad periódicas.
          </p>
        </section>

        {/* Menores */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            10. Menores de Edad
          </h2>
          <p className="leading-relaxed">
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos conscientemente información personal de menores. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento parental verificable, eliminaremos dicha información de inmediato.
          </p>
        </section>

        {/* Modificaciones */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            11. Modificaciones de esta Política
          </h2>
          <p className="leading-relaxed">
            Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el Sitio Web. Te notificaremos sobre cambios significativos a través del email asociado a tu cuenta.
          </p>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            12. Contacto
          </h2>
          <p className="leading-relaxed">
            Si tienes cualquier pregunta sobre esta Política de Privacidad o sobre el tratamiento de tus datos personales, puedes contactarnos en:
          </p>
          <div className="bg-muted rounded-2xl p-6 mt-4 space-y-2">
            <p><strong className="text-foreground">Email general:</strong> legal@acroxia.com</p>
            <p><strong className="text-foreground">Delegado de Protección de Datos:</strong> dpo@acroxia.com</p>
            <p><strong className="text-foreground">Dirección postal:</strong> ACROXIA TECH S.L., Calle Diagonal 456, 4ª Planta, 08006 Barcelona, España</p>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Privacidad;

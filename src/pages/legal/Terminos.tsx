import LegalPageLayout from "@/components/legal/LegalPageLayout";

const Terminos = () => {
  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      metaDescription="Términos y condiciones de uso de ACROXIA. Condiciones del servicio de análisis de contratos de alquiler con inteligencia artificial."
      lastUpdated="8 de enero de 2026"
    >
      <div className="space-y-10 text-foreground/80">
        {/* Disclaimer principal */}
        <section className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl">
          <p className="font-semibold text-foreground mb-3">⚠️ AVISO LEGAL IMPORTANTE - LÉELO ANTES DE USAR EL SERVICIO</p>
          <p className="leading-relaxed mb-3">
            El servicio de análisis de contratos proporcionado por ACROXIA es de carácter <strong className="text-foreground">orientativo e informativo</strong>. Los resultados generados por nuestra tecnología de inteligencia artificial <strong className="text-foreground">NO constituyen asesoramiento legal profesional</strong> y no sustituyen la consulta con un abogado colegiado.
          </p>
          <p className="leading-relaxed">
            Para cuestiones legales complejas, litigios o decisiones que puedan tener consecuencias jurídicas significativas, <strong className="text-foreground">recomendamos encarecidamente consultar con un profesional del derecho</strong>.
          </p>
        </section>

        {/* Aceptación */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            1. Aceptación de los Términos
          </h2>
          <p className="mb-4 leading-relaxed">
            Al acceder y utilizar los servicios de ACROXIA (el "Servicio"), proporcionados por ACROXIA ("nosotros" o "nuestro"), aceptas quedar vinculado por estos Términos y Condiciones ("Términos"). Si no estás de acuerdo con alguna parte de estos Términos, no podrás acceder al Servicio.
          </p>
          <p className="leading-relaxed">
            Estos Términos se aplican a todos los visitantes, usuarios y otras personas que accedan o utilicen el Servicio.
          </p>
        </section>

        {/* Descripción del servicio */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            2. Descripción del Servicio
          </h2>
          <p className="mb-4 leading-relaxed">
            ACROXIA es una plataforma tecnológica que utiliza inteligencia artificial para analizar contratos de alquiler y detectar posibles cláusulas abusivas, ilegales o desfavorables para el arrendatario, según la legislación española vigente.
          </p>
          <p className="leading-relaxed">
            El Servicio incluye:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
            <li>Análisis automatizado de contratos de alquiler en formato PDF, Word o imagen.</li>
            <li>Identificación de cláusulas potencialmente problemáticas.</li>
            <li>Generación de informes con recomendaciones orientativas.</li>
            <li>Referencias a la normativa legal aplicable.</li>
          </ul>
        </section>

        {/* Limitaciones del análisis IA */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            3. Limitaciones del Análisis por Inteligencia Artificial
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <p className="font-semibold text-red-800 mb-3">🔴 LIMITACIONES IMPORTANTES</p>
            <ul className="list-disc list-inside space-y-3 text-red-900/80">
              <li><strong>No es asesoramiento legal:</strong> Los análisis proporcionados son orientativos y no sustituyen el consejo de un abogado cualificado.</li>
              <li><strong>Sin responsabilidad profesional:</strong> ACROXIA no ejerce la abogacía y no asume responsabilidad profesional por las decisiones tomadas basándose en nuestros análisis.</li>
              <li><strong>Posibles errores:</strong> La tecnología de IA, aunque avanzada, puede cometer errores, malinterpretar contextos o no detectar todas las cláusulas problemáticas.</li>
              <li><strong>Legislación cambiante:</strong> Las leyes y jurisprudencia evolucionan constantemente. Nuestros análisis pueden no reflejar los cambios más recientes.</li>
              <li><strong>Contexto limitado:</strong> El análisis se basa únicamente en el texto del contrato proporcionado, sin conocer las circunstancias particulares de cada caso.</li>
            </ul>
          </div>

          <p className="leading-relaxed">
            Al utilizar el Servicio, reconoces y aceptas expresamente estas limitaciones y eximes a ACROXIA de cualquier responsabilidad derivada de decisiones tomadas basándose en nuestros análisis.
          </p>
        </section>

        {/* Registro de cuenta */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            4. Registro y Cuenta de Usuario
          </h2>
          <p className="mb-4 leading-relaxed">
            Para acceder a determinadas funcionalidades del Servicio, deberás crear una cuenta. Al hacerlo, te comprometes a:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Proporcionar información veraz, exacta, actualizada y completa.</li>
            <li>Mantener y actualizar dicha información.</li>
            <li>Mantener la confidencialidad de tu contraseña y no compartir tus credenciales.</li>
            <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</li>
            <li>Ser responsable de todas las actividades que ocurran bajo tu cuenta.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos Términos.
          </p>
        </section>

        {/* Uso aceptable */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            5. Uso Aceptable del Servicio
          </h2>
          <p className="mb-4 leading-relaxed">
            Te comprometes a utilizar el Servicio únicamente para fines legales y de acuerdo con estos Términos. Queda expresamente prohibido:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
            <li>Utilizar el Servicio para fines fraudulentos o ilegales.</li>
            <li>Subir documentos que contengan malware o código malicioso.</li>
            <li>Intentar acceder a sistemas, datos o cuentas de otros usuarios.</li>
            <li>Realizar ingeniería inversa o intentar extraer el código fuente de nuestros algoritmos.</li>
            <li>Utilizar el Servicio para competir directamente con ACROXIA.</li>
            <li>Revender o redistribuir el Servicio sin autorización.</li>
            <li>Subir contratos de terceros en los que no seas parte.</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-4">
            <p className="font-semibold text-foreground mb-3">⚠️ RESPONSABILIDAD SOBRE DATOS DE TERCEROS</p>
            <p className="leading-relaxed mb-3">
              Al subir un contrato de alquiler, declaras y garantizas que:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong className="text-foreground">Eres parte legítima del contrato</strong> (arrendatario, potencial arrendatario evaluando una propuesta, o persona autorizada).</li>
              <li><strong className="text-foreground">Tienes interés legítimo</strong> en analizar el documento para conocer tus derechos como inquilino.</li>
              <li><strong className="text-foreground">No utilizarás</strong> el análisis para fines ilícitos, difamatorios o perjudiciales contra el arrendador o terceros.</li>
              <li><strong className="text-foreground">Comprendes</strong> que el contrato puede contener datos personales de terceros (arrendador, inmobiliaria, avalistas) que serán tratados conforme a nuestra Política de Privacidad.</li>
            </ul>
          </div>

          <p className="leading-relaxed">
            ACROXIA queda exonerada de cualquier responsabilidad derivada del uso indebido de la plataforma para analizar contratos en los que el usuario no tenga un interés legítimo o sobre los cuales no tenga derecho a acceder.
          </p>
        </section>

        {/* Precios y pagos */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            6. Precios, Pagos y Suscripciones
          </h2>
          
          <h3 className="font-semibold text-foreground mt-6 mb-3">6.1. Modelo de créditos</h3>
          <p className="mb-4 leading-relaxed">
            ACROXIA funciona con un sistema de créditos. Cada análisis de contrato consume un número determinado de créditos según el tipo de servicio contratado.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.2. Precios</h3>
          <p className="mb-4 leading-relaxed">
            Los precios vigentes están disponibles en nuestra página de precios. Nos reservamos el derecho de modificar los precios con un preaviso de 30 días a los usuarios registrados.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.3. Procesamiento de pagos</h3>
          <p className="mb-4 leading-relaxed">
            Nuestro proceso de compra es gestionado por nuestro revendedor online Paddle.com. Paddle.com es el Merchant of Record (comerciante registrado) de todos nuestros pedidos. Paddle gestiona todas las consultas de atención al cliente relacionadas con pagos, facturación, impuestos y devoluciones. Para más información, consulta los{" "}
            <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:text-foreground/70">
              Términos del Comprador de Paddle
            </a>.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.4. Facturación</h3>
          <p className="mb-4 leading-relaxed">
            Las suscripciones se facturan de forma anticipada según el período seleccionado (mensual o anual). Los créditos no utilizados no son reembolsables ni transferibles entre períodos de facturación, salvo que se indique lo contrario en la oferta comercial.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">6.5. Derecho de desistimiento</h3>
          <p className="leading-relaxed">
            De conformidad con la normativa de consumidores, dispones de 14 días naturales desde la contratación para ejercer tu derecho de desistimiento, siempre que no hayas utilizado el servicio. Una vez iniciado el análisis de un contrato, se considera que has aceptado la prestación del servicio y no procederá el reembolso por ese análisis específico. Los reembolsos son gestionados por Paddle. Para solicitar un reembolso, visita{" "}
            <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:text-foreground/70">
              paddle.net
            </a>{" "}
            o contacta con nuestro equipo de soporte.
          </p>
        </section>

        {/* Propiedad intelectual */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            7. Propiedad Intelectual
          </h2>
          
          <h3 className="font-semibold text-foreground mt-6 mb-3">7.1. Nuestra propiedad</h3>
          <p className="mb-4 leading-relaxed">
            El Servicio, incluyendo todo el software, algoritmos, diseño, textos, gráficos y otros contenidos, son propiedad exclusiva de ACROXIA y están protegidos por las leyes de propiedad intelectual e industrial.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">7.2. Tus documentos</h3>
          <p className="mb-4 leading-relaxed">
            Tú mantienes todos los derechos sobre los documentos que subas a la plataforma. Al utilizar el Servicio, nos concedes una licencia limitada, no exclusiva y temporal para procesar dichos documentos con el único fin de prestarte el servicio contratado.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">7.3. Informes generados</h3>
          <p className="leading-relaxed">
            Los informes de análisis generados son para tu uso personal y privado. Puedes compartirlos con terceros (abogados, familiares, etc.), pero no puedes reproducirlos o distribuirlos comercialmente sin nuestra autorización.
          </p>
        </section>

        {/* Limitación de responsabilidad */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            8. Limitación de Responsabilidad
          </h2>
          
          <div className="bg-muted rounded-2xl p-6 mb-6">
            <p className="font-semibold text-foreground mb-3">EXENCIÓN DE RESPONSABILIDAD</p>
            <p className="leading-relaxed">
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, ACROXIA NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO, SIN LIMITACIÓN, PÉRDIDA DE BENEFICIOS, DATOS, USO, FONDO DE COMERCIO U OTRAS PÉRDIDAS INTANGIBLES, RESULTANTES DE:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>El uso o la imposibilidad de uso del Servicio.</li>
              <li>Decisiones tomadas basándose en los análisis proporcionados.</li>
              <li>Errores, imprecisiones u omisiones en los análisis.</li>
              <li>Acceso no autorizado o alteración de tus transmisiones o datos.</li>
              <li>Cualquier otra cuestión relacionada con el Servicio.</li>
            </ul>
          </div>

          <p className="leading-relaxed">
            En ningún caso nuestra responsabilidad total excederá el importe pagado por ti a ACROXIA en los 12 meses anteriores al evento que dio lugar a la reclamación.
          </p>
        </section>

        {/* Indemnización */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            9. Indemnización
          </h2>
          <p className="leading-relaxed">
            Aceptas defender, indemnizar y mantener indemne a ACROXIA, sus directivos, empleados y agentes, frente a cualquier reclamación, daño, obligación, pérdida, responsabilidad, coste o deuda, y gasto (incluyendo honorarios de abogados) derivados de: (a) tu uso del Servicio; (b) tu incumplimiento de estos Términos; (c) tu violación de derechos de terceros.
          </p>
        </section>

        {/* Modificaciones */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            10. Modificaciones del Servicio y los Términos
          </h2>
          <p className="mb-4 leading-relaxed">
            Nos reservamos el derecho de modificar o discontinuar el Servicio (o cualquier parte del mismo) en cualquier momento, con o sin previo aviso.
          </p>
          <p className="leading-relaxed">
            Podemos modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente tras su publicación. El uso continuado del Servicio después de cualquier modificación constituye tu aceptación de los nuevos Términos.
          </p>
        </section>

        {/* Terminación */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            11. Terminación
          </h2>
          <p className="mb-4 leading-relaxed">
            Podemos suspender o terminar tu acceso al Servicio de inmediato, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitación, si incumples estos Términos.
          </p>
          <p className="leading-relaxed">
            Tras la terminación, tu derecho a utilizar el Servicio cesará inmediatamente. Si deseas cancelar tu cuenta, puedes simplemente dejar de utilizar el Servicio o contactarnos para solicitar la eliminación de tu cuenta.
          </p>
        </section>

        {/* Ley aplicable */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            12. Ley Aplicable y Jurisdicción
          </h2>
          <p className="mb-4 leading-relaxed">
            Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
          </p>
          <p className="leading-relaxed">
            Para la resolución de cualquier controversia derivada de estos Términos o del uso del Servicio, las partes se someten a los Juzgados y Tribunales de la ciudad de Barcelona, España, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, sin perjuicio de los derechos que la normativa de consumidores pueda reconocerte.
          </p>
        </section>

        {/* Disposiciones generales */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            13. Disposiciones Generales
          </h2>
          <ul className="list-disc list-inside space-y-3 ml-4">
            <li><strong className="text-foreground">Acuerdo completo:</strong> Estos Términos constituyen el acuerdo completo entre tú y ACROXIA respecto al Servicio.</li>
            <li><strong className="text-foreground">Divisibilidad:</strong> Si alguna disposición de estos Términos resulta inválida, las demás disposiciones permanecerán en vigor.</li>
            <li><strong className="text-foreground">Renuncia:</strong> El hecho de que ACROXIA no ejerza un derecho o disposición de estos Términos no constituirá una renuncia a dicho derecho o disposición.</li>
            <li><strong className="text-foreground">Cesión:</strong> No puedes ceder estos Términos sin nuestro consentimiento previo por escrito.</li>
          </ul>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            14. Contacto
          </h2>
          <p className="mb-4 leading-relaxed">
            Si tienes alguna pregunta sobre estos Términos, por favor contáctanos:
          </p>
          <div className="bg-muted rounded-2xl p-6 space-y-2">
            <p><strong className="text-foreground">ACROXIA</strong></p>
            <p><strong className="text-foreground">Email:</strong> contacto@acroxia.com</p>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Terminos;

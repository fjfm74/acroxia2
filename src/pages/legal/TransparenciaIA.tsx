import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { Bot, AlertTriangle, Scale, Users, Shield, HelpCircle } from "lucide-react";

const TransparenciaIA = () => {
  return (
    <LegalPageLayout
      title="Transparencia de Inteligencia Artificial"
      metaDescription="Información sobre el uso de IA en ACROXIA. Cumplimiento del Reglamento de IA de la UE (AI Act)."
      lastUpdated="8 de enero de 2026"
    >
      <div className="space-y-8">
        {/* Introducción destacada */}
        <div className="p-6 bg-muted rounded-xl border border-border">
          <div className="flex items-start gap-4">
            <Bot className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-xl font-semibold mb-2">
                ACROXIA utiliza Inteligencia Artificial
              </h2>
              <p className="text-muted-foreground">
                Esta página explica de forma transparente cómo utilizamos sistemas de IA en nuestros 
                servicios, en cumplimiento del Reglamento (UE) 2024/1689 (Reglamento de Inteligencia 
                Artificial de la Unión Europea).
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">1. ¿Qué es ACROXIA?</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA es una herramienta tecnológica que utiliza inteligencia artificial para analizar 
            contratos de alquiler y detectar posibles cláusulas abusivas o ilegales según la normativa 
            española vigente.
          </p>
          <p className="text-muted-foreground mb-4">
            Nuestro sistema procesa el texto de los contratos y lo compara con una base de conocimiento 
            legal actualizada, generando un informe informativo para el usuario.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">2. Tecnología utilizada</h2>
          <p className="text-muted-foreground mb-4">
            ACROXIA emplea modelos de lenguaje de gran escala (LLM) para el procesamiento de texto natural. 
            Específicamente:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Extracción de texto:</strong> Procesamos documentos PDF, DOCX e imágenes para extraer el contenido textual.</li>
            <li><strong>Análisis semántico:</strong> Identificamos cláusulas y las categorizamos según su naturaleza.</li>
            <li><strong>Comparación legal:</strong> Contrastamos cada cláusula con nuestra base de datos de normativa aplicable (RAG - Retrieval-Augmented Generation).</li>
            <li><strong>Generación de informes:</strong> Producimos explicaciones comprensibles sobre cada hallazgo.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            3. Limitaciones importantes
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <p className="font-medium text-amber-800 mb-2">
              Es fundamental que comprendas las limitaciones de nuestro sistema:
            </p>
            <ul className="text-amber-700 space-y-2 list-disc list-inside">
              <li>La IA puede cometer errores de interpretación o no detectar todas las cláusulas problemáticas.</li>
              <li>El análisis se basa en patrones y puede no considerar el contexto específico de tu situación.</li>
              <li>La normativa legal cambia; aunque actualizamos nuestra base de datos, puede haber desfases.</li>
              <li>Cada contrato tiene particularidades que requieren valoración profesional individualizada.</li>
              <li>El sistema no tiene acceso a información contextual que un abogado sí podría obtener.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <Scale className="h-6 w-6" />
            4. Lo que ACROXIA NO es ni hace
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-border rounded-lg">
              <p className="font-medium text-red-600 mb-2">❌ NO es asesoramiento legal</p>
              <p className="text-sm text-muted-foreground">
                Los informes son meramente informativos y no constituyen consejo jurídico profesional.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="font-medium text-red-600 mb-2">❌ NO sustituye a un abogado</p>
              <p className="text-sm text-muted-foreground">
                Para decisiones legales importantes, consulta siempre con un abogado colegiado.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="font-medium text-red-600 mb-2">❌ NO te representa legalmente</p>
              <p className="text-sm text-muted-foreground">
                No podemos actuar en tu nombre ni defender tus intereses ante terceros o tribunales.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="font-medium text-red-600 mb-2">❌ NO garantiza resultados</p>
              <p className="text-sm text-muted-foreground">
                No podemos garantizar que las cláusulas identificadas sean declaradas nulas por un juez.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            5. Supervisión humana
          </h2>
          <p className="text-muted-foreground mb-4">
            Aunque nuestro sistema está automatizado, mantenemos supervisión humana en varios niveles:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Base de conocimiento legal:</strong> Juristas revisan y actualizan periódicamente nuestra base de datos normativa.</li>
            <li><strong>Mejora continua:</strong> Analizamos los resultados para detectar y corregir errores sistemáticos.</li>
            <li><strong>Soporte al usuario:</strong> Nuestro equipo está disponible para aclarar dudas sobre los informes.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Si crees que el sistema ha cometido un error significativo, puedes reportarlo a{" "}
            <a href="mailto:contacto@acroxia.com" className="text-primary hover:underline">
              contacto@acroxia.com
            </a>{" "}
            para su revisión.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            6. Tus derechos respecto a decisiones automatizadas
          </h2>
          <p className="text-muted-foreground mb-4">
            Conforme al artículo 22 del RGPD, tienes derecho a:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Obtener intervención humana:</strong> Puedes solicitar que un humano revise el análisis de tu contrato.</li>
            <li><strong>Expresar tu punto de vista:</strong> Puedes indicarnos si crees que el análisis es incorrecto.</li>
            <li><strong>Impugnar la decisión:</strong> Puedes solicitar una nueva evaluación si consideras que hay errores.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            ACROXIA no toma decisiones automatizadas que produzcan efectos jurídicos sobre ti. 
            Proporcionamos información para que tú tomes tus propias decisiones de forma informada.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">7. Privacidad y tratamiento de datos</h2>
          <p className="text-muted-foreground mb-4">
            Los contratos que subes son tratados de forma confidencial:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>Solo se procesan para generar tu análisis específico.</li>
            <li>No se utilizan para entrenar modelos de IA.</li>
            <li>Se almacenan de forma cifrada y segura.</li>
            <li>Puedes solicitar su eliminación en cualquier momento.</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Para más información, consulta nuestra{" "}
            <a href="/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            8. Datos de terceros y procesamiento por IA
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <p className="font-medium text-amber-800 mb-2">
              Información importante sobre datos de terceros
            </p>
            <p className="text-amber-700 mb-4">
              Los contratos de alquiler contienen datos personales tanto tuyos como del arrendador y posibles terceros (inmobiliarias, avalistas, etc.). A continuación explicamos cómo tratamos esta información.
            </p>
          </div>

          <h3 className="font-semibold text-foreground mt-6 mb-3">8.1. Qué datos se procesan</h3>
          <p className="text-muted-foreground mb-4">
            Para realizar el análisis, el texto completo del contrato (incluyendo nombres, DNI, direcciones y datos bancarios de todas las partes) se envía a nuestros sistemas de procesamiento.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">8.2. Proveedores de IA utilizados</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Google Gemini</strong> (a través de Lovable AI Gateway): Modelo de lenguaje utilizado para analizar el contenido del contrato e identificar cláusulas problemáticas.</li>
            <li>Los datos se transmiten de forma segura y cifrada.</li>
            <li>Existen acuerdos de procesamiento de datos (DPA) con los proveedores.</li>
          </ul>

          <h3 className="font-semibold text-foreground mt-6 mb-3">8.3. Medidas de anonimización</h3>
          <p className="text-muted-foreground mb-4">
            Para minimizar la exposición de datos sensibles de terceros, aplicamos las siguientes medidas <strong>antes</strong> de enviar el texto al modelo de IA:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>DNI/NIE:</strong> Se ocultan parcialmente (ej: ****5678*)</li>
            <li><strong>IBAN y cuentas bancarias:</strong> Se anonimizan completamente</li>
            <li><strong>Números de teléfono:</strong> Se ocultan parcialmente</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Esta anonimización permite que la IA analice las cláusulas legales sin necesidad de procesar datos identificativos completos.
          </p>

          <h3 className="font-semibold text-foreground mt-6 mb-3">8.4. Uso de los datos por los proveedores</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>Los proveedores de IA <strong>NO utilizan</strong> los datos de tus contratos para entrenar sus modelos.</li>
            <li>Los datos se procesan únicamente para generar la respuesta solicitada.</li>
            <li>No se almacenan de forma permanente en los servidores de los proveedores.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">9. Marco legal aplicable</h2>
          <p className="text-muted-foreground mb-4">
            Esta información de transparencia se proporciona en cumplimiento de:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li><strong>Reglamento (UE) 2024/1689</strong> (Reglamento de Inteligencia Artificial) - Obligaciones de transparencia (Art. 50).</li>
            <li><strong>Reglamento (UE) 2016/679</strong> (RGPD) - Información sobre decisiones automatizadas (Arts. 13-14, 22).</li>
            <li><strong>Ley Orgánica 3/2018</strong> (LOPDGDD) - Normativa española de protección de datos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            10. Contacto
          </h2>
          <p className="text-muted-foreground mb-4">
            Si tienes preguntas sobre el uso de IA en ACROXIA, puedes contactarnos:
          </p>
          <ul className="text-muted-foreground space-y-2">
            <li><strong>Email:</strong> <a href="mailto:contacto@acroxia.com" className="text-primary hover:underline">contacto@acroxia.com</a></li>
          </ul>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default TransparenciaIA;

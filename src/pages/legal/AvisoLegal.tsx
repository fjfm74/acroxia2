import LegalPageLayout from "@/components/legal/LegalPageLayout";

const AvisoLegal = () => {
  return (
    <LegalPageLayout
      title="Aviso Legal"
      metaDescription="Aviso legal de ACROXIA. Información sobre el titular del sitio web, condiciones de uso y propiedad intelectual."
      lastUpdated="8 de enero de 2026"
      allowIndex={true}
    >
      <div className="space-y-10 text-foreground/80">
        {/* Identificación del titular */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            1. Identificación del Titular
          </h2>
          <p className="mb-4 leading-relaxed">
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos del titular del sitio web:
          </p>
          <div className="bg-muted rounded-2xl p-6 space-y-2">
            <p><strong className="text-foreground">Razón Social:</strong> ACROXIA TECH S.L.</p>
            <p><strong className="text-foreground">CIF:</strong> B-12345678</p>
            <p><strong className="text-foreground">Domicilio Social:</strong> Calle Diagonal 456, 4ª Planta, 08006 Barcelona, España</p>
            <p><strong className="text-foreground">Email:</strong> legal@acroxia.com</p>
            <p><strong className="text-foreground">Teléfono:</strong> +34 900 000 000</p>
            <p><strong className="text-foreground">Registro Mercantil:</strong> Inscrita en el Registro Mercantil de Barcelona, Tomo 12345, Folio 67, Hoja B-89012</p>
          </div>
        </section>

        {/* Objeto y ámbito */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            2. Objeto y Ámbito de Aplicación
          </h2>
          <p className="mb-4 leading-relaxed">
            El presente Aviso Legal regula el uso del sitio web <strong className="text-foreground">www.acroxia.com</strong> (en adelante, el "Sitio Web"), del que es titular ACROXIA TECH S.L. (en adelante, "ACROXIA").
          </p>
          <p className="leading-relaxed">
            ACROXIA es una plataforma tecnológica que ofrece servicios de análisis automatizado de contratos de alquiler mediante tecnología de inteligencia artificial, con el objetivo de identificar cláusulas potencialmente abusivas o contrarias a la legislación vigente.
          </p>
        </section>

        {/* Condiciones de acceso */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            3. Condiciones de Acceso y Uso
          </h2>
          <p className="mb-4 leading-relaxed">
            El acceso al Sitio Web es gratuito, sin perjuicio del coste de conexión a través de la red de telecomunicaciones suministrada por el proveedor de acceso contratado por el usuario.
          </p>
          <p className="mb-4 leading-relaxed">
            El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que ACROXIA ofrece a través de su Sitio Web y, con carácter enunciativo pero no limitativo, a no emplearlos para:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Incurrir en actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</li>
            <li>Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico-ilegal, de apología del terrorismo o atentatorio contra los derechos humanos.</li>
            <li>Provocar daños en los sistemas físicos y lógicos de ACROXIA, de sus proveedores o de terceras personas.</li>
            <li>Introducir o difundir en la red virus informáticos o cualesquiera otros sistemas que sean susceptibles de provocar daños.</li>
          </ul>
        </section>

        {/* Propiedad intelectual */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            4. Propiedad Intelectual e Industrial
          </h2>
          <p className="mb-4 leading-relaxed">
            Todos los contenidos del Sitio Web, incluyendo, a título enunciativo pero no limitativo, textos, fotografías, gráficos, imágenes, iconos, tecnología, software, enlaces y demás contenidos audiovisuales o sonoros, así como su diseño gráfico y códigos fuente, son propiedad intelectual de ACROXIA o de terceros, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación reconocidos por la normativa vigente en materia de propiedad intelectual.
          </p>
          <p className="mb-4 leading-relaxed">
            Las marcas, nombres comerciales o signos distintivos son titularidad de ACROXIA o de terceros, sin que pueda entenderse que el acceso al Sitio Web atribuya ningún derecho sobre las citadas marcas, nombres comerciales y/o signos distintivos.
          </p>
          <p className="leading-relaxed">
            Queda expresamente prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otra forma de explotación de los contenidos del Sitio Web sin la autorización expresa y por escrito de ACROXIA.
          </p>
        </section>

        {/* Exclusión de garantías */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            5. Exclusión de Garantías y Responsabilidad
          </h2>
          <p className="mb-4 leading-relaxed">
            ACROXIA no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl">
            <p className="font-medium text-foreground mb-2">⚠️ Aviso Importante</p>
            <p className="leading-relaxed">
              El servicio de análisis de contratos proporcionado por ACROXIA tiene carácter meramente orientativo e informativo, y <strong className="text-foreground">no constituye en ningún caso asesoramiento legal profesional</strong>. Para cuestiones legales complejas o decisiones que puedan tener consecuencias jurídicas, se recomienda consultar con un abogado colegiado.
            </p>
          </div>
        </section>

        {/* Enlaces externos */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            6. Enlaces Externos
          </h2>
          <p className="leading-relaxed">
            El Sitio Web puede contener enlaces a sitios web de terceros. ACROXIA no asume ninguna responsabilidad por el contenido, veracidad o funcionamiento de dichos sitios web externos. La inclusión de estos enlaces no implica ningún tipo de asociación, fusión o participación con las entidades conectadas.
          </p>
        </section>

        {/* Modificaciones */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            7. Modificaciones
          </h2>
          <p className="leading-relaxed">
            ACROXIA se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.
          </p>
        </section>

        {/* Legislación aplicable */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
            8. Legislación Aplicable y Jurisdicción
          </h2>
          <p className="leading-relaxed">
            La relación entre ACROXIA y el usuario se regirá por la normativa española vigente. Para la resolución de cualquier controversia, las partes se someterán a los Juzgados y Tribunales de la ciudad de Barcelona, salvo que la normativa aplicable disponga otra cosa para los consumidores y usuarios.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default AvisoLegal;

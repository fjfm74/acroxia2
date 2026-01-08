import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  AlertTriangle, 
  Wallet, 
  TrendingUp, 
  CalendarX,
  ArrowRight
} from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

const categories = [
  {
    id: "derechos",
    title: "Derechos del Inquilino",
    icon: Scale,
    description: "Conoce tus derechos fundamentales según la LAU",
    faqs: [
      {
        question: "¿Cuáles son mis derechos básicos como inquilino en España?",
        answer: "Como inquilino en España tienes derecho a: ocupar la vivienda durante el plazo acordado (mínimo 5 años si el arrendador es persona física, 7 si es jurídica), prórrogas obligatorias, a que te devuelvan la fianza en 30 días, a no pagar gastos de gestión inmobiliaria, y a que el casero realice las reparaciones necesarias para mantener la habitabilidad del inmueble."
      },
      {
        question: "¿Puede el casero entrar en mi piso sin permiso?",
        answer: "No. El casero NO puede entrar en tu vivienda sin tu consentimiento previo, ni siquiera siendo el propietario. El domicilio es inviolable según el artículo 18 de la Constitución. Solo puede acceder con tu permiso o con autorización judicial. Si entra sin permiso, podría incurrir en un delito de allanamiento de morada."
      },
      {
        question: "¿Puedo negarme a una subida de alquiler?",
        answer: "Depende. Durante el contrato, solo pueden subir el alquiler si está expresamente pactado y conforme al índice legal (IRAV desde 2025). Si te proponen una subida fuera de estos límites, puedes negarte. Al renovar el contrato tras las prórrogas, el propietario puede proponer nuevas condiciones que puedes aceptar o rechazar."
      },
      {
        question: "¿Cuánto tiempo tengo derecho a vivir en el piso alquilado?",
        answer: "La LAU garantiza un mínimo de 5 años si el arrendador es persona física, o 7 años si es empresa. Aunque el contrato sea de 1 año, se prorroga automáticamente hasta alcanzar estos mínimos. Después, hay 3 años adicionales de prórroga tácita si ninguna parte comunica lo contrario con 4 meses de antelación."
      },
      {
        question: "¿Qué pasa si el propietario quiere vender el piso?",
        answer: "Tienes derecho de adquisición preferente: el propietario debe ofrecerte la compra en las mismas condiciones antes de venderlo a un tercero. Si el piso se vende, tu contrato sigue vigente y el nuevo propietario debe respetarlo hasta que termine. Esto está protegido por ley."
      },
      {
        question: "¿Puedo subarrendar una habitación de mi piso de alquiler?",
        answer: "Solo si el contrato lo permite expresamente o el propietario lo autoriza por escrito. El subarriendo total está prohibido. Si subarriendas sin permiso, el propietario puede resolver el contrato. En viviendas de protección oficial, el subarriendo está completamente prohibido."
      }
    ]
  },
  {
    id: "clausulas-abusivas",
    title: "Cláusulas Abusivas",
    icon: AlertTriangle,
    description: "Identifica qué cláusulas son ilegales en tu contrato",
    faqs: [
      {
        question: "¿Qué es una cláusula abusiva en un contrato de alquiler?",
        answer: "Una cláusula abusiva es aquella que va contra la Ley de Arrendamientos Urbanos (LAU) o que genera un desequilibrio importante entre los derechos del inquilino y el arrendador. Estas cláusulas son nulas de pleno derecho, es decir, no tienen ningún efecto legal aunque las hayas firmado."
      },
      {
        question: "¿Cuáles son las cláusulas ilegales más comunes en contratos de alquiler?",
        answer: "Las más frecuentes son: exigir más de 2 meses de fianza legal, cobrar al inquilino los gastos de inmobiliaria, prohibir mascotas de forma genérica, obligar a pagar IBI o derramas extraordinarias, cláusulas de permanencia con penalizaciones abusivas, y permitir al casero entrar sin previo aviso."
      },
      {
        question: "¿Puedo anular un contrato si tiene cláusulas abusivas?",
        answer: "Las cláusulas abusivas son nulas automáticamente, pero el resto del contrato sigue siendo válido. No necesitas anular todo el contrato: simplemente esas cláusulas no te obligan. Puedes reclamar si el arrendador intenta aplicarlas. En casos graves, podrías solicitar la resolución del contrato."
      },
      {
        question: "¿Es legal que me cobren más de 2 meses de fianza?",
        answer: "La fianza legal obligatoria es de 1 mes para vivienda habitual. Adicionalmente, pueden pedirte hasta 2 meses extra como garantía adicional (aval, depósito). Si te exigen más de 3 meses en total, es ilegal. En contratos anteriores a 2019, el límite era diferente."
      },
      {
        question: "¿Me pueden obligar a pagar el IBI o la comunidad?",
        answer: "El IBI es un impuesto del propietario y no es legalmente trasladable al inquilino en vivienda habitual según la LAU. Los gastos de comunidad pueden pactarse, pero debe quedar claro en el contrato. Si no hay pacto expreso, corresponden al propietario."
      },
      {
        question: "¿Es válida una cláusula que prohíbe tener mascotas?",
        answer: "Es discutido legalmente. Una prohibición genérica puede considerarse abusiva. Sin embargo, sí pueden establecerse condiciones razonables (tipo de animal, tamaño, responsabilidad por daños). Los tribunales tienden a fallar a favor del inquilino si la mascota no causa molestias."
      },
      {
        question: "¿Qué hacer si descubro cláusulas ilegales después de firmar?",
        answer: "Las cláusulas nulas no te obligan aunque las hayas firmado. Documenta las cláusulas abusivas, comunica por escrito al propietario que no las aceptas, y si intenta aplicarlas, puedes denunciar ante Consumo o demandar su nulidad. Guarda toda la comunicación."
      },
      {
        question: "¿Cómo denuncio cláusulas abusivas en mi contrato?",
        answer: "Puedes: 1) Presentar reclamación en la OMIC (Oficina Municipal de Información al Consumidor), 2) Denunciar ante la Agencia de Consumo de tu comunidad autónoma, 3) Acudir a un abogado especializado para demanda judicial. También puedes usar ACROXIA para identificar las cláusulas antes de reclamar."
      }
    ]
  },
  {
    id: "fianza",
    title: "Fianza y Depósitos",
    icon: Wallet,
    description: "Todo sobre la devolución de tu fianza",
    faqs: [
      {
        question: "¿Cuánto tiempo tiene el casero para devolverme la fianza?",
        answer: "El propietario tiene 30 días desde la entrega de llaves para devolverte la fianza. Si no lo hace en ese plazo, la fianza empieza a generar intereses legales a tu favor. Pasado el plazo, puedes reclamar por vía judicial."
      },
      {
        question: "¿Puede el casero quedarse mi fianza por el desgaste normal?",
        answer: "No. El desgaste normal por el uso habitual de la vivienda (pintura ligeramente deteriorada, marcas mínimas en paredes, electrodomésticos con uso normal) no justifica retener la fianza. Solo pueden descontarte por daños reales, no por deterioro natural."
      },
      {
        question: "¿Qué pasa si no me devuelven la fianza en 30 días?",
        answer: "Puedes reclamar de varias formas: 1) Enviar burofax exigiendo la devolución con intereses, 2) Reclamar ante la OMIC o Consumo, 3) Iniciar un proceso monitorio (rápido y barato para cantidades menores de 6.000€). A partir del día 31, se generan intereses legales."
      },
      {
        question: "¿Es legal pedir más de una mensualidad de fianza?",
        answer: "La fianza legal obligatoria es exactamente 1 mensualidad para vivienda habitual. Además, pueden pedir hasta 2 mensualidades como garantía adicional. Más de 3 meses en total es ilegal. Las garantías adicionales deben devolverse al terminar el contrato."
      },
      {
        question: "¿Cómo reclamar la fianza si el casero no responde?",
        answer: "1) Envía un burofax certificado reclamando la devolución, 2) Si no responde en 15 días, acude a la OMIC, 3) Si sigue sin responder, interpón una demanda de reclamación de cantidad (proceso monitorio si es menos de 6.000€). Puedes hacerlo sin abogado."
      },
      {
        question: "¿Qué diferencia hay entre fianza y depósito de garantía?",
        answer: "La fianza es la cantidad obligatoria por ley (1 mes) que se deposita en el organismo autonómico correspondiente. El depósito o garantía adicional es una cantidad extra (máximo 2 meses) que el propietario puede exigir y que guarda él directamente. Ambas deben devolverse al finalizar el contrato."
      }
    ]
  },
  {
    id: "subida-alquiler",
    title: "Subida del Alquiler",
    icon: TrendingUp,
    description: "Límites legales a las subidas de renta en 2025",
    faqs: [
      {
        question: "¿Cuánto puede subir mi alquiler en 2025?",
        answer: "Desde enero de 2025, las subidas de alquiler están limitadas al índice IRAV (Índice de Referencia de Arrendamientos de Vivienda), que sustituye al IPC. El IRAV actualmente ronda el 2-3% anual. Tu casero no puede subir más de este porcentaje en la actualización anual."
      },
      {
        question: "¿Qué es el IRAV y cómo afecta a mi alquiler?",
        answer: "El IRAV es el nuevo índice creado por la Ley de Vivienda para limitar las subidas de alquiler. Es más estable que el IPC y está diseñado específicamente para vivienda. Solo aplica en la actualización anual de contratos vigentes, no en renovaciones o nuevos contratos."
      },
      {
        question: "¿Pueden subirme el alquiler más del IRAV?",
        answer: "Durante el contrato, no: la subida está limitada al IRAV. Sin embargo, cuando el contrato termine (tras los 5-7 años + prórrogas), el propietario puede proponer un nuevo contrato con el precio que quiera. En zonas tensionadas hay límites adicionales."
      },
      {
        question: "¿Con cuánto tiempo de antelación deben avisarme de una subida?",
        answer: "El propietario debe comunicarte la subida con al menos 1 mes de antelación a la fecha en que corresponda la actualización (normalmente el aniversario del contrato). Si no te avisa a tiempo, la subida no puede aplicarse hasta el mes siguiente."
      },
      {
        question: "¿Qué puedo hacer si la subida es abusiva?",
        answer: "1) Verifica que la subida no supera el IRAV, 2) Comunica por escrito que rechazas subidas por encima del índice legal, 3) Si insisten, acude a la OMIC o Consumo, 4) En último caso, un juez puede declarar nula la subida abusiva. No pagues la diferencia mientras reclamas."
      }
    ]
  },
  {
    id: "fin-contrato",
    title: "Fin del Contrato",
    icon: CalendarX,
    description: "Cómo terminar el alquiler correctamente",
    faqs: [
      {
        question: "¿Cuánto preaviso debo dar para dejar el piso?",
        answer: "Debes avisar con al menos 30 días de antelación a la fecha en que quieras irte. Si no das este preaviso, el propietario puede reclamarte una mensualidad de indemnización. Es recomendable comunicarlo por escrito (email o burofax) para tener prueba."
      },
      {
        question: "¿Puede el casero echarme antes de que termine el contrato?",
        answer: "Solo en casos muy específicos: impago de rentas, daños graves a la vivienda, actividades molestas o ilícitas, subarriendo no autorizado, o si necesita la vivienda para sí mismo o familiares de primer grado (con ciertos requisitos). Fuera de estos casos, no puede echarte."
      },
      {
        question: "¿Qué pasa si me voy antes de cumplir el año?",
        answer: "Durante los primeros 6 meses NO puedes irte sin penalización (salvo pacto). A partir del mes 7, puedes irte dando 30 días de preaviso. Si hay cláusula de penalización, puede ser de máximo 1 mes por año que falte de contrato, prorrateado por meses."
      },
      {
        question: "¿Tengo que dejar el piso pintado al irme?",
        answer: "No necesariamente. Debes devolver el piso en el estado en que lo recibiste, salvo el deterioro normal por uso. Si lo recibiste recién pintado y lo has dejado muy deteriorado (manchas, agujeros), podrían descontarte de la fianza. El desgaste normal de la pintura no es reclamable."
      },
      {
        question: "¿Qué es la prórroga tácita y cómo funciona?",
        answer: "Tras el período mínimo (5-7 años), si ninguna de las partes comunica que no quiere continuar (con 4 meses de antelación el casero, 2 meses tú), el contrato se prorroga automáticamente por períodos anuales hasta un máximo de 3 años adicionales."
      }
    ]
  }
];

const FAQCategories = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {categories.map((category, categoryIndex) => (
            <FadeIn key={category.id} delay={categoryIndex * 0.1}>
              <div className="mb-24 last:mb-0">
                {/* Category Header */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <category.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2">
                      {category.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* FAQs Accordion */}
                <Accordion type="single" collapsible className="space-y-3 mb-4">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`${category.id}-${faqIndex}`}
                      className="border border-border rounded-xl px-6 bg-background data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5 text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* CTA after each category */}
                {categoryIndex === 1 && (
                  <div className="mt-10 mb-8 p-6 bg-muted rounded-2xl border border-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          ¿Tu contrato tiene cláusulas abusivas?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Analízalo gratis en menos de 2 minutos con nuestra IA
                        </p>
                      </div>
                      <Button asChild className="rounded-full px-6">
                        <Link to="/">
                          Analizar mi contrato
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQCategories;

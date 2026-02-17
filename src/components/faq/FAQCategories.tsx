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
  Receipt,
  ArrowRight
} from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

export const faqCategories = [
  {
    id: "derechos",
    title: "Derechos del Inquilino",
    icon: Scale,
    description: "Conoce tus derechos fundamentales según la LAU",
    faqs: [
      {
        question: "¿Cuáles son mis derechos básicos como inquilino en España?",
        answer: "Tienes derecho a permanecer en la vivienda un mínimo de 5 años (7 si el arrendador es empresa), a prórrogas obligatorias, a la devolución de la fianza en 30 días, a no pagar gastos de gestión inmobiliaria y a que el propietario realice las reparaciones necesarias para mantener la habitabilidad del inmueble.",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Guía: Devolución de fianza" }]
      },
      {
        question: "¿Puede el casero entrar en mi piso sin permiso?",
        answer: "No, en ningún caso. El domicilio es inviolable según el artículo 18 de la Constitución. El propietario solo puede acceder con tu consentimiento previo o con autorización judicial. Si entra sin permiso, podría incurrir en un delito de allanamiento de morada.",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas" }]
      },
      {
        question: "¿Puedo negarme a una subida de alquiler?",
        answer: "Sí, si la subida supera el índice legal (IRAV desde 2026). Durante el contrato, solo pueden subir el alquiler si está expresamente pactado y conforme al IRAV. Si te proponen una subida fuera de estos límites, puedes negarte. Al renovar tras las prórrogas, el propietario puede proponer nuevas condiciones.",
        links: [{ href: "/subida-alquiler-2026", label: "Guía: Subida de alquiler 2026" }]
      },
      {
        question: "¿Cuánto tiempo tengo derecho a vivir en el piso alquilado?",
        answer: "Mínimo 5 años si el arrendador es persona física, o 7 años si es empresa. Aunque el contrato sea de 1 año, se prorroga automáticamente hasta alcanzar estos mínimos (artículo 9 LAU). Después, hay 3 años adicionales de prórroga tácita si ninguna parte comunica lo contrario con 4 meses de antelación."
      },
      {
        question: "¿Qué pasa si el propietario quiere vender el piso?",
        answer: "Tu contrato sigue vigente: el nuevo propietario debe respetarlo hasta que termine. Además, tienes derecho de adquisición preferente (tanteo y retracto): el propietario debe ofrecerte la compra en las mismas condiciones antes de venderlo a un tercero."
      },
      {
        question: "¿Puedo subarrendar una habitación de mi piso de alquiler?",
        answer: "Solo con autorización expresa del propietario por escrito o si el contrato lo permite. El subarriendo total está prohibido por la LAU. Si subarriendas sin permiso, el propietario puede resolver el contrato. En viviendas de protección oficial, el subarriendo está completamente prohibido."
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
        answer: "Es una cláusula nula de pleno derecho que contraviene la LAU o genera un desequilibrio significativo entre los derechos del inquilino y del arrendador. No tiene ningún efecto legal aunque la hayas firmado.",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Las 8 cláusulas abusivas más comunes" }]
      },
      {
        question: "¿Cuáles son las cláusulas ilegales más comunes en contratos de alquiler?",
        answer: "Las 6 más frecuentes son: exigir más de 2 meses de garantía adicional (máximo 3 meses en total), cobrar al inquilino los gastos de inmobiliaria, prohibir mascotas de forma genérica, obligar a pagar el IBI, penalizaciones por desistimiento superiores a 1 mes/año, y permitir al casero entrar sin previo aviso.",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Guía completa de cláusulas abusivas" }]
      },
      {
        question: "¿Puedo anular un contrato si tiene cláusulas abusivas?",
        answer: "No es necesario anular todo el contrato. Las cláusulas abusivas son nulas automáticamente, pero el resto del contrato sigue siendo válido. Simplemente esas cláusulas no te obligan. Si el arrendador intenta aplicarlas, puedes reclamar. En casos graves, podrías solicitar la resolución del contrato."
      },
      {
        question: "¿Es legal que me cobren más de 2 meses de fianza?",
        answer: "La fianza legal es de 1 mes para vivienda habitual. Adicionalmente pueden pedirte hasta 2 meses de garantía adicional. El total máximo permitido es de 3 meses de renta. Si te exigen más, se considera contrario a la LAU."
      },
      {
        question: "¿Me pueden obligar a pagar el IBI o la comunidad?",
        answer: "El IBI no es trasladable al inquilino en vivienda habitual según la LAU: es un impuesto del propietario. Los gastos de comunidad pueden pactarse, pero debe constar expresamente en el contrato. Sin pacto expreso, corresponden al propietario."
      },
      {
        question: "¿Es válida una cláusula que prohíbe tener mascotas?",
        answer: "Una prohibición genérica puede considerarse abusiva según la jurisprudencia reciente. Sí son válidas restricciones razonables (tipo de animal, tamaño, responsabilidad por daños). Los tribunales tienden a fallar a favor del inquilino si la mascota no causa molestias."
      },
      {
        question: "¿Qué hacer si descubro cláusulas ilegales después de firmar?",
        answer: "Las cláusulas nulas no te obligan aunque las hayas firmado. Documenta las cláusulas abusivas, comunica por escrito al propietario que no las aceptas, y si intenta aplicarlas, denuncia ante Consumo o demanda su nulidad. Guarda toda la comunicación como prueba."
      },
      {
        question: "¿Cómo denuncio cláusulas abusivas en mi contrato?",
        answer: "Tres vías principales: 1) Reclamación en la OMIC (Oficina Municipal de Información al Consumidor), 2) Denuncia ante la Agencia de Consumo de tu comunidad autónoma, 3) Demanda judicial con abogado especializado. ACROXIA puede ayudarte a identificar las cláusulas antes de reclamar."
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
        answer: "30 días desde la entrega de llaves (artículo 36.4 LAU). Si no la devuelve en ese plazo, la fianza genera intereses legales a tu favor automáticamente. Pasado el plazo, puedes reclamar por vía judicial.",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Guía completa de devolución de fianza" }]
      },
      {
        question: "¿Puede el casero quedarse mi fianza por el desgaste normal?",
        answer: "No. El desgaste normal por uso habitual (pintura ligeramente deteriorada, marcas mínimas en paredes, electrodomésticos con uso normal) no justifica retener la fianza según la jurisprudencia. Solo pueden descontarte por daños reales que excedan el deterioro natural.",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Motivos ilegales de retención de fianza" }]
      },
      {
        question: "¿Qué pasa si no me devuelven la fianza en 30 días?",
        answer: "A partir del día 31 se generan intereses legales a tu favor. Puedes: 1) Enviar burofax exigiendo la devolución con intereses, 2) Reclamar ante la OMIC o Consumo, 3) Iniciar un proceso monitorio (rápido y sin abogado para cantidades menores de 2.000€).",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Cómo reclamar la fianza paso a paso" }]
      },
      {
        question: "¿Es legal pedir más de una mensualidad de fianza?",
        answer: "La fianza legal es exactamente 1 mensualidad. Además pueden pedir hasta 2 mensualidades de garantía adicional. El total máximo: 3 meses de renta. Cualquier cantidad superior es ilegal según la LAU. Las garantías adicionales deben devolverse al finalizar el contrato."
      },
      {
        question: "¿Cómo reclamar la fianza si el casero no responde?",
        answer: "Sigue estos pasos: 1) Envía burofax certificado reclamando la devolución, 2) Si no responde en 15 días, acude a la OMIC, 3) Si sigue sin responder, interpón una demanda monitoria (sin abogado para menos de 2.000€). Puedes hacerlo sin abogado."
      },
      {
        question: "¿Qué diferencia hay entre fianza y depósito de garantía?",
        answer: "La fianza es 1 mes obligatorio por ley, depositado en el organismo autonómico correspondiente. La garantía adicional es una cantidad extra (máximo 2 meses) que guarda el propietario directamente. Ambas deben devolverse al finalizar el contrato."
      }
    ]
  },
  {
    id: "subida-alquiler",
    title: "Subida del Alquiler e IRAV 2026",
    icon: TrendingUp,
    description: "Límites legales a las subidas de renta en 2026",
    faqs: [
      {
        question: "¿Cuánto puede subir mi alquiler en 2026?",
        answer: "Máximo el IRAV, que ronda el 2-3% anual (aproximadamente 2,2% en enero 2026). El IRAV sustituye al IPC desde la Ley de Vivienda 2023 y es el único índice aplicable para vivienda habitual. Tu casero no puede subir más de este porcentaje en la actualización anual.",
        links: [{ href: "/subida-alquiler-2026", label: "Guía completa: Subida de alquiler 2026" }]
      },
      {
        question: "¿Qué es el IRAV y cómo afecta a mi alquiler?",
        answer: "El IRAV (Índice de Referencia de Arrendamientos de Vivienda) es el nuevo índice legal que sustituye al IPC para limitar las subidas de alquiler de vivienda habitual. Es más estable que el IPC y lo publica mensualmente el INE. Solo aplica en la actualización anual de contratos vigentes, no en renovaciones o nuevos contratos.",
        links: [{ href: "/subida-alquiler-2026", label: "Todo sobre el IRAV 2026" }]
      },
      {
        question: "¿Cuál es el IRAV de enero 2026?",
        answer: "Aproximadamente el 2,2% según el INE. Esto significa que la subida máxima aplicable en la actualización anual de 2026 es del 2,2% sobre tu renta actual. Consulta siempre el valor oficial actualizado en la web del INE."
      },
      {
        question: "¿Pueden subirme el alquiler más del IRAV?",
        answer: "No durante el contrato vigente: la subida está limitada al IRAV por ley. Sin embargo, al terminar el contrato (tras los 5-7 años + prórrogas), el propietario puede proponer un nuevo contrato con el precio que quiera. En zonas tensionadas hay límites adicionales."
      },
      {
        question: "¿Qué diferencia hay entre el IRAV y el IPC para el alquiler?",
        answer: "El IPC mide la inflación general y es muy volátil (llegó al 10% en 2022). El IRAV está diseñado específicamente para vivienda y es más estable, rondando el 2-3%. Desde la Ley de Vivienda 2023, el IRAV sustituye al IPC para actualizar alquileres de vivienda habitual."
      },
      {
        question: "¿Con cuánto tiempo de antelación deben avisarme de una subida?",
        answer: "Mínimo 1 mes de antelación a la fecha de actualización (normalmente el aniversario del contrato). Si el propietario no te avisa a tiempo, la subida no puede aplicarse hasta el mes siguiente al de la comunicación."
      },
      {
        question: "¿Qué puedo hacer si la subida es abusiva?",
        answer: "No pagues la diferencia y reclama: 1) Verifica que la subida supera el IRAV, 2) Comunica por escrito que rechazas subidas por encima del índice legal, 3) Acude a la OMIC o Consumo, 4) Un juez puede declarar nula la subida abusiva."
      },
      {
        question: "¿Aplica el IRAV a locales comerciales y oficinas?",
        answer: "No, solo a vivienda habitual. Los contratos de locales comerciales, oficinas, naves industriales y otros usos pueden pactar libremente el índice de actualización (IPC u otro) o la subida que acuerden las partes."
      }
    ]
  },
  {
    id: "fin-contrato",
    title: "Fin del Contrato y Penalizaciones",
    icon: CalendarX,
    description: "Cómo terminar el alquiler y evitar penalizaciones abusivas",
    faqs: [
      {
        question: "¿Cuánto preaviso debo dar para dejar el piso?",
        answer: "30 días de antelación como mínimo. Si no das este preaviso, el propietario puede reclamarte una mensualidad de indemnización. Comunícalo siempre por escrito (email o burofax) para tener prueba documental."
      },
      {
        question: "¿Puede el casero echarme antes de que termine el contrato?",
        answer: "Solo en casos tasados por ley: impago de rentas, daños graves a la vivienda, actividades molestas o ilícitas, subarriendo no autorizado, o necesidad de la vivienda para sí mismo o familiares de primer grado (con requisitos específicos). Fuera de estos supuestos, no puede echarte."
      },
      {
        question: "¿Qué pasa si me voy antes de cumplir el año?",
        answer: "Los primeros 6 meses son de permanencia obligatoria por ley: no puedes irte sin penalización (salvo pacto). A partir del mes 7, puedes irte dando 30 días de preaviso. La penalización máxima es de 1 mes por año que falte de contrato, prorrateado por meses."
      },
      {
        question: "¿Cuál es la penalización legal por irme antes de tiempo?",
        answer: "Máximo 1 mensualidad por cada año que falte por cumplir, prorrateada por meses (artículo 11 LAU). Ejemplo: si te faltan 8 meses, la penalización máxima sería 8/12 = 0,67 mensualidades. Cualquier penalización mayor es abusiva y reclamable."
      },
      {
        question: "¿Son legales las cláusulas de permanencia en alquiler?",
        answer: "Sí, con límites: los primeros 6 meses son de permanencia obligatoria por ley. A partir del mes 7, puedes irte con 30 días de preaviso. Si el contrato establece permanencias más largas con penalizaciones superiores a 1 mes/año, esas cláusulas son nulas."
      },
      {
        question: "¿Tengo que dejar el piso pintado al irme?",
        answer: "No necesariamente. Solo debes devolver el piso en el estado en que lo recibiste, salvo el deterioro normal por uso. El desgaste normal de la pintura no es reclamable según la jurisprudencia. Solo pueden descontarte de la fianza si hay daños reales (manchas graves, agujeros)."
      },
      {
        question: "¿Qué es la prórroga tácita y cómo funciona?",
        answer: "Es una extensión automática del contrato: tras el período mínimo (5-7 años), si ninguna parte comunica que no quiere continuar (4 meses de antelación el casero, 2 meses tú), el contrato se prorroga automáticamente por períodos anuales hasta un máximo de 3 años adicionales."
      },
      {
        question: "¿Puede el casero no renovarme el contrato después de 5 años?",
        answer: "Sí, tras los 5 años mínimos (7 si es empresa). El propietario debe comunicarlo con 4 meses de antelación por escrito. Si no lo comunica, se activa la prórroga tácita automática. En zonas tensionadas existen prórrogas extraordinarias adicionales."
      }
    ]
  },
  {
    id: "gastos-comunidad",
    title: "Gastos de Comunidad y Suministros",
    icon: Receipt,
    description: "Qué gastos puedes y no puedes pagar como inquilino",
    faqs: [
      {
        question: "¿Tengo que pagar los gastos de comunidad como inquilino?",
        answer: "Solo si está expresamente pactado en el contrato. Sin pacto escrito, corresponden al propietario. Si hay pacto, debe especificar la cantidad mensual o porcentaje. El casero no puede añadirlos después de firmar el contrato."
      },
      {
        question: "¿Es legal que el inquilino pague el IBI?",
        answer: "No en vivienda habitual. El IBI es un impuesto sobre la propiedad que corresponde siempre al propietario según la LAU. Si tu contrato incluye esta cláusula, es nula y puedes reclamar lo pagado indebidamente."
      },
      {
        question: "¿Quién paga las derramas extraordinarias?",
        answer: "El propietario, no el inquilino. Las derramas para mejoras o reparaciones estructurales corresponden al dueño del inmueble. Solo podrían repercutirte servicios que disfrutas directamente (como un ascensor nuevo), y aun así es discutible legalmente."
      },
      {
        question: "¿Puedo negarme a pagar gastos que no están en el contrato?",
        answer: "Sí, sin excepciones. Si un gasto no está pactado expresamente en el contrato, no tienes obligación de pagarlo. Esto incluye comunidad, IBI, seguros del hogar del propietario y tasas de basura. Exige siempre que te especifiquen los gastos por escrito."
      },
      {
        question: "¿Los suministros (luz, agua, gas) van siempre a mi cargo?",
        answer: "Generalmente sí, pero debe estar pactado en el contrato. Lo habitual es que el inquilino pague los suministros de consumo. Sin embargo, el alta o la instalación de contadores y las altas de suministros son responsabilidad del propietario."
      },
      {
        question: "¿Quién paga el seguro de hogar en un piso de alquiler?",
        answer: "El seguro del continente (estructura, paredes) lo paga el propietario. El seguro del contenido (tus muebles y enseres) es opcional y lo pagas tú si quieres contratarlo. No pueden obligarte a contratar un seguro de hogar completo."
      },
      {
        question: "¿Pueden obligarme a pagar la tasa de basuras?",
        answer: "Depende del municipio. Si la tasa va vinculada al IBI, la paga el propietario. Si es una tasa municipal independiente y el contrato establece que la pagas tú, puede ser válido. Consulta la regulación de tu ayuntamiento."
      }
    ]
  }
];

const FAQCategories = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
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
                        {(faq as any).links && (faq as any).links.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {(faq as any).links.map((link: { href: string; label: string }, i: number) => (
                              <Link
                                key={i}
                                to={link.href}
                                className="inline-flex items-center gap-1 text-sm text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground mr-4"
                              >
                                {link.label}
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            ))}
                          </div>
                        )}
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
                        <Link to="/analizar-gratis">
                          Analizar mi contrato gratis
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

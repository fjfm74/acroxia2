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
        answer: "Duración mínima de 5 años —7 si el arrendador es persona jurídica— (art. 9 LAU), prórrogas obligatorias de hasta 3 años adicionales (art. 10 LAU), devolución de la fianza en 30 días (art. 36.4 LAU), gratuidad de los gastos de gestión inmobiliaria (art. 20.1 LAU) y obligación del propietario de realizar reparaciones de conservación (art. 21 LAU).",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Guía: Devolución de fianza" }]
      },
      {
        question: "¿Puede el casero entrar en mi piso sin permiso?",
        answer: "No. El domicilio es inviolable (art. 18.2 Constitución Española). El propietario solo puede acceder con tu consentimiento previo o autorización judicial. La entrada sin permiso puede constituir delito de allanamiento de morada (art. 202 Código Penal), con penas de 6 meses a 2 años de prisión.",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas" }]
      },
      {
        question: "¿Puedo negarme a una subida de alquiler?",
        answer: "Sí, si supera el IRAV (art. 46 Ley 12/2023 de Vivienda). Durante el contrato vigente, la actualización anual de renta está limitada al IRAV (~2,2% en enero 2026). Cualquier subida superior es rechazable. Al finalizar el período mínimo (5-7 años + prórrogas), el propietario puede proponer nuevas condiciones.",
        links: [{ href: "/subida-alquiler-2026", label: "Guía: Subida de alquiler 2026" }]
      },
      {
        question: "¿Cuánto tiempo tengo derecho a vivir en el piso alquilado?",
        answer: "Mínimo 5 años si el arrendador es persona física, 7 años si es persona jurídica (art. 9 LAU). Los contratos de duración inferior se prorrogan automáticamente hasta alcanzar estos mínimos. Después, 3 años adicionales de prórroga tácita si ninguna parte comunica lo contrario con 4 meses (arrendador) o 2 meses (inquilino) de antelación (art. 10 LAU)."
      },
      {
        question: "¿Qué pasa si el propietario quiere vender el piso?",
        answer: "Tu contrato sigue vigente: el nuevo propietario debe respetarlo hasta su finalización (art. 14 LAU). Además, tienes derecho de adquisición preferente —tanteo y retracto— (art. 25 LAU): el propietario debe ofrecerte la compra en las mismas condiciones antes de venderlo a un tercero, con un plazo de 30 días naturales para ejercer el tanteo."
      },
      {
        question: "¿Puedo subarrendar una habitación de mi piso de alquiler?",
        answer: "Solo parcialmente y con consentimiento escrito del propietario (art. 8.2 LAU). El subarriendo total está expresamente prohibido. El subarriendo no consentido es causa de resolución del contrato (art. 27.2.c LAU). En viviendas de protección oficial, el subarriendo está completamente prohibido."
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
        answer: "Es una cláusula nula de pleno derecho (art. 6 LAU) que contraviene normas imperativas de la LAU o genera un desequilibrio significativo entre los derechos de las partes. No produce ningún efecto legal aunque la hayas firmado: la nulidad es automática.",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Las 8 cláusulas abusivas más comunes" }]
      },
      {
        question: "¿Cuáles son las cláusulas ilegales más comunes en contratos de alquiler?",
        answer: "Las 6 más frecuentes son: 1) exigir más de 2 meses de garantía adicional (art. 36.5 LAU, máx. 3 meses totales), 2) cobrar al inquilino los gastos de inmobiliaria (art. 20.1 LAU), 3) prohibir mascotas de forma genérica, 4) obligar a pagar el IBI, 5) penalizaciones por desistimiento superiores a 1 mes/año pendiente (art. 11 LAU), y 6) permitir al casero entrar sin previo aviso (art. 18.2 CE).",
        links: [{ href: "/clausulas-abusivas-alquiler", label: "Guía completa de cláusulas abusivas" }]
      },
      {
        question: "¿Puedo anular un contrato si tiene cláusulas abusivas?",
        answer: "No es necesario anular todo el contrato. Las cláusulas abusivas son nulas automáticamente (art. 6 LAU), pero el resto del contrato sigue siendo válido. Simplemente esas cláusulas no te obligan. Si el arrendador intenta aplicarlas, puedes reclamar su nulidad judicialmente."
      },
      {
        question: "¿Es legal que me cobren más de 2 meses de fianza?",
        answer: "La fianza legal es exactamente 1 mensualidad (art. 36.1 LAU). Adicionalmente pueden pedir hasta 2 mensualidades de garantía adicional (art. 36.5 LAU). El total máximo permitido es de 3 meses de renta. Cualquier cantidad superior contraviene la LAU."
      },
      {
        question: "¿Me pueden obligar a pagar el IBI o la comunidad?",
        answer: "El IBI no es trasladable al inquilino en vivienda habitual: es un impuesto sobre la propiedad del que responde el propietario. Los gastos de comunidad pueden pactarse expresamente en el contrato (art. 20 LAU). Sin pacto expreso, corresponden al propietario."
      },
      {
        question: "¿Es válida una cláusula que prohíbe tener mascotas?",
        answer: "Una prohibición genérica puede considerarse abusiva según la jurisprudencia reciente. Sí son válidas restricciones razonables (tipo de animal, tamaño, responsabilidad por daños). La Ley 7/2023 de Bienestar Animal refuerza los derechos de tenencia responsable de animales."
      },
      {
        question: "¿Qué hacer si descubro cláusulas ilegales después de firmar?",
        answer: "Las cláusulas contrarias a la LAU son nulas aunque las hayas firmado (art. 6 LAU). Documéntalas, comunica por escrito al propietario que no las aceptas (burofax recomendado), y si intenta aplicarlas, denuncia ante Consumo o demanda la nulidad. Conserva toda la comunicación como prueba."
      },
      {
        question: "¿Cómo denuncio cláusulas abusivas en mi contrato?",
        answer: "3 vías principales: 1) Reclamación en la OMIC (gratuita), 2) Denuncia ante la Agencia de Consumo de tu comunidad autónoma, 3) Demanda judicial (sin abogado obligatorio para cuantías inferiores a 2.000 €). ACROXIA puede ayudarte a identificar las cláusulas potencialmente abusivas antes de reclamar."
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
        answer: "30 días desde la entrega de llaves (art. 36.4 LAU). Si no la devuelve en ese plazo, la cantidad genera intereses legales a tu favor automáticamente. Pasado el plazo, puedes reclamar por vía judicial o mediante proceso monitorio.",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Guía completa de devolución de fianza" }]
      },
      {
        question: "¿Puede el casero quedarse mi fianza por el desgaste normal?",
        answer: "No. El desgaste por uso habitual no justifica retención de fianza según jurisprudencia consolidada. Solo pueden descontarte por daños reales que excedan el deterioro natural. La carga de la prueba recae en el arrendador (art. 36.4 LAU).",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Motivos ilegales de retención de fianza" }]
      },
      {
        question: "¿Qué pasa si no me devuelven la fianza en 30 días?",
        answer: "A partir del día 31 se generan intereses legales a tu favor (art. 36.4 LAU). Puedes: 1) Enviar burofax exigiendo la devolución con intereses, 2) Reclamar ante la OMIC o Consumo (gratuito), 3) Iniciar un proceso monitorio (sin abogado obligatorio para cuantías inferiores a 2.000 €).",
        links: [{ href: "/devolucion-fianza-alquiler", label: "Cómo reclamar la fianza paso a paso" }]
      },
      {
        question: "¿Es legal pedir más de una mensualidad de fianza?",
        answer: "La fianza legal es exactamente 1 mensualidad de renta (art. 36.1 LAU). Adicionalmente pueden pedir hasta 2 mensualidades de garantía adicional (art. 36.5 LAU). El total máximo: 3 meses de renta. Cualquier cantidad superior contraviene la LAU."
      },
      {
        question: "¿Cómo reclamar la fianza si el casero no responde?",
        answer: "3 pasos: 1) Envía burofax certificado reclamando la devolución con intereses (art. 36.4 LAU), 2) Si no responde en 15 días, acude a la OMIC (gratuito), 3) Interpón demanda monitoria (sin abogado obligatorio para cuantías inferiores a 2.000 €, art. 812 LEC)."
      },
      {
        question: "¿Qué diferencia hay entre fianza y depósito de garantía?",
        answer: "La fianza es 1 mensualidad obligatoria por ley (art. 36.1 LAU), depositada en el organismo autonómico correspondiente. La garantía adicional es una cantidad extra —máximo 2 mensualidades (art. 36.5 LAU)— que custodia directamente el propietario. Ambas deben devolverse al finalizar el contrato."
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
        answer: "Máximo el IRAV: aproximadamente 2,2% en enero 2026 (publicado por el INE). El IRAV sustituye al IPC para vivienda habitual desde la Ley 12/2023 de Vivienda (Disposición final 6ª). Tu casero no puede aplicar una subida superior en la actualización anual de renta.",
        links: [{ href: "/subida-alquiler-2026", label: "Guía completa: Subida de alquiler 2026" }]
      },
      {
        question: "¿Qué es el IRAV y cómo afecta a mi alquiler?",
        answer: "El IRAV (Índice de Referencia de Arrendamientos de Vivienda) es el índice legal que sustituye al IPC para limitar subidas de alquiler de vivienda habitual (Disposición final 6ª, Ley 12/2023). Lo publica mensualmente el INE, es más estable que el IPC (~2-3% vs. hasta 10% del IPC en 2022), y solo aplica a la actualización anual de contratos vigentes.",
        links: [{ href: "/subida-alquiler-2026", label: "Todo sobre el IRAV 2026" }]
      },
      {
        question: "¿Cuál es el IRAV de enero 2026?",
        answer: "Aproximadamente 2,2% según el INE. Esto significa que la subida máxima aplicable en la actualización anual de 2026 es del 2,2% sobre la renta vigente. Consulta siempre el valor oficial actualizado en la web del INE (ine.es)."
      },
      {
        question: "¿Pueden subirme el alquiler más del IRAV?",
        answer: "No durante el contrato vigente: la actualización está limitada al IRAV por ley (Disposición final 6ª, Ley 12/2023). Al terminar el período mínimo (5 años persona física / 7 años persona jurídica + prórrogas), el propietario puede proponer un nuevo contrato con precio libre. En zonas tensionadas existen límites adicionales (art. 17.6-17.7 LAU modificado)."
      },
      {
        question: "¿Qué diferencia hay entre el IRAV y el IPC para el alquiler?",
        answer: "El IPC mide la inflación general y es volátil (llegó al 10,8% en julio 2022). El IRAV está diseñado específicamente para vivienda y es más estable (~2-3% anual). Desde 2024, el IRAV sustituye al IPC para actualizar alquileres de vivienda habitual (Disposición final 6ª, Ley 12/2023)."
      },
      {
        question: "¿Con cuánto tiempo de antelación deben avisarme de una subida?",
        answer: "Mínimo 1 mes de antelación a la fecha de actualización, que suele coincidir con el aniversario del contrato (art. 18.1 LAU). Si el propietario no notifica a tiempo, la subida no puede aplicarse hasta el mes siguiente al de la comunicación. La notificación debe ser por escrito."
      },
      {
        question: "¿Qué puedo hacer si la subida es abusiva?",
        answer: "No pagues la diferencia y reclama: 1) Verifica que supera el IRAV vigente, 2) Comunica por escrito (burofax) que rechazas subidas por encima del índice legal, 3) Acude a la OMIC o Consumo (gratuito), 4) Un juez puede declarar nula la subida que exceda el IRAV."
      },
      {
        question: "¿Aplica el IRAV a locales comerciales y oficinas?",
        answer: "No, solo a arrendamientos de vivienda habitual (art. 2 LAU). Los contratos de locales comerciales, oficinas y naves industriales se rigen por el régimen de arrendamientos para uso distinto de vivienda (art. 3 LAU) y pueden pactar libremente el índice de actualización."
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
        answer: "30 días de antelación como mínimo (art. 11 LAU). Si no das este preaviso, el propietario puede reclamarte la indemnización proporcional correspondiente. Comunícalo siempre por escrito —burofax o email con acuse de recibo— para tener prueba documental."
      },
      {
        question: "¿Puede el casero echarme antes de que termine el contrato?",
        answer: "Solo por causas tasadas en la ley (art. 27.2 LAU): a) impago de rentas, b) subarriendo no consentido, c) daños dolosos, d) actividades molestas, insalubres o ilícitas, e) obras no consentidas. También puede recuperar la vivienda para uso propio o de familiares de primer grado, con requisitos específicos (art. 9.3 LAU)."
      },
      {
        question: "¿Qué pasa si me voy antes de cumplir el año?",
        answer: "Los primeros 6 meses son de permanencia obligatoria (art. 11 LAU): no puedes desistir sin consecuencias. A partir del mes 7, puedes irte dando 30 días de preaviso. La indemnización máxima pactable es de 1 mensualidad por cada año que falte de contrato, prorrateado por meses."
      },
      {
        question: "¿Cuál es la penalización legal por irme antes de tiempo?",
        answer: "Máximo 1 mensualidad por cada año pendiente de cumplir, prorrateada por meses (art. 11 LAU). Ejemplo: si faltan 8 meses, la indemnización máxima sería 8/12 = 0,67 mensualidades. Cualquier penalización superior podría ser declarada abusiva."
      },
      {
        question: "¿Son legales las cláusulas de permanencia en alquiler?",
        answer: "Los primeros 6 meses son de permanencia obligatoria por ley (art. 11 LAU). A partir del mes 7, el inquilino puede desistir con 30 días de preaviso. Las cláusulas que establezcan permanencias más largas con penalizaciones superiores a 1 mes/año pendiente podrían ser declaradas nulas (art. 6 LAU)."
      },
      {
        question: "¿Tengo que dejar el piso pintado al irme?",
        answer: "No necesariamente. Debes devolver el piso en el estado en que lo recibiste, salvo el deterioro por uso normal (art. 1561 Código Civil). El desgaste habitual de la pintura no es reclamable según jurisprudencia consolidada. Solo pueden descontarte de la fianza por daños reales que excedan el deterioro natural."
      },
      {
        question: "¿Qué es la prórroga tácita y cómo funciona?",
        answer: "Tras el período mínimo de 5-7 años, si ninguna parte comunica que no quiere continuar —4 meses de antelación el arrendador, 2 meses el inquilino—, el contrato se prorroga automáticamente por períodos anuales hasta un máximo de 3 años adicionales (art. 10 LAU)."
      },
      {
        question: "¿Puede el casero no renovarme el contrato después de 5 años?",
        answer: "Sí, tras los 5 años mínimos —7 si es persona jurídica— (art. 9 LAU). Debe comunicarlo con 4 meses de antelación por escrito (art. 10.1 LAU). Si no lo comunica a tiempo, se activa la prórroga tácita automática. En zonas tensionadas, la Ley 12/2023 establece prórrogas extraordinarias adicionales."
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
        answer: "Solo si está expresamente pactado en el contrato (art. 20 LAU). Sin pacto escrito, corresponden al propietario. El pacto debe especificar la cantidad mensual o el porcentaje. El arrendador no puede añadir este gasto después de firmar el contrato."
      },
      {
        question: "¿Es legal que el inquilino pague el IBI?",
        answer: "El IBI es un impuesto sobre la propiedad que corresponde al propietario como sujeto pasivo (art. 63 del Texto Refundido de la Ley de Haciendas Locales). En vivienda habitual, su repercusión al inquilino es contraria al espíritu de la LAU. Si tu contrato incluye esta cláusula, podría ser declarada nula."
      },
      {
        question: "¿Quién paga las derramas extraordinarias?",
        answer: "El propietario, no el inquilino. Las derramas para mejoras o reparaciones estructurales corresponden al titular del inmueble (art. 21 LAU para conservación, art. 22 LAU para mejoras). Solo podrían repercutirte gastos por servicios individualizados que disfrutes directamente."
      },
      {
        question: "¿Puedo negarme a pagar gastos que no están en el contrato?",
        answer: "Sí. Si un gasto no está pactado expresamente en el contrato, no tienes obligación de pagarlo (art. 20 LAU). Esto incluye comunidad, IBI, seguros del hogar del propietario y tasas de basura. Exige siempre que te detallen los gastos por escrito antes de firmar."
      },
      {
        question: "¿Los suministros (luz, agua, gas) van siempre a mi cargo?",
        answer: "Generalmente sí, pero debe estar pactado en el contrato (art. 20.3 LAU). Lo habitual es que el inquilino asuma los suministros de consumo. Sin embargo, el alta de suministros y la instalación de contadores son responsabilidad del propietario como parte de la habitabilidad de la vivienda (art. 21 LAU)."
      },
      {
        question: "¿Quién paga el seguro de hogar en un piso de alquiler?",
        answer: "El seguro del continente (estructura, paredes) corresponde al propietario. El seguro del contenido (tus muebles y enseres) es opcional y lo contratas tú si lo deseas. No pueden obligarte a contratar un seguro de hogar completo: sería una cláusula potencialmente abusiva (art. 6 LAU)."
      },
      {
        question: "¿Pueden obligarme a pagar la tasa de basuras?",
        answer: "Depende del municipio. Si la tasa va vinculada al IBI, la paga el propietario como sujeto pasivo. Si es una tasa municipal independiente y el contrato establece expresamente que la asumes tú (art. 20 LAU), puede ser válido. Consulta la ordenanza fiscal de tu ayuntamiento."
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

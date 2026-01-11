import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { ContractConfig } from './contractTemplateConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para generar el contenido del contrato dinámicamente
function generateContractContent(config: ContractConfig): string {
  const fechaFormateada = format(config.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es });
  
  let content = `CONTRATO DE ARRENDAMIENTO DE ${config.propertyType === 'vivienda_habitual' ? 'VIVIENDA HABITUAL' : 'INMUEBLE PARA USO DISTINTO DE VIVIENDA'}

En _________________________ (localidad), a _____ de _____________ de _____

REUNIDOS

De una parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDADOR/A".

De otra parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDATARIO/A".

Ambas partes se reconocen capacidad legal suficiente para el otorgamiento del presente contrato y, a tal efecto,

EXPONEN

I. Que EL/LA ARRENDADOR/A es propietario/a del inmueble sito en:

Dirección: _________________________________________________________________
Municipio: ${config.municipio || '_________________________'}
Código Postal: _______________
Comunidad Autónoma: ${config.comunidadAutonoma || '_________________________'}
Referencia Catastral: _________________________________________________________

${config.propertyDescription ? `Descripción del inmueble: ${config.propertyDescription}\n\n` : ''}II. Que EL/LA ARRENDATARIO/A está interesado/a en arrendar dicho inmueble para ${config.propertyType === 'vivienda_habitual' ? 'destinarlo a su vivienda habitual y permanente' : 'uso distinto de vivienda habitual'}.

III. Que ambas partes han convenido libremente celebrar el presente CONTRATO DE ARRENDAMIENTO, que se regirá por las siguientes:

ESTIPULACIONES

PRIMERA.- OBJETO DEL CONTRATO
El/La arrendador/a arrienda al/a la arrendatario/a el inmueble descrito en el Expositivo I, ${config.propertyType === 'vivienda_habitual' ? 'para ser destinado a vivienda habitual y permanente del/de la arrendatario/a' : 'para uso distinto de vivienda habitual'}.

SEGUNDA.- DURACIÓN
El presente contrato tendrá una duración de ${config.duracionAnios} ${config.duracionAnios === 1 ? 'año' : 'años'}, comenzando a contar desde el día _____ de _____________ de _____.

${config.propertyType === 'vivienda_habitual' && config.duracionAnios < 5 ? `
NOTA IMPORTANTE: Conforme al artículo 9 de la LAU, si la duración pactada fuera inferior a cinco años (o siete si el arrendador es persona jurídica), llegado el día del vencimiento, el contrato se prorrogará obligatoriamente por plazos anuales hasta alcanzar dicha duración mínima, salvo que el/la arrendatario/a manifieste su voluntad de no renovarlo con al menos treinta días de antelación.
` : ''}
${config.renovacionAutomatica ? `
Al finalizar el período inicial o sus prórrogas, si ninguna de las partes notifica a la otra su voluntad de no renovarlo con al menos cuatro meses de antelación (el/la arrendador/a) o dos meses (el/la arrendatario/a), el contrato se prorrogará por plazos anuales hasta un máximo de tres años más.
` : `
Al finalizar el período de duración pactado, el contrato quedará extinguido sin necesidad de requerimiento previo, salvo acuerdo expreso de las partes.
`}
TERCERA.- RENTA
La renta mensual queda fijada en ${config.rentaMensual.toLocaleString('es-ES')} EUROS (${config.rentaMensual.toLocaleString('es-ES')} €).

El pago se efectuará por meses anticipados, dentro de los primeros ${config.diaPago} días de cada mes, mediante transferencia bancaria a la cuenta que designe el/la arrendador/a:

IBAN: __ __ __ __   __ __ __ __   __ __   __ __ __ __ __ __ __ __ __ __
Titular: _________________________________________________________________

${config.isZonaTensionada ? `
NOTA SOBRE ZONA TENSIONADA: El inmueble objeto de este contrato se encuentra en un área declarada como zona de mercado residencial tensionado. Conforme a la normativa vigente, la renta inicial no podrá exceder de la última renta de contrato de arrendamiento de vivienda habitual vigente en los últimos cinco años en la misma vivienda, una vez aplicada la cláusula de actualización anual, salvo las excepciones legalmente previstas. Se recomienda consultar el índice de precios de referencia en: https://serpavi.mivau.gob.es/
` : ''}
La renta se actualizará anualmente, en la fecha en que se cumpla cada año de vigencia del contrato, aplicando la variación del Índice de Referencia para la Actualización de los Arrendamientos de Vivienda (IRAV) publicado por el INE.

CUARTA.- FIANZA
A la firma del presente contrato, el/la arrendatario/a hace entrega de la cantidad de ${config.rentaMensual * config.mesesFianza} EUROS (${(config.rentaMensual * config.mesesFianza).toLocaleString('es-ES')} €), equivalente a ${config.mesesFianza} ${config.mesesFianza === 1 ? 'mensualidad' : 'mensualidades'} de renta, en concepto de fianza legal.

${config.propertyType === 'vivienda_habitual' && config.mesesFianza > 2 ? `
ADVERTENCIA: Para arrendamientos de vivienda habitual, la fianza legal máxima es de dos mensualidades de renta (Art. 36.1 LAU).
` : ''}
Esta fianza será depositada por el/la arrendador/a en el organismo correspondiente de la Comunidad Autónoma de ${config.comunidadAutonoma || '_______________'}, conforme a la normativa autonómica aplicable.

${config.tieneGarantiasAdicionales && config.mesesGarantiasAdicionales ? `
QUINTA.- GARANTÍAS ADICIONALES
Además de la fianza legal, el/la arrendatario/a presta una garantía adicional equivalente a ${config.mesesGarantiasAdicionales} ${config.mesesGarantiasAdicionales === 1 ? 'mensualidad' : 'mensualidades'} de renta, esto es, ${(config.rentaMensual * config.mesesGarantiasAdicionales).toLocaleString('es-ES')} EUROS (${(config.rentaMensual * config.mesesGarantiasAdicionales).toLocaleString('es-ES')} €), mediante:

☐ Depósito en metálico
☐ Aval bancario
☐ Otro: _________________________

Esta garantía adicional responderá del cumplimiento de las obligaciones arrendaticias más allá de la fianza legal.
` : ''}
${config.gastosComunidad === 'arrendatario' || config.ibi === 'arrendatario' ? `
${config.tieneGarantiasAdicionales ? 'SEXTA' : 'QUINTA'}.- GASTOS E IMPUESTOS
` : ''}
${config.gastosComunidad === 'arrendatario' ? `
a) GASTOS DE COMUNIDAD: Serán de cuenta del/de la arrendatario/a los gastos generales para el adecuado sostenimiento del inmueble, sus servicios, tributos, cargas y responsabilidades que no sean susceptibles de individualización (gastos de comunidad de propietarios), limitándose a los gastos ordinarios de conservación y mantenimiento, quedando excluidos los derramas y gastos extraordinarios.

El importe actual de los gastos de comunidad asciende a ___________ €/mes (o el que resulte de las liquidaciones periódicas).
` : ''}
${config.ibi === 'arrendatario' ? `
b) IMPUESTO SOBRE BIENES INMUEBLES (IBI): Conforme a lo previsto en el artículo 20 de la LAU y de común acuerdo entre las partes, el importe del IBI correspondiente al inmueble arrendado será repercutido al/a la arrendatario/a. El importe actual del IBI anual asciende a ___________ €, que se abonará de forma prorrateada mensualmente / en el momento de su devengo.
` : ''}
${config.suministros === 'incluidos' ? `
c) SUMINISTROS: Los suministros de agua, electricidad, gas y telecomunicaciones están INCLUIDOS en la renta mensual.
` : `
${config.gastosComunidad === 'arrendatario' || config.ibi === 'arrendatario' ? 'c)' : ''} SUMINISTROS: Los suministros de agua, electricidad, gas, telecomunicaciones y cualesquiera otros que se contraten, serán de cuenta exclusiva del/de la arrendatario/a, quien procederá a su contratación y cambio de titularidad en el plazo máximo de treinta días desde la firma del presente contrato.
`}
${getNextClauseNumber(config)}.- OBLIGACIONES DEL/DE LA ARRENDADOR/A
El/La arrendador/a se obliga a:
a) Entregar la vivienda en condiciones de habitabilidad y en buen estado de conservación.
b) Realizar las reparaciones necesarias para conservar la vivienda en estado de servir para el uso convenido.
c) Mantener al/a la arrendatario/a en el goce pacífico del arrendamiento.

${getNextClauseNumber(config, 1)}.- OBLIGACIONES DEL/DE LA ARRENDATARIO/A
El/La arrendatario/a se obliga a:
a) Pagar la renta y demás cantidades que le correspondan en los términos convenidos.
b) Utilizar la vivienda con la diligencia debida, destinándola ${config.propertyType === 'vivienda_habitual' ? 'exclusivamente a vivienda habitual' : 'al uso pactado'}.
c) No realizar obras que modifiquen la configuración de la vivienda sin consentimiento escrito del/de la arrendador/a.
d) Permitir el acceso a la vivienda al/a la arrendador/a y a quienes le representen para la realización de obras de conservación, previa comunicación.
e) Comunicar al/a la arrendador/a, en el plazo más breve posible, cualquier daño o desperfecto cuya reparación le incumba.

${config.prohibicionMascotas || config.prohibicionFumar ? `
${getNextClauseNumber(config, 2)}.- NORMAS DE USO
${config.prohibicionMascotas ? `
a) ANIMALES: Queda expresamente prohibida la tenencia de animales en la vivienda sin autorización previa y escrita del/de la arrendador/a.

NOTA LEGAL: Esta cláusula tiene eficacia limitada. Conforme a la jurisprudencia mayoritaria, la prohibición absoluta de animales de compañía puede considerarse abusiva. Se recomienda valorar cada caso individualmente.
` : ''}
${config.prohibicionFumar ? `
b) PROHIBICIÓN DE FUMAR: Queda prohibido fumar en el interior de la vivienda. El incumplimiento de esta norma podrá dar lugar a la retención de parte de la fianza para sufragar los gastos de limpieza y eliminación de olores.
` : ''}
` : ''}
${config.clausulaObrasReformas ? `
${getNextClauseNumber(config, getClauseOffset(config, 'obras'))}.- OBRAS Y REFORMAS
a) El/La arrendatario/a no podrá realizar obras que modifiquen la configuración de la vivienda o de sus accesorios, ni obras que causen una disminución de la estabilidad o seguridad del inmueble, sin el consentimiento previo y por escrito del/de la arrendador/a.

b) Las obras menores de decoración (pintura, instalación de estanterías, etc.) podrán realizarse siempre que no afecten a la estructura del inmueble y que la vivienda se restituya a su estado original al finalizar el contrato, salvo pacto en contrario.

c) Cualquier mejora realizada por el/la arrendatario/a, incluso con autorización del/de la arrendador/a, quedará en beneficio de la finca sin derecho a indemnización, salvo pacto expreso en contrario.
` : ''}
${config.clausulaSubarriendo ? `
${getNextClauseNumber(config, getClauseOffset(config, 'subarriendo'))}.- CESIÓN Y SUBARRIENDO
a) Queda expresamente prohibida la cesión del contrato y el subarriendo, total o parcial, de la vivienda sin el consentimiento previo y por escrito del/de la arrendador/a.

b) El incumplimiento de esta prohibición será causa de resolución del contrato conforme al artículo 27.2.c) de la LAU, pudiendo el/la arrendador/a resolver el contrato y exigir la indemnización correspondiente.

c) La autorización para subarrendar o ceder, de concederse, deberá constar por escrito y especificar las condiciones de dicho subarriendo o cesión.
` : ''}
${config.clausulaAccesoVisitas ? `
${getNextClauseNumber(config, getClauseOffset(config, 'visitas'))}.- ACCESO PARA VISITAS
a) Durante los últimos TRES MESES de vigencia del contrato, el/la arrendatario/a permitirá el acceso al inmueble para su exhibición a posibles nuevos inquilinos o compradores, previo aviso con al menos 24 horas de antelación.

b) Las visitas se realizarán en horario razonable (de 10:00 a 20:00 horas en días laborables y de 10:00 a 14:00 horas los sábados), con una duración máxima de 30 minutos por visita.

c) El/La arrendador/a o su representante estarán presentes durante las visitas. El/La arrendatario/a podrá designar a una persona de su confianza si no pudiera estar presente.
` : ''}
${config.clausulaPenalizacionImpago ? `
${getNextClauseNumber(config, getClauseOffset(config, 'impago'))}.- PENALIZACIÓN POR IMPAGO
a) El retraso en el pago de la renta o de cualquier cantidad a cargo del/de la arrendatario/a devengará, desde el día siguiente a su vencimiento, un interés de demora equivalente al interés legal del dinero vigente, incrementado en dos puntos.

b) Los gastos de reclamación extrajudicial de las cantidades adeudadas (requerimientos notariales, burofaxes, etc.) serán de cuenta del/de la arrendatario/a moroso/a.

c) El impago de la renta o de cualquiera de las cantidades cuyo pago corresponda al/a la arrendatario/a será causa de resolución del contrato conforme al artículo 27.2.a) de la LAU.
` : ''}
${getNextClauseNumber(config, getClauseOffset(config, 'resolucion'))}.- RESOLUCIÓN DEL CONTRATO
El contrato podrá resolverse:
a) Por mutuo acuerdo de las partes.
b) Por las causas de resolución previstas en el artículo 27 de la LAU.
c) Por incumplimiento de cualquiera de las obligaciones establecidas en el presente contrato.

${config.incluyeCertificadoEnergetico ? `
${getNextClauseNumber(config, getClauseOffset(config, 'certificado'))}.- CERTIFICADO DE EFICIENCIA ENERGÉTICA
El/La arrendador/a declara que la vivienda dispone de Certificado de Eficiencia Energética, del que se entrega copia al/a la arrendatario/a, con calificación: _______.
` : ''}
${getNextClauseNumber(config, getClauseOffset(config, 'notificaciones'))}.- NOTIFICACIONES
Todas las notificaciones entre las partes se realizarán por escrito y se dirigirán:
- Al/A la arrendador/a: A la dirección indicada en el encabezamiento o a _________________________________
- Al/A la arrendatario/a: A la vivienda objeto de este contrato.

${getNextClauseNumber(config, getClauseOffset(config, 'legislacion'))}.- LEGISLACIÓN APLICABLE
El presente contrato se rige por lo dispuesto en la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos, y demás normativa que resulte de aplicación.

${getNextClauseNumber(config, getClauseOffset(config, 'jurisdiccion'))}.- JURISDICCIÓN
Para cuantas cuestiones litigiosas pudieran derivarse del presente contrato, las partes se someten a los Juzgados y Tribunales del lugar donde radica la vivienda.

Y en prueba de conformidad, firman el presente contrato por duplicado ejemplar, en el lugar y fecha indicados en el encabezamiento.

EL/LA ARRENDADOR/A                                    EL/LA ARRENDATARIO/A


_______________________________                       _______________________________
Fdo.: D./Dª.                                         Fdo.: D./Dª.

${config.incluyeInventario ? `
---

ANEXO I: INVENTARIO

El presente inventario forma parte integrante del contrato de arrendamiento.

| Nº | Descripción del bien | Estado | Observaciones |
|----|---------------------|--------|---------------|
| 1  |                     |        |               |
| 2  |                     |        |               |
| 3  |                     |        |               |
| 4  |                     |        |               |
| 5  |                     |        |               |
| 6  |                     |        |               |
| 7  |                     |        |               |
| 8  |                     |        |               |
| 9  |                     |        |               |
| 10 |                     |        |               |

(Añadir filas según sea necesario)

Fotografías adjuntas: ☐ Sí  ☐ No

Fecha del inventario: _____ de _____________ de _____

EL/LA ARRENDADOR/A                                    EL/LA ARRENDATARIO/A


_______________________________                       _______________________________
` : ''}
---

AVISO LEGAL: Este documento es una plantilla orientativa generada por ACROXIA basada en la Ley de Arrendamientos Urbanos (LAU) vigente en 2026. No constituye asesoramiento jurídico y se recomienda su revisión por un profesional del derecho antes de su firma. ACROXIA no se responsabiliza del uso que se haga de este documento.

Generado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
`;

  return content;
}

// Función auxiliar para calcular el offset de cláusulas dinámicamente
function getClauseOffset(config: ContractConfig, clauseType: string): number {
  let offset = 2; // Base offset después de obligaciones
  
  if (config.prohibicionMascotas || config.prohibicionFumar) offset++;
  
  const clauseOrder = ['obras', 'subarriendo', 'visitas', 'impago', 'resolucion', 'certificado', 'notificaciones', 'legislacion', 'jurisdiccion'];
  const clauseIndex = clauseOrder.indexOf(clauseType);
  
  for (let i = 0; i < clauseIndex; i++) {
    const clause = clauseOrder[i];
    if (clause === 'obras' && config.clausulaObrasReformas) offset++;
    else if (clause === 'subarriendo' && config.clausulaSubarriendo) offset++;
    else if (clause === 'visitas' && config.clausulaAccesoVisitas) offset++;
    else if (clause === 'impago' && config.clausulaPenalizacionImpago) offset++;
    else if (clause === 'resolucion') offset++;
    else if (clause === 'certificado' && config.incluyeCertificadoEnergetico) offset++;
    else if (clause === 'notificaciones') offset++;
    else if (clause === 'legislacion') offset++;
  }
  
  return offset;
}

function getNextClauseNumber(config: ContractConfig, offset: number = 0): string {
  let base = 5; // Empezamos en la quinta cláusula (después de las básicas)
  
  if (config.tieneGarantiasAdicionales) base++;
  if (config.gastosComunidad === 'arrendatario' || config.ibi === 'arrendatario') base++;
  
  const ordinals = ['QUINTA', 'SEXTA', 'SÉPTIMA', 'OCTAVA', 'NOVENA', 'DÉCIMA', 
                    'UNDÉCIMA', 'DUODÉCIMA', 'DECIMOTERCERA', 'DECIMOCUARTA', 'DECIMOQUINTA',
                    'DECIMOSEXTA', 'DECIMOSÉPTIMA', 'DECIMOCTAVA', 'DECIMONOVENA', 'VIGÉSIMA'];
  
  return ordinals[base - 5 + offset] || `${base + offset}ª`;
}

export async function generateContractDocx(config: ContractConfig): Promise<void> {
  try {
    const content = generateContractContent(config);
    
    // Crear un documento Word simple usando docxtemplater
    // Primero creamos un documento base mínimo
    const baseDocx = createMinimalDocx();
    
    const zip = new PizZip(baseDocx);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Renderizar con el contenido
    doc.render({
      content: content,
    });
    
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    const fileName = `contrato-alquiler-${config.municipio || 'plantilla'}-${format(new Date(), 'yyyy-MM-dd')}.docx`;
    saveAs(blob, fileName);
    
  } catch (error) {
    console.error('Error generando el documento:', error);
    throw error;
  }
}

// Alternativa: generar como texto plano descargable
export function generateContractText(config: ContractConfig): void {
  const content = generateContractContent(config);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const fileName = `contrato-alquiler-${config.municipio || 'plantilla'}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
  saveAs(blob, fileName);
}

// Función para crear un documento DOCX mínimo base
function createMinimalDocx(): ArrayBuffer {
  // Este es un documento DOCX mínimo válido codificado en base64
  // Contiene solo la estructura básica necesaria con un placeholder {content}
  const minimalDocxBase64 = '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';
  
  // Decodificar base64 a ArrayBuffer
  const binaryString = atob(minimalDocxBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { ContractConfig } from './contractTemplateConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Estilos reutilizables
const STYLES = {
  title: { bold: true, size: 28, font: 'Arial' },
  heading: { bold: true, size: 24, font: 'Arial' },
  subheading: { bold: true, size: 22, font: 'Arial' },
  normal: { size: 22, font: 'Arial' },
  small: { size: 20, font: 'Arial' },
  italic: { size: 22, font: 'Arial', italics: true },
  bold: { size: 22, font: 'Arial', bold: true },
  warning: { size: 20, font: 'Arial', italics: true, color: '996600' },
};

// Helper para crear párrafos con texto
function createParagraph(text: string, options: { 
  heading?: typeof HeadingLevel[keyof typeof HeadingLevel];
  alignment?: typeof AlignmentType[keyof typeof AlignmentType];
  spacing?: { before?: number; after?: number };
  style?: Partial<typeof STYLES.normal>;
  bullet?: boolean;
} = {}): Paragraph {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: options.spacing || { after: 200 },
    bullet: options.bullet ? { level: 0 } : undefined,
    children: [
      new TextRun({
        text,
        ...STYLES.normal,
        ...options.style,
      }),
    ],
  });
}

// Helper para crear títulos de cláusulas
function createClauseTitle(number: string, title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: `${number}.- ${title}`,
        ...STYLES.subheading,
      }),
    ],
  });
}

// Helper para crear alertas/notas legales
function createLegalNote(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '996600' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '996600' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '996600' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '996600' },
    },
    shading: { fill: 'FFF8E1' },
    children: [
      new TextRun({
        text: `⚠️ ${text}`,
        ...STYLES.warning,
      }),
    ],
  });
}

// Función para obtener el número de cláusula ordinal
function getOrdinal(num: number): string {
  const ordinals = [
    'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA', 'SÉPTIMA', 
    'OCTAVA', 'NOVENA', 'DÉCIMA', 'UNDÉCIMA', 'DUODÉCIMA', 'DECIMOTERCERA', 
    'DECIMOCUARTA', 'DECIMOQUINTA', 'DECIMOSEXTA', 'DECIMOSÉPTIMA', 
    'DECIMOCTAVA', 'DECIMONOVENA', 'VIGÉSIMA'
  ];
  return ordinals[num - 1] || `${num}ª`;
}

// Generador principal del documento
export async function generateContractDocx(config: ContractConfig): Promise<void> {
  const fechaFormateada = format(config.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es });
  let clauseNumber = 1;
  
  const children: (Paragraph | Table)[] = [];

  // ==================== ENCABEZADO ====================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `CONTRATO DE ARRENDAMIENTO DE ${config.propertyType === 'vivienda_habitual' ? 'VIVIENDA HABITUAL' : 'INMUEBLE PARA USO DISTINTO DE VIVIENDA'}`,
          ...STYLES.title,
        }),
      ],
    })
  );

  children.push(
    createParagraph('En _________________________ (localidad), a _____ de _____________ de _____', {
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // ==================== REUNIDOS ====================
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      children: [new TextRun({ text: 'REUNIDOS', ...STYLES.heading })],
    })
  );

  children.push(
    createParagraph(
      'De una parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDADOR/A".'
    )
  );

  children.push(
    createParagraph(
      'De otra parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDATARIO/A".'
    )
  );

  children.push(
    createParagraph(
      'Ambas partes se reconocen capacidad legal suficiente para el otorgamiento del presente contrato y, a tal efecto,'
    )
  );

  // ==================== EXPONEN ====================
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      children: [new TextRun({ text: 'EXPONEN', ...STYLES.heading })],
    })
  );

  children.push(
    createParagraph('I. Que EL/LA ARRENDADOR/A es propietario/a del inmueble sito en:')
  );

  children.push(createParagraph('Dirección: _________________________________________________________________'));
  children.push(createParagraph(`Municipio: ${config.municipio || '_________________________'}`));
  children.push(createParagraph('Código Postal: _______________'));
  children.push(createParagraph(`Comunidad Autónoma: ${config.comunidadAutonoma || '_________________________'}`));
  children.push(createParagraph('Referencia Catastral: _________________________________________________________'));

  if (config.propertyDescription) {
    children.push(createParagraph(`Descripción del inmueble: ${config.propertyDescription}`));
  }

  children.push(
    createParagraph(
      `II. Que EL/LA ARRENDATARIO/A está interesado/a en arrendar dicho inmueble para ${config.propertyType === 'vivienda_habitual' ? 'destinarlo a su vivienda habitual y permanente' : 'uso distinto de vivienda habitual'}.`
    )
  );

  children.push(
    createParagraph(
      'III. Que ambas partes han convenido libremente celebrar el presente CONTRATO DE ARRENDAMIENTO, que se regirá por las siguientes:'
    )
  );

  // ==================== ESTIPULACIONES ====================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 500, after: 400 },
      children: [new TextRun({ text: 'ESTIPULACIONES', ...STYLES.heading })],
    })
  );

  // PRIMERA - OBJETO
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'OBJETO DEL CONTRATO'));
  children.push(
    createParagraph(
      `El/La arrendador/a arrienda al/a la arrendatario/a el inmueble descrito en el Expositivo I, ${config.propertyType === 'vivienda_habitual' ? 'para ser destinado a vivienda habitual y permanente del/de la arrendatario/a' : 'para uso distinto de vivienda habitual'}.`
    )
  );

  // SEGUNDA - DURACIÓN
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'DURACIÓN'));
  children.push(
    createParagraph(
      `El presente contrato tendrá una duración de ${config.duracionAnios} ${config.duracionAnios === 1 ? 'año' : 'años'}, comenzando a contar desde el día _____ de _____________ de _____.`
    )
  );

  if (config.propertyType === 'vivienda_habitual' && config.duracionAnios < 5) {
    children.push(
      createLegalNote(
        'NOTA IMPORTANTE: Conforme al artículo 9 de la LAU, si la duración pactada fuera inferior a cinco años (o siete si el arrendador es persona jurídica), llegado el día del vencimiento, el contrato se prorrogará obligatoriamente por plazos anuales hasta alcanzar dicha duración mínima, salvo que el/la arrendatario/a manifieste su voluntad de no renovarlo con al menos treinta días de antelación.'
      )
    );
  }

  if (config.renovacionAutomatica) {
    children.push(
      createParagraph(
        'Al finalizar el período inicial o sus prórrogas, si ninguna de las partes notifica a la otra su voluntad de no renovarlo con al menos cuatro meses de antelación (el/la arrendador/a) o dos meses (el/la arrendatario/a), el contrato se prorrogará por plazos anuales hasta un máximo de tres años más.'
      )
    );
  } else {
    children.push(
      createParagraph(
        'Al finalizar el período de duración pactado, el contrato quedará extinguido sin necesidad de requerimiento previo, salvo acuerdo expreso de las partes.'
      )
    );
  }

  // TERCERA - RENTA
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'RENTA'));
  children.push(
    createParagraph(
      `La renta mensual queda fijada en ${config.rentaMensual.toLocaleString('es-ES')} EUROS (${config.rentaMensual.toLocaleString('es-ES')} €).`
    )
  );
  children.push(
    createParagraph(
      `El pago se efectuará por meses anticipados, dentro de los primeros ${config.diaPago} días de cada mes, mediante transferencia bancaria a la cuenta que designe el/la arrendador/a:`
    )
  );
  children.push(createParagraph('IBAN: __ __ __ __   __ __ __ __   __ __   __ __ __ __ __ __ __ __ __ __'));
  children.push(createParagraph('Titular: _________________________________________________________________'));

  if (config.isZonaTensionada) {
    children.push(
      createLegalNote(
        'ZONA TENSIONADA: El inmueble se encuentra en un área declarada como zona de mercado residencial tensionado. La renta inicial no podrá exceder de la última renta de contrato vigente en los últimos cinco años, salvo excepciones legales. Consultar: https://serpavi.mivau.gob.es/'
      )
    );
  }

  children.push(
    createParagraph(
      'La renta se actualizará anualmente, en la fecha en que se cumpla cada año de vigencia del contrato, aplicando la variación del Índice de Referencia para la Actualización de los Arrendamientos de Vivienda (IRAV) publicado por el INE.'
    )
  );

  // CUARTA - FIANZA
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'FIANZA'));
  children.push(
    createParagraph(
      `A la firma del presente contrato, el/la arrendatario/a hace entrega de la cantidad de ${(config.rentaMensual * config.mesesFianza).toLocaleString('es-ES')} EUROS (${(config.rentaMensual * config.mesesFianza).toLocaleString('es-ES')} €), equivalente a ${config.mesesFianza} ${config.mesesFianza === 1 ? 'mensualidad' : 'mensualidades'} de renta, en concepto de fianza legal.`
    )
  );

  if (config.propertyType === 'vivienda_habitual' && config.mesesFianza > 2) {
    children.push(
      createLegalNote(
        'ADVERTENCIA: Para arrendamientos de vivienda habitual, la fianza legal máxima es de dos mensualidades de renta (Art. 36.1 LAU).'
      )
    );
  }

  children.push(
    createParagraph(
      `Esta fianza será depositada por el/la arrendador/a en el organismo correspondiente de la Comunidad Autónoma de ${config.comunidadAutonoma || '_______________'}, conforme a la normativa autonómica aplicable.`
    )
  );

  // QUINTA - GARANTÍAS ADICIONALES (opcional)
  if (config.tieneGarantiasAdicionales && config.mesesGarantiasAdicionales) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'GARANTÍAS ADICIONALES'));
    children.push(
      createParagraph(
        `Además de la fianza legal, el/la arrendatario/a presta una garantía adicional equivalente a ${config.mesesGarantiasAdicionales} ${config.mesesGarantiasAdicionales === 1 ? 'mensualidad' : 'mensualidades'} de renta, esto es, ${(config.rentaMensual * config.mesesGarantiasAdicionales).toLocaleString('es-ES')} EUROS, mediante:`
      )
    );
    children.push(createParagraph('☐ Depósito en metálico'));
    children.push(createParagraph('☐ Aval bancario'));
    children.push(createParagraph('☐ Otro: _________________________'));
    children.push(
      createParagraph(
        'Esta garantía adicional responderá del cumplimiento de las obligaciones arrendaticias más allá de la fianza legal.'
      )
    );
  }

  // GASTOS E IMPUESTOS (opcional)
  if (config.gastosComunidad === 'arrendatario' || config.ibi === 'arrendatario' || config.suministros === 'incluidos') {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'GASTOS E IMPUESTOS'));

    if (config.gastosComunidad === 'arrendatario') {
      children.push(
        createParagraph(
          'a) GASTOS DE COMUNIDAD: Serán de cuenta del/de la arrendatario/a los gastos generales para el adecuado sostenimiento del inmueble (gastos de comunidad de propietarios), limitándose a los gastos ordinarios de conservación y mantenimiento, quedando excluidos los derramas y gastos extraordinarios.'
        )
      );
      children.push(createParagraph('El importe actual de los gastos de comunidad asciende a ___________ €/mes.'));
    }

    if (config.ibi === 'arrendatario') {
      children.push(
        createParagraph(
          'b) IMPUESTO SOBRE BIENES INMUEBLES (IBI): Conforme a lo previsto en el artículo 20 de la LAU, el importe del IBI correspondiente al inmueble arrendado será repercutido al/a la arrendatario/a. El importe actual del IBI anual asciende a ___________ €.'
        )
      );
    }

    if (config.suministros === 'incluidos') {
      children.push(
        createParagraph(
          'c) SUMINISTROS: Los suministros de agua, electricidad, gas y telecomunicaciones están INCLUIDOS en la renta mensual.'
        )
      );
    } else {
      children.push(
        createParagraph(
          'c) SUMINISTROS: Los suministros de agua, electricidad, gas, telecomunicaciones y cualesquiera otros que se contraten, serán de cuenta exclusiva del/de la arrendatario/a, quien procederá a su contratación y cambio de titularidad en el plazo máximo de treinta días desde la firma del presente contrato.'
        )
      );
    }
  }

  // OBLIGACIONES DEL ARRENDADOR
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'OBLIGACIONES DEL/DE LA ARRENDADOR/A'));
  children.push(createParagraph('El/La arrendador/a se obliga a:'));
  children.push(createParagraph('a) Entregar la vivienda en condiciones de habitabilidad y en buen estado de conservación.'));
  children.push(createParagraph('b) Realizar las reparaciones necesarias para conservar la vivienda en estado de servir para el uso convenido.'));
  children.push(createParagraph('c) Mantener al/a la arrendatario/a en el goce pacífico del arrendamiento.'));

  // OBLIGACIONES DEL ARRENDATARIO
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'OBLIGACIONES DEL/DE LA ARRENDATARIO/A'));
  children.push(createParagraph('El/La arrendatario/a se obliga a:'));
  children.push(createParagraph('a) Pagar la renta y demás cantidades que le correspondan en los términos convenidos.'));
  children.push(
    createParagraph(
      `b) Utilizar la vivienda con la diligencia debida, destinándola ${config.propertyType === 'vivienda_habitual' ? 'exclusivamente a vivienda habitual' : 'al uso pactado'}.`
    )
  );
  children.push(createParagraph('c) No realizar obras que modifiquen la configuración de la vivienda sin consentimiento escrito del/de la arrendador/a.'));
  children.push(createParagraph('d) Permitir el acceso a la vivienda al/a la arrendador/a para la realización de obras de conservación, previa comunicación.'));
  children.push(createParagraph('e) Comunicar al/a la arrendador/a, en el plazo más breve posible, cualquier daño o desperfecto cuya reparación le incumba.'));

  // NORMAS DE USO (opcional)
  if (config.prohibicionMascotas || config.prohibicionFumar) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'NORMAS DE USO'));

    if (config.prohibicionMascotas) {
      children.push(
        createParagraph(
          'a) ANIMALES: Queda expresamente prohibida la tenencia de animales en la vivienda sin autorización previa y escrita del/de la arrendador/a.'
        )
      );
      children.push(
        createLegalNote(
          'NOTA LEGAL: Esta cláusula tiene eficacia limitada. Conforme a la jurisprudencia mayoritaria, la prohibición absoluta de animales de compañía puede considerarse abusiva.'
        )
      );
    }

    if (config.prohibicionFumar) {
      children.push(
        createParagraph(
          'b) PROHIBICIÓN DE FUMAR: Queda prohibido fumar en el interior de la vivienda. El incumplimiento de esta norma podrá dar lugar a la retención de parte de la fianza para sufragar los gastos de limpieza.'
        )
      );
    }
  }

  // OBRAS Y REFORMAS (opcional)
  if (config.clausulaObrasReformas) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'OBRAS Y REFORMAS'));
    children.push(
      createParagraph(
        'a) El/La arrendatario/a no podrá realizar obras que modifiquen la configuración de la vivienda o de sus accesorios sin el consentimiento previo y por escrito del/de la arrendador/a.'
      )
    );
    children.push(
      createParagraph(
        'b) Las obras menores de decoración (pintura, instalación de estanterías, etc.) podrán realizarse siempre que no afecten a la estructura del inmueble y que la vivienda se restituya a su estado original al finalizar el contrato.'
      )
    );
    children.push(
      createParagraph(
        'c) Cualquier mejora realizada por el/la arrendatario/a, incluso con autorización, quedará en beneficio de la finca sin derecho a indemnización, salvo pacto expreso en contrario.'
      )
    );
  }

  // CESIÓN Y SUBARRIENDO (opcional)
  if (config.clausulaSubarriendo) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'CESIÓN Y SUBARRIENDO'));
    children.push(
      createParagraph(
        'a) Queda expresamente prohibida la cesión del contrato y el subarriendo, total o parcial, de la vivienda sin el consentimiento previo y por escrito del/de la arrendador/a.'
      )
    );
    children.push(
      createParagraph(
        'b) El incumplimiento de esta prohibición será causa de resolución del contrato conforme al artículo 27.2.c) de la LAU.'
      )
    );
    children.push(
      createParagraph(
        'c) La autorización para subarrendar o ceder, de concederse, deberá constar por escrito y especificar las condiciones.'
      )
    );
  }

  // ACCESO PARA VISITAS (opcional)
  if (config.clausulaAccesoVisitas) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'ACCESO PARA VISITAS'));
    children.push(
      createParagraph(
        'a) Durante los últimos TRES MESES de vigencia del contrato, el/la arrendatario/a permitirá el acceso al inmueble para su exhibición a posibles nuevos inquilinos o compradores, previo aviso con al menos 24 horas de antelación.'
      )
    );
    children.push(
      createParagraph(
        'b) Las visitas se realizarán en horario razonable (de 10:00 a 20:00 horas en días laborables y de 10:00 a 14:00 horas los sábados), con una duración máxima de 30 minutos por visita.'
      )
    );
    children.push(
      createParagraph(
        'c) El/La arrendador/a o su representante estarán presentes durante las visitas.'
      )
    );
  }

  // PENALIZACIÓN POR IMPAGO (opcional)
  if (config.clausulaPenalizacionImpago) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'PENALIZACIÓN POR IMPAGO'));
    children.push(
      createParagraph(
        'a) El retraso en el pago de la renta devengará, desde el día siguiente a su vencimiento, un interés de demora equivalente al interés legal del dinero vigente, incrementado en dos puntos.'
      )
    );
    children.push(
      createParagraph(
        'b) Los gastos de reclamación extrajudicial de las cantidades adeudadas (requerimientos notariales, burofaxes, etc.) serán de cuenta del/de la arrendatario/a moroso/a.'
      )
    );
    children.push(
      createParagraph(
        'c) El impago de la renta será causa de resolución del contrato conforme al artículo 27.2.a) de la LAU.'
      )
    );
  }

  // RESOLUCIÓN DEL CONTRATO
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'RESOLUCIÓN DEL CONTRATO'));
  children.push(createParagraph('El contrato podrá resolverse:'));
  children.push(createParagraph('a) Por mutuo acuerdo de las partes.'));
  children.push(createParagraph('b) Por las causas de resolución previstas en el artículo 27 de la LAU.'));
  children.push(createParagraph('c) Por incumplimiento de cualquiera de las obligaciones establecidas en el presente contrato.'));

  // CERTIFICADO ENERGÉTICO (opcional)
  if (config.incluyeCertificadoEnergetico) {
    children.push(createClauseTitle(getOrdinal(clauseNumber++), 'CERTIFICADO DE EFICIENCIA ENERGÉTICA'));
    children.push(
      createParagraph(
        'El/La arrendador/a declara que la vivienda dispone de Certificado de Eficiencia Energética, del que se entrega copia al/a la arrendatario/a, con calificación: _______.'
      )
    );
  }

  // NOTIFICACIONES
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'NOTIFICACIONES'));
  children.push(createParagraph('Todas las notificaciones entre las partes se realizarán por escrito y se dirigirán:'));
  children.push(createParagraph('- Al/A la arrendador/a: A la dirección indicada en el encabezamiento o a _________________________________'));
  children.push(createParagraph('- Al/A la arrendatario/a: A la vivienda objeto de este contrato.'));

  // LEGISLACIÓN APLICABLE
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'LEGISLACIÓN APLICABLE'));
  children.push(
    createParagraph(
      'El presente contrato se rige por lo dispuesto en la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos, y demás normativa que resulte de aplicación.'
    )
  );

  // JURISDICCIÓN
  children.push(createClauseTitle(getOrdinal(clauseNumber++), 'JURISDICCIÓN'));
  children.push(
    createParagraph(
      'Para cuantas cuestiones litigiosas pudieran derivarse del presente contrato, las partes se someten a los Juzgados y Tribunales del lugar donde radica la vivienda.'
    )
  );

  // ==================== FIRMAS ====================
  children.push(
    new Paragraph({
      spacing: { before: 600, after: 200 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: 'Y en prueba de conformidad, firman el presente contrato por duplicado ejemplar, en el lugar y fecha indicados en el encabezamiento.',
          ...STYLES.normal,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 600 },
      children: [
        new TextRun({ text: 'EL/LA ARRENDADOR/A', ...STYLES.bold }),
        new TextRun({ text: '                                              ', ...STYLES.normal }),
        new TextRun({ text: 'EL/LA ARRENDATARIO/A', ...STYLES.bold }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { before: 800 } }));
  children.push(
    createParagraph('_______________________________                       _______________________________')
  );
  children.push(
    createParagraph('Fdo.: D./Dª.                                                              Fdo.: D./Dª.')
  );

  // ==================== ANEXO INVENTARIO (opcional) ====================
  if (config.incluyeInventario) {
    children.push(
      new Paragraph({
        spacing: { before: 800, after: 400 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'ANEXO I: INVENTARIO',
            ...STYLES.heading,
          }),
        ],
      })
    );

    children.push(
      createParagraph('El presente inventario forma parte integrante del contrato de arrendamiento.')
    );

    // Tabla de inventario
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nº', bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Descripción del bien', bold: true })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Observaciones', bold: true })] })], width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      }),
    ];

    for (let i = 1; i <= 10; i++) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: i.toString() })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '' })] })] }),
          ],
        })
      );
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );

    children.push(new Paragraph({ spacing: { before: 400 } }));
    children.push(createParagraph('Fotografías adjuntas: ☐ Sí  ☐ No'));
    children.push(createParagraph('Fecha del inventario: _____ de _____________ de _____'));

    children.push(
      new Paragraph({
        spacing: { before: 600 },
        children: [
          new TextRun({ text: 'EL/LA ARRENDADOR/A', ...STYLES.bold }),
          new TextRun({ text: '                                              ', ...STYLES.normal }),
          new TextRun({ text: 'EL/LA ARRENDATARIO/A', ...STYLES.bold }),
        ],
      })
    );

    children.push(new Paragraph({ spacing: { before: 800 } }));
    children.push(
      createParagraph('_______________________________                       _______________________________')
    );
  }

  // ==================== AVISO LEGAL ====================
  children.push(
    new Paragraph({
      spacing: { before: 800 },
      shading: { fill: 'F5F5F5' },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      children: [
        new TextRun({
          text: 'AVISO LEGAL: Este documento es una plantilla orientativa generada por ACROXIA basada en la Ley de Arrendamientos Urbanos (LAU) vigente en 2026. No constituye asesoramiento jurídico y se recomienda su revisión por un profesional del derecho antes de su firma. ACROXIA no se responsabiliza del uso que se haga de este documento.',
          ...STYLES.small,
          italics: true,
        }),
      ],
    })
  );

  children.push(
    createParagraph(`Generado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, {
      alignment: AlignmentType.RIGHT,
      style: STYLES.small,
    })
  );

  // ==================== CREAR DOCUMENTO ====================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Generar blob y descargar
  const blob = await Packer.toBlob(doc);
  const fileName = `contrato-alquiler-${config.municipio || 'plantilla'}-${format(new Date(), 'yyyy-MM-dd')}.docx`;
  saveAs(blob, fileName);
}

// Mantener la versión de texto como fallback
export function generateContractText(config: ContractConfig): void {
  // Redirigir a la versión DOCX
  generateContractDocx(config).catch(error => {
    console.error('Error generando DOCX, usando fallback de texto:', error);
    // Fallback a texto plano si falla
    const content = generateTextContent(config);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `contrato-alquiler-${config.municipio || 'plantilla'}-${format(new Date(), 'yyyy-MM-dd')}.txt`);
  });
}

// Contenido de texto para fallback
function generateTextContent(config: ContractConfig): string {
  return `CONTRATO DE ARRENDAMIENTO DE ${config.propertyType === 'vivienda_habitual' ? 'VIVIENDA HABITUAL' : 'INMUEBLE PARA USO DISTINTO DE VIVIENDA'}

En _________________________ (localidad), a _____ de _____________ de _____

REUNIDOS

De una parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDADOR/A".

De otra parte, D./Dª. _________________________________________________, mayor de edad, con DNI/NIE _________________, y domicilio a efectos de notificaciones en _________________________________________________________________, en adelante "EL/LA ARRENDATARIO/A".

[...]

Este es un documento simplificado. Para obtener el documento completo, por favor utilice la versión DOCX.

Generado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
`;
}

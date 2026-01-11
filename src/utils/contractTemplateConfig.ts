// Tipos y configuraciones para el generador de plantillas de contrato

export interface ContractConfig {
  // Paso 1: Tipo de inmueble
  propertyType: 'vivienda_habitual' | 'uso_distinto';
  propertyDescription?: string;
  
  // Paso 2: Ubicación
  comunidadAutonoma: string;
  municipio: string;
  isZonaTensionada: boolean;
  
  // Paso 3: Condiciones económicas
  rentaMensual: number;
  diaPago: number;
  mesesFianza: number;
  tieneGarantiasAdicionales: boolean;
  mesesGarantiasAdicionales?: number;
  
  // Paso 4: Duración
  fechaInicio: Date;
  duracionAnios: number;
  renovacionAutomatica: boolean;
  
  // Paso 5: Gastos
  gastosComunidad: 'arrendador' | 'arrendatario';
  ibi: 'arrendador' | 'arrendatario';
  suministros: 'incluidos' | 'arrendatario';
  
  // Paso 6: Cláusulas opcionales
  prohibicionMascotas: boolean;
  prohibicionFumar: boolean;
  incluyeInventario: boolean;
  incluyeCertificadoEnergetico: boolean;
  clausulaObrasReformas: boolean;
  clausulaSubarriendo: boolean;
  clausulaAccesoVisitas: boolean;
  clausulaPenalizacionImpago: boolean;
}

export const COMUNIDADES_AUTONOMAS = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla-La Mancha',
  'Castilla y León',
  'Cataluña',
  'Ceuta',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Madrid',
  'Melilla',
  'Murcia',
  'Navarra',
  'País Vasco',
];

export const DURACIONES_CONTRATO = [
  { value: 1, label: '1 año' },
  { value: 2, label: '2 años' },
  { value: 3, label: '3 años' },
  { value: 4, label: '4 años' },
  { value: 5, label: '5 años' },
];

export const DIAS_PAGO = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Día ${i + 1}`,
}));

export const MESES_FIANZA = [
  { value: 1, label: '1 mes' },
  { value: 2, label: '2 meses (máximo legal vivienda habitual)' },
];

export const MESES_GARANTIAS = [
  { value: 1, label: '1 mes' },
  { value: 2, label: '2 meses' },
  { value: 3, label: '3 meses' },
];

export const defaultContractConfig: ContractConfig = {
  propertyType: 'vivienda_habitual',
  comunidadAutonoma: '',
  municipio: '',
  isZonaTensionada: false,
  rentaMensual: 0,
  diaPago: 1,
  mesesFianza: 1,
  tieneGarantiasAdicionales: false,
  duracionAnios: 1,
  fechaInicio: new Date(),
  renovacionAutomatica: true,
  gastosComunidad: 'arrendador',
  ibi: 'arrendador',
  suministros: 'arrendatario',
  prohibicionMascotas: false,
  prohibicionFumar: false,
  incluyeInventario: false,
  incluyeCertificadoEnergetico: true,
  clausulaObrasReformas: true,
  clausulaSubarriendo: true,
  clausulaAccesoVisitas: true,
  clausulaPenalizacionImpago: false,
};

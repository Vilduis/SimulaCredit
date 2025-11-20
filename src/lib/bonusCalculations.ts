/**
 * Cálculo de Bonos del Nuevo Crédito Mivivienda y Techo Propio
 * Basado en las normas oficiales del programa
 */

/**
 * Rangos de bonos BBP (Bono del Buen Pagador) según valor de vivienda
 * Valores en Soles (PEN)
 */
export const BBP_RANGES = {
  RANGE_1: {
    min: 68800,
    max: 98100,
    bonus: 27400,
    bonusSustainable: 33700, // Vivienda Sostenible
  },
  RANGE_2: {
    min: 98101,
    max: 146900,
    bonus: 22800,
    bonusSustainable: 28000, // Estimado (aumento proporcional)
  },
  RANGE_3: {
    min: 146901,
    max: 244600,
    bonus: 20900,
    bonusSustainable: 25700, // Estimado (aumento proporcional)
  },
  RANGE_4: {
    min: 244601,
    max: 362100,
    bonus: 7800,
    bonusSustainable: 9600, // Estimado (aumento proporcional)
  },
  RANGE_5: {
    min: 362101,
    max: 488800,
    bonus: 0, // Sigue siendo crédito Mivivienda pero sin bono
    bonusSustainable: 0,
  },
  // Mayor a 488,800: NO es Mivivienda (Crédito Hipotecario Tradicional)
  MAX_MIVIVIENDA: 488800,
} as const;

/**
 * Calcula el Bono del Buen Pagador (BBP) según el valor de la vivienda
 * @param propertyPrice - Precio de la vivienda en Soles
 * @param isSustainableHousing - Si es Vivienda Sostenible (aumenta el bono)
 * @returns Monto del bono en Soles, o 0 si no aplica
 */
export function calculateBBPAmount(
  propertyPrice: number,
  isSustainableHousing: boolean = false
): number {
  // Validar que el precio sea positivo
  if (propertyPrice <= 0) {
    return 0;
  }

  // Si el precio es mayor al máximo de Mivivienda, no aplica bono
  if (propertyPrice > BBP_RANGES.MAX_MIVIVIENDA) {
    return 0;
  }

  // Determinar el rango y el bono correspondiente
  if (propertyPrice >= BBP_RANGES.RANGE_1.min && propertyPrice <= BBP_RANGES.RANGE_1.max) {
    return isSustainableHousing 
      ? BBP_RANGES.RANGE_1.bonusSustainable 
      : BBP_RANGES.RANGE_1.bonus;
  }

  if (propertyPrice >= BBP_RANGES.RANGE_2.min && propertyPrice <= BBP_RANGES.RANGE_2.max) {
    return isSustainableHousing 
      ? BBP_RANGES.RANGE_2.bonusSustainable 
      : BBP_RANGES.RANGE_2.bonus;
  }

  if (propertyPrice >= BBP_RANGES.RANGE_3.min && propertyPrice <= BBP_RANGES.RANGE_3.max) {
    return isSustainableHousing 
      ? BBP_RANGES.RANGE_3.bonusSustainable 
      : BBP_RANGES.RANGE_3.bonus;
  }

  if (propertyPrice >= BBP_RANGES.RANGE_4.min && propertyPrice <= BBP_RANGES.RANGE_4.max) {
    return isSustainableHousing 
      ? BBP_RANGES.RANGE_4.bonusSustainable 
      : BBP_RANGES.RANGE_4.bonus;
  }

  if (propertyPrice >= BBP_RANGES.RANGE_5.min && propertyPrice <= BBP_RANGES.RANGE_5.max) {
    return 0; // Rango 5: Crédito Mivivienda pero sin bono
  }

  // Si no está en ningún rango válido, retornar 0
  return 0;
}

/**
 * Verifica si una vivienda califica para Crédito Mivivienda
 * @param propertyPrice - Precio de la vivienda en Soles
 * @returns true si califica para Mivivienda, false si es crédito tradicional
 */
export function isMiviviendaEligible(propertyPrice: number): boolean {
  return propertyPrice > 0 && propertyPrice <= BBP_RANGES.MAX_MIVIVIENDA;
}

/**
 * Obtiene el estado de elegibilidad del precio para BBP
 * @param propertyPrice - Precio de la vivienda en Soles
 * @returns Objeto con el estado y mensaje descriptivo
 */
export function getBBPEligibilityStatus(propertyPrice: number): {
  eligible: boolean;
  status: 'too_low' | 'eligible' | 'too_high' | 'no_price';
  message: string;
  canApplyBonus: boolean;
} {
  if (propertyPrice <= 0) {
    return {
      eligible: false,
      status: 'no_price',
      message: 'Ingrese un precio válido para calcular el bono',
      canApplyBonus: false,
    };
  }

  if (propertyPrice < BBP_RANGES.RANGE_1.min) {
    return {
      eligible: false,
      status: 'too_low',
      message: `❌ Precio muy bajo: S/ ${propertyPrice.toLocaleString('es-PE')}. El mínimo para BBP es S/ ${BBP_RANGES.RANGE_1.min.toLocaleString('es-PE')}. No califica para Bono del Buen Pagador.`,
      canApplyBonus: false,
    };
  }

  if (propertyPrice > BBP_RANGES.MAX_MIVIVIENDA) {
    return {
      eligible: false,
      status: 'too_high',
      message: `❌ Precio muy alto: S/ ${propertyPrice.toLocaleString('es-PE')}. El máximo para Crédito Mivivienda es S/ ${BBP_RANGES.MAX_MIVIVIENDA.toLocaleString('es-PE')}. No califica para BBP (Crédito Hipotecario Tradicional).`,
      canApplyBonus: false,
    };
  }

  // Está en rango válido
  const rangeInfo = getBBPRangeInfo(propertyPrice);
  if (rangeInfo && rangeInfo.isMivivienda) {
    return {
      eligible: true,
      status: 'eligible',
      message: `✅ Califica para BBP. Rango: ${rangeInfo.range}. Bono: S/ ${rangeInfo.bonus.toLocaleString('es-PE')}`,
      canApplyBonus: true,
    };
  }

  return {
    eligible: false,
    status: 'too_high',
    message: 'No califica para BBP',
    canApplyBonus: false,
  };
}

/**
 * Obtiene información del rango BBP para un precio dado
 * @param propertyPrice - Precio de la vivienda en Soles
 * @returns Información del rango o null si no aplica
 */
export function getBBPRangeInfo(propertyPrice: number): {
  range: string;
  min: number;
  max: number;
  bonus: number;
  bonusSustainable: number;
  isMivivienda: boolean;
} | null {
  if (propertyPrice <= 0) {
    return null;
  }

  if (propertyPrice > BBP_RANGES.MAX_MIVIVIENDA) {
    return {
      range: 'TRADICIONAL',
      min: BBP_RANGES.MAX_MIVIVIENDA + 1,
      max: Infinity,
      bonus: 0,
      bonusSustainable: 0,
      isMivivienda: false,
    };
  }

  if (propertyPrice >= BBP_RANGES.RANGE_1.min && propertyPrice <= BBP_RANGES.RANGE_1.max) {
    return {
      range: 'RANGO 1',
      ...BBP_RANGES.RANGE_1,
      isMivivienda: true,
    };
  }

  if (propertyPrice >= BBP_RANGES.RANGE_2.min && propertyPrice <= BBP_RANGES.RANGE_2.max) {
    return {
      range: 'RANGO 2',
      ...BBP_RANGES.RANGE_2,
      isMivivienda: true,
    };
  }

  if (propertyPrice >= BBP_RANGES.RANGE_3.min && propertyPrice <= BBP_RANGES.RANGE_3.max) {
    return {
      range: 'RANGO 3',
      ...BBP_RANGES.RANGE_3,
      isMivivienda: true,
    };
  }

  if (propertyPrice >= BBP_RANGES.RANGE_4.min && propertyPrice <= BBP_RANGES.RANGE_4.max) {
    return {
      range: 'RANGO 4',
      ...BBP_RANGES.RANGE_4,
      isMivivienda: true,
    };
  }

  if (propertyPrice >= BBP_RANGES.RANGE_5.min && propertyPrice <= BBP_RANGES.RANGE_5.max) {
    return {
      range: 'RANGO 5',
      ...BBP_RANGES.RANGE_5,
      isMivivienda: true,
    };
  }

  return null;
}

/**
 * Bono Familiar Habitacional (BFH) - Techo Propio
 * Montos fijos según modalidad
 */
export const BFH_AMOUNTS = {
  compra: 37557,
  construccion: 32100, // Puede ser 37557 en regiones específicas
  mejoramiento: 10580,
} as const;

/**
 * Calcula el Bono Familiar Habitacional (BFH) según la modalidad
 * @param modalidad - Modalidad del BFH: compra, construccion o mejoramiento
 * @returns Monto del bono en Soles
 */
export function calculateBFHAmount(
  modalidad: 'compra' | 'construccion' | 'mejoramiento'
): number {
  return BFH_AMOUNTS[modalidad] || 0;
}


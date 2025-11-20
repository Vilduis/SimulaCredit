/**
 * Utilidades para calcular costos relacionados con préstamos
 * Aplica el principio DRY evitando duplicación de lógica
 */

/**
 * Calcula el total de costos mensuales de seguros
 * @param insuranceLifeAmount - Monto mensual de seguro de desgravamen
 * @param insurancePropertyAmount - Monto mensual de seguro de inmueble
 * @param administrativeFees - Gastos administrativos mensuales (opcional)
 * @returns Total de costos mensuales de seguros y gastos administrativos
 */
export function calculateMonthlyInsuranceCosts(
  insuranceLifeAmount: number = 0,
  insurancePropertyAmount: number = 0,
  administrativeFees: number = 0
): number {
  return (insuranceLifeAmount || 0) + 
         (insurancePropertyAmount || 0) + 
         (administrativeFees || 0);
}

/**
 * Calcula el total de costos mensuales para el cliente
 * Incluye: cuota + seguros + gastos administrativos + costos adicionales
 * 
 * @param monthlyPayment - Cuota mensual del préstamo
 * @param insuranceLifeAmount - Monto mensual de seguro de desgravamen
 * @param insurancePropertyAmount - Monto mensual de seguro de inmueble
 * @param administrativeFees - Gastos administrativos mensuales
 * @param extraMonthlyCosts - Costos mensuales adicionales (NO incluye seguros/comisiones)
 * @returns Total de pagos mensuales del cliente
 */
export function calculateTotalMonthlyCosts(
  monthlyPayment: number,
  insuranceLifeAmount: number = 0,
  insurancePropertyAmount: number = 0,
  administrativeFees: number = 0,
  extraMonthlyCosts: number = 0
): number {
  const monthlyInsuranceCosts = calculateMonthlyInsuranceCosts(
    insuranceLifeAmount,
    insurancePropertyAmount,
    administrativeFees
  );
  
  return monthlyPayment + monthlyInsuranceCosts + (extraMonthlyCosts || 0);
}

/**
 * Calcula el total de costos mensuales adicionales (sin incluir seguros ni comisiones)
 * Solo incluye costos adicionales que el cliente debe pagar mensualmente
 * pero que no están relacionados con seguros o comisiones del crédito
 * 
 * @param extraMonthlyCosts - Costos mensuales adicionales del cliente
 * @param insuranceLifeAmount - Monto mensual de seguro de desgravamen
 * @param insurancePropertyAmount - Monto mensual de seguro de inmueble
 * @param administrativeFees - Gastos administrativos mensuales
 * @returns Total de costos adicionales mensuales (seguros + gastos + extras)
 */
export function calculateTotalExtraMonthlyCosts(
  extraMonthlyCosts: number = 0,
  insuranceLifeAmount: number = 0,
  insurancePropertyAmount: number = 0,
  administrativeFees: number = 0
): number {
  const monthlyInsuranceCosts = calculateMonthlyInsuranceCosts(
    insuranceLifeAmount,
    insurancePropertyAmount,
    administrativeFees
  );
  
  return (extraMonthlyCosts || 0) + monthlyInsuranceCosts;
}


/**
 * Funciones de cálculo financiero para créditos hipotecarios
 * Implementa Método Francés Vencido Ordinario y todos los indicadores financieros
 */

export interface AmortizationRow {
    period: number;
    date: string;
    initialBalance: number;
    interest: number;
    payment: number;
    amortization: number;
    finalBalance: number;
}

/**
 * Convierte TNA a TEA según la capitalización
 */
export function convertTNAtoTEA(tna: number, capitalization: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'): number {
    const frequencies = {
        monthly: 12,
        bimonthly: 6,
        quarterly: 4,
        semiannual: 2,
        annual: 1
    };

    const m = frequencies[capitalization];
    return (Math.pow(1 + (tna / 100) / m, m) - 1) * 100;
}

/**
 * Convierte TEA a tasa periódica mensual
 */
export function convertTEAtoMonthlyRate(tea: number): number {
    return Math.pow(1 + tea / 100, 1 / 12) - 1;
}

/**
 * Calcula la cuota mensual usando Método Francés
 */
export function calculateMonthlyPayment(loanAmount: number, monthlyRate: number, totalMonths: number): number {
    if (monthlyRate === 0) {
        return loanAmount / totalMonths;
    }

    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
    const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
    return numerator / denominator;
}

/**
 * Calcula fecha sumando meses de 30 días (método francés vencido ordinario)
 * @param date - Fecha base
 * @param months - Número de meses a sumar (cada mes = 30 días)
 * @returns Nueva fecha con meses de 30 días sumados
 */
function addMonths30Days(date: Date, months: number): Date {
    const newDate = new Date(date);
    // Calcular días totales: meses × 30 días (método francés vencido ordinario)
    const totalDays = months * 30;
    newDate.setDate(newDate.getDate() + totalDays);
    return newDate;
}

/**
 * Genera tabla de amortización completa con Método Francés
 * Incluye soporte para períodos de gracia
 * IMPORTANTE: Usa meses de 30 días según método francés vencido ordinario
 */
export function generateAmortizationTable(
    loanAmount: number,
    monthlyRate: number,
    totalMonths: number,
    graceApplies: boolean,
    graceType: 'total' | 'partial' | undefined,
    graceMonths: number | undefined,
    startDate: Date = new Date()
): AmortizationRow[] {
    const table: AmortizationRow[] = [];
    let currentBalance = loanAmount;
    const gracePeriod = graceApplies && graceMonths ? graceMonths : 0;

    // Calcular cuota normal (después del período de gracia)
    // Nota: Si hay gracia total, el saldo cambiará y la cuota se recalculará
    const paymentMonths = totalMonths - gracePeriod;
    let monthlyPayment = calculateMonthlyPayment(currentBalance, monthlyRate, paymentMonths);

    for (let period = 1; period <= totalMonths; period++) {
        // Usar meses de 30 días según método francés vencido ordinario
        const date = addMonths30Days(startDate, period - 1);

        const initialBalance = currentBalance;
        const interest = currentBalance * monthlyRate;

        let payment: number;
        let amortization: number;

        if (period <= gracePeriod) {
            // Período de gracia
            if (graceType === 'total') {
                // Gracia total: no se paga nada, el interés se capitaliza
                payment = 0;
                amortization = 0;
                currentBalance = currentBalance + interest; // Capitalización
            } else {
                // Gracia parcial: solo se paga el interés
                payment = interest;
                amortization = 0;
                currentBalance = currentBalance; // No cambia el capital
            }
        } else {
            // Período normal de pago
            // En método francés, la cuota debe ser constante después del período de gracia
            // Si hay gracia total, el saldo cambió, así que recalcular la cuota constante
            if (period === gracePeriod + 1) {
                const remainingMonths = totalMonths - gracePeriod;
                const recalculatedPayment = calculateMonthlyPayment(currentBalance, monthlyRate, remainingMonths);
                payment = recalculatedPayment;
                // Actualizar monthlyPayment para los períodos siguientes
                monthlyPayment = recalculatedPayment;
            } else {
                // Usar la cuota constante calculada (ya actualizada si hubo gracia)
                payment = monthlyPayment;
            }

            amortization = payment - interest;
            currentBalance = currentBalance - amortization;
        }

        table.push({
            period,
            date: date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }),
            initialBalance,
            interest,
            payment,
            amortization,
            finalBalance: Math.max(0, currentBalance)
        });
    }

    return table;
}

/**
 * Calcula el VAN (Valor Actual Neto)
 */
export function calculateVAN(
    loanAmount: number,
    cashFlows: number[],
    discountRate: number
): number {
    // Para el cliente, el período 0 es un ingreso (monto del préstamo)
    // VAN = Monto financiado (t=0, sin descuento) - VP(de todas las cuotas)
    let van = loanAmount; // Ingreso inicial (positivo)

    for (let i = 0; i < cashFlows.length; i++) {
        const presentValue = cashFlows[i] / Math.pow(1 + discountRate, i + 1);
        van += presentValue; // cashFlows son negativos (pagos)
    }

    return van;
}

/**
 * Calcula la TIR (Tasa Interna de Retorno) usando método de bisección
 */
export function calculateTIR(loanAmount: number, cashFlows: number[]): number {
    // Función para calcular VAN con una tasa específica
    const calculateVANAtRate = (rate: number): number => {
        // Flujo de caja correcto: t0 positivo (préstamo recibido), siguientes negativos (cuotas)
        let van = loanAmount;
        for (let i = 0; i < cashFlows.length; i++) {
            van += cashFlows[i] / Math.pow(1 + rate, i + 1);
        }
        return van;
    };

    // Método de bisección
    let low = -0.99; // -99% (límite inferior)
    let high = 10; // 1000% (límite superior)
    const tolerance = 0.0001;
    const maxIterations = 1000;

    for (let i = 0; i < maxIterations; i++) {
        const mid = (low + high) / 2;
        const vanMid = calculateVANAtRate(mid);

        if (Math.abs(vanMid) < tolerance) {
            return mid * 100; // Convertir a porcentaje
        }

        // VAN aumenta con la tasa (flujos negativos). Si VAN(mid) > 0,
        // la raíz está por debajo de mid → mover 'high' hacia mid.
        // Si VAN(mid) < 0, la raíz está por encima de mid → mover 'low'.
        if (vanMid > 0) {
            high = mid;
        } else {
            low = mid;
        }
    }

    return ((low + high) / 2) * 100;
}

/**
 * Calcula la TCEA (Tasa de Costo Efectivo Anual)
 * Considera todos los costos del crédito
 */
export function calculateTCEA(
    loanAmount: number,
    cashFlowsMonthly: number[]
): number {
    // TCEA: IRR del flujo del cliente incluyendo costos (cuotas + costos adicionales)
    const monthlyIRR = calculateTIR(loanAmount, cashFlowsMonthly) / 100; // decimal
    const annualTCEA = (Math.pow(1 + monthlyIRR, 12) - 1) * 100;
    return annualTCEA;
}

/**
 * Calcula la TREA (Tasa de Rendimiento Efectivo Anual)
 * Para el cliente, considera el rendimiento de la inversión
 */
export function calculateTREA(
    loanAmount: number,
    cashFlowsBankMonthly: number[]
): number {
    // TREA (banco): IRR del flujo del banco
    // Usamos directamente flujos negativos (cuotas) con t0 positivo para mantener el mismo esquema de cálculo.
    // cashFlowsBankMonthly ya debe ser la serie de pagos mensuales con signo negativo.
    const monthlyIRR = calculateTIR(loanAmount, cashFlowsBankMonthly) / 100; // decimal
    const annualTREA = (Math.pow(1 + monthlyIRR, 12) - 1) * 100;
    return annualTREA;
}

/**
 * Calcula la Duración (Macaulay Duration)
 */
export function calculateDuration(
    cashFlows: number[],
    discountRate: number
): number {
    let weightedSum = 0;
    let presentValueSum = 0;

    for (let i = 0; i < cashFlows.length; i++) {
        const period = i + 1; // Mes
        const presentValue = cashFlows[i] / Math.pow(1 + discountRate, period);
        weightedSum += period * presentValue;
        presentValueSum += presentValue;
    }

    return weightedSum / presentValueSum / 12; // Convertir a años
}

/**
 * Calcula la Duración Modificada
 */
export function calculateModifiedDuration(
    duration: number,
    yieldRate: number
): number {
    return duration / (1 + yieldRate);
}

/**
 * Calcula la Convexidad
 */
export function calculateConvexity(
    cashFlows: number[],
    discountRate: number
): number {
    let convexitySum = 0;
    let presentValueSum = 0;

    for (let i = 0; i < cashFlows.length; i++) {
        const period = i + 1;
        const presentValue = cashFlows[i] / Math.pow(1 + discountRate, period);
        convexitySum += period * (period + 1) * presentValue / Math.pow(1 + discountRate, 2);
        presentValueSum += presentValue;
    }

    return convexitySum / presentValueSum;
}

/**
 * Función principal que calcula todos los indicadores financieros
 */
export function calculateFinancialIndicators(
    loanAmount: number,
    _propertyPrice: number,
    _downPayment: number,
    monthlyRate: number,
    totalMonths: number,
    graceApplies: boolean,
    graceType: 'total' | 'partial' | undefined,
    graceMonths: number | undefined,
    extraMonthlyCosts: number = 0,
    discountMonthlyRate?: number
) {
    // Generar tabla de amortización
    const amortizationTable = generateAmortizationTable(
        loanAmount,
        monthlyRate,
        totalMonths,
        graceApplies,
        graceType,
        graceMonths
    );

    // Calcular totales
    const totalAmount = amortizationTable.reduce((sum, row) => sum + row.payment, 0);
    const totalInterest = totalAmount - loanAmount;
    const monthlyPayment = amortizationTable.find(row => row.payment > 0)?.payment || 0;

    // Generar flujos de caja para cálculos
    const cashFlowsClient = amortizationTable.map(row => -(row.payment + (extraMonthlyCosts || 0))); // Pagos + costos
    const cashFlowsBank = amortizationTable.map(row => -row.payment); // Solo cuotas (ingreso del banco)

    // Calcular indicadores
    const annualRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

    // VAN (usando la tasa de interés como tasa de descuento)
    const van = calculateVAN(loanAmount, cashFlowsClient, (discountMonthlyRate ?? monthlyRate));

    // TIR (Tasa Interna de Retorno) - Calcula la tasa real que iguala el VAN a cero
    // Para créditos con método francés, considera todos los flujos de caja (cuotas + costos)
    const monthlyTIR = calculateTIR(loanAmount, cashFlowsClient) / 100; // TIR mensual en decimal
    const tir = (Math.pow(1 + monthlyTIR, 12) - 1) * 100; // Convertir a TEA anual

    // TCEA
    const tcea = calculateTCEA(loanAmount, cashFlowsClient);

    // TREA
    const trea = calculateTREA(loanAmount, cashFlowsBank);

    // Duración
    const duration = calculateDuration(cashFlowsClient, (discountMonthlyRate ?? monthlyRate));

    // Duración Modificada
    const modifiedDuration = calculateModifiedDuration(duration, (discountMonthlyRate ?? monthlyRate));

    // Convexidad
    const convexity = calculateConvexity(cashFlowsClient, (discountMonthlyRate ?? monthlyRate));

    return {
        monthlyPayment,
        totalAmount,
        totalInterest,
        tcea,
        trea,
        van,
        tir,
        duration,
        modifiedDuration,
        annualRate,
        convexity,
        amortizationTable
    };
}


import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Screen, Property, LoanConfig, SimulationResult } from '../App';
import { Calculator, ArrowLeft } from 'lucide-react';
import { FormField } from './help/FormField';
import { SuccessAlert } from './help/SuccessAlert';
import { 
  calculateFinancialIndicators, 
  convertTNAtoTEA, 
  convertTEAtoMonthlyRate 
} from '../lib/financialCalculations';

interface LoanSimulatorProps {
  property: Property | null;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onSimulationComplete: (config: LoanConfig, result: SimulationResult) => void;
}

export function LoanSimulatorWithHelp({ property, onNavigate, onLogout, onSimulationComplete }: LoanSimulatorProps) {
  const [config, setConfig] = useState<LoanConfig>({
    propertyPrice: property?.price || 0,
    downPayment: 20,
    loanAmount: 0,
    termYears: 20,
    currency: 'PEN',
    rateType: 'effective',
    interestRate: 8.5,
    graceApplies: false,
    bonusApplies: false,
    discountRateAnnual: 12,
    extraMonthlyCosts: 0
  });

  const [validations, setValidations] = useState<Record<string, { level: 'success' | 'warning' | 'error'; message: string } | null>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Update loan amount when property price or down payment changes
  useEffect(() => {
    const loanAmount = config.propertyPrice * (1 - config.downPayment / 100);
    setConfig(prev => ({ ...prev, loanAmount }));
  }, [config.propertyPrice, config.downPayment]);

  // Sincronizar precio cuando cambia la propiedad seleccionada
  useEffect(() => {
    if (property && typeof property.price === 'number') {
      setConfig(prev => ({ ...prev, propertyPrice: property.price }));
    }
  }, [property]);

  const handleConfigChange = (field: keyof LoanConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field: keyof LoanConfig, value: any) => {
    const newValidations = { ...validations };

    switch (field) {
      case 'propertyPrice':
        if (value < 50000) {
          newValidations.propertyPrice = { level: 'error', message: '❌ El precio debe ser mayor a S/ 50,000' };
        } else if (value > 5000000) {
          newValidations.propertyPrice = { level: 'error', message: '❌ El precio debe ser menor a S/ 5,000,000' };
        } else {
          newValidations.propertyPrice = { level: 'success', message: '✓ Precio válido' };
        }
        break;

      case 'downPayment':
        if (value < 10) {
          newValidations.downPayment = { level: 'error', message: '❌ La cuota inicial debe ser al menos 10% del precio' };
        } else if (value < 20) {
          newValidations.downPayment = { level: 'warning', message: '⚠️ Se recomienda una cuota inicial de al menos 20%' };
        } else if (value >= 30) {
          newValidations.downPayment = { level: 'warning', message: '⚠️ Una cuota inicial mayor reduce los intereses totales' };
        } else {
          newValidations.downPayment = { level: 'success', message: '✓ Cuota inicial adecuada' };
        }
        break;

      case 'interestRate':
        if (value < 1 || value > 30) {
          newValidations.interestRate = { level: 'error', message: '❌ Ingrese un número entre 1 y 30' };
        } else if (value > 15) {
          newValidations.interestRate = { level: 'warning', message: '⚠️ Esta tasa está fuera del rango típico. ¿Está seguro?' };
        } else {
          newValidations.interestRate = { level: 'success', message: '✓ Tasa dentro del rango permitido' };
        }
        break;

      case 'termYears':
        if (value < 5 || value > 30) {
          newValidations.termYears = { level: 'error', message: '❌ El plazo debe estar entre 5 y 30 años' };
        } else if (value > 25) {
          newValidations.termYears = { level: 'warning', message: '⚠️ A mayor plazo: menor cuota mensual pero mayor costo total' };
        } else {
          newValidations.termYears = { level: 'success', message: '✓ Plazo adecuado' };
        }
        break;

      default:
        newValidations[field] = null;
    }

    setValidations(newValidations);
  };

  const formatCurrency = (amount: number) => {
    const currencyCode = config.currency === 'PEN' ? 'PEN' : 'USD';
    const symbol = config.currency === 'PEN' ? 'S/' : '$';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(currencyCode, symbol);
  };

  const calculateSimulation = async () => {
    // Validation check
    const hasErrors = Object.values(validations).some(v => v?.level === 'error');
    if (hasErrors) {
      alert('Por favor corrija los errores antes de continuar');
      return;
    }

    try {
      // Calcular tasa mensual
      let monthlyRate: number;
      
      if (config.rateType === 'effective') {
        // TEA (Tasa Efectiva Anual) -> Tasa Mensual
        monthlyRate = convertTEAtoMonthlyRate(config.interestRate);
      } else {
        // TNA (Tasa Nominal Anual) -> TEA -> Tasa Mensual
        if (!config.capitalization) {
          alert('Debe especificar la capitalización para tasas nominales');
          return;
        }
        const tea = convertTNAtoTEA(config.interestRate, config.capitalization);
        monthlyRate = convertTEAtoMonthlyRate(tea);
      }
      
      // Calcular monto efectivo del préstamo
      let effectiveLoanAmount = config.loanAmount;
      if (config.bonusApplies && config.bonusAmount) {
        effectiveLoanAmount -= config.bonusAmount;
      }
      
      const totalMonths = config.termYears * 12;
      const discountMonthlyRate = convertTEAtoMonthlyRate(config.discountRateAnnual || 0);
      
      // Calcular todos los indicadores financieros usando las funciones correctas
      const indicators = calculateFinancialIndicators(
        effectiveLoanAmount,
        config.propertyPrice,
        config.propertyPrice * (config.downPayment / 100),
        monthlyRate,
        totalMonths,
        config.graceApplies,
        config.graceType,
        config.graceMonths,
        config.extraMonthlyCosts || 0,
        discountMonthlyRate
      );
      
      const result: SimulationResult = {
        monthlyPayment: indicators.monthlyPayment,
        tcea: indicators.tcea,
        trea: indicators.trea,
        totalAmount: indicators.totalAmount,
        totalInterest: indicators.totalInterest,
        van: indicators.van,
        tir: indicators.tir,
        duration: indicators.duration,
        modifiedDuration: indicators.modifiedDuration,
        convexity: indicators.convexity,
        amortizationTable: indicators.amortizationTable
      };

      // No guardar automáticamente: el usuario debe hacer clic en "Guardar Simulación" en la pantalla de resultados

      setShowSuccess(true);
      setTimeout(() => {
        onSimulationComplete(config, result);
      }, 2000);
    } catch (error) {
      console.error('Error al calcular simulación:', error);
      alert('Error al calcular la simulación. Por favor verifica los datos ingresados.');
    }
  };

  return (
    <div>
      <Navigation currentScreen="simulator" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => property ? onNavigate('property-detail') : onNavigate('projects')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
          
          <h1 className="text-3xl text-gray-900 mb-2">Configuración del Simulador</h1>
          <p className="text-gray-600">Configure los parámetros del crédito hipotecario</p>
          {property && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Propiedad seleccionada:</strong> {property.name} - {formatCurrency(property.price)}
              </p>
            </div>
          )}
        </div>

        {showSuccess && (
          <SuccessAlert
            title="✓ Plan de pagos calculado correctamente"
            message={`Cuota mensual: ${formatCurrency(config.loanAmount * 0.008)}`}
            primaryAction={{
              label: "Ver detalles completos",
              onClick: () => setShowSuccess(false)
            }}
          />
        )}

        <div className="space-y-6">
          {/* Datos del Préstamo */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Préstamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={`Precio de la Propiedad (${config.currency === 'PEN' ? 'S/' : '$'})`}
                  required
                  helpTooltip={{
                    title: "Precio de la propiedad",
                    description: "Ingrese el precio total de la propiedad según cotización.",
                    example: "S/ 180,000.00",
                    range: "S/ 50,000 - S/ 5,000,000"
                  }}
                  validation={validations.propertyPrice}
                  helpText="Incluye todos los costos asociados a la compra"
                >
                  <Input
                    type="number"
                    value={config.propertyPrice}
                    onChange={(e) => handleConfigChange('propertyPrice', parseFloat(e.target.value) || 0)}
                    placeholder="300000"
                  />
                </FormField>

                <FormField
                  label="Cuota Inicial (%)"
                  required
                  helpTooltip={{
                    title: "Cuota inicial",
                    description: "Porcentaje del precio que pagará como inicial.",
                    example: "20%",
                    range: "Mínimo requerido por Fondo MiVivienda: 10%",
                    warning: "Se recomienda 20%-30% para mejores condiciones"
                  }}
                  validation={validations.downPayment}
                  helpText="Se recomienda una cuota inicial entre 20%-30% para obtener mejores condiciones y reducir los intereses totales a pagar."
                >
                  <Input
                    type="number"
                    value={config.downPayment}
                    onChange={(e) => handleConfigChange('downPayment', parseFloat(e.target.value) || 0)}
                    placeholder="20"
                    min="0"
                    max="50"
                  />
                </FormField>

                <FormField
                  label="Monto a Financiar"
                  helpTooltip={{
                    title: "Monto a financiar",
                    description: "Monto que será financiado por el banco. Se calcula automáticamente restando la cuota inicial del precio total."
                  }}
                  helpText="Se calcula automáticamente: Precio - Cuota inicial"
                >
                  <Input
                    type="number"
                    value={config.loanAmount}
                    readOnly
                    className="bg-gray-50"
                  />
                </FormField>

                <FormField
                  label="Plazo (años)"
                  required
                  helpTooltip={{
                    title: "Plazo del crédito",
                    description: "Tiempo en años para pagar el crédito.",
                    range: "5-30 años",
                    warning: "A mayor plazo: menor cuota mensual pero mayor costo total por intereses"
                  }}
                  validation={validations.termYears}
                  helpText="A mayor plazo: menor cuota mensual pero mayor costo total por intereses."
                >
                  <Select value={config.termYears.toString()} onValueChange={(value) => handleConfigChange('termYears', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30].map(years => (
                        <SelectItem key={years} value={years.toString()}>{years} años</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Tasa */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Tasa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Tipo de Moneda"
                  required
                  helpTooltip={{
                    title: "Tipo de moneda",
                    description: "Moneda en la que se realizará el crédito.",
                    example: "Soles (PEN) o Dólares (USD)"
                  }}
                >
                  <Select value={config.currency} onValueChange={(value: 'PEN' | 'USD') => handleConfigChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">Soles (S/)</SelectItem>
                      <SelectItem value="USD">Dólares ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Tipo de Tasa"
                  required
                  helpTooltip={{
                    title: "Tipo de tasa",
                    description: "TEA (Efectiva): Incluye capitalización. TNA (Nominal): Requiere especificar capitalización.",
                    warning: "Consulte con su banco cuál le están ofreciendo"
                  }}
                >
                  <Select value={config.rateType} onValueChange={(value: 'effective' | 'nominal') => handleConfigChange('rateType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="effective">TEA (Efectiva)</SelectItem>
                      <SelectItem value="nominal">TNA (Nominal)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Tasa de Interés (% anual)"
                  required
                  helpTooltip={{
                    title: "Tasa de interés anual",
                    description: "Ingrese la tasa anual que le ofrece la entidad financiera.",
                    example: "8.50%",
                    range: "Rango típico: 1.00% - 30.00%"
                  }}
                  validation={validations.interestRate}
                  helpText="Se recomienda consultar con su entidad financiera"
                >
                  <Input
                    type="number"
                    step="0.1"
                    value={config.interestRate}
                    onChange={(e) => handleConfigChange('interestRate', parseFloat(e.target.value) || 0)}
                    placeholder="8.5"
                    min="1"
                    max="30"
                  />
                </FormField>
              </div>

              {config.rateType === 'nominal' && (
                <FormField
                  label="Capitalización"
                  required
                  helpTooltip={{
                    title: "Capitalización",
                    description: "Frecuencia con que los intereses se agregan al capital.",
                    warning: "Mayor frecuencia = mayor costo efectivo del crédito"
                  }}
                  helpText="Frecuencia con que los intereses se agregan al capital. Mayor frecuencia = mayor costo efectivo del crédito."
                >
                  <Select value={config.capitalization} onValueChange={(value) => handleConfigChange('capitalization', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Costos adicionales y COK */}
          <Card>
            <CardHeader>
              <CardTitle>Costos y Tasa de Descuento (COK)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={`Costos mensuales adicionales (${config.currency === 'PEN' ? 'S/' : '$'})`}
                helpTooltip={{
                  title: 'Costos mensuales adicionales',
                  description: 'Seguro de desgravamen, seguro de inmueble, portes y comisiones mensuales agregados a la cuota.',
                  warning: 'Estos costos aumentan la TCEA al representar el costo total del crédito.'
                }}
                helpText="Se suman a la cuota para el cálculo de TCEA y VAN"
              >
                <Input
                  type="number"
                  step="0.01"
                  value={config.extraMonthlyCosts === 0 ? '' : config.extraMonthlyCosts}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleConfigChange('extraMonthlyCosts', v === '' ? 0 : parseFloat(v) || 0);
                  }}
                  placeholder="0"
                  min="0"
                />
              </FormField>

              <FormField
                label="Tasa de Descuento (COK) % anual"
                helpTooltip={{
                  title: 'COK (Costo de Oportunidad del Capital)',
                  description: 'Tasa externa usada para descontar el flujo de costos del cliente al calcular el VAN.',
                  warning: 'No debe ser la misma tasa del crédito; use su tasa de oportunidad.'
                }}
                helpText="Se convierte a tasa mensual para el cálculo de VAN"
              >
                <Input
                  type="number"
                  step="0.1"
                  value={config.discountRateAnnual}
                  onChange={(e) => handleConfigChange('discountRateAnnual', parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  min="0"
                  max="100"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Períodos de Gracia */}
          <Card>
            <CardHeader>
              <CardTitle>Períodos de Gracia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="¿Aplicar período de gracia?"
                helpTooltip={{
                  title: "Período de gracia",
                  description: "Tiempo donde no se paga la cuota completa. - Gracia Total: No se paga capital ni intereses. - Gracia Parcial: Solo se pagan intereses.",
                  warning: "Aumenta el costo total del crédito"
                }}
              >
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.graceApplies}
                    onCheckedChange={(checked) => handleConfigChange('graceApplies', checked)}
                  />
                  <Label>Aplicar período de gracia</Label>
                </div>
              </FormField>

              {config.graceApplies && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    label="Tipo de Gracia"
                    required
                  >
                    <Select value={config.graceType} onValueChange={(value: 'total' | 'partial') => handleConfigChange('graceType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">Total (no se paga nada)</SelectItem>
                        <SelectItem value="partial">Parcial (solo intereses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label="Número de Meses"
                    required
                    helpTooltip={{
                      title: "Meses de gracia",
                      description: "Número de meses que durará el período de gracia.",
                      range: "1-24 meses"
                    }}
                  >
                    <Input
                      type="number"
                      value={config.graceMonths || ''}
                      onChange={(e) => handleConfigChange('graceMonths', parseInt(e.target.value) || 0)}
                      placeholder="6"
                      min="1"
                      max="24"
                    />
                  </FormField>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bono Techo Propio */}
          <Card>
            <CardHeader>
              <CardTitle>Bono Techo Propio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="¿Aplica bono del Estado?"
                helpTooltip={{
                  title: "Bono Techo Propio",
                  description: "Subsidio habitacional del Estado para reducir el monto del crédito.",
                  range: "Hasta S/ 30,000",
                  warning: "Verificar elegibilidad según ingresos familiares"
                }}
              >
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.bonusApplies}
                    onCheckedChange={(checked) => handleConfigChange('bonusApplies', checked)}
                  />
                  <Label>Aplicar bono del Estado</Label>
                </div>
              </FormField>

              {config.bonusApplies && (
                <FormField
                  label={`Monto del Bono (${config.currency === 'PEN' ? 'S/' : '$'})`}
                  required
                  helpTooltip={{
                    title: "Monto del bono",
                    description: "Monto del subsidio del Estado que se restará del precio de la propiedad.",
                    example: "S/ 30,000",
                    range: "Hasta S/ 30,000"
                  }}
                >
                  <Input
                    type="number"
                    value={config.bonusAmount || ''}
                    onChange={(e) => handleConfigChange('bonusAmount', parseFloat(e.target.value) || 0)}
                    placeholder="30000"
                  />
                </FormField>
              )}
            </CardContent>
          </Card>

          {/* Botón de cálculo */}
          <div className="flex justify-center">
            <Button 
              onClick={calculateSimulation}
              size="lg"
              className="bg-green-600 hover:bg-green-700 px-12 py-4 text-lg"
            >
              <Calculator className="w-6 h-6 mr-3" />
              CALCULAR PLAN DE PAGOS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
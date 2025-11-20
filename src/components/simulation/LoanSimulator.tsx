import { useState, useEffect, useRef } from 'react';
import { Navigation } from '../shared/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Screen, Property, LoanConfig, SimulationResult } from '../../App';
import { Calculator, ArrowLeft } from 'lucide-react';
import { FormField } from '../help/FormField';
import { SuccessAlert } from '../help/SuccessAlert';
import { 
  calculateFinancialIndicators, 
  convertTNAtoTEA, 
  convertTEAtoMonthlyRate 
} from '../../lib/financialCalculations';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { toast } from 'sonner';
import { financialEntityService, FinancialEntity } from '../../services/financialEntityService';
import { 
  calculateBBPAmount, 
  calculateBFHAmount,
  isMiviviendaEligible,
  getBBPRangeInfo,
  getBBPEligibilityStatus
} from '../../lib/bonusCalculations';
import { calculateTotalExtraMonthlyCosts } from '../../lib/costCalculations';

interface LoanSimulatorProps {
  property: Property | null;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onSimulationComplete: (config: LoanConfig, result: SimulationResult) => void;
}

export function LoanSimulator({ property, onNavigate, onLogout, onSimulationComplete }: LoanSimulatorProps) {
  const { defaults, isLoading: loadingConfig } = useSystemConfig();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousDefaultsRef = useRef(defaults);
  const [financialEntities, setFinancialEntities] = useState<FinancialEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  
  const [config, setConfig] = useState<LoanConfig>({
    propertyPrice: property?.price || 0,
    downPayment: defaults.defaultDownPayment,
    loanAmount: 0,
    termYears: defaults.defaultTermYears,
    currency: defaults.defaultCurrency,
    rateType: 'effective',
    interestRate: defaults.defaultInterestRate,
    graceApplies: defaults.enableGracePeriod,
    bonusApplies: defaults.enableStateBonus,
    bonusType: null,
    bonusAmount: undefined,
    bfhModalidad: null,
    isSustainableHousing: false,
    discountRateAnnual: defaults.defaultDiscountRateAnnual,
    extraMonthlyCosts: 0,
    entityId: null
  });

  const [validations, setValidations] = useState<Record<string, { level: 'success' | 'warning' | 'error'; message: string } | null>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar entidades financieras activas
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoadingEntities(true);
        const entities = await financialEntityService.getActive();
        setFinancialEntities(entities);
      } catch (error) {
        console.error('Error cargando entidades financieras:', error);
      } finally {
        setLoadingEntities(false);
      }
    };
    loadEntities();
  }, []);

  // Cargar valores por defecto cuando se selecciona una entidad o se deselecciona
  useEffect(() => {
    // Solo ejecutar si ya se inicializó y hay entidades cargadas
    if (!isInitialized || loadingEntities || !defaults) return;

    if (config.entityId) {
      // Entidad seleccionada: cargar valores de la entidad
      const entity = financialEntities.find(e => e.id === config.entityId);
      if (entity) {
        setConfig(prev => {
          // Calcular plazo por defecto (promedio entre min y max, o usar default del sistema)
          let defaultTermYears = defaults.defaultTermYears;
          if (entity.min_term_years && entity.max_term_years) {
            defaultTermYears = Math.round((entity.min_term_years + entity.max_term_years) / 2);
          } else if (entity.min_term_years) {
            defaultTermYears = entity.min_term_years;
          } else if (entity.max_term_years) {
            defaultTermYears = entity.max_term_years;
          }

          // Calcular cuota inicial por defecto (usar mínimo de la entidad o default del sistema, el mayor)
          const defaultDownPayment = entity.min_down_payment 
            ? Math.max(entity.min_down_payment, defaults.defaultDownPayment)
            : defaults.defaultDownPayment;

          return {
            ...prev,
            // Parámetros principales de la entidad
            downPayment: defaultDownPayment,
            interestRate: entity.base_interest_rate || defaults.defaultInterestRate,
            termYears: defaultTermYears,
            rateType: entity.allowed_rate_types?.[0] || prev.rateType || 'effective',
            capitalization: entity.allowed_capitalizations?.[0] || prev.capitalization,
            // Seguros y comisiones
            insuranceLifeRate: entity.default_insurance_life_rate || undefined,
            insurancePropertyRate: entity.default_insurance_property_rate || undefined,
            commissionEvaluation: entity.default_commission_evaluation || undefined,
            commissionDisbursement: entity.default_commission_disbursement || undefined,
            administrativeFees: entity.default_administrative_fees || undefined,
          };
        });
      }
    } else {
      // No hay entidad seleccionada: usar valores por defecto del sistema
      setConfig(prev => ({
        ...prev,
        downPayment: defaults.defaultDownPayment,
        interestRate: defaults.defaultInterestRate,
        termYears: defaults.defaultTermYears,
        currency: defaults.defaultCurrency,
        rateType: 'effective', // Reset a default
        capitalization: undefined, // Reset
        graceApplies: defaults.enableGracePeriod,
        bonusApplies: defaults.enableStateBonus,
        discountRateAnnual: defaults.defaultDiscountRateAnnual,
        // Limpiar seguros y comisiones específicos de entidad
        insuranceLifeRate: undefined,
        insurancePropertyRate: undefined,
        commissionEvaluation: undefined,
        commissionDisbursement: undefined,
        administrativeFees: undefined,
      }));
    }
  }, [config.entityId, financialEntities, defaults, isInitialized, loadingEntities]);

  // Inicializar con valores de configuración del sistema cuando se carga por primera vez
  useEffect(() => {
    if (!loadingConfig && defaults && !isInitialized) {
      setConfig(prev => ({
        ...prev,
        propertyPrice: property?.price || prev.propertyPrice,
        downPayment: defaults.defaultDownPayment,
        termYears: defaults.defaultTermYears,
        currency: defaults.defaultCurrency,
        interestRate: defaults.defaultInterestRate,
        graceApplies: defaults.enableGracePeriod,
            bonusApplies: defaults.enableStateBonus,
            bonusType: prev.bonusType || null,
            bonusAmount: prev.bonusAmount,
            bfhModalidad: prev.bfhModalidad || null,
            discountRateAnnual: defaults.defaultDiscountRateAnnual,
          }));
      previousDefaultsRef.current = defaults;
      setIsInitialized(true);
    }
  }, [loadingConfig, defaults, isInitialized, property]);

  // Sincronizar cuando cambia la configuración del sistema
  // Solo actualiza si los valores actuales del simulador coinciden con los valores por defecto anteriores
  // Esto evita sobrescribir cambios manuales del usuario o valores de entidad seleccionada
  useEffect(() => {
    // No sincronizar si hay una entidad seleccionada (los valores vienen de la entidad)
    if (config.entityId) return;
    
    if (!loadingConfig && defaults && isInitialized && previousDefaultsRef.current) {
      const prevDefaults = previousDefaultsRef.current;
      
      setConfig(prev => {
        // Verificar si los valores actuales del simulador coinciden con los defaults anteriores
        // Si coinciden, significa que el usuario no los ha modificado, así que podemos actualizarlos
        const valuesMatchDefaults = 
          prev.downPayment === prevDefaults.defaultDownPayment &&
          prev.termYears === prevDefaults.defaultTermYears &&
          prev.interestRate === prevDefaults.defaultInterestRate &&
          prev.currency === prevDefaults.defaultCurrency &&
          prev.graceApplies === prevDefaults.enableGracePeriod &&
          prev.bonusApplies === prevDefaults.enableStateBonus &&
          prev.bonusType === null &&
          prev.discountRateAnnual === prevDefaults.defaultDiscountRateAnnual;
        
        // Si los valores coinciden con los defaults anteriores Y los nuevos defaults son diferentes,
        // entonces actualizar (el admin cambió la configuración)
        const configChanged = 
          prevDefaults.defaultDownPayment !== defaults.defaultDownPayment ||
          prevDefaults.defaultTermYears !== defaults.defaultTermYears ||
          prevDefaults.defaultInterestRate !== defaults.defaultInterestRate ||
          prevDefaults.defaultCurrency !== defaults.defaultCurrency ||
          prevDefaults.enableGracePeriod !== defaults.enableGracePeriod ||
          prevDefaults.enableStateBonus !== defaults.enableStateBonus ||
          prevDefaults.defaultDiscountRateAnnual !== defaults.defaultDiscountRateAnnual;
        
        if (valuesMatchDefaults && configChanged) {
          previousDefaultsRef.current = defaults;
          return {
            ...prev,
            downPayment: defaults.defaultDownPayment,
            termYears: defaults.defaultTermYears,
            currency: defaults.defaultCurrency,
            interestRate: defaults.defaultInterestRate,
            graceApplies: defaults.enableGracePeriod,
            bonusApplies: defaults.enableStateBonus,
            bonusType: prev.bonusType || null,
            bonusAmount: prev.bonusAmount,
            bfhModalidad: prev.bfhModalidad || null,
            discountRateAnnual: defaults.defaultDiscountRateAnnual,
          };
        }
        return prev;
      });
    }
  }, [defaults, loadingConfig, isInitialized, config.entityId]);

  // Update loan amount when property price or down payment changes
  useEffect(() => {
    const loanAmount = config.propertyPrice * (1 - config.downPayment / 100);
    setConfig(prev => ({ ...prev, loanAmount }));
  }, [config.propertyPrice, config.downPayment]);

  // Calcular monto efectivo a financiar (después de aplicar bono)
  const effectiveLoanAmount = config.bonusApplies && config.bonusAmount 
    ? Math.max(0, config.loanAmount - (config.bonusAmount || 0))
    : config.loanAmount;

  // Recalcular seguro de desgravamen cuando cambia el loanAmount efectivo o la tasa
  useEffect(() => {
    if (config.insuranceLifeRate !== undefined && config.insuranceLifeRate !== null && effectiveLoanAmount) {
      const amount = (effectiveLoanAmount * config.insuranceLifeRate / 100);
      setConfig(prev => ({ ...prev, insuranceLifeAmount: amount }));
    } else {
      // Si se borra la tasa, poner el monto en 0
      setConfig(prev => ({ ...prev, insuranceLifeAmount: 0 }));
    }
  }, [effectiveLoanAmount, config.insuranceLifeRate]);

  // Recalcular seguro de inmueble cuando cambia el propertyPrice o la tasa
  useEffect(() => {
    if (config.insurancePropertyRate !== undefined && config.insurancePropertyRate !== null && config.propertyPrice) {
      const amount = (config.propertyPrice * config.insurancePropertyRate / 100 / 12);
      setConfig(prev => ({ ...prev, insurancePropertyAmount: amount }));
    } else {
      // Si se borra la tasa, poner el monto en 0
      setConfig(prev => ({ ...prev, insurancePropertyAmount: 0 }));
    }
  }, [config.propertyPrice, config.insurancePropertyRate]);

  // Recalcular monto de BBP cuando cambia el precio de la propiedad o si es vivienda sostenible
  useEffect(() => {
    if (config.bonusApplies && config.bonusType === 'bbp' && config.propertyPrice > 0) {
      const eligibility = getBBPEligibilityStatus(config.propertyPrice);
      const bbpAmount = eligibility.canApplyBonus 
        ? calculateBBPAmount(config.propertyPrice, config.isSustainableHousing || false)
        : 0;
      setConfig(prev => ({ ...prev, bonusAmount: bbpAmount }));
    }
  }, [config.propertyPrice, config.bonusType, config.bonusApplies, config.isSustainableHousing]);

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
    
    // Obtener entidad financiera seleccionada para validaciones
    const selectedEntity = config.entityId 
      ? financialEntities.find(e => e.id === config.entityId)
      : null;

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
        const minDownPayment = selectedEntity?.min_down_payment || 10;
        if (value < minDownPayment) {
          newValidations.downPayment = { 
            level: 'error', 
            message: `❌ La cuota inicial debe ser al menos ${minDownPayment}% (requisito de ${selectedEntity?.name || 'la entidad'})` 
          };
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
        const minTerm = selectedEntity?.min_term_years || 5;
        const maxTerm = selectedEntity?.max_term_years || 30;
        if (value < minTerm || value > maxTerm) {
          newValidations.termYears = { 
            level: 'error', 
            message: `❌ El plazo debe estar entre ${minTerm} y ${maxTerm} años (requisito de ${selectedEntity?.name || 'la entidad'})` 
          };
        } else if (value > 25) {
          newValidations.termYears = { level: 'warning', message: '⚠️ A mayor plazo: menor cuota mensual pero mayor costo total' };
        } else {
          newValidations.termYears = { level: 'success', message: '✓ Plazo adecuado' };
        }
        break;

      case 'graceMonths':
        if (config.graceApplies && value) {
          const maxGraceMonths = selectedEntity?.grace_max_months;
          if (maxGraceMonths && value > maxGraceMonths) {
            newValidations.graceMonths = { 
              level: 'error', 
              message: `❌ El período de gracia máximo es ${maxGraceMonths} meses (requisito de ${selectedEntity?.name || 'la entidad'})` 
            };
          } else if (!selectedEntity?.grace_allowed) {
            newValidations.graceMonths = { 
              level: 'error', 
              message: `❌ ${selectedEntity?.name || 'Esta entidad'} no permite período de gracia` 
            };
          } else {
            newValidations.graceMonths = { level: 'success', message: '✓ Período de gracia válido' };
          }
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
      toast.error('Por favor corrija los errores antes de continuar');
      return;
    }

    // Validar según entidad financiera si está seleccionada
    const selectedEntity = config.entityId 
      ? financialEntities.find(e => e.id === config.entityId)
      : null;

    if (selectedEntity) {
      // Validar cuota inicial mínima
      if (config.downPayment < (selectedEntity.min_down_payment || 10)) {
        toast.error("Cuota inicial insuficiente", {
          description: `La entidad ${selectedEntity.name} requiere mínimo ${selectedEntity.min_down_payment}% de cuota inicial`,
        });
        return;
      }

      // Validar plazo
      if (config.termYears < (selectedEntity.min_term_years || 5) || 
          config.termYears > (selectedEntity.max_term_years || 30)) {
        toast.error("Plazo fuera de rango", {
          description: `La entidad ${selectedEntity.name} permite plazos entre ${selectedEntity.min_term_years || 5} y ${selectedEntity.max_term_years || 30} años`,
        });
        return;
      }

      // Validar período de gracia
      if (config.graceApplies && config.graceMonths) {
        if (!selectedEntity.grace_allowed) {
          toast.error("Período de gracia no permitido", {
            description: `${selectedEntity.name} no permite período de gracia`,
          });
          return;
        }
        if (selectedEntity.grace_max_months && config.graceMonths > selectedEntity.grace_max_months) {
          toast.error("Período de gracia excedido", {
            description: `El máximo permitido es ${selectedEntity.grace_max_months} meses`,
          });
          return;
        }
      }

      // Validar tipo de tasa
      if (!selectedEntity.allowed_rate_types.includes(config.rateType)) {
        toast.error("Tipo de tasa no permitido", {
          description: `${selectedEntity.name} solo permite tasas ${selectedEntity.allowed_rate_types.join(' o ')}`,
        });
        return;
      }

      // Validar capitalización si es tasa nominal
      if (config.rateType === 'nominal' && config.capitalization) {
        if (!selectedEntity.allowed_capitalizations.includes(config.capitalization)) {
          toast.error("Capitalización no permitida", {
            description: `${selectedEntity.name} no permite capitalización ${config.capitalization}`,
          });
          return;
        }
      }
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
          toast.error('Debe especificar la capitalización para tasas nominales');
          return;
        }
        const tea = convertTNAtoTEA(config.interestRate, config.capitalization);
        monthlyRate = convertTEAtoMonthlyRate(tea);
      }
      
      // Calcular monto efectivo del préstamo (después de aplicar bono)
      const finalEffectiveLoanAmount = config.bonusApplies && config.bonusAmount 
        ? Math.max(0, config.loanAmount - (config.bonusAmount || 0))
        : config.loanAmount;
      
      const totalMonths = config.termYears * 12;
      const discountMonthlyRate = convertTEAtoMonthlyRate(config.discountRateAnnual || 0);
      
      // Calcular costos mensuales totales usando función centralizada (DRY)
      // Incluye: costos adicionales + seguros + gastos administrativos
      const totalExtraMonthlyCosts = calculateTotalExtraMonthlyCosts(
        config.extraMonthlyCosts || 0,
        config.insuranceLifeAmount || 0,
        config.insurancePropertyAmount || 0,
        config.administrativeFees || 0
      );
      
      // Calcular todos los indicadores financieros usando las funciones correctas
      const indicators = calculateFinancialIndicators(
        finalEffectiveLoanAmount,
        config.propertyPrice,
        config.propertyPrice * (config.downPayment / 100),
        monthlyRate,
        totalMonths,
        config.graceApplies,
        config.graceType,
        config.graceMonths,
        totalExtraMonthlyCosts,
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
    } catch (error: any) {
      console.error('Error al calcular simulación:', error);
      const errorMessage = error?.message?.replace(/https?:\/\/[^\s]+/g, "").replace(/localhost[^\s]*/gi, "").trim() || "Por favor verifica los datos ingresados";
      toast.error('Error al calcular la simulación', {
        description: errorMessage,
      });
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
                    description: "Monto que será financiado por el banco. Se calcula automáticamente: Precio - Cuota inicial - Bono (si aplica)."
                  }}
                  helpText={config.bonusApplies && config.bonusAmount 
                    ? `Precio - Cuota inicial - Bono = ${formatCurrency(config.loanAmount - (config.bonusAmount || 0))}`
                    : "Se calcula automáticamente: Precio - Cuota inicial"}
                >
                  <Input
                    type="number"
                    value={config.bonusApplies && config.bonusAmount 
                      ? config.loanAmount - (config.bonusAmount || 0)
                      : config.loanAmount}
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

              {/* Selector de Entidad Financiera */}
              <div className="pt-4 border-t">
                <FormField
                  label="Entidad Financiera"
                  helpTooltip={{
                    title: "Entidad financiera",
                    description: "Seleccione la entidad financiera (banco, caja) para esta simulación. Esto cargará automáticamente los valores por defecto de seguros y comisiones.",
                  }}
                  helpText="Seleccione la entidad para cargar automáticamente seguros y comisiones"
                >
                  <Select
                    value={config.entityId || "none"}
                    onValueChange={(value) => handleConfigChange('entityId', value === "none" ? null : value)}
                    disabled={loadingEntities}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingEntities ? "Cargando..." : "Seleccione una entidad"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna (valores manuales)</SelectItem>
                      {financialEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} {entity.short_name ? `(${entity.short_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Bonos del Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Bonos del Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="¿Aplica bono del Estado?"
                helpTooltip={{
                  title: "Bonos del Estado",
                  description: "El Bono del Buen Pagador (BBP) está vinculado al Crédito MIVIVIENDA. El Bono Familiar Habitacional (BFH) está vinculado al programa Techo Propio.",
                }}
              >
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.bonusApplies}
                    onCheckedChange={(checked) => {
                      handleConfigChange('bonusApplies', checked);
                      if (!checked) {
                        handleConfigChange('bonusType', null);
                        handleConfigChange('bonusAmount', undefined);
                        handleConfigChange('bfhModalidad', null);
                      }
                    }}
                  />
                  <Label>Aplicar bono del Estado</Label>
                </div>
              </FormField>

              {config.bonusApplies && (
                <>
                  <FormField
                    label="Tipo de Bono"
                    required
                    helpTooltip={{
                      title: "Tipo de bono",
                      description: "BBP: Para Crédito MIVIVIENDA. BFH: Para programa Techo Propio (compra, construcción o mejoramiento).",
                    }}
                  >
                    <Select
                      value={config.bonusType || ''}
                      onValueChange={(value: 'bbp' | 'bfh') => {
                        handleConfigChange('bonusType', value);
                        // Calcular monto automáticamente según tipo
                        if (value === 'bbp') {
                          const eligibility = getBBPEligibilityStatus(config.propertyPrice);
                          const bbpAmount = eligibility.canApplyBonus 
                            ? calculateBBPAmount(config.propertyPrice, config.isSustainableHousing || false)
                            : 0;
                          handleConfigChange('bonusAmount', bbpAmount);
                          handleConfigChange('bfhModalidad', null);
                        } else {
                          handleConfigChange('bonusAmount', undefined);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de bono" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bbp">
                          Bono del Buen Pagador (BBP) - Crédito MIVIVIENDA
                        </SelectItem>
                        <SelectItem value="bfh">
                          Bono Familiar Habitacional (BFH) - Techo Propio
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {config.bonusType === 'bbp' && (
                    <>
                      <FormField
                        label="Vivienda Sostenible"
                        helpTooltip={{
                          title: "Vivienda Sostenible",
                          description: "Si la vivienda cumple con criterios de sostenibilidad, el bono BBP aumenta. Ejemplo: Rango 1 pasa de S/ 27,400 a S/ 33,700.",
                        }}
                        helpText="Marque si la vivienda cumple con criterios de sostenibilidad (aumenta el bono)"
                      >
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.isSustainableHousing || false}
                            onCheckedChange={(checked) => {
                              handleConfigChange('isSustainableHousing', checked);
                              // Recalcular bono cuando cambia el estado de vivienda sostenible
                              const newBbpAmount = calculateBBPAmount(config.propertyPrice, checked);
                              handleConfigChange('bonusAmount', newBbpAmount);
                            }}
                          />
                          <Label>Es Vivienda Sostenible</Label>
                        </div>
                      </FormField>

                      <FormField
                        label={`Monto del BBP (${config.currency === 'PEN' ? 'S/' : '$'})`}
                        helpTooltip={{
                          title: "Bono del Buen Pagador (BBP)",
                          description: "Monto calculado automáticamente según el precio de la vivienda y si es sostenible. Puede modificarse manualmente.",
                          range: "S/ 27,400 - S/ 7,800 (normal) o S/ 33,700 - S/ 9,600 (sostenible) según valor de vivienda",
                        }}
                        helpText="Se calcula automáticamente según el precio de la vivienda. Puede editar el monto si es necesario."
                      >
                        <Input
                          type="number"
                          value={config.bonusAmount || calculateBBPAmount(config.propertyPrice, config.isSustainableHousing || false) || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            handleConfigChange('bonusAmount', value);
                            // El monto a financiar se actualizará automáticamente por el efecto de effectiveLoanAmount
                          }}
                          placeholder="0"
                          min="0"
                          max={config.loanAmount}
                        />
                        {(() => {
                          const eligibility = getBBPEligibilityStatus(config.propertyPrice);
                          const calculatedBonus = calculateBBPAmount(config.propertyPrice, config.isSustainableHousing || false);
                          
                          return (
                            <>
                              {eligibility.status === 'eligible' ? (
                                <>
                                  <p className="text-xs text-green-600 mt-1 font-medium">
                                    {eligibility.message}
                                    {config.isSustainableHousing && (
                                      <span className="ml-2">(Vivienda Sostenible: +{formatCurrency(calculatedBonus - (getBBPRangeInfo(config.propertyPrice)?.bonus || 0))})</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Monto sugerido: {formatCurrency(calculatedBonus)}
                                  </p>
                                </>
                              ) : eligibility.status === 'too_low' ? (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  {eligibility.message}
                                </p>
                              ) : eligibility.status === 'too_high' ? (
                                <p className="text-xs text-orange-600 mt-1 font-medium">
                                  {eligibility.message}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500 mt-1">
                                  Monto sugerido: {formatCurrency(calculatedBonus)}
                                </p>
                              )}
                              
                              {config.bonusAmount && config.bonusAmount > 0 && eligibility.canApplyBonus && (
                                <p className="text-xs text-green-600 mt-1">
                                  Nuevo monto a financiar: {formatCurrency(Math.max(0, config.loanAmount - config.bonusAmount))}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </FormField>
                    </>
                  )}

                  {config.bonusType === 'bfh' && (
                    <>
                      <FormField
                        label="Modalidad del BFH"
                        required
                        helpTooltip={{
                          title: "Modalidad BFH",
                          description: "Adquisición: hasta S/ 37,557. Construcción: S/ 32,100. Mejoramiento: S/ 10,580.",
                        }}
                      >
                        <Select
                          value={config.bfhModalidad || ''}
                          onValueChange={(value: 'compra' | 'construccion' | 'mejoramiento') => {
                            handleConfigChange('bfhModalidad', value);
                            const bfhAmount = calculateBFHAmount(value);
                            handleConfigChange('bonusAmount', bfhAmount);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar modalidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compra">Adquisición de vivienda nueva</SelectItem>
                            <SelectItem value="construccion">Construcción en sitio propio</SelectItem>
                            <SelectItem value="mejoramiento">Mejoramiento de vivienda</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label={`Monto del BFH (${config.currency === 'PEN' ? 'S/' : '$'})`}
                        helpTooltip={{
                          title: "Bono Familiar Habitacional (BFH)",
                          description: "Monto calculado automáticamente según la modalidad seleccionada.",
                        }}
                        helpText="Se calcula automáticamente según la modalidad."
                      >
                        <Input
                          type="number"
                          value={config.bonusAmount || (config.bfhModalidad ? calculateBFHAmount(config.bfhModalidad) : 0) || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            handleConfigChange('bonusAmount', value);
                            // El monto a financiar se actualizará automáticamente por el efecto de effectiveLoanAmount
                          }}
                          placeholder="0"
                          min="0"
                          max={config.loanAmount}
                          readOnly={!!config.bfhModalidad}
                          className={config.bfhModalidad ? 'bg-gray-50' : ''}
                        />
                        {config.bfhModalidad && (
                          <p className="text-xs text-gray-500 mt-1">
                            Monto calculado según modalidad seleccionada
                          </p>
                        )}
                        {config.bonusAmount && config.bonusAmount > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Nuevo monto a financiar: {formatCurrency(Math.max(0, config.loanAmount - config.bonusAmount))}
                          </p>
                        )}
                      </FormField>
                    </>
                  )}
                </>
              )}
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
                    value={config.interestRate === 0 ? '' : config.interestRate}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleConfigChange('interestRate', v === '' ? 0 : (parseFloat(v) || 0));
                    }}
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
                  description: 'Otros gastos mensuales del cliente (NO incluye seguros ni comisiones, que se configuran por separado). Ejemplos: gastos de mantenimiento, servicios adicionales, etc.',
                  warning: 'Estos costos se suman a los seguros y comisiones para calcular el costo total mensual en la TCEA y VAN.'
                }}
                helpText="Se suman a seguros/comisiones para el cálculo total de TCEA y VAN"
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
                  value={config.discountRateAnnual === 0 ? '' : config.discountRateAnnual}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleConfigChange('discountRateAnnual', v === '' ? 0 : (parseFloat(v) || 0));
                  }}
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

          {/* Seguros y Comisiones */}
          <Card>
            <CardHeader>
              <CardTitle>Seguros y Comisiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Seguro de Desgravamen - Tasa mensual (%)"
                  helpTooltip={{
                    title: "Seguro de desgravamen",
                    description: "Tasa mensual de seguro de desgravamen. Se calcula sobre el saldo del préstamo.",
                    example: "0.15% mensual"
                  }}
                >
                  <Input
                    type="number"
                    step="0.0001"
                    value={config.insuranceLifeRate ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const rate = value === '' ? undefined : (value ? parseFloat(value) : undefined);
                      handleConfigChange('insuranceLifeRate', rate);
                    }}
                    placeholder="0.15"
                    min="0"
                  />
                </FormField>

                <FormField
                  label="Seguro de Desgravamen - Monto mensual"
                  helpText="Se calcula automáticamente: Saldo × Tasa"
                >
                  <Input
                    type="number"
                    value={config.insuranceLifeAmount ?? 0}
                    readOnly
                    className="bg-gray-50"
                    placeholder="0"
                  />
                </FormField>

                <FormField
                  label="Seguro de Inmueble - Tasa anual (%)"
                  helpTooltip={{
                    title: "Seguro de inmueble",
                    description: "Tasa anual de seguro de inmueble. Se divide entre 12 para obtener el monto mensual.",
                    example: "0.25% anual"
                  }}
                >
                  <Input
                    type="number"
                    step="0.0001"
                    value={config.insurancePropertyRate ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const rate = value === '' ? undefined : (value ? parseFloat(value) : undefined);
                      handleConfigChange('insurancePropertyRate', rate);
                    }}
                    placeholder="0.25"
                    min="0"
                  />
                </FormField>

                <FormField
                  label="Seguro de Inmueble - Monto mensual"
                  helpText="Se calcula automáticamente: Precio × Tasa anual ÷ 12"
                >
                  <Input
                    type="number"
                    value={config.insurancePropertyAmount ?? 0}
                    readOnly
                    className="bg-gray-50"
                    placeholder="0"
                  />
                </FormField>

                <FormField
                  label="Comisión de Evaluación"
                  helpTooltip={{
                    title: "Comisión de evaluación",
                    description: "Comisión única que se cobra al evaluar el crédito.",
                    example: "S/ 500.00"
                  }}
                >
                  <Input
                    type="number"
                    value={config.commissionEvaluation || ''}
                    onChange={(e) => handleConfigChange('commissionEvaluation', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                  />
                </FormField>

                <FormField
                  label="Comisión de Desembolso"
                  helpTooltip={{
                    title: "Comisión de desembolso",
                    description: "Comisión única que se cobra al desembolsar el crédito.",
                    example: "S/ 300.00"
                  }}
                >
                  <Input
                    type="number"
                    value={config.commissionDisbursement || ''}
                    onChange={(e) => handleConfigChange('commissionDisbursement', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                  />
                </FormField>

                <FormField
                  label="Gastos Administrativos Mensuales"
                  helpTooltip={{
                    title: "Gastos administrativos",
                    description: "Gastos administrativos mensuales (portes, mantenimiento de cuenta, etc.).",
                    example: "S/ 50.00"
                  }}
                >
                  <Input
                    type="number"
                    value={config.administrativeFees || ''}
                    onChange={(e) => handleConfigChange('administrativeFees', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    min="0"
                  />
                </FormField>
              </div>
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
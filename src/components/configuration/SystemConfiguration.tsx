import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigation } from '../shared/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Screen } from '../../App';
import { 
  Settings, Save, RotateCcw,
  DollarSign, Download, Upload, Database
} from 'lucide-react';
import { configService } from '../../services/configService';
import { toast } from 'sonner';

interface ConfigurationProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

type FinancialSettingsState = {
  defaultCurrency: 'PEN' | 'USD';
  defaultInterestRate: number;
  defaultTermYears: number;
  defaultDownPayment: number;
  enableGracePeriod: boolean;
  enableStateBonus: boolean;
  defaultDiscountRateAnnual?: number;
};

export function SystemConfiguration({ onNavigate, onLogout }: ConfigurationProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'SimulaCredit Inmobiliaria',
    companyRuc: '20123456789',
    companyEmail: 'contacto@simulacredit.com',
    systemLanguage: 'es'
  });

  // Financial Settings State
  const [financialSettings, setFinancialSettings] = useState<FinancialSettingsState>({
    defaultCurrency: 'PEN',
    defaultInterestRate: 8.5,
    defaultTermYears: 20,
    defaultDownPayment: 20,
    enableGracePeriod: true,
    enableStateBonus: true,
    defaultDiscountRateAnnual: 8.0
  });

  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [savingFinancial, setSavingFinancial] = useState(false);

  // Función helper para limpiar mensajes de error y evitar mostrar localhost
  const getErrorMessage = (error: any): string => {
    if (!error) return "Ha ocurrido un error";

    let message = error.message || String(error);

    // Remover referencias a localhost, URLs y detalles técnicos
    message = message.replace(/https?:\/\/[^\s]+/g, "");
    message = message.replace(/localhost[^\s]*/gi, "");
    message = message.replace(/fetch failed/gi, "");
    message = message.replace(/network error/gi, "");
    message = message.replace(/Failed to fetch/gi, "");

    // Limpiar espacios múltiples
    message = message.replace(/\s+/g, " ").trim();

    // Si el mensaje está vacío o es muy técnico, usar un mensaje genérico
    if (!message || message.length < 3) {
      return "Ha ocurrido un error. Por favor, intente nuevamente.";
    }

    return message;
  };

  // Cargar configuración financiera desde DB
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingFinancial(true);
        const config = await configService.getFirst();
        if (config) {
          setFinancialSettings(prev => ({
            ...prev,
            defaultCurrency: (config.default_currency ?? 'PEN') as 'PEN' | 'USD',
            defaultInterestRate: config.default_interest_rate ?? prev.defaultInterestRate,
            defaultTermYears: config.default_term_years ?? prev.defaultTermYears,
            defaultDownPayment: config.default_down_payment ?? prev.defaultDownPayment,
            enableGracePeriod: config.enable_grace_period ?? prev.enableGracePeriod,
            enableStateBonus: config.enable_state_bonus ?? prev.enableStateBonus,
            defaultDiscountRateAnnual: config.default_discount_rate_annual ?? prev.defaultDiscountRateAnnual,
          }));
        }
      } catch (err) {
        console.error('Error cargando system_config:', err);
      } finally {
        setLoadingFinancial(false);
      }
    };
    loadConfig();
  }, []);

  const handleSaveSettings = async (category: string) => {
    if (category === 'financiero') {
      // Leer estados para evitar race conditions y silenciar warnings
      if (savingFinancial || loadingFinancial) {
        console.warn('Guardado ignorado: proceso en curso o configuración cargando');
        return;
      }
      try {
        setSavingFinancial(true);
        await configService.upsertFinancialSettings({
          default_currency: financialSettings.defaultCurrency,
          default_interest_rate: financialSettings.defaultInterestRate,
          default_term_years: financialSettings.defaultTermYears,
          default_down_payment: financialSettings.defaultDownPayment,
          enable_grace_period: financialSettings.enableGracePeriod,
          enable_state_bonus: financialSettings.enableStateBonus,
          default_discount_rate_annual: financialSettings.defaultDiscountRateAnnual,
        });
        
        // Invalidar caché de React Query para que todos los componentes se actualicen
        await queryClient.invalidateQueries({ queryKey: ['system_config'] });
        
        toast.success('Configuración financiera guardada exitosamente', {
          description: 'Los cambios se aplicarán inmediatamente en el simulador.',
        });
      } catch (err: any) {
        console.error('Error guardando configuración financiera:', err);
        const errorMessage = getErrorMessage(err);
        toast.error('No se pudo guardar configuración financiera', {
          description: errorMessage || 'Revisar permisos (solo admin)',
        });
      } finally {
        setSavingFinancial(false);
      }
      return;
    }
    console.log(`Guardando configuración de ${category}`);
    toast.success(`Configuración de ${category} guardada exitosamente`);
  };

  const handleResetSettings = (category: string) => {
    if (confirm(`¿Está seguro de restablecer la configuración de ${category}?`)) {
      console.log(`Restableciendo configuración de ${category}`);
      toast.success(`Configuración de ${category} restablecida`);
    }
  };

  const handleExportSettings = () => {
    toast.info('Exportando configuración del sistema...');
  };

  const handleImportSettings = () => {
    toast.info('Importando configuración del sistema...');
  };

  return (
    <div>
      <Navigation currentScreen="config" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Configuración del Sistema</h1>
            <p className="text-gray-600">Administre la configuración y parámetros del sistema</p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button onClick={handleExportSettings} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleImportSettings} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <CardTitle>Configuración General</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nombre de la Empresa</Label>
                      <Input
                        id="company-name"
                        value={generalSettings.companyName}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-ruc">RUC</Label>
                      <Input
                        id="company-ruc"
                        value={generalSettings.companyRuc}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyRuc: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Email Corporativo</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={generalSettings.companyEmail}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Idioma del Sistema</Label>
                      <Select value={generalSettings.systemLanguage} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, systemLanguage: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => handleResetSettings('general')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restablecer
                  </Button>
                  <Button onClick={() => handleSaveSettings('general')} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Settings */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <CardTitle>Configuración Financiera</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg">Parámetros por Defecto</h3>
                    
                    <div className="space-y-2">
                      <Label>Moneda Predeterminada</Label>
                      <Select value={financialSettings.defaultCurrency} onValueChange={(value) => setFinancialSettings(prev => ({ ...prev, defaultCurrency: value as 'PEN' | 'USD' }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEN">Soles (PEN)</SelectItem>
                          <SelectItem value="USD">Dólares (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-rate">Tasa de Interés (%)</Label>
                      <Input
                        id="default-rate"
                        type="number"
                        step="0.1"
                        value={financialSettings.defaultInterestRate}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, defaultInterestRate: parseFloat(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-term">Plazo Predeterminado (años)</Label>
                      <Input
                        id="default-term"
                        type="number"
                        value={financialSettings.defaultTermYears}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, defaultTermYears: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-down">Cuota Inicial (%)</Label>
                      <Input
                        id="default-down"
                        type="number"
                        value={financialSettings.defaultDownPayment}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, defaultDownPayment: parseFloat(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-discount-rate">Tasa de Descuento Anual - COK (%)</Label>
                      <Input
                        id="default-discount-rate"
                        type="number"
                        step="0.01"
                        value={financialSettings.defaultDiscountRateAnnual ?? ''}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, defaultDiscountRateAnnual: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        placeholder="8.0"
                      />
                      <p className="text-xs text-gray-500">
                        Tasa de descuento anual (COK) para cálculos de VAN y TIR
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg">Opciones Especiales</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-grace">Habilitar Período de Gracia</Label>
                      <Switch
                        id="enable-grace"
                        checked={financialSettings.enableGracePeriod}
                        onCheckedChange={(checked) => setFinancialSettings(prev => ({ ...prev, enableGracePeriod: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-bonus">Habilitar Bono Techo Propio</Label>
                      <Switch
                        id="enable-bonus"
                        checked={financialSettings.enableStateBonus}
                        onCheckedChange={(checked) => setFinancialSettings(prev => ({ ...prev, enableStateBonus: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => handleResetSettings('financiero')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restablecer
                  </Button>
                  <Button onClick={() => handleSaveSettings('financiero')} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <CardTitle>Configuración del Sistema</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg">Respaldos</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-backup">Habilitar Respaldos Automáticos</Label>
                      <Switch id="enable-backup" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Frecuencia de Respaldo</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Cada hora</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg">Seguridad</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-audit">Habilitar Log de Auditoría</Label>
                      <Switch id="enable-audit" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        defaultValue="60"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => handleResetSettings('sistema')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restablecer
                  </Button>
                  <Button onClick={() => handleSaveSettings('sistema')} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
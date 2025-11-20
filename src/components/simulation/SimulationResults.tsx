import { useEffect, useState } from "react";
import { Navigation } from "../shared/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Screen, Property, LoanConfig, SimulationResult } from "../../App";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Save,
  Calculator,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Mail,
  Loader2,
} from "lucide-react";
import { HelpTooltip } from "../help/HelpTooltip";
import { SuccessAlert } from "../help/SuccessAlert";
import { simulationService } from "../../services/simulationService";
import { clientService } from "../../services/clientService";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  exportSimulationToPDF,
  exportSimulationToExcel,
} from "../../utils/exportUtils";

interface SimulationResultsProps {
  result: SimulationResult;
  config: LoanConfig;
  property: Property | null;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function SimulationResults({
  result,
  config,
  property,
  onNavigate,
  onLogout,
}: SimulationResultsProps) {
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [saveSuccessClientName, setSaveSuccessClientName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const rowsToShow = showAllRows
    ? result.amortizationTable
    : result.amortizationTable.slice(0, 12);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getAll();
        setClients(data.map((c) => ({ id: c.id, name: c.name })));
        // Preseleccionar desde sessionStorage si existe
        try {
          const storedId = sessionStorage.getItem("selectedClientId");
          if (storedId) {
            setSelectedClientId(storedId);
          }
        } catch (e) {
          // ignorar
        }
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }
    };
    loadClients();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatPercentage = (value: number, decimals: number = 2) => {
    return `${value.toFixed(decimals)}%`;
  };

  const handleDownloadPDF = async () => {
    try {
      const clientName = clients.find((c) => c.id === selectedClientId)?.name;
      await exportSimulationToPDF({
        clientName,
        propertyName: property?.name || null,
        config: {
          loanAmount: config.loanAmount,
          interestRate: config.interestRate,
          termYears: config.termYears,
        },
        result,
      });
    } catch (err: any) {
      console.error("Error generando PDF:", err);
      const errorMessage = err?.message?.replace(/https?:\/\/[^\s]+/g, "").replace(/localhost[^\s]*/gi, "").trim() || "intente nuevamente";
      toast.error("Error generando PDF", {
        description: errorMessage,
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const clientName = clients.find((c) => c.id === selectedClientId)?.name;
      await exportSimulationToExcel({
        clientName,
        propertyName: property?.name || null,
        config: {
          loanAmount: config.loanAmount,
          interestRate: config.interestRate,
          termYears: config.termYears,
        },
        result,
      });
    } catch (err: any) {
      console.error("Error exportando Excel:", err);
      const errorMessage = err?.message?.replace(/https?:\/\/[^\s]+/g, "").replace(/localhost[^\s]*/gi, "").trim() || "intente nuevamente";
      toast.error("Error exportando Excel", {
        description: errorMessage,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSimulation = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!selectedClientId) {
        setSaveError("Seleccione un cliente para asociar la simulación.");
        setSaving(false);
        return;
      }
      await simulationService.create({
        clientId: selectedClientId,
        propertyId: property?.id || null,
        entityId: config.entityId || null,
        config,
        result,
      });
      const clientName = clients.find((c) => c.id === selectedClientId)?.name || null;
      setSaveSuccessClientName(clientName);
      setShowSaveSuccess(true);
      setSaving(false);
      setTimeout(() => setShowSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error al guardar simulación:", err);
      setSaveError(
        `Error al guardar la simulación: ${
          err?.message || "intente nuevamente"
        }`
      );
      setSaving(false);
    }
  };

  const handleNewSimulation = () => {
    onNavigate("simulator");
  };

  const handleSendEmail = () => {
    const email = prompt("Ingrese el email del cliente:");
    if (email) {
      setShowEmailSuccess(true);
      setTimeout(() => setShowEmailSuccess(false), 3000);
    }
  };

  // Tipado explícito para los tooltips de indicadores financieros
  interface IndicatorTooltipSpec {
    title: string;
    description: string;
    example?: string;
    range?: string;
    warning?: string;
  }

  const summaryItems = [
    {
      label: "TCEA",
      value: formatPercentage(result.tcea),
      description: "Tasa de Costo Efectivo Anual",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "TREA",
      value: formatPercentage(result.trea),
      description: "Tasa de Rendimiento Efectivo Anual",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Monto Total",
      value: `${config.currency === "PEN" ? "S/" : "$"} ${formatCurrency(
        result.totalAmount
      )}`,
      description: "Total a pagar durante el crédito",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      label: "Total Intereses",
      value: `${config.currency === "PEN" ? "S/" : "$"} ${formatCurrency(
        result.totalInterest
      )}`,
      description: "Total de intereses a pagar",
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  const financialIndicators: {
    label: string;
    value: string;
    tooltip: IndicatorTooltipSpec;
  }[] = [
    {
      label: "VAN (Valor Actual Neto)",
      value: `${config.currency === "PEN" ? "S/" : "$"} ${formatCurrency(
        result.van
      )}`,
      tooltip: {
        title: "VAN",
        description:
          "Valor Actual Neto. Valor presente de flujos futuros del préstamo.",
        warning: "Si VAN > 0: El proyecto es rentable.",
      },
    },
    {
      label: "TIR (Tasa Interna de Retorno)",
      value: formatPercentage(result.tir),
      tooltip: {
        title: "TIR",
        description:
          "Tasa Interna de Retorno (TIR) expresada como TEA. Es la tasa que iguala el valor presente de todas las cuotas y costos con el monto del préstamo recibido.",
        warning: "Incluye todos los costos del crédito (intereses, seguros, comisiones)",
      },
    },
    {
      label: "Duración",
      value: `${result.duration.toFixed(2)} años`,
      tooltip: {
        title: "Duración",
        description:
          "Tiempo promedio ponderado de recuperación de los flujos de caja.",
        example: "Medida en años",
      },
    },
    {
      label: "Duración Modificada",
      value: `${result.modifiedDuration.toFixed(2)} años`,
      tooltip: {
        title: "Duración Modificada",
        description:
          "Sensibilidad del precio del bono a cambios en las tasas de interés.",
        example: "Expresada como porcentaje",
      },
    },
    {
      label: "Convexidad",
      value: result.convexity.toFixed(2),
      tooltip: {
        title: "Convexidad",
        description:
          "Medida de la curvatura de la relación precio-rendimiento.",
        warning: "Complementa a la duración modificada",
      },
    },
  ];

  return (
    <div>
      <Navigation
        currentScreen="simulator"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showEmailSuccess && (
          <div className="mb-6">
            <SuccessAlert
              title="✓ Simulación enviada por email"
              message="La simulación fue enviada correctamente"
              details="El cliente recibirá el detalle completo en su correo"
            />
          </div>
        )}

        {showSaveSuccess && (
          <div className="mb-6">
            <SuccessAlert
              title="✓ Simulación guardada"
              message="La simulación fue guardada correctamente"
              details={saveSuccessClientName ? `Cliente: ${saveSuccessClientName}` : undefined}
            />
          </div>
        )}

        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => onNavigate("simulator")}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al simulador</span>
          </Button>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">
                Resultados de la Simulación
              </h1>
              <p className="text-gray-600">
                Plan de pagos calculado para su crédito hipotecario
              </p>
              {property && (
                <p className="text-sm text-gray-500 mt-2">
                  Propiedad: {property.name} - {formatCurrency(property.price)}{" "}
                  {config.currency === "PEN" ? "S/" : "$"}
                </p>
              )}
            </div>
            <Badge className="bg-green-500 hover:bg-green-600 mt-4 md:mt-0">
              Simulación Completada
            </Badge>
          </div>
        </div>

        {/* Cuota mensual destacada */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Calculator className="w-8 h-8 mr-3" />
              <h2 className="text-2xl">Cuota Mensual</h2>
              <HelpTooltip
                title="Cuota Mensual"
                description="Monto fijo que el cliente debe pagar mensualmente durante todo el período del crédito."
                example={`${
                  config.currency === "PEN" ? "S/" : "$"
                } ${formatCurrency(result.monthlyPayment)}`}
                warning="Esta cuota incluye capital + intereses"
                className="ml-2 text-blue-100"
              />
            </div>
            <div className="text-5xl mb-2">
              {config.currency === "PEN" ? "S/" : "$"}{" "}
              {formatCurrency(result.monthlyPayment)}
            </div>
            <p className="text-blue-100">
              Por {config.termYears} años • {config.termYears * 12} cuotas
            </p>
          </CardContent>
        </Card>

        {/* Panel Superior - Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm text-gray-600">{item.label}</p>
                        <HelpTooltip
                          title={item.label}
                          description={item.description}
                          example={item.value}
                        />
                      </div>
                      <p className="text-xl text-gray-900 mb-2">{item.value}</p>
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Indicadores Financieros */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CardTitle>Indicadores Financieros</CardTitle>
                  <HelpTooltip
                    title="Indicadores Financieros"
                    description="Métricas que evalúan la rentabilidad y riesgo del crédito hipotecario."
                    warning="Estos valores ayudan a tomar decisiones informadas"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialIndicators.map((indicator, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {indicator.label}:
                        </span>
                        <HelpTooltip
                          title={indicator.tooltip.title}
                          description={indicator.tooltip.description}
                          example={indicator.tooltip.example}
                          range={indicator.tooltip.range}
                          warning={indicator.tooltip.warning}
                        />
                      </div>
                      <span className="text-gray-900">{indicator.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Asignar a Cliente
                  </label>
                  <Select
                    value={selectedClientId}
                    onValueChange={(v) => {
                      setSelectedClientId(v);
                      try {
                        sessionStorage.setItem("selectedClientId", v);
                      } catch (e) {}
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          clients.length
                            ? "Selecciona un cliente"
                            : "Cargando clientes..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    La simulación se guardará vinculada al cliente seleccionado.
                  </p>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </Button>
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </Button>
                <Button
                  onClick={handleSendEmail}
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por correo</span>
                </Button>
                <Button
                  onClick={handleSaveSimulation}
                  variant="outline"
                  disabled={saving}
                  className="w-full flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Simulación</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleNewSimulation}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Nueva Simulación</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Amortización */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle>Tabla de Amortización</CardTitle>
                    <HelpTooltip
                      title="Tabla de Amortización"
                      description="Detalle mes a mes del pago del crédito, mostrando capital, intereses y saldo pendiente."
                      example="Primeros 12 períodos del cronograma"
                      warning="Esta tabla muestra solo los primeros períodos"
                    />
                  </div>
                  <Badge variant="outline">Primeros 12 períodos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Período</TableHead>
                        <TableHead className="text-center">Fecha</TableHead>
                        <TableHead className="text-right">
                          Saldo Inicial
                        </TableHead>
                        <TableHead className="text-right">Interés</TableHead>
                        <TableHead className="text-right">Cuota</TableHead>
                        <TableHead className="text-right">
                          Amortización
                        </TableHead>
                        <TableHead className="text-right">
                          Saldo Final
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsToShow.map((row, index) => (
                        <TableRow
                          key={index}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <TableCell className="text-center">
                            {row.period}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {row.date}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {config.currency === "PEN" ? "S/" : "$"}{" "}
                            {formatCurrency(row.initialBalance)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-red-600">
                            {config.currency === "PEN" ? "S/" : "$"}{" "}
                            {formatCurrency(row.interest)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {config.currency === "PEN" ? "S/" : "$"}{" "}
                            {formatCurrency(row.payment)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-green-600">
                            {config.currency === "PEN" ? "S/" : "$"}{" "}
                            {formatCurrency(row.amortization)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {config.currency === "PEN" ? "S/" : "$"}{" "}
                            {formatCurrency(row.finalBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {result.amortizationTable.length > 12 && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllRows(!showAllRows)}
                    >
                      {showAllRows
                        ? `Mostrar solo primeros 12 meses (${result.amortizationTable.length} total)`
                        : `Mostrar tabla completa (${result.amortizationTable.length} meses)`}
                    </Button>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Resumen de la Tabla
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Períodos:</span>
                      <div className="text-blue-800">
                        {result.amortizationTable.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cuota Promedio:</span>
                      <div className="text-blue-800">
                        {config.currency === "PEN" ? "S/" : "$"}{" "}
                        {formatCurrency(result.monthlyPayment)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Intereses:</span>
                      <div className="text-red-600">
                        {config.currency === "PEN" ? "S/" : "$"}{" "}
                        {formatCurrency(result.totalInterest)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Monto Financiado:</span>
                      <div className="text-green-600">
                        {config.currency === "PEN" ? "S/" : "$"}{" "}
                        {formatCurrency(config.loanAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
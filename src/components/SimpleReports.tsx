import { useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Screen } from "../App";
import {
  Download,
  FileSpreadsheet,
  Building,
  Calculator,
  DollarSign,
  Eye,
  BarChart3,
  PieChart,
  Loader2,
  Users,
} from "lucide-react";
import { simulationService } from "../services/simulationService";
import { clientService } from "../services/clientService";
import { propertyService } from "../services/propertyService";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { exportReportsToPDF, exportReportsToExcel } from "../utils/exportUtils";

interface ReportsProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function SimpleReports({ onNavigate, onLogout }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [simulations, setSimulations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSim, setViewSim] = useState<any | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completada", className: "bg-green-500" },
      pending: { label: "Pendiente", className: "bg-yellow-500" },
      archived: { label: "Archivada", className: "bg-gray-500" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar simulaciones, clientes y propiedades
      const [simsData, clientsData, propertiesData] = await Promise.all([
        simulationService.getAll(),
        clientService.getAll(),
        propertyService.getAll(),
      ]);

      setSimulations(simsData);
      setClients(clientsData);
      setProperties(propertiesData);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos para reportes");
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: string) => {
    const periodMap: Record<string, string> = {
      week: "Última semana",
      month: "Último mes",
      quarter: "Último trimestre",
      year: "Último año",
    };
    const periodLabel = periodMap[selectedPeriod] || selectedPeriod;
    try {
      if (format === "pdf") {
        await exportReportsToPDF({ recentSimulations, topClients, periodLabel });
      } else if (format === "excel") {
        await exportReportsToExcel({ recentSimulations, topClients, periodLabel });
      }
    } catch (err: any) {
      console.error("Error exportando reporte:", err);
      alert(`Error exportando reporte: ${err?.message || "intente nuevamente"}`);
    }
  };

  // Procesar datos reales
  const recentSimulations = simulations.slice(0, 10).map((sim) => {
    const client = clients.find((c) => c.id === sim.client_id);
    const property = properties.find((p) => p.id === sim.property_id);
    return {
      id: sim.id,
      client: client?.name || "Cliente no especificado",
      property: property?.name || "Propiedad no especificada",
      amount: sim.loan_amount || 0,
      date: sim.created_at
        ? new Date(sim.created_at).toISOString().split("T")[0]
        : "",
      status: "completed",
    };
  });

  // Calcular top clients basado en simulaciones reales
  const clientSimulationCounts = simulations.reduce((acc: any, sim) => {
    const clientId = sim.client_id;
    if (clientId) {
      if (!acc[clientId]) {
        acc[clientId] = { count: 0, totalAmount: 0 };
      }
      acc[clientId].count++;
      acc[clientId].totalAmount += sim.loan_amount || 0;
    }
    return acc;
  }, {});

  const topClients = clients
    .map((client) => ({
      id: client.id,
      name: client.name,
      simulations: clientSimulationCounts[client.id]?.count || 0,
      loans: clientSimulationCounts[client.id]?.count || 0, // provisional: contamos simulaciones como créditos
      amount: clientSimulationCounts[client.id]?.totalAmount || 0,
    }))
    .sort((a, b) => b.simulations - a.simulations)
    .slice(0, 5);

  const openViewSimulation = (id: string) => {
    const sim = simulations.find((s) => s.id === id);
    if (!sim) return;
    setViewSim(sim);
    setViewOpen(true);
  };

  return (
    <div>
      <Navigation
        currentScreen="reports"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Reportes y Estadísticas
            </h1>
            <p className="text-gray-600">
              Análisis detallado del sistema de simulaciones
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando datos...</span>
            </div>
          )}

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleExportReport("pdf")}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={() => handleExportReport("excel")}
                variant="outline"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando reportes...</span>
          </div>
        ) : (
          <Tabs
            value={selectedReport}
            onValueChange={setSelectedReport}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen General</TabsTrigger>
              <TabsTrigger value="simulations">Simulaciones</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* KPIs principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Total Simulaciones
                        </p>
                        <p className="text-2xl text-gray-900">
                          {simulations.length}
                        </p>
                        <div className="flex items-center mt-2">
                          <Calculator className="w-4 h-4 text-blue-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Simulaciones realizadas
                          </span>
                        </div>
                      </div>
                      <Calculator className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Clientes Registrados
                        </p>
                        <p className="text-2xl text-gray-900">
                          {clients.length}
                        </p>
                        <div className="flex items-center mt-2">
                          <Users className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Total clientes
                          </span>
                        </div>
                      </div>
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Propiedades Disponibles
                        </p>
                        <p className="text-2xl text-gray-900">
                          {properties.length}
                        </p>
                        <div className="flex items-center mt-2">
                          <Building className="w-4 h-4 text-purple-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Total propiedades
                          </span>
                        </div>
                      </div>
                      <Building className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Monto Promedio</p>
                        <p className="text-2xl text-gray-900">
                          {simulations.length > 0
                            ? formatCurrency(
                                simulations.reduce((sum, sim) => {
                                  return sum + (sim.loan_amount || 0);
                                }, 0) / simulations.length
                              )
                            : "S/ 0"}
                        </p>
                        <div className="flex items-center mt-2">
                          <DollarSign className="w-4 h-4 text-orange-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Promedio de préstamos
                          </span>
                        </div>
                      </div>
                      <DollarSign className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos simplificados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Simulaciones vs Créditos Aprobados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                        <p className="text-gray-600 mb-2">Análisis Mensual</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Junio: 67 simulaciones</span>
                            <span className="text-green-600">21 créditos</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mayo: 55 simulaciones</span>
                            <span className="text-green-600">16 créditos</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Abril: 61 simulaciones</span>
                            <span className="text-green-600">18 créditos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Tipo de Propiedad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <PieChart className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <p className="text-gray-600 mb-4">
                          Distribución Porcentual
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded"></div>
                              <span>Departamentos</span>
                            </div>
                            <span>65%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span>Casas</span>
                            </div>
                            <span>25%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                              <span>Townhouses</span>
                            </div>
                            <span>10%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="simulations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Simulaciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSimulations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-gray-500 py-8"
                          >
                            No hay simulaciones registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentSimulations.map((sim) => (
                          <TableRow key={sim.id}>
                            <TableCell>{sim.client}</TableCell>
                            <TableCell>{sim.property}</TableCell>
                            <TableCell>{formatCurrency(sim.amount)}</TableCell>
                            <TableCell>
                              {sim.date ? formatDate(sim.date) : "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(sim.status)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => openViewSimulation(sim.id)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Clientes por Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-center">
                          Simulaciones
                        </TableHead>
                        <TableHead className="text-center">Créditos</TableHead>
                        <TableHead className="text-right">
                          Monto Total
                        </TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topClients.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-gray-500 py-8"
                          >
                            No hay clientes con simulaciones
                          </TableCell>
                        </TableRow>
                      ) : (
                        topClients.map((client, index) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm text-blue-600">
                                    {index + 1}
                                  </span>
                                </div>
                                <span>{client.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {client.simulations}
                            </TableCell>
                            <TableCell className="text-center">
                              {client.loans}
                            </TableCell>
                            <TableCell className="text-right">
                              {client.amount > 0
                                ? formatCurrency(client.amount)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  client.simulations > 0 ? "default" : "secondary"
                                }
                              >
                                {client.simulations > 0 ? "Activo" : "Prospecto"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Modal de visualización de simulación */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Detalle de Simulación</DialogTitle>
                </DialogHeader>
                {viewSim ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Cliente</span>
                        <div className="text-gray-900">
                          {clients.find(c => c.id === viewSim.client_id)?.name || 'Cliente no especificado'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Propiedad</span>
                        <div className="text-gray-900">
                          {properties.find(p => p.id === viewSim.property_id)?.name || 'Propiedad no especificada'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Monto</span>
                        <div className="text-gray-900">{formatCurrency(viewSim.loan_amount || 0)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cuota Mensual</span>
                        <div className="text-gray-900">{formatCurrency(viewSim.monthly_payment || 0)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">TCEA</span>
                        <div className="text-gray-900">{(viewSim.tcea ?? 0).toFixed(2)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Plazo</span>
                        <div className="text-gray-900">{viewSim.term_years} años</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Creada el {viewSim.created_at ? formatDate(viewSim.created_at) : '-'}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Cargando...</div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Tabs>
        )}
      </div>
    </div>
  );
}

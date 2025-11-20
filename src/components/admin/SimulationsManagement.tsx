import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Navigation } from "../shared/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Calculator,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Filter,
} from "lucide-react";
import {
  SimulationDB,
  simulationService,
} from "../../services/simulationService";
import { Screen } from "../../App";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { financialEntityService } from "../../services/financialEntityService";
import { clientService } from "../../services/clientService";
import { propertyService } from "../../services/propertyService";

interface SimulationsManagementProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "badge-status-draft" },
  pending: { label: "Pendiente", className: "badge-status-pending" },
  approved: { label: "Aprobada", className: "badge-status-approved" },
  rejected: { label: "Rechazada", className: "badge-status-rejected" },
  active: { label: "Activa", className: "badge-status-active" },
  completed: { label: "Completada", className: "badge-status-completed" },
  cancelled: { label: "Cancelada", className: "badge-status-cancelled" },
};

export function SimulationsManagement({
  onNavigate,
  onLogout,
}: SimulationsManagementProps) {
  const [simulations, setSimulations] = useState<SimulationDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSimulation, setSelectedSimulation] =
    useState<SimulationDB | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SimulationDB["status"]>("pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [financialEntities, setFinancialEntities] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [simsData, entitiesData, clientsData, propertiesData] =
        await Promise.all([
          simulationService.getAll(),
          financialEntityService.getAll(),
          clientService.getAll(),
          propertyService.getAll(),
        ]);
      setSimulations(simsData);
      setFinancialEntities(entitiesData);
      setClients(clientsData);
      setProperties(propertiesData);
    } catch (err: any) {
      const errorMessage =
        err?.message?.replace(/https?:\/\/[^\s]+/g, "").replace(/localhost[^\s]*/gi, "").trim() ||
        "Error al cargar simulaciones";
      toast.error("Error al cargar simulaciones", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSimulations = simulations.filter((sim) => {
    if (filterStatus === "all") return true;
    return sim.status === filterStatus;
  });

  const handleViewSimulation = (simulation: SimulationDB) => {
    setSelectedSimulation(simulation);
    setViewDialogOpen(true);
  };

  const handleChangeStatus = (simulation: SimulationDB) => {
    setSelectedSimulation(simulation);
    setNewStatus(simulation.status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedSimulation) return;

    try {
      setUpdatingStatus(true);
      await simulationService.updateStatus(selectedSimulation.id, newStatus);
      await loadData();
      toast.success("Estado actualizado correctamente");
      setStatusDialogOpen(false);
      setSelectedSimulation(null);
    } catch (err: any) {
      const errorMessage =
        err?.message?.replace(/https?:\/\/[^\s]+/g, "").replace(/localhost[^\s]*/gi, "").trim() ||
        "Error al actualizar estado";
      toast.error("Error al actualizar estado", {
        description: errorMessage,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
    });
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "-";
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "-";
  };

  const getPropertyName = (propertyId: string | null) => {
    if (!propertyId) return "-";
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || "-";
  };

  const getEntityName = (entityId: string | null) => {
    if (!entityId) return "-";
    const entity = financialEntities.find((e) => e.id === entityId);
    return entity?.short_name || entity?.name || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando simulaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentScreen="simulations-management"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-6 h-6" />
                  <span>Gestión de Simulaciones</span>
                </CardTitle>
                <CardDescription>
                  Administra y cambia el estado de las simulaciones
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(statusLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredSimulations.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No hay simulaciones {filterStatus !== "all" ? `con estado "${statusLabels[filterStatus]?.label}"` : ""}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Plazo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSimulations.map((sim) => (
                      <TableRow key={sim.id} className="hover:bg-gray-50">
                        <TableCell>{getClientName(sim.client_id)}</TableCell>
                        <TableCell>{getPropertyName(sim.property_id)}</TableCell>
                        <TableCell>{getEntityName(sim.entity_id)}</TableCell>
                        <TableCell>{formatCurrency(sim.loan_amount)}</TableCell>
                        <TableCell>{sim.term_years} años</TableCell>
                        <TableCell>
                          <Badge
                            variant={undefined}
                            className={
                              statusLabels[sim.status]?.className ||
                              "bg-gray-500 text-white"
                            }
                          >
                            {statusLabels[sim.status]?.label || sim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sim.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSimulation(sim)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleChangeStatus(sim)}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para ver detalles */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Simulación</DialogTitle>
            <DialogDescription>
              Información completa de la simulación
            </DialogDescription>
          </DialogHeader>
          {selectedSimulation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cliente</p>
                  <p className="text-sm">{getClientName(selectedSimulation.client_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Propiedad</p>
                  <p className="text-sm">{getPropertyName(selectedSimulation.property_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Entidad Financiera</p>
                  <p className="text-sm">{getEntityName(selectedSimulation.entity_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge
                    variant={undefined}
                    className={
                      statusLabels[selectedSimulation.status]?.className ||
                      "bg-gray-500 text-white"
                    }
                  >
                    {statusLabels[selectedSimulation.status]?.label ||
                      selectedSimulation.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Monto del Préstamo</p>
                  <p className="text-sm">{formatCurrency(selectedSimulation.loan_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Plazo</p>
                  <p className="text-sm">{selectedSimulation.term_years} años</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tasa de Interés</p>
                  <p className="text-sm">{selectedSimulation.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cuota Mensual</p>
                  <p className="text-sm">{formatCurrency(selectedSimulation.monthly_payment)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">TCEA</p>
                  <p className="text-sm">{selectedSimulation.tcea.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                  <p className="text-sm">{formatDate(selectedSimulation.created_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cambiar estado */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Estado</DialogTitle>
            <DialogDescription>
              Seleccione el nuevo estado para esta simulación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={newStatus}
              onValueChange={(value) =>
                setNewStatus(value as SimulationDB["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={updatingStatus}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updatingStatus || newStatus === selectedSimulation?.status}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Estado"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


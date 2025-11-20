import { useState, useEffect } from "react";
import { Navigation } from "../shared/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Screen, Client } from "../../App";
import { Plus, Edit, Trash2, Loader2, Users, Calculator } from "lucide-react";
import { clientService } from "../../services/clientService";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";

interface ClientsListProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function ClientsList({ onNavigate, onLogout }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getAll();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar clientes");
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    sessionStorage.setItem("editingClient", JSON.stringify(client));
    onNavigate("client-edit");
  };

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      setDeletingId(clientToDelete.id);
      setError(null);
      await clientService.delete(clientToDelete.id);
      await loadClients();
    } catch (err: any) {
      setError(err.message || "Error al eliminar el cliente");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleSimulate = (client: Client) => {
    try {
      sessionStorage.setItem("selectedClientId", client.id);
    } catch (e) {
      // ignorar
    }
    // Llevar al usuario al catálogo de proyectos para seleccionar
    onNavigate("projects");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <Navigation
        currentScreen="clients"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Lista de Clientes</h1>
            <p className="text-gray-600">
              Gestiona los clientes registrados en el sistema
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => onNavigate("clients")} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando clientes...</span>
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No hay clientes registrados</p>
              <Button onClick={() => onNavigate("clients")}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar primer cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Clientes ({clients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Ingresos Mensuales</TableHead>
                      <TableHead>Ocupación</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>{client.dni}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          {formatCurrency(client.monthlyIncome)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.occupation}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {client.district}, {client.province}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimulate(client)}
                            >
                              <Calculator className="w-4 h-4 mr-1" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              disabled={deletingId === client.id}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(client)}
                              disabled={deletingId === client.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-gray-600">
          Esta acción no se puede deshacer. Se eliminará el cliente
          {clientToDelete ? ` "${clientToDelete.name}"` : ""} del sistema.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingId !== null}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-green-600 hover:bg-green-700"
            disabled={deletingId !== null}
          >
            {deletingId ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

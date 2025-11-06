import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Screen, Property } from "../App";
import {
  MapPin,
  Home,
  Calculator,
  Eye,
  Plus,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { propertyService } from "../services/propertyService";
import { Alert, AlertDescription } from "./ui/alert";
import { userService } from "../services/userService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface ProjectsCatalogProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onPropertySelect: (property: Property) => void;
  onSimulateForProperty: (property: Property) => void;
}

export function ProjectsCatalog({
  onNavigate,
  onLogout,
  onPropertySelect,
  onSimulateForProperty,
}: ProjectsCatalogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(
    null
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const {
    data: projects = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["properties-available"],
    queryFn: () => propertyService.getAvailable(),
  });

  useEffect(() => {
    const loadRole = async () => {
      try {
        const profile = await userService.getCurrentUserProfile();
        setUserProfile(profile);
        setIsAdmin(profile?.role === "admin");
      } catch (e) {
        setIsAdmin(false);
        setUserProfile(null);
      }
    };
    loadRole();
  }, []);

  const handleEdit = (property: Property) => {
    // Navegar al formulario de edición pasando la propiedad
    onNavigate("property-form" as Screen);
    // Guardar en sessionStorage para que PropertyForm pueda acceder
    sessionStorage.setItem("editingProperty", JSON.stringify(property));
  };

  const openDeleteDialog = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      setDeletingId(propertyToDelete.id);
      await propertyService.delete(propertyToDelete.id);
      await refetch();
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (err: any) {
      // El estado de error de react-query se maneja externamente; aquí podríamos notificar si se desea
    } finally {
      setDeletingId(null);
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

  return (
    <div>
      <Navigation
        currentScreen="projects"
        onNavigate={onNavigate}
        onLogout={onLogout}
        isAdmin={isAdmin}
        userProfile={userProfile}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Catálogo de Proyectos
            </h1>
            <p className="text-gray-600">
              Explora nuestros proyectos inmobiliarios disponibles
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => onNavigate("property-form" as Screen)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Propiedad</span>
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {(error as any)?.message || "Error al cargar propiedades"}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando propiedades...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No hay propiedades disponibles</p>
            {isAdmin && (
              <Button onClick={() => onNavigate("property-form" as Screen)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar primera propiedad
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Disponible
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{project.location}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio desde:</span>
                      <span className="text-gray-900">
                        {formatCurrency(project.priceFrom)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Área desde:</span>
                      <span className="text-gray-900">
                        {project.areaFrom} m²
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Home className="w-4 h-4" />
                        <span>{project.bedrooms} hab.</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{project.bathrooms} baños</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPropertySelect(project)}
                        className="flex-1 flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver detalles</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onSimulateForProperty(project)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Calculator className="w-4 h-4" />
                        <span>Simular</span>
                      </Button>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          className="flex-1 flex items-center justify-center space-x-1"
                          disabled={deletingId === project.id}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(project)}
                          className="flex-1 flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === project.id}
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>Eliminar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer. Se eliminará la propiedad
              {propertyToDelete ? ` "${propertyToDelete.name}"` : ""} del
              catálogo.
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
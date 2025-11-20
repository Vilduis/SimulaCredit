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
import { Building2, Plus, Edit, Trash2, Loader2, Check, X } from "lucide-react";
import {
  FinancialEntity,
  CreateFinancialEntityData,
  financialEntityService,
} from "../../services/financialEntityService";
import { Screen } from "../../App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { FinancialEntityForm } from "./FinancialEntityForm";
import { toast } from "sonner";

interface FinancialEntitiesManagementProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export function FinancialEntitiesManagement({
  onNavigate,
  onLogout,
}: FinancialEntitiesManagementProps) {
  void onNavigate;
  void onLogout;
  const [entities, setEntities] = useState<FinancialEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<FinancialEntity | null>(
    null
  );
  const [editingEntity, setEditingEntity] = useState<FinancialEntity | null>(
    null
  );
  const [formData, setFormData] = useState<CreateFinancialEntityData>({
    name: "",
    short_name: "",
    country: "PE",
    active: true,
    allowed_rate_types: ["effective", "nominal"],
    allowed_capitalizations: [
      "monthly",
      "bimonthly",
      "quarterly",
      "semiannual",
      "annual",
    ],
    min_down_payment: undefined,
    min_term_years: undefined,
    max_term_years: undefined,
    grace_allowed: true,
    grace_max_months: undefined,
    base_interest_rate: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const data = await financialEntityService.getAll();
      setEntities(data);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      toast.error("Error al cargar entidades financieras", {
        description: errorMessage,
      });
      console.error("Error al cargar entidades financieras:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      short_name: "",
      country: "PE",
      active: true,
      allowed_rate_types: ["effective", "nominal"],
      allowed_capitalizations: [
        "monthly",
        "bimonthly",
        "quarterly",
        "semiannual",
        "annual",
      ],
      min_down_payment: undefined,
      min_term_years: undefined,
      max_term_years: undefined,
      grace_allowed: true,
      grace_max_months: undefined,
      base_interest_rate: undefined,
      default_insurance_life_rate: undefined,
      default_insurance_property_rate: undefined,
      default_commission_evaluation: undefined,
      default_commission_disbursement: undefined,
      default_administrative_fees: undefined,
    });
  };

  const handleCreate = () => {
    setEditingEntity(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (entity: FinancialEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      short_name: entity.short_name || "",
      country: entity.country,
      active: entity.active,
      allowed_rate_types: entity.allowed_rate_types,
      allowed_capitalizations: entity.allowed_capitalizations,
      min_down_payment: entity.min_down_payment || undefined,
      min_term_years: entity.min_term_years || undefined,
      max_term_years: entity.max_term_years || undefined,
      grace_allowed: entity.grace_allowed,
      grace_max_months: entity.grace_max_months || undefined,
      base_interest_rate: entity.base_interest_rate || undefined,
      default_insurance_life_rate:
        entity.default_insurance_life_rate || undefined,
      default_insurance_property_rate:
        entity.default_insurance_property_rate || undefined,
      default_commission_evaluation:
        entity.default_commission_evaluation || undefined,
      default_commission_disbursement:
        entity.default_commission_disbursement || undefined,
      default_administrative_fees:
        entity.default_administrative_fees || undefined,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (entity: FinancialEntity) => {
    setEntityToDelete(entity);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entityToDelete) return;
    try {
      setDeletingId(entityToDelete.id);
      await financialEntityService.delete(entityToDelete.id);
      await loadEntities();
      toast.success("Entidad financiera eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setEntityToDelete(null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      toast.error("Error al eliminar entidad financiera", {
        description: errorMessage,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEntity) {
        await financialEntityService.update(editingEntity.id, formData);
        toast.success("Entidad financiera actualizada correctamente");
      } else {
        await financialEntityService.create(formData);
        toast.success("Entidad financiera creada correctamente");
      }

      setIsDialogOpen(false);
      setEditingEntity(null);
      resetForm();
      await loadEntities();
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      toast.error("Error al guardar entidad financiera", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRateType = (type: "effective" | "nominal") => {
    const current = formData.allowed_rate_types || [];
    if (current.includes(type)) {
      setFormData({
        ...formData,
        allowed_rate_types: current.filter((t) => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        allowed_rate_types: [...current, type],
      });
    }
  };

  const toggleCapitalization = (
    cap: "monthly" | "bimonthly" | "quarterly" | "semiannual" | "annual"
  ) => {
    const current = formData.allowed_capitalizations || [];
    if (current.includes(cap)) {
      setFormData({
        ...formData,
        allowed_capitalizations: current.filter((c) => c !== cap),
      });
    } else {
      setFormData({
        ...formData,
        allowed_capitalizations: [...current, cap],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando entidades financieras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentScreen="financial-entities"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulario de creación/edición */}
        {(isDialogOpen || editingEntity) && (
          <FinancialEntityForm
            formData={formData}
            setFormData={setFormData}
            isSubmitting={isSubmitting}
            editingEntity={editingEntity}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingEntity(null);
              resetForm();
            }}
            toggleRateType={toggleRateType}
            toggleCapitalization={toggleCapitalization}
          />
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-6 h-6" />
                  <span>Gestión de Entidades Financieras</span>
                </CardTitle>
                <CardDescription>
                  Administra bancos, cajas y otras entidades financieras del
                  sistema
                </CardDescription>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Entidad
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {entities.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No hay entidades financieras registradas
                </p>
                <Button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Entidad
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Nombre Corto
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        País
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Tasa Base
                      </th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{entity.name}</td>
                        <td className="p-3 text-gray-700">
                          {entity.short_name || "-"}
                        </td>
                        <td className="p-3 text-gray-700">{entity.country}</td>
                        <td className="p-3">
                          {entity.active ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 flex items-center w-fit">
                              <Check className="w-3 h-3 mr-1" />
                              Activa
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 flex items-center w-fit">
                              <X className="w-3 h-3 mr-1" />
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-700">
                          {entity.base_interest_rate
                            ? `${entity.base_interest_rate}%`
                            : "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(entity)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(entity)}
                              disabled={deletingId === entity.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingId === entity.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              {entityToDelete ? (
                <span>
                  ¿Seguro que deseas eliminar la entidad financiera{" "}
                  <strong>{entityToDelete.name}</strong>? Esta acción no se
                  puede deshacer.
                </span>
              ) : (
                "¿Seguro que deseas eliminar esta entidad financiera?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletingId !== null}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

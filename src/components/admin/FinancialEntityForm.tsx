import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Loader2, X, Plus, Save } from "lucide-react";
import {
  CreateFinancialEntityData,
  FinancialEntity,
} from "../../services/financialEntityService";

interface FinancialEntityFormProps {
  formData: CreateFinancialEntityData;
  setFormData: React.Dispatch<React.SetStateAction<CreateFinancialEntityData>>;
  isSubmitting: boolean;
  editingEntity: FinancialEntity | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  toggleRateType: (type: "effective" | "nominal") => void;
  toggleCapitalization: (
    cap: "monthly" | "bimonthly" | "quarterly" | "semiannual" | "annual"
  ) => void;
}

export function FinancialEntityForm({
  formData,
  setFormData,
  isSubmitting,
  editingEntity,
  onSubmit,
  onCancel,
  toggleRateType,
  toggleCapitalization,
}: FinancialEntityFormProps) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {editingEntity
                ? "Editar Entidad Financiera"
                : "Nueva Entidad Financiera"}
            </CardTitle>
            <CardDescription>
              {editingEntity
                ? "Actualiza la información de la entidad financiera"
                : "Registra una nueva entidad financiera (banco, caja, etc.)"}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="rates">Configuración de Tasas</TabsTrigger>
              <TabsTrigger value="terms">Términos y Condiciones</TabsTrigger>
              <TabsTrigger value="insurance">Seguros y Comisiones</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nombre *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Banco de Crédito del Perú"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="short_name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nombre Corto
                  </Label>
                  <Input
                    id="short_name"
                    value={formData.short_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, short_name: e.target.value })
                    }
                    placeholder="BCP"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="country"
                    className="text-sm font-medium text-gray-700"
                  >
                    País
                  </Label>
                  <Input
                    id="country"
                    value={formData.country || "PE"}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="PE"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="base_interest_rate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tasa de Interés Base (%)
                  </Label>
                  <Input
                    id="base_interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.base_interest_rate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_interest_rate: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="8.50"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked as boolean })
                  }
                />
                <Label
                  htmlFor="active"
                  className="cursor-pointer text-sm font-medium text-gray-700"
                >
                  Entidad activa
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Tipos de Tasa Permitidos
                </Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rate_effective"
                      checked={formData.allowed_rate_types?.includes(
                        "effective"
                      )}
                      onCheckedChange={() => toggleRateType("effective")}
                    />
                    <Label
                      htmlFor="rate_effective"
                      className="cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Efectiva
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rate_nominal"
                      checked={formData.allowed_rate_types?.includes("nominal")}
                      onCheckedChange={() => toggleRateType("nominal")}
                    />
                    <Label
                      htmlFor="rate_nominal"
                      className="cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Nominal
                    </Label>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Capitalizaciones Permitidas
                </Label>
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    "monthly",
                    "bimonthly",
                    "quarterly",
                    "semiannual",
                    "annual",
                  ].map((cap) => (
                    <div key={cap} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cap_${cap}`}
                        checked={formData.allowed_capitalizations?.includes(
                          cap as any
                        )}
                        onCheckedChange={() => toggleCapitalization(cap as any)}
                      />
                      <Label
                        htmlFor={`cap_${cap}`}
                        className="cursor-pointer text-sm font-medium text-gray-700"
                      >
                        {cap === "monthly"
                          ? "Mensual"
                          : cap === "bimonthly"
                          ? "Bimestral"
                          : cap === "quarterly"
                          ? "Trimestral"
                          : cap === "semiannual"
                          ? "Semestral"
                          : "Anual"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="min_down_payment"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cuota Inicial Mín. (%)
                  </Label>
                  <Input
                    id="min_down_payment"
                    type="number"
                    step="0.01"
                    value={formData.min_down_payment || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_down_payment: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="10.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="min_term_years"
                    className="text-sm font-medium text-gray-700"
                  >
                    Plazo Mín. (años)
                  </Label>
                  <Input
                    id="min_term_years"
                    type="number"
                    value={formData.min_term_years || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_term_years: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="max_term_years"
                    className="text-sm font-medium text-gray-700"
                  >
                    Plazo Máx. (años)
                  </Label>
                  <Input
                    id="max_term_years"
                    type="number"
                    value={formData.max_term_years || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_term_years: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Período de Gracia
                </Label>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="grace_allowed"
                      checked={formData.grace_allowed}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          grace_allowed: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="grace_allowed"
                      className="cursor-pointer text-sm font-medium text-gray-700"
                    >
                      Permite período de gracia
                    </Label>
                  </div>
                  {formData.grace_allowed && (
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor="grace_max_months"
                        className="text-sm font-medium text-gray-600"
                      >
                        Meses máx.:
                      </Label>
                      <Input
                        id="grace_max_months"
                        type="number"
                        className="w-20"
                        value={formData.grace_max_months || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            grace_max_months: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="12"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="default_insurance_life_rate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Seguro Desgravamen - Tasa mensual (%)
                  </Label>
                  <Input
                    id="default_insurance_life_rate"
                    type="number"
                    step="0.0001"
                    value={formData.default_insurance_life_rate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_insurance_life_rate: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="0.15"
                  />
                  <p className="text-xs text-gray-500">
                    Tasa mensual de seguro de desgravamen (ej: 0.15 = 0.15%)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="default_insurance_property_rate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Seguro Inmueble - Tasa anual (%)
                  </Label>
                  <Input
                    id="default_insurance_property_rate"
                    type="number"
                    step="0.0001"
                    value={formData.default_insurance_property_rate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_insurance_property_rate: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="0.25"
                  />
                  <p className="text-xs text-gray-500">
                    Tasa anual de seguro de inmueble (ej: 0.25 = 0.25%)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="default_commission_evaluation"
                    className="text-sm font-medium text-gray-700"
                  >
                    Comisión de Evaluación
                  </Label>
                  <Input
                    id="default_commission_evaluation"
                    type="number"
                    value={formData.default_commission_evaluation || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_commission_evaluation: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="500.00"
                  />
                  <p className="text-xs text-gray-500">
                    Comisión única por evaluación crediticia
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="default_commission_disbursement"
                    className="text-sm font-medium text-gray-700"
                  >
                    Comisión de Desembolso
                  </Label>
                  <Input
                    id="default_commission_disbursement"
                    type="number"
                    value={formData.default_commission_disbursement || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_commission_disbursement: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="300.00"
                  />
                  <p className="text-xs text-gray-500">
                    Comisión única por desembolso del crédito
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="default_administrative_fees"
                    className="text-sm font-medium text-gray-700"
                  >
                    Gastos Administrativos Mensuales
                  </Label>
                  <Input
                    id="default_administrative_fees"
                    type="number"
                    value={formData.default_administrative_fees || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_administrative_fees: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="50.00"
                  />
                  <p className="text-xs text-gray-500">
                    Gastos administrativos mensuales (portes, mantenimiento,
                    etc.)
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editingEntity ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Entidad
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

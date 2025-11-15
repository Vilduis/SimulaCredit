import { useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Screen, Client } from "../App";
import { Save, X, RotateCcw, List } from "lucide-react";
import { FormField } from "./help/FormField";
import { SuccessAlert } from "./help/SuccessAlert";
import { clientService } from "../services/clientService";

interface ClientRegistrationProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  editingClient?: Client | null;
}

export function ClientRegistrationWithHelp({
  onNavigate,
  onLogout,
  editingClient,
}: ClientRegistrationProps) {
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    email: "",
    monthlyIncome: "",
    occupation: "",
    maritalStatus: "",
    address: "",
    department: "",
    province: "",
    district: "",
  });

  const [validations, setValidations] = useState<
    Record<
      string,
      { level: "success" | "warning" | "error"; message: string } | null
    >
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // Reference loading to avoid TS6133 unused variable warning
  useEffect(() => {}, [loading]);

  useEffect(() => {
    // Primero intentar obtener de sessionStorage (para edición)
    let clientToEdit = editingClient;
    if (!clientToEdit) {
      try {
        const stored = sessionStorage.getItem("editingClient");
        if (stored) {
          clientToEdit = JSON.parse(stored);
          sessionStorage.removeItem("editingClient");
        }
      } catch (e) {
        // Ignorar error
      }
    }

    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || "",
        dni: clientToEdit.dni || "",
        phone: clientToEdit.phone || "",
        email: clientToEdit.email || "",
        monthlyIncome: clientToEdit.monthlyIncome?.toString() || "",
        occupation: clientToEdit.occupation || "",
        maritalStatus: clientToEdit.maritalStatus || "",
        address: clientToEdit.address || "",
        department: clientToEdit.department || "",
        province: clientToEdit.province || "",
        district: clientToEdit.district || "",
      });
    }
  }, [editingClient]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field: string, value: string) => {
    const newValidations = { ...validations };

    switch (field) {
      case "name":
        if (value.length < 2) {
          newValidations.name = {
            level: "error",
            message: "❌ El nombre debe tener al menos 2 caracteres",
          };
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          newValidations.name = {
            level: "error",
            message: "❌ El nombre solo puede contener letras",
          };
        } else {
          newValidations.name = {
            level: "success",
            message: "✓ Nombre válido",
          };
        }
        break;

      case "dni":
        if (!/^\d{8}$/.test(value)) {
          newValidations.dni = {
            level: "error",
            message: "❌ El DNI debe tener 8 dígitos",
          };
        } else {
          newValidations.dni = {
            level: "success",
            message: "✓ DNI verificado correctamente",
          };
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newValidations.email = {
            level: "error",
            message: "❌ Ingrese un email válido. Ejemplo: usuario@dominio.com",
          };
        } else {
          newValidations.email = {
            level: "success",
            message: "✓ Email válido",
          };
        }
        break;

      case "phone":
        if (!/^\d{9}$/.test(value)) {
          newValidations.phone = {
            level: "error",
            message: "❌ El teléfono debe tener 9 dígitos",
          };
        } else {
          newValidations.phone = {
            level: "success",
            message: "✓ Teléfono válido",
          };
        }
        break;

      case "monthlyIncome":
        const income = parseFloat(value);
        if (income < 930) {
          newValidations.monthlyIncome = {
            level: "error",
            message: "❌ El ingreso debe ser mayor al salario mínimo (S/ 930)",
          };
        } else if (income > 50000) {
          newValidations.monthlyIncome = {
            level: "warning",
            message: "⚠️ Ingreso muy alto. Verificar documentación",
          };
        } else {
          newValidations.monthlyIncome = {
            level: "success",
            message: "✓ Ingreso válido",
          };
        }
        break;

      default:
        newValidations[field] = null;
    }

    setValidations(newValidations);
  };

  const handleSave = async () => {
    // Check for errors
    const hasErrors = Object.values(validations).some(
      (v: any) => v?.level === "error"
    );
    if (hasErrors) {
      alert("Por favor corrija los errores antes de guardar");
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        name: formData.name,
        dni: formData.dni,
        phone: formData.phone,
        email: formData.email,
        monthlyIncome: parseFloat(formData.monthlyIncome) || 0,
        occupation: formData.occupation,
        maritalStatus: formData.maritalStatus,
        address: formData.address,
        department: formData.department,
        province: formData.province,
        district: formData.district,
      };

      // Verificar si estamos editando (obtener de sessionStorage si no viene en props)
      let clientToEdit = editingClient;
      if (!clientToEdit) {
        try {
          const stored = sessionStorage.getItem("editingClient");
          if (stored) {
            clientToEdit = JSON.parse(stored);
          }
        } catch (e) {
          // Ignorar
        }
      }

      if (clientToEdit) {
        // Actualizar cliente existente
        // Verificar si el DNI cambió y si ya existe
        if (formData.dni !== clientToEdit.dni) {
          const existingClient = await clientService.getByDni(formData.dni);
          if (existingClient) {
            alert(
              "Ya existe un cliente con este DNI. Por favor verifique el número."
            );
            setLoading(false);
            return;
          }
        }
        await clientService.update(clientToEdit.id, clientData);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onNavigate("clients-list");
        }, 2000);
      } else {
        // Verificar si el DNI ya existe
        const existingClient = await clientService.getByDni(formData.dni);
        if (existingClient) {
          alert(
            "Ya existe un cliente con este DNI. Por favor verifique el número."
          );
          setLoading(false);
          return;
        }

        // Crear nuevo cliente y persistir selección para simulación
        const created = await clientService.create(clientData);
        try {
          sessionStorage.setItem("selectedClientId", created.id);
        } catch (e) {
          // ignorar errores de almacenamiento
        }
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          handleClear();
        }, 5000);
      }
    } catch (error: any) {
      console.error("Error al guardar cliente:", error);
      alert(
        error.message ||
          "Error al guardar el cliente. Por favor intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      dni: "",
      phone: "",
      email: "",
      monthlyIncome: "",
      occupation: "",
      maritalStatus: "",
      address: "",
      department: "",
      province: "",
      district: "",
    });
    setValidations({});
  };

  return (
    <div>
      <Navigation
        currentScreen="clients"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              {formData.dni ? "Editar Cliente" : "Registro de Cliente"}
            </h1>
            <p className="text-gray-600">
              {formData.dni
                ? "Modifica los datos del cliente"
                : "Ingresa los datos del cliente para crear su perfil"}
            </p>
          </div>
          <Button
            onClick={() => onNavigate("clients-list")}
            className="bg-green-600 hover:bg-green-700"
          >
            <List className="w-4 h-4 mr-2" />
            Ver Lista
          </Button>
        </div>

        {showSuccess && (
          <SuccessAlert
            title="✓ Cliente registrado exitosamente"
            message="El cliente ha sido registrado en el sistema"
            details="¿Desea simular un crédito para este cliente?"
            primaryAction={{
              label: "Ir al Simulador",
              onClick: () => {
                setShowSuccess(false);
                onNavigate("simulator");
              },
            }}
            secondaryAction={{
              label: "Volver al inicio",
              onClick: () => {
                setShowSuccess(false);
                onNavigate("dashboard");
              },
            }}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Datos Personales</TabsTrigger>
                <TabsTrigger value="economic">
                  Datos Socioeconómicos
                </TabsTrigger>
                <TabsTrigger value="address">Dirección</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Nombre Completo"
                    required
                    helpTooltip={{
                      title: "Nombre completo",
                      description:
                        "Ingrese el nombre completo del cliente tal como aparece en su DNI.",
                      example: "Juan Carlos Pérez García",
                    }}
                    validation={validations.name}
                  >
                    <Input
                      placeholder="Ej: Juan Carlos Pérez García"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField
                    label="DNI"
                    required
                    helpTooltip={{
                      title: "Documento Nacional de Identidad",
                      description: "Número de DNI de 8 dígitos.",
                      example: "12345678",
                      range: "8 dígitos numéricos",
                    }}
                    validation={validations.dni}
                  >
                    <Input
                      placeholder="Ej: 12345678"
                      value={formData.dni}
                      onChange={(e) => handleInputChange("dni", e.target.value)}
                      maxLength={8}
                    />
                  </FormField>

                  <FormField
                    label="Teléfono"
                    required
                    helpTooltip={{
                      title: "Número de teléfono",
                      description:
                        "Número de teléfono móvil o fijo para contacto.",
                      example: "987654321",
                      range: "9 dígitos",
                    }}
                    validation={validations.phone}
                  >
                    <Input
                      placeholder="Ej: 987654321"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    required
                    helpTooltip={{
                      title: "Correo electrónico",
                      description:
                        "Dirección de correo electrónico válida para notificaciones.",
                      example: "juan.perez@email.com",
                    }}
                    validation={validations.email}
                  >
                    <Input
                      type="email"
                      placeholder="Ej: juan.perez@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="economic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Ingresos Mensuales (S/)"
                    required
                    helpTooltip={{
                      title: "Ingresos mensuales",
                      description:
                        "Ingreso mensual neto en soles. Incluya todos los ingresos comprobables.",
                      example: "S/ 5,000",
                      range: "Mínimo S/ 930 (salario mínimo)",
                    }}
                    validation={validations.monthlyIncome}
                    helpText="El monto a financiar debe ser mayor a S/ 10,000"
                  >
                    <Input
                      type="number"
                      placeholder="Ej: 5000"
                      value={formData.monthlyIncome}
                      onChange={(e) =>
                        handleInputChange("monthlyIncome", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField
                    label="Ocupación"
                    required
                    helpTooltip={{
                      title: "Ocupación",
                      description: "Profesión u ocupación actual del cliente.",
                      example: "Ingeniero, Contador, Docente",
                    }}
                  >
                    <Input
                      placeholder="Ej: Ingeniero, Contador, etc."
                      value={formData.occupation}
                      onChange={(e) =>
                        handleInputChange("occupation", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField
                    label="Estado Civil"
                    required
                    helpTooltip={{
                      title: "Estado civil",
                      description:
                        "Estado civil actual del cliente según documento de identidad.",
                    }}
                  >
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) =>
                        handleInputChange("maritalStatus", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado civil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="divorciado">
                          Divorciado(a)
                        </SelectItem>
                        <SelectItem value="viudo">Viudo(a)</SelectItem>
                        <SelectItem value="conviviente">Conviviente</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      label="Dirección"
                      required
                      helpTooltip={{
                        title: "Dirección de residencia",
                        description:
                          "Dirección completa de residencia actual del cliente.",
                        example: "Av. Ejemplo 123, Urb. Los Jardines",
                      }}
                    >
                      <Input
                        placeholder="Ej: Av. Ejemplo 123, Urb. Los Jardines"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Departamento"
                    required
                    helpTooltip={{
                      title: "Departamento",
                      description:
                        "Departamento del Perú donde reside el cliente.",
                    }}
                  >
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        handleInputChange("department", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lima">Lima</SelectItem>
                        <SelectItem value="arequipa">Arequipa</SelectItem>
                        <SelectItem value="trujillo">La Libertad</SelectItem>
                        <SelectItem value="cusco">Cusco</SelectItem>
                        <SelectItem value="piura">Piura</SelectItem>
                        <SelectItem value="callao">Callao</SelectItem>
                        <SelectItem value="lambayeque">Lambayeque</SelectItem>
                        <SelectItem value="junin">Junín</SelectItem>
                        <SelectItem value="ica">Ica</SelectItem>
                        <SelectItem value="ancash">Áncash</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label="Provincia"
                    required
                    helpTooltip={{
                      title: "Provincia",
                      description: "Provincia donde reside el cliente.",
                      example: "Lima, Arequipa, Trujillo",
                    }}
                  >
                    <Input
                      placeholder="Ej: Lima, Arequipa, etc."
                      value={formData.province}
                      onChange={(e) =>
                        handleInputChange("province", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField
                    label="Distrito"
                    required
                    helpTooltip={{
                      title: "Distrito",
                      description: "Distrito donde reside el cliente.",
                      example: "Miraflores, San Isidro, Surco",
                    }}
                  >
                    <Input
                      placeholder="Ej: Miraflores, San Isidro, etc."
                      value={formData.district}
                      onChange={(e) =>
                        handleInputChange("district", e.target.value)
                      }
                    />
                  </FormField>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpiar</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("dashboard")}
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cliente</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

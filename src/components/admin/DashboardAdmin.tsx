import { useState, useEffect } from "react";
import { Navigation } from "../shared/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Users,
  Building,
  Calculator,
  TrendingUp,
  DollarSign,
  Loader2,
  ShieldCheck,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { Screen } from "../../App";
import { clientService } from "../../services/clientService";
import { simulationService } from "../../services/simulationService";
import { propertyService } from "../../services/propertyService";
import { userService } from "../../services/userService";

interface DashboardAdminProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  isAdmin: boolean;
  userProfile: any;
}

export function DashboardAdmin({
  onNavigate,
  onLogout,
  isAdmin,
  userProfile: adminProfile,
}: DashboardAdminProps) {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSimulations: 0,
    totalProperties: 0,
    totalEmployees: 0,
    averageLoanAmount: 0,
    totalLoanAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [clients, simulations, properties, employees] = await Promise.all([
        clientService.getAll(),
        simulationService.getAll(),
        propertyService.getAll(),
        userService.getAll(),
      ]);

      const totalLoanAmount = simulations.reduce((sum: number, sim: any) => {
        return sum + (sim.loan_amount || 0);
      }, 0);

      const avgLoanAmount =
        simulations.length > 0 ? totalLoanAmount / simulations.length : 0;

      setStats({
        totalClients: clients.length,
        totalSimulations: simulations.length,
        totalProperties: properties.length,
        totalEmployees: employees.filter((e: any) => e.role === "user").length,
        averageLoanAmount: avgLoanAmount,
        totalLoanAmount: totalLoanAmount,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
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

  const adminQuickAccess = [
    {
      title: "Gestionar Empleados",
      description: "Registrar y administrar empleados del sistema",
      icon: ShieldCheck,
      action: () => onNavigate("user-management" as Screen),
      color: "bg-blue-600",
      borderColor: "border-blue-600",
    },
    {
      title: "Entidades Financieras",
      description: "Administrar bancos, cajas y entidades financieras",
      icon: Building,
      action: () => onNavigate("financial-entities" as Screen),
      color: "bg-indigo-600",
      borderColor: "border-indigo-600",
    },
    {
      title: "Reportes Globales",
      description: "Ver estadísticas y reportes de toda la empresa",
      icon: BarChart3,
      action: () => onNavigate("reports"),
      color: "bg-purple-500",
      borderColor: "border-purple-500",
    },
    {
      title: "Gestionar Propiedades",
      description: "Administrar catálogo de propiedades inmobiliarias",
      icon: Building,
      action: () => onNavigate("projects"),
      color: "bg-green-600",
      borderColor: "border-green-600",
    },
    {
      title: "Gestionar Simulaciones",
      description: "Administrar y cambiar estados de simulaciones",
      icon: Calculator,
      action: () => onNavigate("simulations-management" as Screen),
      color: "bg-orange-500",
      borderColor: "border-orange-500",
    },
  ];

  const statsData = [
    {
      title: "Total de Clientes",
      value: loading ? "..." : stats.totalClients.toString(),
      icon: Users,
      description: "Clientes registrados en el sistema",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total de Simulaciones",
      value: loading ? "..." : stats.totalSimulations.toString(),
      icon: Calculator,
      description: "Simulaciones realizadas",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Empleados Activos",
      value: loading ? "..." : stats.totalEmployees.toString(),
      icon: UserCheck,
      description: "Empleados registrados",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Propiedades Disponibles",
      value: loading ? "..." : stats.totalProperties.toString(),
      icon: Building,
      description: "Propiedades en catálogo",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Monto Total Prestado",
      value: loading ? "..." : formatCurrency(stats.totalLoanAmount),
      icon: DollarSign,
      description: "Suma total de préstamos simulados",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Monto Promedio",
      value: loading ? "..." : formatCurrency(stats.averageLoanAmount),
      icon: TrendingUp,
      description: "Promedio de préstamos simulados",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div>
      <Navigation
        currentScreen="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        isAdmin={isAdmin}
        userProfile={adminProfile}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Bienvenido, {adminProfile?.full_name || "Administrador"}
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Administrador
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Globales */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Estadísticas Globales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin inline" />
                          ) : (
                            stat.value
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stat.description}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${stat.bgColor} ml-4 shrink-0`}
                      >
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Acceso Rápido Administrativo */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Acceso Rápido Administrativo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminQuickAccess.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className={`hover:shadow-lg transition-all cursor-pointer border-2 ${item.borderColor} hover:opacity-90`}
                  onClick={item.action}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {item.title}
                      </CardTitle>
                      <div
                        className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-4 text-sm">
                      {item.description}
                    </p>
                    <Button
                      className={`w-full ${item.color} hover:opacity-90 text-white`}
                    >
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

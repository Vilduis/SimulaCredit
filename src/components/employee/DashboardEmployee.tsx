// removed default React import as it's unused
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../shared/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Users,
  Building,
  Calculator,
  FileText,
  DollarSign,
  Loader2,
  Plus,
  UserCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Screen } from "../../App";
import { clientService } from "../../services/clientService";
import { simulationService } from "../../services/simulationService";
import { propertyService } from "../../services/propertyService";

interface DashboardEmployeeProps {
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  isAdmin: boolean;
  userProfile: any;
}

export function DashboardEmployee({
  onNavigate,
  onLogout,
  isAdmin,
  userProfile: empleadoProfile,
}: DashboardEmployeeProps) {
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll(),
  });

  const { data: simulations = [], isLoading: loadingSimulations } = useQuery({
    queryKey: ["simulations"],
    queryFn: () => simulationService.getAll(),
  });

  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ["properties-available"],
    queryFn: () => propertyService.getAvailable(),
  });

  const loading = loadingClients || loadingSimulations || loadingProperties;

  // Filtrar solo las simulaciones de los últimos 30 días (en cliente para no tocar SQL)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSimulationsCount = simulations.filter((sim: any) => {
    const simDate = new Date(sim.created_at);
    return simDate >= thirtyDaysAgo;
  }).length;

  const averageAmount =
    simulations.length > 0
      ? simulations.reduce(
          (sum: number, sim: any) => sum + (sim.loan_amount || 0),
          0
        ) / simulations.length
      : 0;

  // Contar simulaciones por estado
  const simulationsByStatus = simulations.reduce((acc: any, sim: any) => {
    const status = sim.status || "draft";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const empleadoQuickAccess = [
    {
      title: "Registrar Cliente",
      description: "Registrar información de un nuevo cliente potencial",
      icon: Plus,
      action: () => onNavigate("clients"),
      color: "bg-blue-600",
    },
    {
      title: "Mis Clientes",
      description: "Ver y gestionar mis clientes registrados",
      icon: Users,
      action: () => onNavigate("clients-list" as Screen),
      color: "bg-blue-600",
    },
    {
      title: "Ver Proyectos",
      description: "Explorar catálogo de propiedades disponibles",
      icon: Building,
      action: () => onNavigate("projects"),
      color: "bg-green-600",
    },
    {
      title: "Simular Crédito",
      description: "Calcular plan de pagos para un cliente",
      icon: Calculator,
      action: () => onNavigate("simulator"),
      color: "bg-orange-500",
    },
    {
      title: "Mis Reportes",
      description: "Ver mis estadísticas y reportes",
      icon: FileText,
      action: () => onNavigate("reports"),
      color: "bg-purple-500",
    },
  ];

  const statsData = [
    {
      title: "Mis Clientes",
      value: loading ? "..." : clients.length.toString(),
      icon: Users,
      description: "Clientes que he registrado",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Mis Simulaciones",
      value: loading ? "..." : simulations.length.toString(),
      icon: Calculator,
      description: "Simulaciones que he realizado",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendientes",
      value: loading ? "..." : (simulationsByStatus.pending || 0).toString(),
      icon: Clock,
      description: "Simulaciones pendientes de evaluación",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Aprobadas",
      value: loading ? "..." : (simulationsByStatus.approved || 0).toString(),
      icon: CheckCircle2,
      description: "Simulaciones aprobadas",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Propiedades Disponibles",
      value: loading ? "..." : properties.length.toString(),
      icon: Building,
      description: "Propiedades en catálogo",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Monto Promedio",
      value: loading ? "..." : formatCurrency(averageAmount),
      icon: DollarSign,
      description: "Promedio de mis simulaciones",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div>
      <Navigation
        currentScreen="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        isAdmin={isAdmin}
        userProfile={empleadoProfile}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mi Panel de Trabajo
              </h1>
              <p className="text-gray-600">
                Bienvenido, {empleadoProfile?.full_name || "Empleado"}
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <UserCircle className="w-4 h-4 mr-2" />
                Asesor de Ventas
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Personales */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mis Estadísticas
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
                        className={`p-3 rounded-lg ${stat.bgColor} ml-4 flex-shrink-0`}
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

        {/* Acceso Rápido (estilo alineado al panel de admin) */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {empleadoQuickAccess.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300"
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
                    <Button className={`w-full ${item.color} hover:opacity-90`}>
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

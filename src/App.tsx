import { useState, useEffect, lazy, Suspense } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardAdmin } from "./components/DashboardAdmin";
import { DashboardEmpleado } from "./components/DashboardEmpleado";
import { ClientRegistrationWithHelp } from "./components/ClientRegistrationWithHelp";
import { ProjectsCatalog } from "./components/ProjectsCatalog";
import { PropertyDetail } from "./components/PropertyDetail";
import { LoanSimulatorWithHelp } from "./components/LoanSimulatorWithHelp";
// Lazy load de pantallas pesadas para mejorar primera carga
const SimulationResultsWithHelpLazy = lazy(() =>
  import("./components/SimulationResultsWithHelp").then((m) => ({
    default: m.SimulationResultsWithHelp,
  }))
);
const SimpleReportsLazy = lazy(() =>
  import("./components/SimpleReports").then((m) => ({
    default: m.SimpleReports,
  }))
);
import { SimpleConfiguration } from "./components/SimpleConfiguration";
import { PropertyForm } from "./components/PropertyForm";
import { ClientsList } from "./components/ClientsList";
import { UserManagement } from "./components/UserManagement";
import { authService } from "./services/authService";
import { migrateProperties } from "./utils/migrateProperties";
import { userService } from "./services/userService";

export type Screen =
  | "login"
  | "dashboard"
  | "clients"
  | "clients-list"
  | "client-edit"
  | "projects"
  | "property-detail"
  | "property-form"
  | "simulator"
  | "results"
  | "reports"
  | "config"
  | "user-management";

export type Client = {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  monthlyIncome: number;
  occupation: string;
  maritalStatus: string;
  address: string;
  department: string;
  province: string;
  district: string;
};

export type Property = {
  id: string;
  name: string;
  location: string;
  priceFrom: number;
  areaFrom: number;
  image: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  projectId: string;
};

export type LoanConfig = {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  termYears: number;
  currency: "PEN" | "USD";
  rateType: "effective" | "nominal";
  interestRate: number;
  capitalization?:
    | "monthly"
    | "bimonthly"
    | "quarterly"
    | "semiannual"
    | "annual";
  graceApplies: boolean;
  graceType?: "total" | "partial";
  graceMonths?: number;
  bonusApplies: boolean;
  bonusAmount?: number;
  // Nuevo: COK anual (tasa de descuento) y costos mensuales adicionales
  discountRateAnnual?: number;
  extraMonthlyCosts?: number;
};

export type SimulationResult = {
  monthlyPayment: number;
  tcea: number;
  trea: number;
  totalAmount: number;
  totalInterest: number;
  van: number;
  tir: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  amortizationTable: Array<{
    period: number;
    date: string;
    initialBalance: number;
    interest: number;
    payment: number;
    amortization: number;
    finalBalance: number;
  }>;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [loanConfig, setLoanConfig] = useState<LoanConfig | null>(null);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          setIsAuthenticated(true);
          // Restaurar la pantalla previa si existe
          const storedScreen = sessionStorage.getItem(
            "currentScreen"
          ) as Screen | null;
          setCurrentScreen(storedScreen ?? "dashboard");
          // Restaurar propiedad seleccionada si existe
          try {
            const storedProperty = sessionStorage.getItem("selectedProperty");
            if (storedProperty) {
              setSelectedProperty(JSON.parse(storedProperty));
            }
          } catch (e) {
            // Ignorar errores de parseo de almacenamiento
          }
          // Restaurar resultados de simulación si existen
          try {
            const sr = sessionStorage.getItem("simulationResult");
            const lc = sessionStorage.getItem("loanConfig");
            if (sr && lc) {
              setSimulationResult(JSON.parse(sr));
              setLoanConfig(JSON.parse(lc));
              if (storedScreen === "results") {
                setCurrentScreen("results");
              }
            }
          } catch (e) {
            // Ignorar errores de parseo
          }
          // Verificar si es admin y cargar perfil
          try {
            const profile = await userService.getCurrentUserProfile();
            setUserProfile(profile);
            setIsAdmin(profile?.role === "admin");
          } catch (error) {
            console.error("Error al verificar rol de admin:", error);
            setIsAdmin(false);
            setUserProfile(null);
          }
          // Migrar propiedades si es necesario (solo una vez)
          try {
            await migrateProperties();
          } catch (error) {
            console.error("Error al migrar propiedades:", error);
          }
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuchar cambios en autenticación
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        const storedScreen = sessionStorage.getItem(
          "currentScreen"
        ) as Screen | null;
        setCurrentScreen(storedScreen ?? "dashboard");
        // Restaurar propiedad seleccionada si existe
        try {
          const storedProperty = sessionStorage.getItem("selectedProperty");
          if (storedProperty) {
            setSelectedProperty(JSON.parse(storedProperty));
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
        // Restaurar resultados de simulación si existen
        try {
          const sr = sessionStorage.getItem("simulationResult");
          const lc = sessionStorage.getItem("loanConfig");
          if (sr && lc) {
            setSimulationResult(JSON.parse(sr));
            setLoanConfig(JSON.parse(lc));
            if (storedScreen === "results") {
              setCurrentScreen("results");
            }
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
        // Verificar si es admin y cargar perfil
        try {
          const profile = await userService.getCurrentUserProfile();
          setUserProfile(profile);
          setIsAdmin(profile?.role === "admin");
        } catch (error) {
          console.error("Error al verificar rol de admin:", error);
          setIsAdmin(false);
          setUserProfile(null);
        }
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserProfile(null);
        setCurrentScreen("login");
        sessionStorage.removeItem("currentScreen");
        // Limpiar propiedad seleccionada
        setSelectedProperty(null);
        sessionStorage.removeItem("selectedProperty");
        // Limpiar resultados de simulación
        setSimulationResult(null);
        setLoanConfig(null);
        sessionStorage.removeItem("simulationResult");
        sessionStorage.removeItem("loanConfig");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setIsAuthenticated(true);
    const storedScreen = sessionStorage.getItem(
      "currentScreen"
    ) as Screen | null;
    setCurrentScreen(storedScreen ?? "dashboard");
    // Restaurar propiedad seleccionada si existe
    try {
      const storedProperty = sessionStorage.getItem("selectedProperty");
      if (storedProperty) {
        setSelectedProperty(JSON.parse(storedProperty));
      }
    } catch (e) {
      // Ignorar errores
    }
    // Restaurar resultados de simulación si existen
    try {
      const sr = sessionStorage.getItem("simulationResult");
      const lc = sessionStorage.getItem("loanConfig");
      if (sr && lc) {
        setSimulationResult(JSON.parse(sr));
        setLoanConfig(JSON.parse(lc));
        if (storedScreen === "results") {
          setCurrentScreen("results");
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    // Verificar si es admin y cargar perfil
    try {
      const profile = await userService.getCurrentUserProfile();
      setUserProfile(profile);
      setIsAdmin(profile?.role === "admin");
    } catch (error) {
      console.error("Error al verificar rol de admin:", error);
      setIsAdmin(false);
      setUserProfile(null);
    }
    // Migrar propiedades si es necesario
    try {
      await migrateProperties();
    } catch (error) {
      console.error("Error al migrar propiedades:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setCurrentScreen("login");
      sessionStorage.removeItem("currentScreen");
      setSelectedProperty(null);
      sessionStorage.removeItem("selectedProperty");
      setSimulationResult(null);
      setLoanConfig(null);
      sessionStorage.removeItem("simulationResult");
      sessionStorage.removeItem("loanConfig");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
    try {
      sessionStorage.setItem("currentScreen", screen);
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
    // Si el usuario vuelve al simulador, limpiar resultados anteriores
    if (screen === "simulator") {
      setSimulationResult(null);
      setLoanConfig(null);
      try {
        sessionStorage.removeItem("simulationResult");
        sessionStorage.removeItem("loanConfig");
      } catch (e) {
        // Ignorar errores
      }
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setCurrentScreen("property-detail");
    try {
      sessionStorage.setItem("selectedProperty", JSON.stringify(property));
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
  };

  const handleSimulateForProperty = (property: Property) => {
    setSelectedProperty(property);
    setCurrentScreen("simulator");
    try {
      sessionStorage.setItem("selectedProperty", JSON.stringify(property));
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
  };

  const handleSimulationComplete = (
    config: LoanConfig,
    result: SimulationResult
  ) => {
    setLoanConfig(config);
    setSimulationResult(result);
    setCurrentScreen("results");
    try {
      sessionStorage.setItem("loanConfig", JSON.stringify(config));
      sessionStorage.setItem("simulationResult", JSON.stringify(result));
      sessionStorage.setItem("currentScreen", "results");
    } catch (e) {
      // Ignorar errores
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-gray-600">Cargando módulo...</span>
          </div>
        }
      >
      {currentScreen === "dashboard" && (
        <>
          {isAdmin ? (
            <DashboardAdmin
              onNavigate={navigateToScreen}
              onLogout={handleLogout}
              isAdmin={isAdmin}
              userProfile={userProfile}
            />
          ) : (
            <DashboardEmpleado
              onNavigate={navigateToScreen}
              onLogout={handleLogout}
              isAdmin={isAdmin}
              userProfile={userProfile}
            />
          )}
        </>
      )}

      {currentScreen === "clients" && (
        <ClientRegistrationWithHelp
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "projects" && (
        <ProjectsCatalog
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
          onPropertySelect={handlePropertySelect}
          onSimulateForProperty={handleSimulateForProperty}
        />
      )}

      {currentScreen === "property-detail" && selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
          onSimulateForProperty={handleSimulateForProperty}
        />
      )}

      {currentScreen === "simulator" && (
        <LoanSimulatorWithHelp
          property={selectedProperty}
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
          onSimulationComplete={handleSimulationComplete}
        />
      )}

      {currentScreen === "results" && simulationResult && loanConfig && (
        <SimulationResultsWithHelpLazy
          result={simulationResult}
          config={loanConfig}
          property={selectedProperty}
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "reports" && (
        <SimpleReportsLazy onNavigate={navigateToScreen} onLogout={handleLogout} />
      )}

      {currentScreen === "config" && (
        <SimpleConfiguration
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "property-form" && (
        <PropertyForm
          property={(() => {
            try {
              const stored = sessionStorage.getItem("editingProperty");
              if (stored) {
                sessionStorage.removeItem("editingProperty");
                return JSON.parse(stored);
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
          onSave={() => {
            // Recargar propiedades si es necesario
          }}
        />
      )}

      {currentScreen === "clients-list" && (
        <ClientsList onNavigate={navigateToScreen} onLogout={handleLogout} />
      )}

      {currentScreen === "client-edit" && (
        <ClientRegistrationWithHelp
          onNavigate={navigateToScreen}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "user-management" && (
        <UserManagement onNavigate={navigateToScreen} onLogout={handleLogout} />
      )}
      </Suspense>
    </div>
  );
}

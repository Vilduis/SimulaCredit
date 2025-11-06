import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Building2,
  Home,
  Users,
  Building,
  Calculator,
  FileText,
  Settings,
  LogOut,
  HelpCircle,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Screen } from "../App";
import { HelpCenter } from "./help/HelpCenter";
import { userService } from "../services/userService";
import { DesktopNav } from "./nav/DesktopNav";
import { MobileNav } from "./nav/MobileNav";

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  userProfile?: any;
}

export function Navigation({
  currentScreen,
  onNavigate,
  onLogout,
  isAdmin: propIsAdmin,
  userProfile: propUserProfile,
}: NavigationProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(propIsAdmin ?? false);
  const [userProfile, setUserProfile] = useState<any>(propUserProfile ?? null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Si se pasan props, usarlas; si no, cargar internamente
    if (propIsAdmin !== undefined && propUserProfile !== undefined) {
      setIsAdmin(propIsAdmin);
      setUserProfile(propUserProfile);
    } else {
      // Cargar internamente si no se pasan props
      const loadProfile = async () => {
        try {
          const profile = await userService.getCurrentUserProfile();
          setUserProfile(profile);
          setIsAdmin(profile?.role === "admin");
        } catch (error) {
          console.error("Error al cargar perfil en Navigation:", error);
          setIsAdmin(false);
          setUserProfile(null);
        }
      };
      loadProfile();
    }
  }, [propIsAdmin, propUserProfile]);

  // Detección de viewport para reforzar control además de Tailwind
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Menú diferente según el rol
  const navigationItems = isAdmin
    ? [
        // Menú para Administrador
        { screen: "dashboard" as Screen, label: "Inicio", icon: Home },
        {
          screen: "user-management" as Screen,
          label: "Empleados",
          icon: ShieldCheck,
        },
        { screen: "projects" as Screen, label: "Proyectos", icon: Building },
        { screen: "reports" as Screen, label: "Reportes", icon: FileText },
        { screen: "config" as Screen, label: "Configuración", icon: Settings },
      ]
    : [
        // Menú para Empleado
        { screen: "dashboard" as Screen, label: "Inicio", icon: Home },
        { screen: "clients" as Screen, label: "Clientes", icon: Users },
        { screen: "projects" as Screen, label: "Proyectos", icon: Building },
        { screen: "simulator" as Screen, label: "Simulador", icon: Calculator },
        { screen: "reports" as Screen, label: "Reportes", icon: FileText },
      ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 ${
                  isAdmin ? "bg-blue-600" : "bg-green-600"
                } rounded-lg flex items-center justify-center shadow-md`}
              >
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  SimulaCredit
                </span>
                <div className="flex items-center mt-0.5">
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-blue-600 mr-1" />
                      <span className="text-xs text-blue-600 font-semibold">
                        Administrador
                      </span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-semibold">
                        Asesor de Ventas
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Menú de navegación (desktop y tablets) */}
            <DesktopNav
              items={navigationItems}
              currentScreen={currentScreen}
              onNavigate={onNavigate}
              isAdmin={isAdmin}
              isMobile={isMobile}
            />

            {/* Menú móvil (hamburguesa) */}
            {/* Menú móvil (hamburguesa) */}
            {isMobile && (
              <MobileNav
                items={navigationItems}
                currentScreen={currentScreen}
                onNavigate={onNavigate}
                onHelp={() => setIsHelpOpen(true)}
                onLogout={onLogout}
                isAdmin={isAdmin}
              />
            )}

            {/* Separador */}
            <div className="hidden sm:block w-px h-8 bg-gray-300 mx-2" />

            {/* Información del usuario */}
            {userProfile && (
              <div className="hidden md:flex items-center px-3 py-2 mx-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
                <div
                  className={`w-8 h-8 ${
                    isAdmin ? "bg-blue-600" : "bg-green-600"
                  } rounded-full flex items-center justify-center mr-3`}
                >
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">
                    {userProfile.full_name || userProfile.email.split("@")[0]}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      isAdmin ? "text-blue-600" : "text-green-600"
                    }`}
                  >
                    {isAdmin ? "Administrador" : "Asesor de Ventas"}
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <Button
              variant="ghost"
              onClick={() => setIsHelpOpen(true)}
              className={`${
                isMobile ? "hidden" : "flex"
              } items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 ml-2`}
              title="Ayuda"
            >
              <HelpCircle className="text-blue-600 w-4 h-4" />
              <span
                className={`text-blue-600 ${isMobile ? "hidden" : "inline"}`}
              >
                Ayuda
              </span>
            </Button>

            <Button
              variant="ghost"
              onClick={onLogout}
              className={`${
                isMobile ? "hidden" : "flex"
              } items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 ml-2`}
              title="Cerrar Sesión"
            >
              <LogOut className="text-red-600 w-4 h-4" />
              <span
                className={`text-red-600 ${isMobile ? "hidden" : "inline"}`}
              >
                Salir
              </span>
            </Button>
          </div>
        </div>
      </div>

      <HelpCenter isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </nav>
  );
}

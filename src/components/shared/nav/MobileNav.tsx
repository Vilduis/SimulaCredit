import { Button } from "../../ui/button";
import { Screen } from "../../../App";
import { Menu, HelpCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";

interface MobileNavProps {
  items: { screen: Screen; label: string; icon: any }[];
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onHelp: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export function MobileNav({
  items,
  currentScreen,
  onNavigate,
  onHelp,
  onLogout,
  isAdmin,
}: MobileNavProps) {
  return (
    <div className="sm:hidden block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            title="Menú"
          >
            <Menu className="w-4 h-4" />
            <span>Menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          className="w-56 z-[100]"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            return (
              <DropdownMenuItem
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={
                  isActive
                    ? isAdmin
                      ? "bg-blue-600/10"
                      : "bg-green-600/10"
                    : ""
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onHelp}>
            <HelpCircle className="w-4 h-4" />
            <span>Ayuda</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout} className="text-red-600">
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
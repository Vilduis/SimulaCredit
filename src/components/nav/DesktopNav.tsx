import { Button } from "../ui/button";
import { Screen } from "../../App";

interface DesktopNavProps {
  items: { screen: Screen; label: string; icon: any }[];
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isAdmin?: boolean;
  isMobile?: boolean;
}

export function DesktopNav({
  items,
  currentScreen,
  onNavigate,
  isAdmin,
  isMobile,
}: DesktopNavProps) {
  return (
    <div className={`${isMobile ? "hidden" : "flex"} items-center gap-1`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.screen;
        return (
          <Button
            key={item.screen}
            variant={isActive ? "default" : "ghost"}
            onClick={() => onNavigate(item.screen)}
            className={`flex items-center space-x-2 ${
              isActive
                ? isAdmin
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
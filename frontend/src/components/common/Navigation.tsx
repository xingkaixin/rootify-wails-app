import { Button } from "@/components/ui/button";
import { Languages, ChartNoAxesGantt } from "lucide-react";
import type { ActiveTab } from "../shared/types";

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      <div className="space-y-2 w-full px-2">
        <Button
          onClick={() => onTabChange("translation")}
          variant={activeTab === "translation" ? "default" : "ghost"}
          size="icon"
          className="relative group w-full"
        >
          <Languages className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            词根翻译
          </span>
        </Button>
        <Button
          onClick={() => onTabChange("management")}
          variant={activeTab === "management" ? "default" : "ghost"}
          size="icon"
          className="relative group w-full"
        >
          <ChartNoAxesGantt className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            词根管理
          </span>
        </Button>
      </div>
    </nav>
  );
}
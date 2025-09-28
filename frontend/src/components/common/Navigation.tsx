import { Button } from "@/components/ui/button";
import { Languages, ChartNoAxesGantt } from "lucide-react";
import type { ActiveTab } from "../shared/types";

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 p-6">
      <div className="space-y-2">
        <Button
          onClick={() => onTabChange("translation")}
          variant={activeTab === "translation" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Languages className="w-5 h-5 mr-3" />
          词根翻译
        </Button>
        <Button
          onClick={() => onTabChange("management")}
          variant={activeTab === "management" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <ChartNoAxesGantt className="w-5 h-5 mr-3" />
          词根管理
        </Button>
      </div>
    </nav>
  );
}
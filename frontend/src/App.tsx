import { useState } from "react";
import { Navigation } from "./components/common/Navigation";
import { TranslationPage } from "./components/translation/TranslationPage";
import { ManagementPage } from "./components/management/ManagementPage";
import type { ActiveTab } from "./components/shared/types";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("translation");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "translation" && <TranslationPage />}
          {activeTab === "management" && <ManagementPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
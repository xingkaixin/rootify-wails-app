import { useState, useEffect } from "react";
import { Header } from "./components/common/Header";
import { Navigation } from "./components/common/Navigation";
import { TranslationPage } from "./components/translation/TranslationPage";
import { ManagementPage } from "./components/management/ManagementPage";
import type { ActiveTab } from "./components/shared/types";

function App() {
  const [version, setVersion] = useState("1.0.0");
  const [activeTab, setActiveTab] = useState<ActiveTab>("translation");

  useEffect(() => {
    setVersion(import.meta.env.VITE_APP_VERSION || "1.0.0");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header version={version} />

      <div className="flex h-[calc(100vh-73px)]">
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
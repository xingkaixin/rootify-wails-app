import { useState } from "react";
import { Navigation } from "./components/common/Navigation";
import { TranslationPage } from "./components/translation/TranslationPage";
import { ManagementPage } from "./components/management/ManagementPage";
import type { ActiveTab } from "./components/shared/types";
import type { TableRowData } from "./components/shared/types";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("translation");
  // 在App级别存储翻译页面状态，避免切换页面时丢失
  const [translationState, setTranslationState] = useState<{
    unifiedInput: string;
    tableData: TableRowData[];
  }>({
    unifiedInput: "",
    tableData: [],
  });

  const updateTranslationState = (updates: Partial<typeof translationState>) => {
    setTranslationState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "translation" && (
            <TranslationPage
              unifiedInput={translationState.unifiedInput}
              tableData={translationState.tableData}
              onStateUpdate={updateTranslationState}
            />
          )}
          {activeTab === "management" && <ManagementPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
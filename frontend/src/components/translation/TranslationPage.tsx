import { useState } from "react";
import { InputArea } from "./InputArea";
import { TranslationTable } from "./TranslationTable";
import { CustomRootForm } from "./CustomRootForm";
import { HistoryPanel } from "./HistoryPanel";
import { useClipboard } from "../../hooks/useClipboard";
import { translateText, addRoot, saveTranslationHistory, isTranslationComplete } from "../../services/api";
import { copyToClipboard } from "../../services/csv";
import type { TableRowData } from "../shared/types";

interface TranslationPageProps {
  unifiedInput: string;
  tableData: TableRowData[];
  onStateUpdate: (updates: { unifiedInput?: string; tableData?: TableRowData[] }) => void;
}

export function TranslationPage({ unifiedInput, tableData, onStateUpdate }: TranslationPageProps) {

  const { copiedIndex, copyText } = useClipboard();

  // 直接实现状态管理逻辑，替代useTranslation hook
  const handleUnifiedInput = async (value: string) => {
    onStateUpdate({ unifiedInput: value });

    if (value.trim()) {
      const lines = value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // 即时翻译：输入中文后立即自动翻译
      const translatedData = await Promise.all(
        lines.map(async (line) => {
          if (line.trim()) {
            const translated = await translateText(line);

            // 只有在翻译完全成功时才保存历史记录
            if (translated && line.trim()) {
              const complete = await isTranslationComplete(line);
              if (complete) {
                saveTranslationHistory(line.trim(), translated);
              }
            }

            return {
              chinese: line,
              english: translated,
            };
          }
          return { chinese: line, english: "" };
        })
      );

      onStateUpdate({ tableData: translatedData });
    } else {
      onStateUpdate({ tableData: [] });
    }
  };

  const handleTableEdit = async (index: number, chinese: string) => {
    if (index < 0 || index >= tableData.length) return;

    const newData = [...tableData];
    const row = newData[index];
    if (!row) return;

    row.chinese = chinese;

    // 即时翻译：编辑中文后立即自动翻译
    if (chinese.trim()) {
      const translated = await translateText(chinese);
      row.english = translated;

      // 只有在翻译完全成功时才保存历史记录
      if (translated && chinese.trim()) {
        const complete = await isTranslationComplete(chinese);
        if (complete) {
          saveTranslationHistory(chinese.trim(), translated);
        }
      }
    } else {
      row.english = "";
    }

    onStateUpdate({ tableData: newData });
  };

  const addRow = () => {
    onStateUpdate({ tableData: [...tableData, { chinese: "", english: "" }] });
  };

  const deleteRow = (index: number) => {
    const newData = tableData.filter((_, i) => i !== index);
    onStateUpdate({ tableData: newData });
  };

  const reset = () => {
    onStateUpdate({ unifiedInput: "", tableData: [] });
  };

  const handleBatchTranslate = async () => {
    try {
      const translatedData = await Promise.all(
        tableData.map(async (row) => {
          if (row.chinese.trim()) {
            const translated = await translateText(row.chinese);
            return {
              ...row,
              english: translated,
            };
          }
          return row;
        })
      );
      onStateUpdate({ tableData: translatedData });
    } catch (error) {
      console.error("Failed to translate text:", error);
    }
  };

  const handleAddCustomRoot = async (chinese: string, english: string) => {
    if (chinese.trim() && english.trim()) {
      try {
        await addRoot(chinese.trim(), english.trim());

        // 重新翻译所有文本
        const retranslatedData = await Promise.all(
          tableData.map(async (row) => {
            if (row.chinese.trim()) {
              const translated = await translateText(row.chinese);
              return {
                ...row,
                english: translated,
              };
            }
            return row;
          })
        );

        onStateUpdate({ tableData: retranslatedData });
      } catch (error) {
        console.error("Failed to add custom root:", error);
      }
    }
  };

  const handleSelectHistory = (chineseText: string, englishText: string) => {
    // 将历史记录添加到表格中
    onStateUpdate({
      tableData: [
        ...tableData,
        { chinese: chineseText, english: englishText }
      ]
    });
  };

  const handleExportTSV = async () => {
    if (tableData.length === 0) {
      alert("没有数据可导出");
      return;
    }

    // 创建TSV内容：中文\t英文\n
    const tsvContent = tableData
      .map((row) => `${row.chinese}\t${row.english}`)
      .join("\n");
    const fullContent = `中文\t英文\n${tsvContent}`;

    const success = await copyToClipboard(fullContent);
    if (success) {
      alert("已复制到剪贴板，可直接粘贴到Excel中");
    } else {
      alert("复制失败，请手动复制数据");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          词根翻译
        </h2>

        <InputArea
          unifiedInput={unifiedInput}
          onUnifiedInputChange={handleUnifiedInput}
          onBatchTranslate={handleBatchTranslate}
          onAddRow={addRow}
          onReset={reset}
          hasData={tableData.length > 0}
        />

        <TranslationTable
          tableData={tableData}
          onTableEdit={handleTableEdit}
          onDeleteRow={deleteRow}
          copiedIndex={copiedIndex}
          onCopyText={copyText}
          onExportTSV={handleExportTSV}
        />

        <CustomRootForm onAddCustomRoot={handleAddCustomRoot} />
      </div>

      <div className="lg:col-span-1">
        <HistoryPanel onSelectHistory={handleSelectHistory} />
      </div>
    </div>
  );
}
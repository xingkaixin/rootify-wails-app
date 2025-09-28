import { useState } from "react";
import { InputArea } from "./InputArea";
import { TranslationTable } from "./TranslationTable";
import { CustomRootForm } from "./CustomRootForm";
import { useTranslation } from "../../hooks/useTranslation";
import { useClipboard } from "../../hooks/useClipboard";
import { translateText, addRoot } from "../../services/api";
import { copyToClipboard } from "../../services/csv";

export function TranslationPage() {
  const {
    unifiedInput,
    tableData,
    setTableData,
    handleUnifiedInput,
    handleTableEdit,
    addRow,
    deleteRow,
    reset,
  } = useTranslation();

  const { copiedIndex, copyText } = useClipboard();

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
      setTableData(translatedData);
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

        setTableData(retranslatedData);
      } catch (error) {
        console.error("Failed to add custom root:", error);
      }
    }
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
    <div className="space-y-6">
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
  );
}
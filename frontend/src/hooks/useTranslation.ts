import { useState } from "react";
import type { TableRowData } from "../components/shared/types";

export function useTranslation() {
  const [unifiedInput, setUnifiedInput] = useState("");
  const [tableData, setTableData] = useState<TableRowData[]>([]);

  const handleUnifiedInput = (value: string) => {
    setUnifiedInput(value);

    if (value.trim()) {
      const lines = value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const newData = lines.map((line) => ({ chinese: line, english: "" }));
      setTableData(newData);
    } else {
      setTableData([]);
    }
  };

  const handleTableEdit = (index: number, chinese: string) => {
    if (index < 0 || index >= tableData.length) return;

    const newData = [...tableData];
    const row = newData[index];
    if (!row) return;

    row.chinese = chinese;
    row.english = "";
    setTableData(newData);
  };

  const addRow = () => {
    setTableData([...tableData, { chinese: "", english: "" }]);
  };

  const deleteRow = (index: number) => {
    const newData = tableData.filter((_, i) => i !== index);
    setTableData(newData);
  };

  const reset = () => {
    setUnifiedInput("");
    setTableData([]);
  };

  return {
    unifiedInput,
    tableData,
    setTableData,
    handleUnifiedInput,
    handleTableEdit,
    addRow,
    deleteRow,
    reset,
  };
}
import type { ImportPreviewItem } from "../components/shared/types";

export function parseCSVContent(
  csvContent: string,
  existingRoots: Record<string, string>
): ImportPreviewItem[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return []; // 至少需要标题行+一行数据

  const preview: ImportPreviewItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    // 从1开始，跳过标题行
    const line = lines[i];
    if (!line || line.trim() === "") continue; // 跳过空行

    const columns = line
      .split(",")
      .map((col) => col.trim().replace(/^"|"$/g, "")); // 去掉双引号
    if (columns.length >= 2) {
      const chinese = columns[0];
      const english = columns[1];

      if (chinese && english) {
        const action = existingRoots[chinese] ? "update" : "add";
        preview.push({ chinese, english, action });
      }
    }
  }

  return preview;
}

export function downloadCSVFile(csvContent: string, filename: string): void {
  if (!csvContent || csvContent === "中文词根,英文对应\n") {
    alert("没有词根数据可导出");
    return;
  }

  // 创建Blob对象
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // 创建下载链接
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放URL对象
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 使用现代的Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案：使用document.execCommand
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error("复制失败:", error);
    return false;
  }
}
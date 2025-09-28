import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, FileDown, FileUp } from "lucide-react";
import { RootTable } from "./RootTable";
import { ImportDialog } from "./ImportDialog";
import { EditDialog } from "./EditDialog";
import { useRoots } from "../../hooks/useRoots";
import { deleteRoot, clearAllRoots, importRoots, exportRoots } from "../../services/api";
import { parseCSVContent, downloadCSVFile } from "../../services/csv";
import type { ImportPreviewItem, EditingRoot } from "../shared/types";

export function ManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [editingRoot, setEditingRoot] = useState<EditingRoot | null>(null);

  const { allRoots, refreshRoots } = useRoots();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const csvContent = e.target?.result as string;
      const preview = parseCSVContent(csvContent, allRoots);

      if (preview.length === 0) {
        alert("CSV格式错误：需要至少两列数据（中文词根,英文对应）");
        return;
      }

      setImportPreview(preview);
      setShowImportDialog(true);
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const handleEditRoot = (chinese: string, english: string) => {
    setEditingRoot({ chinese, english });
  };

  const handleSaveEdit = async (newChinese: string, newEnglish: string) => {
    if (newChinese.trim() && newEnglish.trim()) {
      try {
        // 如果中文修改了，先删除旧的
        if (editingRoot && editingRoot.chinese !== newChinese) {
          await deleteRoot(editingRoot.chinese);
        }

        await importRoots({ [newChinese.trim()]: newEnglish.trim() });
        setEditingRoot(null);
        refreshRoots();
      } catch (error) {
        console.error("Failed to save root:", error);
      }
    }
  };

  const handleDeleteRoot = async (chinese: string) => {
    if (confirm(`确定要删除词根 "${chinese}" 吗？`)) {
      try {
        await deleteRoot(chinese);
        refreshRoots();
      } catch (error) {
        console.error("Failed to delete root:", error);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await exportRoots();
      downloadCSVFile(
        csvContent,
        `词根库_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (error) {
      console.error("Failed to export roots:", error);
      alert("导出失败");
    }
  };

  const confirmClearAll = async () => {
    try {
      await clearAllRoots();
      setShowClearConfirm(false);
      refreshRoots();
    } catch (error) {
      console.error("Failed to clear roots:", error);
    }
  };

  const confirmImport = async () => {
    try {
      const rootsToImport: Record<string, string> = {};
      importPreview.forEach(({ chinese, english }) => {
        rootsToImport[chinese] = english;
      });

      await importRoots(rootsToImport);
      setShowImportDialog(false);
      setImportPreview([]);
      refreshRoots();
    } catch (error) {
      console.error("Failed to import roots:", error);
    }
  };

  const filteredRoots = Object.entries(allRoots).filter(
    ([chinese, english]) =>
      chinese.includes(searchTerm) || english.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        词根库管理
      </h2>

      <div className="mb-6">
        <div className="flex gap-4">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索词根..."
            className="flex-1"
          />
          <Button onClick={handleClearAll} variant="destructive">
            <RotateCcw className="w-4 h-4 mr-2" />
            清空
          </Button>
          <Button onClick={handleExportCSV} variant="default">
            <FileDown className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button asChild variant="default">
            <label className="cursor-pointer flex items-center">
              <FileUp className="w-4 h-4 mr-2" />
              导入
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>

      <EditDialog
        editingRoot={editingRoot}
        onOpenChange={() => setEditingRoot(null)}
        onSave={handleSaveEdit}
      />

      {/* 清空确认对话框 */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ 确认清空</DialogTitle>
            <DialogDescription>
              确定要清空所有词根吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowClearConfirm(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={confirmClearAll} variant="destructive">
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        importPreview={importPreview}
        onConfirm={confirmImport}
      />

      <RootTable
        roots={filteredRoots}
        onEdit={handleEditRoot}
        onDelete={handleDeleteRoot}
      />

      <div className="text-sm text-gray-500 text-center">
        共 {filteredRoots.length} 个词根
      </div>
    </div>
  );
}
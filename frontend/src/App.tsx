import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Languages,
  ChartNoAxesGantt,
  FilePlus2,
  RotateCcw,
  ClipboardList,
  Activity,
  FileDown,
  FileUp,
} from "lucide-react";
import * as GoAPI from "../wailsjs/go/main/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface WordRoot {
  chinese: string;
  english: string;
}

interface SegmentationResult {
  chinese: string;
  english: string;
  isUnknown?: boolean;
}

async function getAllRoots(): Promise<Record<string, string>> {
  try {
    const roots = await GoAPI.GetAllRoots();
    return roots || {};
  } catch (error) {
    console.error("Failed to load roots:", error);
    return {};
  }
}

async function segmentText(text: string): Promise<SegmentationResult[]> {
  try {
    const segments = await GoAPI.SegmentText(text);
    return (segments || []) as SegmentationResult[];
  } catch (error) {
    console.error("Failed to segment text:", error);
    return [];
  }
}

function MixedTranslation({ chinese }: { chinese: string }) {
  const [segments, setSegments] = useState<SegmentationResult[]>([]);

  useEffect(() => {
    if (chinese.trim()) {
      segmentText(chinese).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [chinese]);

  if (!chinese.trim()) {
    return <span className="text-gray-400">...</span>;
  }

  if (segments.length === 0) {
    return <span className="text-gray-400">加载中...</span>;
  }

  return (
    <>
      {segments.map((segment, index) => {
        const isMatched = !segment.isUnknown && segment.english.trim() !== "";

        if (isMatched) {
          return (
            <span key={index} className="text-green-600">
              {segment.english}
              {index < segments.length - 1 && "_"}
            </span>
          );
        } else {
          return (
            <span key={index} className="text-red-600">
              {segment.chinese}
              {index < segments.length - 1 && "_"}
            </span>
          );
        }
      })}
    </>
  );
}

function RootManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<
    Array<{ chinese: string; english: string; action: "add" | "update" }>
  >([]);
  const [editingRoot, setEditingRoot] = useState<{
    chinese: string;
    english: string;
  } | null>(null);
  const [allRoots, setAllRoots] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllRoots().then(setAllRoots);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const csvContent = e.target?.result as string;
      parseCSVAndPreview(csvContent);
    };
    reader.readAsText(file);
  };

  const parseCSVAndPreview = (csvContent: string) => {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return; // 至少需要标题行+一行数据

    // 跳过第一行标题，从第二行开始处理
    const preview: Array<{
      chinese: string;
      english: string;
      action: "add" | "update";
    }> = [];

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
          const action = allRoots[chinese] ? "update" : "add";
          preview.push({ chinese, english, action });
        }
      }
    }

    if (preview.length === 0) {
      alert("CSV格式错误：需要至少两列数据（中文词根,英文对应）");
      return;
    }

    setImportPreview(preview);
    setShowImportDialog(true);
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
          await GoAPI.DeleteRoot(editingRoot.chinese);
        }

        await GoAPI.AddRoot(newChinese.trim(), newEnglish.trim());
        setEditingRoot(null);
        getAllRoots().then(setAllRoots);
      } catch (error) {
        console.error("Failed to save root:", error);
      }
    }
  };

  const handleDeleteRoot = async (chinese: string) => {
    if (confirm(`确定要删除词根 "${chinese}" 吗？`)) {
      try {
        await GoAPI.DeleteRoot(chinese);
        getAllRoots().then(setAllRoots);
      } catch (error) {
        console.error("Failed to delete root:", error);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await GoAPI.ExportRoots();

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
      link.setAttribute(
        "download",
        `词根库_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 释放URL对象
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export roots:", error);
      alert("导出失败");
    }
  };

  const confirmClearAll = async () => {
    try {
      await GoAPI.ClearAllRoots();
      setShowClearConfirm(false);
      getAllRoots().then(setAllRoots);
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

      await GoAPI.ImportRoots(rootsToImport);
      setShowImportDialog(false);
      setImportPreview([]);
      getAllRoots().then(setAllRoots);
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

      {/* 编辑对话框 */}
      <Dialog open={!!editingRoot} onOpenChange={() => setEditingRoot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✏️ 编辑词根</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-chinese" className="mb-2">
                中文词根
              </Label>
              <Input
                type="text"
                defaultValue={editingRoot?.chinese}
                id="edit-chinese"
              />
            </div>
            <div>
              <Label htmlFor="edit-english" className="mb-2">
                英文对应
              </Label>
              <Input
                type="text"
                defaultValue={editingRoot?.english}
                id="edit-english"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingRoot(null)} variant="outline">
              取消
            </Button>
            <Button
              onClick={() => {
                const chineseInput = document.getElementById(
                  "edit-chinese"
                ) as HTMLInputElement;
                const englishInput = document.getElementById(
                  "edit-english"
                ) as HTMLInputElement;
                if (editingRoot) {
                  handleSaveEdit(chineseInput.value, englishInput.value);
                }
              }}
              variant="default"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* 导入预览对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>📋 导入预览</DialogTitle>
            <DialogDescription>
              发现 {importPreview.length} 个词根：
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">中文</TableHead>
                  <TableHead className="w-1/3">英文</TableHead>
                  <TableHead className="w-1/3">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.map(({ chinese, english, action }, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{chinese}</TableCell>
                    <TableCell className="font-mono text-blue-600">
                      {english}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={action === "add" ? "default" : "secondary"}
                      >
                        {action === "add" ? "新增" : "更新"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowImportDialog(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={confirmImport} variant="default">
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">中文词根</TableHead>
              <TableHead className="w-[40%]">英文对应</TableHead>
              <TableHead className="w-[20%]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoots.map(([chinese, english]) => (
              <TableRow key={chinese}>
                <TableCell className="font-medium">{chinese}</TableCell>
                <TableCell className="font-mono text-blue-600">
                  {english}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditRoot(chinese, english)}
                      size="sm"
                      variant="outline"
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={() => handleDeleteRoot(chinese)}
                      size="sm"
                      variant="destructive"
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500 text-center">
        共 {filteredRoots.length} 个词根
      </div>
    </div>
  );
}

function App() {
  const [version, setVersion] = useState("1.0.0");
  const [activeTab, setActiveTab] = useState<"translation" | "management">(
    "translation"
  );
  const [unifiedInput, setUnifiedInput] = useState("");
  const [tableData, setTableData] = useState<
    Array<{ chinese: string; english: string }>
  >([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [manualTranslations, setManualTranslations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setVersion(import.meta.env.VITE_APP_VERSION || "1.0.0");
  }, []);

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

  const handleBatchTranslate = async () => {
    try {
      const translatedData = await Promise.all(
        tableData.map(async (row) => {
          if (row.chinese.trim()) {
            const translated = await GoAPI.TranslateText(row.chinese);
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

  const handleReset = () => {
    setUnifiedInput("");
    setTableData([]);
  };

  const copyToClipboard = async (text: string, index: number) => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleAddCustomRoot = async (chinese: string, english: string) => {
    if (chinese.trim() && english.trim()) {
      try {
        await GoAPI.AddRoot(chinese.trim(), english.trim());

        // 重新翻译所有文本
        const retranslatedData = await Promise.all(
          tableData.map(async (row) => {
            if (row.chinese.trim()) {
              const translated = await GoAPI.TranslateText(row.chinese);
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

    try {
      // 使用现代的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullContent);
        alert("已复制到剪贴板，可直接粘贴到Excel中");
      } else {
        // 降级方案：使用document.execCommand
        const textArea = document.createElement("textarea");
        textArea.value = fullContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("已复制到剪贴板，可直接粘贴到Excel中");
      }
    } catch (error) {
      console.error("复制失败:", error);
      alert("复制失败，请手动复制数据");
    }
  };

  const handleNewChineseChange = (value: string) => {
    setManualTranslations((prev) => ({ ...prev, newChinese: value }));
  };

  const handleNewEnglishChange = (value: string) => {
    setManualTranslations((prev) => ({ ...prev, newEnglish: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="relative inline-block">
          <h1 className="text-2xl font-bold text-gray-900">金融词根翻译系统</h1>
          <span className="absolute bottom-0 right-0 text-sm text-gray-500 transform translate-x-full ml-2">
            v{version}
          </span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <nav className="w-64 bg-white border-r border-gray-200 p-6">
          <div className="space-y-2">
            <Button
              onClick={() => setActiveTab("translation")}
              variant={activeTab === "translation" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Languages className="w-5 h-5 mr-3" />
              词根翻译
            </Button>
            <Button
              onClick={() => setActiveTab("management")}
              variant={activeTab === "management" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <ChartNoAxesGantt className="w-5 h-5 mr-3" />
              词根管理
            </Button>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "translation" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                词根翻译
              </h2>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入中文字段名（支持单行或多行）
                </label>
                <Textarea
                  value={unifiedInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleUnifiedInput(e.target.value)
                  }
                  placeholder="输入中文字段名，每行一个：
交易日期
时间戳
信息来源
存款金额
取款金额"
                  className="h-32 resize-none"
                />
                <div className="flex gap-4 mt-4">
                  <Button
                    onClick={handleBatchTranslate}
                    disabled={tableData.length === 0}
                    variant="default"
                  >
                    <Languages className="w-4 h-4 mr-2" />
                    翻译
                  </Button>
                  <Button onClick={addRow} variant="default">
                    <FilePlus2 className="w-4 h-4 mr-2" />
                    添加行
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    清空
                  </Button>
                </div>
              </div>

              {tableData.length > 0 && (
                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                    <div className="text-sm font-medium">翻译结果</div>
                    <Button
                      onClick={handleExportTSV}
                      variant="default"
                      size="sm"
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      复制到剪贴板
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">中文字段名</TableHead>
                        <TableHead className="w-1/2">英文字段名</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, index) => (
                        <TableRow key={index} className="group">
                          <TableCell>
                            <Input
                              type="text"
                              value={row.chinese}
                              onChange={(e) =>
                                handleTableEdit(index, e.target.value)
                              }
                              className="border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                              placeholder="输入中文"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="relative flex items-center">
                              <div className="font-mono flex-1">
                                <MixedTranslation chinese={row.chinese} />
                              </div>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {row.english && (
                                  <Button
                                    onClick={() =>
                                      copyToClipboard(row.english, index)
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="复制"
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => deleteRow(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  title="删除"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ➕ 添加自定义词根
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  用户判断：什么是一个完整的词根？输入中文词语和对应的英文翻译：
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="new-chinese" className="mb-2">
                      中文词语
                    </Label>
                    <Input
                      type="text"
                      id="new-chinese"
                      value={manualTranslations.newChinese || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleNewChineseChange(e.target.value)
                      }
                      placeholder="例如：证券、区块链、人工智能"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-english" className="mb-2">
                      英文翻译
                    </Label>
                    <Input
                      type="text"
                      id="new-english"
                      value={manualTranslations.newEnglish || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleNewEnglishChange(e.target.value)
                      }
                      placeholder="例如：securities、blockchain、ai"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      handleAddCustomRoot(
                        manualTranslations.newChinese || "",
                        manualTranslations.newEnglish || ""
                      );
                      setManualTranslations((prev) => ({
                        ...prev,
                        newChinese: "",
                        newEnglish: "",
                      }));
                    }}
                    disabled={
                      !manualTranslations.newChinese?.trim() ||
                      !manualTranslations.newEnglish?.trim()
                    }
                    variant="default"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    添加词根
                  </Button>
                  <Button
                    onClick={() =>
                      setManualTranslations((prev) => ({
                        ...prev,
                        newChinese: "",
                        newEnglish: "",
                      }))
                    }
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    清空
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "management" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                词根库管理
              </h2>
              <RootManagement />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

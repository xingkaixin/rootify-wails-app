import { useState, useEffect } from "react";
import { Copy, Check, FileText, Settings } from "lucide-react";
import * as GoAPI from "../wailsjs/go/main/App";

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
            </span>
          );
        } else {
          return (
            <span key={index} className="text-red-600">
              {segment.chinese}
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
  const [importPreview, setImportPreview] = useState<Array<{chinese: string, english: string, action: 'add' | 'update'}>>([]);
  const [editingRoot, setEditingRoot] = useState<{chinese: string, english: string} | null>(null);
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
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return; // 至少需要标题行+一行数据

    // 跳过第一行标题，从第二行开始处理
    const preview: Array<{chinese: string, english: string, action: 'add' | 'update'}> = [];
    
    for (let i = 1; i < lines.length; i++) { // 从1开始，跳过标题行
      const line = lines[i];
      if (!line || line.trim() === '') continue; // 跳过空行

      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, '')); // 去掉双引号
      if (columns.length >= 2) {
        const chinese = columns[0];
        const english = columns[1];

        if (chinese && english) {
          const action = allRoots[chinese] ? 'update' : 'add';
          preview.push({ chinese, english, action });
        }
      }
    }

    if (preview.length === 0) {
      alert('CSV格式错误：需要至少两列数据（中文词根,英文对应）');
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
        alert('没有词根数据可导出');
        return;
      }

      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `词根库_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 释放URL对象
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export roots:", error);
      alert('导出失败');
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
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索词根..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleClearAll}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            清空所有
          </button>
          <button
            onClick={handleExportCSV}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            导出CSV
          </button>
          <label className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-medium">
            批量导入
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 编辑对话框 */}
      {editingRoot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✏️ 编辑词根</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">中文词根</label>
                <input
                  type="text"
                  defaultValue={editingRoot.chinese}
                  id="edit-chinese"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">英文对应</label>
                <input
                  type="text"
                  defaultValue={editingRoot.english}
                  id="edit-english"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setEditingRoot(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const chineseInput = document.getElementById('edit-chinese') as HTMLInputElement;
                  const englishInput = document.getElementById('edit-english') as HTMLInputElement;
                  handleSaveEdit(chineseInput.value, englishInput.value);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清空确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ 确认清空</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要清空所有词根吗？此操作不可恢复。
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入预览对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 导入预览</h3>
            <p className="text-sm text-gray-600 mb-4">发现 {importPreview.length} 个词根：</p>
            
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg mb-4">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="px-3 py-1.5 font-medium text-gray-900 border-r border-gray-200 text-sm">中文</div>
                <div className="px-3 py-1.5 font-medium text-gray-900 border-r border-gray-200 text-sm">英文</div>
                <div className="px-3 py-1.5 font-medium text-gray-900 text-sm">操作</div>
              </div>
              
              {importPreview.map(({ chinese, english, action }, index) => (
                <div key={index} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
                  <div className="px-3 py-1 border-r border-gray-200 font-medium text-sm">{chinese}</div>
                  <div className="px-3 py-1 border-r border-gray-200 font-mono text-blue-600 text-sm">{english}</div>
                  <div className="px-3 py-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      action === 'add' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {action === 'add' ? '新增' : '更新'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
          <div className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
            中文词根
          </div>
          <div className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">英文对应</div>
          <div className="px-4 py-3 font-medium text-gray-900">
            操作
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredRoots.map(([chinese, english]) => {
            return (
              <div
                key={chinese}
                className="grid grid-cols-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 items-center"
              >
                <div className="px-4 py-3 border-r border-gray-200 font-medium text-gray-800">
                  {chinese}
                </div>
                <div className="px-4 py-3 border-r border-gray-200 font-mono text-blue-600">{english}</div>
                <div className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => handleEditRoot(chinese, english)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteRoot(chinese)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
  const [manualTranslations, setManualTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    setVersion(import.meta.env.VITE_APP_VERSION || '1.0.0');
  }, []);

  const handleUnifiedInput = (value: string) => {
    setUnifiedInput(value);
    
    if (value.trim()) {
      const lines = value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const newData = lines.map(line => ({ chinese: line, english: "" }));
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
              english: translated
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
                english: translated
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
      alert('没有数据可导出');
      return;
    }

    // 创建TSV内容：中文\t英文\n
    const tsvContent = tableData.map(row => `${row.chinese}\t${row.english}`).join('\n');
    const fullContent = `中文\t英文\n${tsvContent}`;

    try {
      // 使用现代的Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullContent);
        alert('已复制到剪贴板，可直接粘贴到Excel中');
      } else {
        // 降级方案：使用document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = fullContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('已复制到剪贴板，可直接粘贴到Excel中');
      }
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制数据');
    }
  };

  const handleNewChineseChange = (value: string) => {
    setManualTranslations(prev => ({ ...prev, newChinese: value }));
  };

  const handleNewEnglishChange = (value: string) => {
    setManualTranslations(prev => ({ ...prev, newEnglish: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="relative inline-block">
          <h1 className="text-2xl font-bold text-gray-900">金融词根翻译系统</h1>
          <span className="absolute bottom-0 right-0 text-sm text-gray-500 transform translate-x-full ml-2">v{version}</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <nav className="w-64 bg-white border-r border-gray-200 p-6">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("translation")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "translation"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              词根翻译
            </button>
            <button
              onClick={() => setActiveTab("management")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "management"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Settings className="w-5 h-5" />
              词根管理
            </button>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "translation" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">词根翻译</h2>
              
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入中文字段名（支持单行或多行）
                </label>
                <textarea
                  value={unifiedInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUnifiedInput(e.target.value)}
                  placeholder="输入中文字段名，每行一个：
交易日期
时间戳
信息来源
存款金额
取款金额"
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleBatchTranslate}
                    disabled={tableData.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    翻译
                  </button>
                  <button
                    onClick={addRow}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    添加行
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    清空
                  </button>
                </div>
              </div>

              {tableData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-2 items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">中文字段名</div>
                    <div className="px-4 py-3 font-medium text-gray-900 flex justify-between items-center">
                      <span>英文字段名</span>
                      <button
                        onClick={handleExportTSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        导出到剪贴板
                      </button>
                    </div>
                  </div>

                  {tableData.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 group">
                      <div className="border-r border-gray-200 relative">
                        <input
                          type="text"
                          value={row.chinese}
                          onChange={(e) => handleTableEdit(index, e.target.value)}
                          className="w-full px-4 py-3 border-0 bg-transparent focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          placeholder="输入中文"
                        />
                        </div>
                      <div className="relative flex items-center">
                        <div className="px-4 py-3 pr-20 font-mono flex-1">
                          <MixedTranslation chinese={row.english} />
                        </div>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {row.english && (
                            <button
                              onClick={() => copyToClipboard(row.english, index)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="复制"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteRow(index)}
                            className="p-1 hover:bg-red-100 rounded transition-colors text-red-500 font-bold"
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ 添加自定义词根</h3>
                <p className="text-sm text-gray-600 mb-4">用户判断：什么是一个完整的词根？输入中文词语和对应的英文翻译：</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">中文词语</label>
                    <input
                      type="text"
                      value={manualTranslations.newChinese || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNewChineseChange(e.target.value)}
                      placeholder="例如：证券、区块链、人工智能"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">英文翻译</label>
                    <input
                      type="text"
                      value={manualTranslations.newEnglish || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNewEnglishChange(e.target.value)}
                      placeholder="例如：securities、blockchain、ai"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      handleAddCustomRoot(manualTranslations.newChinese || "", manualTranslations.newEnglish || "");
                      setManualTranslations(prev => ({ ...prev, newChinese: "", newEnglish: "" }));
                    }}
                    disabled={!manualTranslations.newChinese?.trim() || !manualTranslations.newEnglish?.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    添加词根
                  </button>
                  <button
                    onClick={() => setManualTranslations(prev => ({ ...prev, newChinese: "", newEnglish: "" }))}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    清空
                  </button>
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

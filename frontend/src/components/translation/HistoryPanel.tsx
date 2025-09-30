import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Clock } from "lucide-react";
import { getTranslationHistory, clearTranslationHistory, type TranslationHistoryItem } from "@/services/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HistoryPanelProps {
  onSelectHistory: (chineseText: string, englishText: string) => void;
  refreshTrigger?: number; // 外部刷新触发器
}

export function HistoryPanel({ onSelectHistory, refreshTrigger }: HistoryPanelProps) {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0); // 内部强制刷新
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyData = await getTranslationHistory();
      setHistory(historyData);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearHistory = async () => {
    try {
      await clearTranslationHistory();
      // 直接清空本地状态并强制刷新
      setHistory([]);
      setInternalRefreshTrigger(prev => prev + 1);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("清空历史记录失败");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    loadHistory();
  }, [internalRefreshTrigger, refreshTrigger]); // 监听内部和外部刷新触发器

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            翻译历史
          </CardTitle>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-8 px-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              加载中...
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              暂无翻译历史
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onSelectHistory(item.chineseText, item.englishText)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.chineseText}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTime(item.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {item.englishText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* 清空确认对话框 */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ 确认清空</DialogTitle>
            <DialogDescription>
              确定要清空所有翻译历史记录吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowClearConfirm(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={confirmClearHistory} variant="destructive">
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
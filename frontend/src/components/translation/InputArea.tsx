import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Languages, FilePlus2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface InputAreaProps {
  unifiedInput: string;
  onUnifiedInputChange: (value: string) => void;
  onBatchTranslate: () => void;
  onReset: () => void;
  hasData: boolean;
}

export function InputArea({
  unifiedInput,
  onUnifiedInputChange,
  onBatchTranslate,
  onReset,
  hasData,
}: InputAreaProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleBatchTranslate = () => {
    onBatchTranslate();
    // 翻译后自动折叠
    setIsExpanded(false);
  };

  const handleReset = () => {
    onReset();
    // 清空后保持当前展开状态
  };

  // 折叠状态下的UI
  if (!isExpanded) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">快速录入</span>
          </div>
          <Button onClick={handleToggleExpand} variant="outline" size="sm">
            <ChevronDown className="w-4 h-4 mr-1" />
            展开
          </Button>
        </div>
      </div>
    );
  }

  // 展开状态下的UI
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          输入中文字段名（支持单行或多行）
        </label>
        <Button onClick={handleToggleExpand} variant="outline" size="sm">
          <ChevronUp className="w-4 h-4 mr-1" />
          折叠
        </Button>
      </div>
      <Textarea
        value={unifiedInput}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onUnifiedInputChange(e.target.value)
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
          disabled={!hasData}
          variant="default"
        >
          <Languages className="w-4 h-4 mr-2" />
          翻译
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          清空
        </Button>
      </div>
    </div>
  );
}
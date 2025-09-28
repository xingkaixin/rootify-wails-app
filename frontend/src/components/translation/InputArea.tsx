import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Languages, FilePlus2, RotateCcw } from "lucide-react";

interface InputAreaProps {
  unifiedInput: string;
  onUnifiedInputChange: (value: string) => void;
  onBatchTranslate: () => void;
  onAddRow: () => void;
  onReset: () => void;
  hasData: boolean;
}

export function InputArea({
  unifiedInput,
  onUnifiedInputChange,
  onBatchTranslate,
  onAddRow,
  onReset,
  hasData,
}: InputAreaProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        输入中文字段名（支持单行或多行）
      </label>
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
          onClick={onBatchTranslate}
          disabled={!hasData}
          variant="default"
        >
          <Languages className="w-4 h-4 mr-2" />
          翻译
        </Button>
        <Button onClick={onAddRow} variant="default">
          <FilePlus2 className="w-4 h-4 mr-2" />
          添加行
        </Button>
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          清空
        </Button>
      </div>
    </div>
  );
}
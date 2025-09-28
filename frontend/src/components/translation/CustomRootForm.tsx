import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Activity, RotateCcw } from "lucide-react";

interface CustomRootFormProps {
  onAddCustomRoot: (chinese: string, english: string) => void;
}

export function CustomRootForm({ onAddCustomRoot }: CustomRootFormProps) {
  const [newChinese, setNewChinese] = useState("");
  const [newEnglish, setNewEnglish] = useState("");

  const handleAdd = () => {
    if (newChinese.trim() && newEnglish.trim()) {
      onAddCustomRoot(newChinese, newEnglish);
      setNewChinese("");
      setNewEnglish("");
    }
  };

  const handleReset = () => {
    setNewChinese("");
    setNewEnglish("");
  };

  return (
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
            value={newChinese}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewChinese(e.target.value)
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
            value={newEnglish}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewEnglish(e.target.value)
            }
            placeholder="例如：securities、blockchain、ai"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleAdd}
          disabled={!newChinese.trim() || !newEnglish.trim()}
          variant="default"
        >
          <Activity className="w-4 h-4 mr-2" />
          添加词根
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          清空
        </Button>
      </div>
    </div>
  );
}
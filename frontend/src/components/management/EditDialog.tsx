import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EditingRoot } from "../shared/types";

interface EditDialogProps {
  editingRoot: EditingRoot | null;
  onOpenChange: (open: boolean) => void;
  onSave: (newChinese: string, newEnglish: string) => void;
}

export function EditDialog({
  editingRoot,
  onOpenChange,
  onSave,
}: EditDialogProps) {
  const handleSave = () => {
    const chineseInput = document.getElementById(
      "edit-chinese"
    ) as HTMLInputElement;
    const englishInput = document.getElementById(
      "edit-english"
    ) as HTMLInputElement;
    if (editingRoot) {
      onSave(chineseInput.value, englishInput.value);
    }
  };

  return (
    <Dialog open={!!editingRoot} onOpenChange={onOpenChange}>
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
          <Button onClick={() => onOpenChange(false)} variant="outline">
            取消
          </Button>
          <Button onClick={handleSave} variant="default">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
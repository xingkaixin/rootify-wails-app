import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ImportPreviewItem } from "../shared/types";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importPreview: ImportPreviewItem[];
  onConfirm: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  importPreview,
  onConfirm,
}: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button onClick={onConfirm} variant="default">
            确认导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
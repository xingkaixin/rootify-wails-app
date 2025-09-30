import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, FilePlus2 } from "lucide-react";
import { MixedTranslation } from "../shared/MixedTranslation";
import type { TableRowData } from "../shared/types";

interface TranslationTableProps {
  tableData: TableRowData[];
  onTableEdit: (index: number, chinese: string) => void;
  onDeleteRow: (index: number) => void;
  onAddRow: () => void;
  copiedIndex: number | null;
  onCopyText: (text: string, index: number) => void;
  onExportTSV: () => void;
}

export function TranslationTable({
  tableData,
  onTableEdit,
  onDeleteRow,
  onAddRow,
  copiedIndex,
  onCopyText,
  onExportTSV,
}: TranslationTableProps) {
  if (tableData.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="text-sm font-medium">翻译结果</div>
        <div className="flex gap-2">
          <Button
            onClick={onAddRow}
            variant="outline"
            size="sm"
          >
            <FilePlus2 className="w-4 h-4 mr-2" />
            添加行
          </Button>
          <Button
            onClick={onExportTSV}
            variant="default"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制到剪贴板
          </Button>
        </div>
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
                    onTableEdit(index, e.target.value)
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
                          onCopyText(row.english, index)
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
                      onClick={() => onDeleteRow(index)}
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
  );
}
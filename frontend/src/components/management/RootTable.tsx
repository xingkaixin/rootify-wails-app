import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface RootTableProps {
  roots: [string, string][];
  onEdit: (chinese: string, english: string) => void;
  onDelete: (chinese: string) => void;
}

export function RootTable({ roots, onEdit, onDelete }: RootTableProps) {
  return (
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
          {roots.map(([chinese, english]) => (
            <TableRow key={chinese}>
              <TableCell className="font-medium">{chinese}</TableCell>
              <TableCell className="font-mono text-blue-600">
                {english}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(chinese, english)}
                    size="sm"
                    variant="outline"
                  >
                    编辑
                  </Button>
                  <Button
                    onClick={() => onDelete(chinese)}
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
  );
}
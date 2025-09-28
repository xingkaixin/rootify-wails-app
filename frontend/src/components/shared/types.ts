export interface WordRoot {
  chinese: string;
  english: string;
}

export interface SegmentationResult {
  chinese: string;
  english: string;
  isUnknown?: boolean;
}

export interface TableRowData {
  chinese: string;
  english: string;
}

export interface ImportPreviewItem {
  chinese: string;
  english: string;
  action: "add" | "update";
}

export interface EditingRoot {
  chinese: string;
  english: string;
}

export type ActiveTab = "translation" | "management";
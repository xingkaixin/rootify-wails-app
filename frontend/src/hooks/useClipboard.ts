import { useState } from "react";
import { copyToClipboard } from "../services/csv";

export function useClipboard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = async (text: string, index: number) => {
    if (text) {
      const success = await copyToClipboard(text);
      if (success) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    }
  };

  return {
    copiedIndex,
    copyText,
  };
}
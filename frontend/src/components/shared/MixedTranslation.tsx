import { useState, useEffect } from "react";
import { segmentText } from "../../services/api";
import type { SegmentationResult } from "./types";

interface MixedTranslationProps {
  chinese: string;
}

export function MixedTranslation({ chinese }: MixedTranslationProps) {
  const [segments, setSegments] = useState<SegmentationResult[]>([]);

  useEffect(() => {
    if (chinese.trim()) {
      segmentText(chinese).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [chinese]);

  if (!chinese.trim()) {
    return <span className="text-gray-400">...</span>;
  }

  if (segments.length === 0) {
    return <span className="text-gray-400">加载中...</span>;
  }

  return (
    <>
      {segments.map((segment, index) => {
        const isMatched = !segment.isUnknown && segment.english.trim() !== "";

        if (isMatched) {
          return (
            <span key={index} className="text-green-600">
              {segment.english}
              {index < segments.length - 1 && "_"}
            </span>
          );
        } else {
          return (
            <span key={index} className="text-red-600">
              {segment.chinese}
              {index < segments.length - 1 && "_"}
            </span>
          );
        }
      })}
    </>
  );
}
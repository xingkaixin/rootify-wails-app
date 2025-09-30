import * as GoAPI from "../../wailsjs/go/app/App";
import type { SegmentationResult } from "../components/shared/types";

export async function getAllRoots(): Promise<Record<string, string>> {
  try {
    const roots = await GoAPI.GetAllRoots();
    return roots || {};
  } catch (error) {
    console.error("Failed to load roots:", error);
    return {};
  }
}

export async function segmentText(text: string): Promise<SegmentationResult[]> {
  try {
    const segments = await GoAPI.SegmentText(text);
    return (segments || []) as SegmentationResult[];
  } catch (error) {
    console.error("Failed to segment text:", error);
    return [];
  }
}

export async function translateText(text: string): Promise<string> {
  try {
    const translated = await GoAPI.TranslateText(text);
    return translated || "";
  } catch (error) {
    console.error("Failed to translate text:", error);
    return "";
  }
}

export async function addRoot(chinese: string, english: string): Promise<void> {
  try {
    await GoAPI.AddRoot(chinese.trim(), english.trim());
  } catch (error) {
    console.error("Failed to add root:", error);
    throw error;
  }
}

export async function deleteRoot(chinese: string): Promise<void> {
  try {
    await GoAPI.DeleteRoot(chinese);
  } catch (error) {
    console.error("Failed to delete root:", error);
    throw error;
  }
}

export async function clearAllRoots(): Promise<void> {
  try {
    await GoAPI.ClearAllRoots();
  } catch (error) {
    console.error("Failed to clear roots:", error);
    throw error;
  }
}

export async function importRoots(roots: Record<string, string>): Promise<void> {
  try {
    await GoAPI.ImportRoots(roots);
  } catch (error) {
    console.error("Failed to import roots:", error);
    throw error;
  }
}

export async function exportRoots(): Promise<string> {
  try {
    const csvContent = await GoAPI.ExportRoots();
    return csvContent || "中文词根,英文对应\n";
  } catch (error) {
    console.error("Failed to export roots:", error);
    throw error;
  }
}

// Translation History API
export interface TranslationHistoryItem {
  id: number;
  chineseText: string;
  englishText: string;
  createdAt: string;
}

export async function saveTranslationHistory(chineseText: string, englishText: string): Promise<void> {
  try {
    await GoAPI.SaveTranslationHistory(chineseText, englishText);
  } catch (error) {
    console.error("Failed to save translation history:", error);
    // 不抛出错误，历史记录保存失败不应影响主要功能
  }
}

export async function getTranslationHistory(): Promise<TranslationHistoryItem[]> {
  try {
    const history = await GoAPI.GetTranslationHistory();
    return (history || []) as TranslationHistoryItem[];
  } catch (error) {
    console.error("Failed to get translation history:", error);
    return [];
  }
}

export async function clearTranslationHistory(): Promise<void> {
  try {
    await GoAPI.ClearTranslationHistory();
  } catch (error) {
    console.error("Failed to clear translation history:", error);
    throw error;
  }
}

export async function isTranslationComplete(text: string): Promise<boolean> {
  try {
    const isComplete = await GoAPI.IsTranslationComplete(text);
    return isComplete || false;
  } catch (error) {
    console.error("Failed to check translation completeness:", error);
    return false;
  }
}
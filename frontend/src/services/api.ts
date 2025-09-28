import * as GoAPI from "../../wailsjs/go/main/App";
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
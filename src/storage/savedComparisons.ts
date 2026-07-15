import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import { type DiffOptions, type SavedComparison } from "../diff/types";

const STORAGE_KEY = "difflens:saved-comparisons:v1";

interface ReadResult {
  items: SavedComparison[];
  error: string | null;
}

function isDiffOptions(value: unknown): value is DiffOptions {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  const hasBooleanFlags =
    typeof o.ignoreLeadingTrailing === "boolean" &&
    typeof o.ignoreAllWhitespace === "boolean" &&
    typeof o.ignoreBlankLines === "boolean" &&
    typeof o.ignoreCase === "boolean";
  const hasInlineMode = o.inlineMode === "word" || o.inlineMode === "char";
  return hasBooleanFlags && hasInlineMode;
}

function isSavedComparison(value: unknown): value is SavedComparison {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.before === "string" &&
    typeof item.after === "string" &&
    isDiffOptions(item.options)
  );
}

export function readSavedComparisons(): ReadResult {
  if (typeof window === "undefined") {
    return { items: [], error: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return { items: [], error: null };
  }

  let json: string | null;
  try {
    json = decompressFromUTF16(raw);
  } catch {
    return { items: [], error: "저장 데이터를 압축 해제하지 못했습니다." };
  }
  if (json === null) {
    return { items: [], error: "저장 데이터 형식이 올바르지 않습니다." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { items: [], error: "저장 데이터를 읽지 못했습니다(JSON 파싱 실패)." };
  }

  if (!Array.isArray(parsed) || !parsed.every(isSavedComparison)) {
    return { items: [], error: "저장 데이터 스키마가 올바르지 않습니다." };
  }

  return { items: parsed, error: null };
}

export function persistSavedComparisons(items: SavedComparison[]): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const compressed = compressToUTF16(JSON.stringify(items));
  try {
    window.localStorage.setItem(STORAGE_KEY, compressed);
    return null;
  } catch {
    return "저장 공간이 부족하거나 localStorage에 쓸 수 없습니다.";
  }
}

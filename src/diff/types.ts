export type LineStatus = "equal" | "added" | "removed" | "modified";

/** An inline segment inside a modified line (word/char level). */
export interface InlineSegment {
  text: string;
  changed: boolean;
}

/** One side (before or after) of a rendered diff row. */
export interface RowSide {
  /** 1-based line number, or null when this side is a placeholder. */
  lineNumber: number | null;
  /** Raw line text, or null when this side is a placeholder. */
  text: string | null;
  /** Inline segments for modified lines; null when not applicable. */
  segments: InlineSegment[] | null;
}

/** A single aligned row across the before/after panels. */
export interface DiffRow {
  status: LineStatus;
  left: RowSide;
  right: RowSide;
  /** Index into the list of change blocks, or null for equal rows. */
  changeIndex: number | null;
}

export type InlineMode = "word" | "char";

export interface DiffOptions {
  /** ignoreLeadingTrailing: trim leading/trailing whitespace before compare. */
  ignoreLeadingTrailing: boolean;
  /** ignoreAllWhitespace: remove all whitespace before compare. */
  ignoreAllWhitespace: boolean;
  /** ignoreBlankLines: drop empty lines from comparison. */
  ignoreBlankLines: boolean;
  /** ignoreCase: case-insensitive comparison. */
  ignoreCase: boolean;
  /** Inline diff granularity for modified lines. */
  inlineMode: InlineMode;
}

export const defaultOptions: DiffOptions = {
  ignoreLeadingTrailing: false,
  ignoreAllWhitespace: false,
  ignoreBlankLines: false,
  ignoreCase: false,
  inlineMode: "word",
};

export interface DiffResult {
  rows: DiffRow[];
  /** Total number of change blocks (consecutive non-equal rows). */
  changeCount: number;
}

export interface SavedComparison {
  id: string;
  createdAt: string;
  before: string;
  after: string;
  options: DiffOptions;
}

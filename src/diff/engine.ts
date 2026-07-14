import {
  diffArrays,
  diffChars,
  diffWordsWithSpace,
  type Change,
} from "diff";
import {
  type DiffOptions,
  type DiffResult,
  type DiffRow,
  type InlineSegment,
  type RowSide,
} from "./types";

interface Line {
  /** original 1-based line number */
  n: number;
  text: string;
}

/** Normalize a line's text for comparison according to the options. */
function normalize(text: string, opts: DiffOptions): string {
  let out = text;
  if (opts.ignoreAllWhitespace) {
    out = out.replace(/\s+/g, "");
  } else if (opts.ignoreLeadingTrailing) {
    out = out.trim();
  }
  if (opts.ignoreCase) {
    out = out.toLowerCase();
  }
  return out;
}

function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

/** Split text into lines, keeping original line numbers. */
function toLines(text: string, opts: DiffOptions): Line[] {
  const raw = text.length === 0 ? [] : text.split("\n");
  const lines: Line[] = raw.map((t, i) => ({ n: i + 1, text: t }));
  if (opts.ignoreBlankLines) {
    return lines.filter((l) => !isBlank(l.text));
  }
  return lines;
}

/** Build inline segments for a modified pair of lines. */
function inlineSegments(
  before: string,
  after: string,
  opts: DiffOptions,
): { left: InlineSegment[]; right: InlineSegment[] } {
  const parts: Change[] =
    opts.inlineMode === "char"
      ? diffChars(before, after)
      : diffWordsWithSpace(before, after);

  const left: InlineSegment[] = [];
  const right: InlineSegment[] = [];
  for (const part of parts) {
    if (part.added) {
      right.push({ text: part.value, changed: true });
    } else if (part.removed) {
      left.push({ text: part.value, changed: true });
    } else {
      left.push({ text: part.value, changed: false });
      right.push({ text: part.value, changed: false });
    }
  }
  return { left, right };
}

function equalRow(left: Line, right: Line): DiffRow {
  return {
    status: "equal",
    changeIndex: null,
    left: { lineNumber: left.n, text: left.text, segments: null },
    right: { lineNumber: right.n, text: right.text, segments: null },
  };
}

const emptySide: RowSide = { lineNumber: null, text: null, segments: null };

/**
 * Compute an aligned, JetBrains-style side-by-side diff of two texts.
 * Left is treated as "before", right as "after".
 */
export function computeDiff(
  beforeText: string,
  afterText: string,
  opts: DiffOptions,
): DiffResult {
  const beforeLines = toLines(beforeText, opts);
  const afterLines = toLines(afterText, opts);

  const parts = diffArrays<Line, Line>(beforeLines, afterLines, {
    comparator: (a, b) => normalize(a.text, opts) === normalize(b.text, opts),
  });

  const rows: DiffRow[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const value = part.value as Line[];

    if (!part.added && !part.removed) {
      // Equal block: pair one-to-one.
      for (const line of value) {
        rows.push(equalRow(line, line));
      }
      continue;
    }

    if (part.removed) {
      const next = parts[i + 1];
      if (next && next.added) {
        // Removed immediately followed by added => treat overlapping lines as
        // modified pairs, remaining lines as pure delete / add.
        const removedLines = value;
        const addedLines = next.value as Line[];
        const pairCount = Math.min(removedLines.length, addedLines.length);

        for (let k = 0; k < pairCount; k++) {
          const l = removedLines[k];
          const r = addedLines[k];
          const seg = inlineSegments(l.text, r.text, opts);
          rows.push({
            status: "modified",
            changeIndex: null,
            left: { lineNumber: l.n, text: l.text, segments: seg.left },
            right: { lineNumber: r.n, text: r.text, segments: seg.right },
          });
        }
        for (let k = pairCount; k < removedLines.length; k++) {
          const l = removedLines[k];
          rows.push({
            status: "removed",
            changeIndex: null,
            left: { lineNumber: l.n, text: l.text, segments: null },
            right: emptySide,
          });
        }
        for (let k = pairCount; k < addedLines.length; k++) {
          const r = addedLines[k];
          rows.push({
            status: "added",
            changeIndex: null,
            left: emptySide,
            right: { lineNumber: r.n, text: r.text, segments: null },
          });
        }
        i++; // consume the paired "added" part
        continue;
      }

      // Pure removals.
      for (const l of value) {
        rows.push({
          status: "removed",
          changeIndex: null,
          left: { lineNumber: l.n, text: l.text, segments: null },
          right: emptySide,
        });
      }
      continue;
    }

    // Pure additions.
    for (const r of value) {
      rows.push({
        status: "added",
        changeIndex: null,
        left: emptySide,
        right: { lineNumber: r.n, text: r.text, segments: null },
      });
    }
  }

  // Assign change-block indices to contiguous runs of non-equal rows.
  let changeCount = 0;
  let inBlock = false;
  for (const row of rows) {
    if (row.status === "equal") {
      inBlock = false;
      continue;
    }
    if (!inBlock) {
      changeCount++;
      inBlock = true;
    }
    row.changeIndex = changeCount - 1;
  }

  return { rows, changeCount };
}

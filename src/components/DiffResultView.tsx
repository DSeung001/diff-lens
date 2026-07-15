import { useEffect, useMemo, useRef, useState } from "react";
import { type DiffResult, type DiffRow, type RowSide } from "../diff/types";

interface DiffResultViewProps {
  result: DiffResult;
  beforeText: string;
  afterText: string;
  onBeforeTextChange: (value: string) => void;
  onAfterTextChange: (value: string) => void;
  onEdit: () => void;
  onSwap: () => void;
}

const statusIcon: Record<DiffRow["status"], string> = {
  equal: "",
  added: "+",
  removed: "-",
  modified: "~",
};

interface SideCellProps {
  side: RowSide;
  status: DiffRow["status"];
  editable: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onCommit: (nextText: string) => void;
}

function SideCell({
  side,
  status,
  editable,
  isEditing,
  onStartEdit,
  onEndEdit,
  onCommit,
}: SideCellProps) {
  const isPlaceholder = side.text === null;
  const displayText = side.text ?? "";
  const editableClass = editable ? " editable" : "";

  if (!editable) {
    return (
      <div className={`diff-line status-${status}${isPlaceholder ? " placeholder" : ""}`}>
        <span className="gutter" aria-hidden={side.lineNumber === null}>
          {side.lineNumber ?? ""}
        </span>
        <span className="marker" aria-hidden="true">
          {statusIcon[status]}
        </span>
        <code className="content">{displayText}</code>
      </div>
    );
  }

  return (
    <div className={`diff-line status-${status}${isPlaceholder ? " placeholder" : ""}`}>
      <span className="gutter" aria-hidden={side.lineNumber === null}>
        {side.lineNumber ?? ""}
      </span>
      <span className="marker" aria-hidden="true">
        {statusIcon[status]}
      </span>
      <code
        className={`content content-editable${editableClass}`}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onFocus={onStartEdit}
        onBlur={(e) => {
          onCommit(e.currentTarget.textContent ?? "");
          onEndEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        }}
      >
        {isEditing
          ? displayText
          : side.segments
            ? side.segments.map((seg, i) => (
                <span key={i} className={seg.changed ? "inline-changed" : undefined}>
                  {seg.text}
                </span>
              ))
            : displayText}
      </code>
    </div>
  );
}

export function DiffResultView({
  result,
  beforeText,
  afterText,
  onBeforeTextChange,
  onAfterTextChange,
  onEdit,
  onSwap,
}: DiffResultViewProps) {
  const { rows, changeCount } = result;
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // First row index for each change block, used to scroll into view.
  const blockRowIndex = useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach((row, i) => {
      if (row.changeIndex !== null && !map.has(row.changeIndex)) {
        map.set(row.changeIndex, i);
      }
    });
    return map;
  }, [rows]);

  // Bidirectional scroll synchronization between the two panes.
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    let lock = false;
    const sync = (src: HTMLDivElement, dst: HTMLDivElement) => () => {
      if (lock) return;
      lock = true;
      dst.scrollTop = src.scrollTop;
      dst.scrollLeft = src.scrollLeft;
      requestAnimationFrame(() => {
        lock = false;
      });
    };
    const onLeft = sync(left, right);
    const onRight = sync(right, left);
    left.addEventListener("scroll", onLeft);
    right.addEventListener("scroll", onRight);
    return () => {
      left.removeEventListener("scroll", onLeft);
      right.removeEventListener("scroll", onRight);
    };
  }, []);

  const goTo = (index: number) => {
    if (changeCount === 0) return;
    const clamped = (index + changeCount) % changeCount;
    setCurrent(clamped);
    const rowIdx = blockRowIndex.get(clamped);
    if (rowIdx === undefined) return;
    const rowHeight = 20; // matches --line-height in CSS
    const target = Math.max(0, rowIdx * rowHeight - 80);
    leftRef.current?.scrollTo({ top: target, behavior: "smooth" });
  };

  const updatePaneLine = (
    sourceText: string,
    rowIndex: number,
    lineNumber: number | null,
    side: "left" | "right",
    nextText: string,
  ) => {
    const lines = sourceText.length > 0 ? sourceText.split("\n") : [];
    const normalized = nextText.replace(/\r?\n/g, "");

    if (lineNumber !== null) {
      const targetIdx = Math.max(0, lineNumber - 1);
      while (lines.length <= targetIdx) {
        lines.push("");
      }
      lines[targetIdx] = normalized;
      return lines.join("\n");
    }

    const linesBefore = rows
      .slice(0, rowIndex)
      .filter((row) => (side === "left" ? row.left.lineNumber : row.right.lineNumber) !== null)
      .length;
    lines.splice(linesBefore, 0, normalized);
    return lines.join("\n");
  };

  const commitCellEdit = (
    side: "left" | "right",
    rowIndex: number,
    lineNumber: number | null,
    nextText: string,
  ) => {
    if (lineNumber === null && nextText.trim().length === 0) {
      return;
    }

    if (side === "left") {
      onBeforeTextChange(updatePaneLine(beforeText, rowIndex, lineNumber, side, nextText));
      return;
    }
    onAfterTextChange(updatePaneLine(afterText, rowIndex, lineNumber, side, nextText));
  };

  return (
    <div className="result-view">
      <div className="result-toolbar">
        <div className="button-group">
          <button className="btn" onClick={onEdit}>
            ← Edit
          </button>
          <button className="btn" onClick={onSwap}>
            Swap
          </button>
        </div>
        <div className="nav-group">
          <button
            className="btn"
            onClick={() => goTo(current - 1)}
            disabled={changeCount === 0}
            aria-label="Previous change"
          >
            ↑ Prev
          </button>
          <button
            className="btn"
            onClick={() => goTo(current + 1)}
            disabled={changeCount === 0}
            aria-label="Next change"
          >
            ↓ Next
          </button>
          <span className="change-counter" aria-live="polite">
            {changeCount === 0
              ? "No changes"
              : `${current + 1} / ${changeCount} changes`}
          </span>
        </div>
      </div>

      <div className="diff-panels">
        <div className="diff-pane" ref={leftRef}>
          <div className="pane-header">Before</div>
          <div className="pane-body">
            {rows.map((row, i) => (
              <SideCell
                key={i}
                side={row.left}
                status={row.status}
                editable={true}
                isEditing={editingCell === `left-${i}`}
                onStartEdit={() => setEditingCell(`left-${i}`)}
                onEndEdit={() => setEditingCell(null)}
                onCommit={(nextText) =>
                  commitCellEdit("left", i, row.left.lineNumber, nextText)
                }
              />
            ))}
          </div>
        </div>
        <div className="diff-pane" ref={rightRef}>
          <div className="pane-header">After</div>
          <div className="pane-body">
            {rows.map((row, i) => (
              <SideCell
                key={i}
                side={row.right}
                status={row.status}
                editable={true}
                isEditing={editingCell === `right-${i}`}
                onStartEdit={() => setEditingCell(`right-${i}`)}
                onEndEdit={() => setEditingCell(null)}
                onCommit={(nextText) =>
                  commitCellEdit("right", i, row.right.lineNumber, nextText)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

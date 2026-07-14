import { useEffect, useMemo, useRef, useState } from "react";
import { type DiffResult, type DiffRow, type RowSide } from "../diff/types";

interface DiffResultViewProps {
  result: DiffResult;
  onEdit: () => void;
  onSwap: () => void;
}

const statusIcon: Record<DiffRow["status"], string> = {
  equal: "",
  added: "+",
  removed: "-",
  modified: "~",
};

function SideCell({ side, status }: { side: RowSide; status: DiffRow["status"] }) {
  const isPlaceholder = side.text === null;
  return (
    <div className={`diff-line status-${status}${isPlaceholder ? " placeholder" : ""}`}>
      <span className="gutter" aria-hidden={side.lineNumber === null}>
        {side.lineNumber ?? ""}
      </span>
      <span className="marker" aria-hidden="true">
        {statusIcon[status]}
      </span>
      <code className="content">
        {side.segments
          ? side.segments.map((seg, i) => (
              <span key={i} className={seg.changed ? "inline-changed" : undefined}>
                {seg.text}
              </span>
            ))
          : side.text}
      </code>
    </div>
  );
}

export function DiffResultView({ result, onEdit, onSwap }: DiffResultViewProps) {
  const { rows, changeCount } = result;
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

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
              <SideCell key={i} side={row.left} status={row.status} />
            ))}
          </div>
        </div>
        <div className="diff-pane" ref={rightRef}>
          <div className="pane-header">After</div>
          <div className="pane-body">
            {rows.map((row, i) => (
              <SideCell key={i} side={row.right} status={row.status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

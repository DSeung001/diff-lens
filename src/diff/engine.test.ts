import { describe, it, expect } from "vitest";
import { computeDiff } from "./engine";
import { defaultOptions, type DiffOptions } from "./types";

const opts = (o: Partial<DiffOptions> = {}): DiffOptions => ({
  ...defaultOptions,
  ...o,
});

describe("computeDiff", () => {
  it("marks identical text as all equal", () => {
    const { rows, changeCount } = computeDiff("a\nb\nc", "a\nb\nc", opts());
    expect(changeCount).toBe(0);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.status === "equal")).toBe(true);
  });

  it("detects a pure addition", () => {
    const { rows, changeCount } = computeDiff("a\nb", "a\nb\nc", opts());
    expect(changeCount).toBe(1);
    const added = rows.find((r) => r.status === "added");
    expect(added?.right.text).toBe("c");
    expect(added?.left.text).toBeNull();
  });

  it("detects a pure removal", () => {
    const { rows } = computeDiff("a\nb\nc", "a\nc", opts());
    const removed = rows.find((r) => r.status === "removed");
    expect(removed?.left.text).toBe("b");
    expect(removed?.right.text).toBeNull();
  });

  it("pairs a changed line as modified with inline segments", () => {
    const { rows } = computeDiff(
      'const userName = "kim";',
      'const userName = "lee";',
      opts(),
    );
    const mod = rows.find((r) => r.status === "modified");
    expect(mod).toBeDefined();
    const leftChanged = mod!.left.segments!.filter((s) => s.changed).map((s) => s.text);
    const rightChanged = mod!.right.segments!.filter((s) => s.changed).map((s) => s.text);
    expect(leftChanged.join("")).toContain("kim");
    expect(rightChanged.join("")).toContain("lee");
  });

  it("keeps original line numbers on both sides", () => {
    const { rows } = computeDiff("a\nb\nc", "a\nx\nc", opts());
    const mod = rows.find((r) => r.status === "modified");
    expect(mod!.left.lineNumber).toBe(2);
    expect(mod!.right.lineNumber).toBe(2);
  });

  it("respects ignoreCase", () => {
    const strict = computeDiff("Hello", "hello", opts());
    expect(strict.changeCount).toBe(1);
    const loose = computeDiff("Hello", "hello", opts({ ignoreCase: true }));
    expect(loose.changeCount).toBe(0);
  });

  it("respects ignoreAllWhitespace", () => {
    const loose = computeDiff("a b c", "a  b   c", opts({ ignoreAllWhitespace: true }));
    expect(loose.changeCount).toBe(0);
  });

  it("respects ignoreLeadingTrailing", () => {
    const loose = computeDiff("  a", "a  ", opts({ ignoreLeadingTrailing: true }));
    expect(loose.changeCount).toBe(0);
  });

  it("drops blank lines when ignoreBlankLines is set", () => {
    const loose = computeDiff("a\n\nb", "a\nb", opts({ ignoreBlankLines: true }));
    expect(loose.changeCount).toBe(0);
    expect(loose.rows).toHaveLength(2);
  });

  it("counts separate change blocks", () => {
    const { changeCount } = computeDiff("a\nb\nc\nd", "x\nb\nc\ny", opts());
    expect(changeCount).toBe(2);
  });
});

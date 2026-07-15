import { useEffect, useMemo, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { DiffResultView } from "./components/DiffResultView";
import { SavedComparisonsSidebar } from "./components/SavedComparisonsSidebar";
import { computeDiff } from "./diff/engine";
import {
  defaultOptions,
  type DiffOptions,
  type DiffResult,
  type SavedComparison,
} from "./diff/types";
import {
  persistSavedComparisons,
  readSavedComparisons,
} from "./storage/savedComparisons";

type View = "input" | "result";
type Theme = "light" | "dark";

const sampleBefore = `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}`;

const sampleAfter = `function greet(name) {
  const message = \`Hi, \${name}!\`;
  console.log(message);
  return message.trim();
}`;

export default function App() {
  const [view, setView] = useState<View>("input");
  const [before, setBefore] = useState(sampleBefore);
  const [after, setAfter] = useState(sampleAfter);
  const [options, setOptions] = useState<DiffOptions>(defaultOptions);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    () =>
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const { items, error } = readSavedComparisons();
    setSavedComparisons(items);
    setStorageError(error);
  }, []);

  // Recompute when returning to the result view or toggling options.
  const compare = () => {
    setResult(computeDiff(before, after, options));
    setView("result");
  };

  // Keep the result in sync if options change while viewing it.
  const liveResult = useMemo(() => {
    if (view !== "result") return result;
    return computeDiff(before, after, options);
  }, [view, before, after, options, result]);

  const swap = () => {
    setBefore(after);
    setAfter(before);
    if (view === "result") {
      setResult(computeDiff(after, before, options));
    }
  };

  const clear = () => {
    setBefore("");
    setAfter("");
    setResult(null);
  };

  const saveCurrent = () => {
    const next: SavedComparison[] = [
      {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        createdAt: new Date().toISOString(),
        before,
        after,
        options,
      },
      ...savedComparisons,
    ];
    const error = persistSavedComparisons(next);
    if (error) {
      setStorageError(error);
      return;
    }
    setSavedComparisons(next);
    setStorageError(null);
  };

  const loadSaved = (id: string) => {
    const target = savedComparisons.find((item) => item.id === id);
    if (!target) return;
    setBefore(target.before);
    setAfter(target.after);
    setOptions(target.options);
    setResult(computeDiff(target.before, target.after, target.options));
    setView("result");
  };

  const deleteSaved = (id: string) => {
    const next = savedComparisons.filter((item) => item.id !== id);
    const error = persistSavedComparisons(next);
    if (error) {
      setStorageError(error);
      return;
    }
    setSavedComparisons(next);
    setStorageError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ⌕
          </span>
          <h1>DiffLens</h1>
          <span className="tagline">Client-side text diff · nothing leaves your browser</span>
        </div>
        <button
          className="btn theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <main className={`app-main ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <SavedComparisonsSidebar
          isOpen={isSidebarOpen}
          items={savedComparisons}
          errorMessage={storageError}
          onToggle={() => setIsSidebarOpen((v) => !v)}
          onSaveCurrent={saveCurrent}
          onLoad={loadSaved}
          onDelete={deleteSaved}
        />

        <section className="main-content">
          {view === "input" || !liveResult ? (
            <InputPanel
              before={before}
              after={after}
              options={options}
              onBeforeChange={setBefore}
              onAfterChange={setAfter}
              onOptionsChange={setOptions}
              onCompare={compare}
              onSwap={swap}
              onClear={clear}
            />
          ) : (
            <DiffResultView
              result={liveResult}
              beforeText={before}
              afterText={after}
              onBeforeTextChange={setBefore}
              onAfterTextChange={setAfter}
              onEdit={() => setView("input")}
              onSwap={swap}
            />
          )}
        </section>
      </main>
    </div>
  );
}

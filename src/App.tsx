import { useEffect, useMemo, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { DiffResultView } from "./components/DiffResultView";
import { computeDiff } from "./diff/engine";
import { defaultOptions, type DiffOptions, type DiffResult } from "./diff/types";

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

      <main className="app-main">
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
            onEdit={() => setView("input")}
            onSwap={swap}
          />
        )}
      </main>
    </div>
  );
}

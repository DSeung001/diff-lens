import { type DiffOptions } from "../diff/types";
import { OptionsBar } from "./OptionsBar";

interface InputPanelProps {
  before: string;
  after: string;
  options: DiffOptions;
  onBeforeChange: (v: string) => void;
  onAfterChange: (v: string) => void;
  onOptionsChange: (o: DiffOptions) => void;
  onCompare: () => void;
  onSwap: () => void;
  onClear: () => void;
}

export function InputPanel({
  before,
  after,
  options,
  onBeforeChange,
  onAfterChange,
  onOptionsChange,
  onCompare,
  onSwap,
  onClear,
}: InputPanelProps) {
  const canCompare = before.length > 0 || after.length > 0;

  return (
    <div className="input-view">
      <div className="editor-grid">
        <div className="editor-col">
          <label className="editor-label" htmlFor="before">
            Before <span className="muted">(original)</span>
          </label>
          <textarea
            id="before"
            className="editor"
            value={before}
            spellCheck={false}
            placeholder="Paste the original text here…"
            onChange={(e) => onBeforeChange(e.target.value)}
          />
        </div>
        <div className="editor-col">
          <label className="editor-label" htmlFor="after">
            After <span className="muted">(changed)</span>
          </label>
          <textarea
            id="after"
            className="editor"
            value={after}
            spellCheck={false}
            placeholder="Paste the changed text here…"
            onChange={(e) => onAfterChange(e.target.value)}
          />
        </div>
      </div>

      <div className="input-toolbar">
        <div className="button-group">
          <button className="btn btn-primary" onClick={onCompare} disabled={!canCompare}>
            Compare
          </button>
          <button className="btn" onClick={onSwap}>
            Swap
          </button>
          <button className="btn" onClick={onClear} disabled={!canCompare}>
            Clear
          </button>
        </div>
        <OptionsBar options={options} onChange={onOptionsChange} />
      </div>
    </div>
  );
}

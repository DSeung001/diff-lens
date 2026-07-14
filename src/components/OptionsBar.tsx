import { type DiffOptions, type InlineMode } from "../diff/types";

interface OptionsBarProps {
  options: DiffOptions;
  onChange: (options: DiffOptions) => void;
}

interface Toggle {
  key: keyof Omit<DiffOptions, "inlineMode">;
  label: string;
}

const toggles: Toggle[] = [
  { key: "ignoreLeadingTrailing", label: "Trim whitespace" },
  { key: "ignoreAllWhitespace", label: "Ignore all whitespace" },
  { key: "ignoreBlankLines", label: "Ignore blank lines" },
  { key: "ignoreCase", label: "Ignore case" },
];

export function OptionsBar({ options, onChange }: OptionsBarProps) {
  return (
    <div className="options-bar" role="group" aria-label="Comparison options">
      {toggles.map((t) => (
        <label key={t.key} className="option">
          <input
            type="checkbox"
            checked={options[t.key]}
            onChange={(e) => onChange({ ...options, [t.key]: e.target.checked })}
          />
          <span>{t.label}</span>
        </label>
      ))}
      <label className="option">
        <span>Inline</span>
        <select
          value={options.inlineMode}
          onChange={(e) =>
            onChange({ ...options, inlineMode: e.target.value as InlineMode })
          }
          aria-label="Inline diff granularity"
        >
          <option value="word">Word</option>
          <option value="char">Character</option>
        </select>
      </label>
    </div>
  );
}

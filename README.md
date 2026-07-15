# DiffLens

A web-based, **JetBrains-style** text diff tool. Paste a *before* and *after* text
and DiffLens highlights added, removed, and modified lines — plus the exact
words/characters that changed inside a modified line.

All comparison happens **in your browser**. Your text is never uploaded anywhere.

## Features (MVP)

- Side-by-side *Before* / *After* input
- Left-based line diff: added / removed / modified / equal
- Intra-line (word or character) change highlighting
- Line numbers with placeholder alignment for added/removed lines
- Synchronized scrolling between the two panels
- Change navigation (Prev / Next, `n / m changes`)
- Swap left/right, clear, and return-to-edit
- Comparison options: trim whitespace, ignore all whitespace, ignore blank
  lines, ignore case
- Light / dark theme, responsive (stacks on narrow screens)

## Tech stack

- React + TypeScript + Vite
- [`diff`](https://www.npmjs.com/package/diff) for line/word/char diffing
- Custom rendering for a JetBrains-like UI

## Development

```bash
npm install
npm run dev      # http://localhost:5173/diff-lens/
npm test         # run the diff-engine unit tests
npm run build    # type-check + production build into dist/
```

## Deployment (GitHub Pages)

The app deploys automatically to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main`.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment →
Source** and select **GitHub Actions**.

Live site: https://dseung001.github.io/diff-lens/

The base path is set in `vite.config.ts` (`/diff-lens/`) and can be overridden
with the `BASE_PATH` environment variable when building for another host.

## Project structure

```
src/
  diff/
    types.ts        # shared diff types & options
    engine.ts       # line + inline diff, alignment, options
    engine.test.ts  # unit tests
  components/
    InputPanel.tsx      # two textareas + toolbar
    OptionsBar.tsx      # comparison options
    DiffResultView.tsx  # side-by-side result, scroll sync, navigation
  App.tsx           # input <-> result state machine, theme
  main.tsx
  styles.css
```
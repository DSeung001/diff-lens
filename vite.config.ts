import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path for GitHub Pages project site (https://<user>.github.io/diff-lens/).
// Overridable via BASE_PATH for other hosts or local preview.
const base = process.env.BASE_PATH ?? "/diff-lens/";

export default defineConfig({
  base,
  plugins: [react()],
});

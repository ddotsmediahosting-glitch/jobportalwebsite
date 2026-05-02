// Resolve the tailwind config path relative to this file, NOT process.cwd().
// Without this, when vite is invoked from /app (the monorepo root) instead of
// /app/frontend, tailwind auto-discovery searches /app for tailwind.config,
// finds nothing, and silently falls back to defaults with empty content[].
// That makes every custom class (ring-brand-400, etc.) "not exist" at build.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: resolve(__dirname, 'tailwind.config.ts') },
    autoprefixer: {},
  },
};

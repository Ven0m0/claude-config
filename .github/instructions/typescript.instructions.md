---
applyTo: '**/*.{ts,tsx,js,jsx,mjs,cjs}'
---

JS/TS in this repository uses Bun as runtime and package manager, Biome for formatting and linting.

- Use `bun` and `bunx`, never `npm` or `npx`.
- Check and fix Biome issues with `bun run lint:biome` and `bun run lint:biome:fix`.
- Type-check with `bunx tsc --noEmit`.
- Follow Biome config in `biome.json`: 2-space indent, line width 120, single quotes.
- Keep TypeScript compatible with `tsconfig.json` strictness (`noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`).
- Do not use CommonJS `require()` in new files — use ES module imports.

---
name: moai-lang-javascript
description: JavaScript specialist for Node.js, Bun, and Deno with modern async patterns, API development, testing, and lint/format workflows. Use when building or refactoring JavaScript applications.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read, Grep, Glob, Bash
user-invocable: false
metadata:
  version: "2.0.0"
  category: "language"
  status: "active"
  updated: "2026-02-22"
---

# JavaScript Development (Lean)

## When to use

- `.js`, `.mjs`, `.cjs`, `package.json`
- Node/Bun/Deno runtime work
- API handlers, async flows, test/lint setup

## Defaults

- Prefer **Bun** for install/run/test where compatible.
- Prefer async/await over nested promise chains.
- Keep modules explicit (ESM preferred unless project is CJS).
- Add input validation at API boundaries.

## Quick workflow

1. Detect runtime and package manager from repo files.
2. Keep change minimal and idiomatic.
3. Add or update tests near touched behavior.
4. Run lint/tests; report exact commands and outcomes.

## Runtime commands

### Bun-first

- Install: `bun install`
- Run script: `bun run <script>`
- Test: `bun test`
- One-off: `bunx <tool>`

### Node fallback

- Install: `npm install`
- Test: `npm test`
- Type check (TS interop): `npx tsc --noEmit`

### Deno

- Run: `deno run -A main.ts`
- Test: `deno test`

## Implementation checklist

- Use small pure helpers for transform logic.
- Centralize error handling at service/API boundaries.
- Avoid mutable shared state across async operations.
- Prefer native platform APIs before adding dependencies.

## Validation checklist

- Lint and format pass.
- Tests cover changed paths.
- No secrets in code or logs.
- Error messages are actionable.

## References

- `reference.md` - compact runtime/tooling matrix
- `examples.md` - API/test/config snippets
- `../AGENT_SKILL_SPEC.md` - shared Anthropic/Copilot alignment

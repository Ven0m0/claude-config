---
name: moai-lang-typescript
description: TypeScript specialist for strict typing, React/Next.js patterns, schema validation, and type-safe API workflows. Use when implementing or refactoring TypeScript codebases.
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

# TypeScript Development (Lean)

## When to use

- `.ts`, `.tsx`, `tsconfig.json`
- React/Next.js code paths
- API clients/servers requiring strict typing

## Defaults

- Keep `strict: true`.
- Prefer inferred types unless explicit types improve readability.
- Validate untrusted input with schemas (for example Zod).
- Use discriminated unions instead of boolean mode flags.

## Quick workflow

1. Confirm type boundaries (input/output contracts).
2. Implement smallest typed change.
3. Add/update tests.
4. Run type check + lint + test.

## Commands

- Install/run (Bun-compatible repos): `bun install`, `bun run <script>`
- Type check: `bunx tsc --noEmit` or `npx tsc --noEmit`
- Tests: `bun test` or project test script

## Implementation checklist

- No `any` unless documented and justified.
- Exhaustive branching for tagged unions.
- Public types exported from stable module boundaries.
- Runtime validation for API and form payloads.

## Validation checklist

- `tsc --noEmit` passes.
- Lint passes.
- Tests pass for changed behavior.
- Build output unchanged unless intended.

## References

- `reference.md` - type and architecture patterns
- `examples.md` - compact TS/React examples
- `../AGENT_SKILL_SPEC.md` - shared Anthropic/Copilot alignment

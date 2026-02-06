---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/tsconfig.json"
---

# TypeScript Rules

Version: TypeScript 5.9+

## Package Manager - DETECT FIRST

**MANDATORY: Detect and use the project's existing package manager. NEVER mix package managers.**

| Lock file | Package manager |
|-----------|----------------|
| `bun.lockb` | bun |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` | npm |

No lock file? Check `packageManager` in `package.json`, or default to npm.

## Tooling

- Linting: ESLint 9 flat config or Biome
- Formatting: Prettier or Biome
- Testing: Vitest (recommended) or Jest
- Package management: pnpm (recommended) or npm

## Type Safety

- Enable strict mode: `"strict": true` in tsconfig.json
- **No `any`** - use `unknown` for truly unknown types
- Explicit return types on all exported functions
- Use `satisfies` operator for type checking without widening
- Interfaces for objects, types for unions
- Use Zod for runtime validation with `z.infer<>` for type inference

```typescript
// Explicit returns on exports
export function processOrder(orderId: string, userId: number): Order { ... }

// Interfaces for objects, types for unions
interface User { id: string; email: string; }
type Status = 'pending' | 'active' | 'suspended';
```

## Testing - Minimal Output

**Always use minimal output flags to avoid context bloat.**

```bash
bun test -- --silent                    # Suppress console.log output
bun test -- --reporters=dot             # Minimal dot reporter
bun test -- --bail                      # Stop on first failure
```

Avoid `--verbose`, `--expand`, `--debug` unless actively debugging a specific test.

## React 19 Patterns

- Default to Server Components, use 'use client' only when needed
- Use `useActionState` for form actions
- Use `useOptimistic` for optimistic UI updates
- Use `use()` for reading promises and context
- Enable React Compiler for automatic memoization

## Next.js 15.5

- Use App Router with route groups for organization
- Fetch data in Server Components
- Use `React.cache()` for request memoization
- Implement streaming with Suspense boundaries

## Verification Checklist

Before completing TypeScript work:

1. **Type check:** `tsc --noEmit` or project's `typecheck` script
2. **Lint:** `eslint . --fix` or project's `lint` script
3. **Format:** `prettier --write .` or project's `format` script
4. **Tests:** Project's `test` script (with minimal output flags)

**BLOCKERS - Do NOT mark work complete if:**
- Type checking fails (`tsc --noEmit` has errors)
- Lint errors exist
- Tests fail

Verify:
- [ ] Explicit return types on exports
- [ ] No `any` types (use `unknown`)
- [ ] Correct lock file committed

## Quick Reference

| Task | npm | yarn | pnpm | bun |
|------|-----|------|------|-----|
| Install all | `npm install` | `yarn` | `pnpm install` | `bun install` |
| Add package | `npm install pkg` | `yarn add pkg` | `pnpm add pkg` | `bun add pkg` |
| Add dev dep | `npm install -D pkg` | `yarn add -D pkg` | `pnpm add -D pkg` | `bun add -D pkg` |
| Run script | `npm run script` | `yarn script` | `pnpm script` | `bun script` |
| Type check | `npx tsc --noEmit` | `yarn tsc --noEmit` | `pnpm tsc --noEmit` | `bunx tsc --noEmit` |

## Related skills

- Use skills under `claude/skills/` for detailed patterns (typescript).

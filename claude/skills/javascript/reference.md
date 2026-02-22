# JavaScript Reference (Compact)

## Runtime selection

| Situation | Preferred runtime |
|---|---|
| Existing Bun lockfile / scripts | Bun |
| Existing npm/pnpm ecosystem only | Node.js |
| Deno-native project | Deno |

## Lint/format

| Tool | Use |
|---|---|
| Biome | Fast lint + format baseline |
| ESLint | Existing ecosystem or custom rule sets |

## Testing

| Scope | Tool |
|---|---|
| Unit/integration | Vitest or Bun test |
| Legacy/compat | Jest |
| E2E browser | Playwright |

## API patterns

- Validate input before business logic.
- Return consistent error objects.
- Use structured logging with request context.

## Canonical docs

- Node.js: https://nodejs.org/en/docs
- Bun: https://bun.sh/docs
- Deno: https://docs.deno.com/
- Vitest: https://vitest.dev/
- Biome: https://biomejs.dev/

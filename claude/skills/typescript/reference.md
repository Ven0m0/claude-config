# TypeScript Reference (Compact)

## Type design priorities

1. Model domain data with discriminated unions.
2. Keep function signatures explicit at public boundaries.
3. Use utility types (`Pick`, `Omit`, `Partial`) sparingly and clearly.
4. Prefer composition over deep generic nesting.

## React and Next.js notes

- Server and client boundaries must be explicit.
- Keep data fetching near the route boundary.
- Pass typed DTOs to components, not raw ORM records.

## Schema strategy

- Validate external input at runtime.
- Infer static types from schemas to avoid drift.

## Canonical docs

- TypeScript handbook: https://www.typescriptlang.org/docs/
- React docs: https://react.dev/
- Next.js docs: https://nextjs.org/docs
- Zod docs: https://zod.dev/

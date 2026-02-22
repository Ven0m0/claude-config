# TypeScript Examples (Compact)

## Discriminated union

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}
```

## Zod schema + inferred type

```ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;
```

## React component boundary

```tsx
type UserCardProps = {
  user: { name: string; email: string };
};

export function UserCard({ user }: UserCardProps) {
  return (
    <article>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </article>
  );
}
```

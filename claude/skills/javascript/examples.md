# JavaScript Examples (Compact)

## API route with validation

```js
import { z } from "zod";

const payloadSchema = z.object({ name: z.string().min(1) });

export async function createUser(req, res) {
  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const user = await saveUser(parsed.data);
  res.status(201).json(user);
}
```

## Async retry helper

```js
export async function retry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
```

## Vitest test pattern

```js
import { describe, expect, it } from "vitest";
import { retry } from "./retry.js";

describe("retry", () => {
  it("returns on first success", async () => {
    const result = await retry(async () => 42);
    expect(result).toBe(42);
  });
});
```

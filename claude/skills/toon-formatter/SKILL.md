---
name: toon-formatter
description: Compress and format structured data with TOON to cut prompt size without losing shape. Use for JSON, tables, logs, API responses, or repeated records when token budget matters.
disable-model-invocation: true
user-invocable: true
---

# TOON Formatter

Use TOON for structured data when you want JSON-level fidelity with fewer tokens.
It works best for repeated records, tables, logs, metrics, and API responses.
Expect roughly 30-60% savings on regular data.

## Use TOON When

- Arrays have at least 5 similar items.
- Objects mostly share the same keys.
- Shape matters more than JSON punctuation.
- You want compact data in prompts, summaries, or agent handoffs.

## Keep JSON When

- Arrays are tiny.
- Data is deeply nested or irregular.
- Another tool must consume JSON directly.
- The output is prose, instructions, or a one-off example.

## Fastest Workflow

If the `toon` CLI is available, pipe structured output through it:

```bash
curl -s "https://api.example.com/data" | toon
cat data.json | toon
some_command | toon
```

`toon` is safe on non-JSON output and passes it through unchanged.

If you need a local file converter in this repo, use:

```bash
python3 claude/skills/toon-formatter/toon-convert.py input.json -o output.toon
python3 claude/skills/toon-formatter/toon-convert.py data.json --delimiter tab
```

## Manual Formatting Rules

### 1. Pick the right array form

- **Inline** for short primitive arrays: `tags[3]: alpha,beta,gamma`
- **Tabular** for regular objects:

  ```toon
  [2]{id,name}:
    1,Alice
    2,Bob
  ```

- **List form** for mixed or irregular items:

  ```toon
  [2]:
    - name: Alice
      role: admin
    - error: timeout
  ```

### 2. Pick the delimiter

- Comma: default and most compact
- Tab: better when values contain commas
- Pipe: useful when you want markdown-like rows

### 3. Keep explanations short

State the format choice once, then show the data:

```text
Using TOON for 150 user records (uniform shape, lower token cost).
```

## Examples

### API response

```toon
[2]{id,name,email}:
  1,Alice,alice@example.com
  2,Bob,bob@example.com
```

### Nested keys with folding

```toon
server.host: localhost
server.port: 8080
database.host: db.example.com
```

## Install

The standalone CLI is `@toon-format/cli`.

## References

- Spec: https://github.com/toon-format/spec
- Format site: https://toonformat.dev
- Local converter: `claude/skills/toon-formatter/toon-convert.py`

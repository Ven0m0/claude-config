---
name: fast-apply
description: Apply small, anchored edits quickly and safely. Use when a change can be pinned between stable pre-context and post-context markers instead of editing a whole file by hand.
---

# Fast Apply

Use anchored replacements for narrow edits where the surrounding context is stable.

## When to Use

- one block needs replacement and you can identify unique context around it
- the file is large, but the edit is small
- you want a fast patch without reopening the whole file
- you need to verify the target block before writing

## Anchored workflow

1. Find a unique anchor with context:

```bash
rg -n -C 2 'target-pattern' path/to/file
```

2. Capture three parts:

```text
PRE-CONTEXT
...stable lines before the edit...

TARGET
...exact block to replace...

POST-CONTEXT
...stable lines after the edit...
```

3. Replace only the anchored block.

## Preferred replacement patterns

### `sd` with explicit anchors

```bash
sd '(?s)PRE-CONTEXT\nold block\nPOST-CONTEXT' 'PRE-CONTEXT\nnew block\nPOST-CONTEXT' path/to/file
```

### Python for stricter assertions

```bash
python3 - <<'PY'
from pathlib import Path

path = Path('path/to/file')
text = path.read_text()
old = """PRE-CONTEXT
old block
POST-CONTEXT"""
new = """PRE-CONTEXT
new block
POST-CONTEXT"""

if text.count(old) != 1:
    raise SystemExit('Anchor was not unique')

path.write_text(text.replace(old, new, 1))
PY
```

## Guardrails

- Keep the pre-context and post-context as short as possible, but unique.
- Abort if the anchor matches zero or multiple locations.
- Re-run `rg -n -C 2` after the replacement to verify the final block.
- Use a broader edit flow if the target is repeated or unstable.

## Notes/Inspiration

Inspired by [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply) and adapted to this repo's `rg`-first workflow.

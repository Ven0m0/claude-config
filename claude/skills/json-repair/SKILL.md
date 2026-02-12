---
name: json-repair
description: >
  Use the `json_repair` Python library to fix invalid/malformed JSON, especially
  output from LLMs. Trigger this skill whenever you encounter broken JSON strings,
  need to parse unreliable JSON from model outputs, want a drop-in replacement for
  json.loads() that auto-repairs, or are building pipelines that consume LLM-generated
  JSON. Also use when the user mentions "json repair", "fix json", "malformed json",
  "invalid json from LLM", or needs to robustly parse JSON that may have missing
  quotes, trailing commas, unescaped characters, or other common LLM output defects.
---

# json_repair

A zero-dependency Python module that repairs invalid JSON strings — designed
specifically for the messy output LLMs produce (missing quotes, trailing commas,
unescaped characters, incomplete structures).

Install: `pip install json-repair`

## Quick Reference

### Core API

**`repair_json(json_str, return_objects=False, skip_json_loads=False, ensure_ascii=True, strict=False, schema=None, stream_stable=False, **kwargs)`**

Repairs a JSON string. Returns a valid JSON string by default, or a Python object
when `return_objects=True`. Passes through all `json.dumps()` kwargs (indent, etc).

**`json_repair.loads(json_str, **kwargs)`** — drop-in replacement for `json.loads()`.
Returns a Python object. Accepts same kwargs as `repair_json`.

**`json_repair.load(fd, **kwargs)`** — drop-in replacement for `json.load()`.
Reads from a file descriptor.

**`json_repair.from_file(path, **kwargs)`** — reads and repairs JSON from a file path.

### Usage Patterns

**Simple repair (string → string):**
```python
from json_repair import repair_json

fixed = repair_json('{"name": "test", "value": 42,}')
```

**Direct to object (fastest path — skips serialization):**
```python
import json_repair

obj = json_repair.loads(bad_json_string)
# or equivalently:
obj = json_repair.repair_json(bad_json_string, return_objects=True)
```

**From file:**
```python
import json_repair

obj = json_repair.from_file("output.json")
# or with file descriptor:
with open("output.json", "rb") as f:
    obj = json_repair.load(f)
```

### Key Parameters

`return_objects=True` — return Python object instead of JSON string. Always faster
because it skips re-serialization.

`skip_json_loads=True` — skip the initial `json.loads()` validation check. Faster
only when you already know the input is invalid.

`ensure_ascii=False` — preserve non-Latin characters (CJK, Cyrillic, etc) in output
instead of escaping to `\uXXXX`.

`strict=True` — raise `ValueError` on structural issues (duplicate keys, missing
separators, empty keys) instead of repairing them. Useful for validation with
friendly error messages.

`stream_stable=True` — enable streaming-compatible repairs for incremental JSON input.

`schema=<dict|PydanticModel>` — guide repairs with a JSON Schema or Pydantic v2 model.
Requires `pip install 'json-repair[schema]'`. Fills missing values, coerces types,
drops disallowed properties. Mutually exclusive with `strict=True`.

### What It Fixes

LLM output commonly has these defects that json_repair handles:

- Missing or mismatched quotes around keys/values
- Trailing commas in objects and arrays
- Unescaped special characters in strings
- Incomplete key-value pairs (fills with `null` or `""`)
- Missing closing brackets/braces
- Single quotes instead of double quotes
- Comments or extra non-JSON characters mixed in
- Broken arrays/objects with missing elements
- Improperly formatted boolean/null literals

### Anti-Pattern — Don't Do This

```python
# WRONG: wasteful double-parse
try:
    obj = json.loads(s)
except json.JSONDecodeError:
    obj = json_repair.loads(s)

# RIGHT: json_repair already checks validity first
obj = json_repair.loads(s)

# RIGHT: if you insist on try/except, at least skip the redundant check
try:
    obj = json.loads(s)
except json.JSONDecodeError:
    obj = json_repair.loads(s, skip_json_loads=True)
```

### Schema-Guided Repairs (Beta)

Requires: `pip install 'json-repair[schema]'`

```python
from json_repair import repair_json

schema = {
    "type": "object",
    "properties": {"value": {"type": "integer"}},
    "required": ["value"],
}
# Coerces "1" → 1, fills missing required fields
result = repair_json('{"value": "1"}', schema=schema, return_objects=True)
```

With Pydantic v2:
```python
from pydantic import BaseModel, Field
from json_repair import repair_json

class Payload(BaseModel):
    value: int
    tags: list[str] = Field(default_factory=list)

result = repair_json(
    '{"value": "1", "tags": }',
    schema=Payload,
    skip_json_loads=True,
    return_objects=True,
)
# → {"value": 1, "tags": []}
```

### CLI Usage

```
pip install json-repair   # or: pipx install json-repair

json_repair input.json                     # repair and print to stdout
json_repair -i input.json                  # repair in-place
json_repair -o fixed.json input.json       # repair to output file
cat broken.json | json_repair              # pipe from stdin
json_repair --indent 4 input.json          # custom indentation
json_repair --strict input.json            # validate instead of repair
json_repair --schema schema.json input.json  # schema-guided repair
```

### Performance Tips

In order of impact: `return_objects=True` is always faster (skips serialization),
`skip_json_loads=True` helps when input is known-invalid, and pass raw strings
(`r"..."`) when dealing with complex escaping. The library has zero external
dependencies by design.

### Version Pinning

Pin major only: `json_repair==0.*` — the library uses strict semver with frequent
minor/patch releases and no breaking changes within a major version.

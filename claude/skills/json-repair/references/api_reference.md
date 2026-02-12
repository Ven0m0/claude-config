# json_repair API Reference

## Table of Contents
- [Module-level functions](#module-level-functions)
- [Parameter details](#parameter-details)
- [Edge cases and behaviors](#edge-cases-and-behaviors)
- [Integration patterns](#integration-patterns)

## Module-level Functions

### `repair_json(json_str, return_objects=False, skip_json_loads=False, ensure_ascii=True, strict=False, schema=None, stream_stable=False, **kwargs)`

Primary repair function. All other functions delegate to this.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| json_str | str | required | The potentially broken JSON string |
| return_objects | bool | False | Return Python object instead of JSON string |
| skip_json_loads | bool | False | Skip initial json.loads() validity check |
| ensure_ascii | bool | True | Escape non-ASCII chars (set False for CJK/Unicode) |
| strict | bool | False | Raise ValueError on structural issues |
| schema | dict\|BaseModel\|None | None | JSON Schema or Pydantic model for guided repair |
| stream_stable | bool | False | Streaming-compatible repair mode |
| **kwargs | | | Passed to json.dumps() (indent, sort_keys, etc) |

Returns: `str` (default) or `dict|list|str|int|float|bool|None` (when return_objects=True).
On catastrophic failure with return_objects=False: returns `""`.

### `loads(json_str, **kwargs)`
Drop-in for `json.loads()`. Equivalent to `repair_json(json_str, return_objects=True, **kwargs)`.

### `load(fd, **kwargs)`
Drop-in for `json.load()`. Reads from file descriptor, then repairs.

### `from_file(path, **kwargs)`
Opens file at `path`, reads content, repairs. Does NOT catch IOError/OSError.

## Parameter Details

### `strict=True` raises on:
- Duplicate keys in objects
- Missing `:` separators between key-value pairs
- Empty keys or values introduced by stray commas
- Multiple top-level elements
- Other ambiguous constructs

### `schema` parameter (requires `json-repair[schema]`):
- Accepts JSON Schema dict or Pydantic v2 BaseModel class
- Fills missing required fields with defaults
- Coerces scalar types where safe (e.g. `"1"` → `1` for integer fields)
- Drops properties not in schema
- Raises `ValueError` if input can't be made schema-valid
- Applied to both valid and invalid JSON input
- Mutually exclusive with `strict=True`

### `stream_stable=True`:
- For use with streaming LLM output
- Handles incomplete JSON that grows incrementally
- Returns best-effort repair of partial input

## Edge Cases and Behaviors

**Empty/whitespace input:** returns `""` (string mode) or `""` (object mode)

**Already valid JSON:** returned as-is (unless schema forces changes). The
`json.loads()` fast-path handles this efficiently.

**Multiple top-level values:** repairs to single structure (array wrapping or
takes first). Use `strict=True` to reject.

**Non-Latin text:** with default `ensure_ascii=True`, characters like `统一码`
become `\u7edf\u4e00\u7801`. Pass `ensure_ascii=False` to preserve.

**Raw strings for escaping:** when input has complex escapes, pass as raw string:
`repair_json(r'string with escaping\"')`.

## Integration Patterns

### LLM Pipeline (robust parsing)
```python
import json_repair

def parse_llm_output(text: str) -> dict:
    return json_repair.loads(text)
```

### Validated LLM Pipeline (schema-enforced)
```python
from pydantic import BaseModel
from json_repair import repair_json

class Response(BaseModel):
    answer: str
    confidence: float

def parse_validated(text: str) -> dict:
    return repair_json(text, schema=Response, return_objects=True)
```

### Batch file repair
```python
from pathlib import Path
from json_repair import repair_json

for p in Path("data").glob("*.json"):
    fixed = repair_json(p.read_text(), ensure_ascii=False, indent=2)
    p.write_text(fixed)
```

### Streaming repair
```python
from json_repair import repair_json

buffer = ""
for chunk in llm_stream():
    buffer += chunk
    partial = repair_json(buffer, stream_stable=True, return_objects=True)
    update_ui(partial)
```

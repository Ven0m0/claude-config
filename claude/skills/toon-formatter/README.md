# TOON v2.0 Converter

Spec-compliant Python tool to convert JSON files to TOON (Token-Oriented Object Notation) v2.0 format.

**Implements:** [TOON Specification v2.0](https://github.com/toon-format/spec)

## Features

- ✅ **Zero dependencies** (stdlib only)
- ✅ **Spec-compliant** quoting rules (§7)
- ✅ **Three delimiters** (comma, tab, pipe)
- ✅ **Tabular arrays** for uniform objects
- ✅ **Proper type handling** (null, bool, numbers)
- ✅ **Escape sequences** (only 5 valid: \\ \" \n \r \t)
- ✅ **Empty containers** (objects/arrays)
- ✅ **List-item objects** with tabular arrays (§10)
- ✅ **Configurable indentation**

## Usage

```bash
# Basic conversion (stdin/stdout)
cat data.json | ./toon_convert.py

# File input/output
./toon_convert.py input.json -o output.toon

# Tab delimiter (better token efficiency)
./toon_convert.py data.json -d tab -o output.toon

# Pipe delimiter
./toon_convert.py data.json -d pipe

# Custom indentation
./toon_convert.py data.json -i 4
```

## Options

```
positional:
  input              JSON file (stdin if omitted)

optional:
  -o, --output FILE      Output file (stdout if omitted)
  -d, --delimiter TYPE   comma|tab|pipe (default: comma)
  -i, --indent N         Spaces per indent level (default: 2)
```

## Examples

### Tabular Arrays (Uniform Objects)

**Input JSON:**
```json
{
  "users": [
    {"id": 1, "name": "Alice", "age": 30},
    {"id": 2, "name": "Bob", "age": 25}
  ]
}
```

**Output TOON:**
```
users: [2]{id,name,age}:
  1,Alice,30
  2,Bob,25
```

**With Tab Delimiter:**
```
users: [2	]{id	name	age}:
  1	Alice	30
  2	Bob	25
```

### Nested Objects

**Input JSON:**
```json
{
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432
    }
  }
}
```

**Output TOON:**
```
config:
  database:
    host: localhost
    port: 5432
```

### Primitive Arrays

**Input JSON:**
```json
{
  "tags": ["admin", "user", "guest"]
}
```

**Output TOON:**
```
tags: [3]: admin,user,guest
```

### Mixed Arrays

**Input JSON:**
```json
{
  "mixed": [
    {"type": "A", "val": 1},
    42,
    "text",
    null
  ]
}
```

**Output TOON:**
```
mixed: [4]:
  - type: A
    val: 1
  - 42
  - text
  - null
```

### Quoting Special Cases

**Input JSON:**
```json
{
  "special": {
    "keyword": "true",
    "number": "42",
    "comma": "hello, world",
    "spaces": " padded ",
    "empty": ""
  }
}
```

**Output TOON:**
```
special:
  keyword: "true"
  number: "42"
  comma: "hello, world"
  spaces: " padded "
  empty: ""
```

## Format Features

### Objects
YAML-like indentation, no braces:
```
key: value
nested:
  field: value
```

### Arrays (3 types)

**1. Primitive (inline):**
```
tags[3]: javascript,react,node
```

**2. Tabular (uniform objects):**
```
users[2]{id,name}:
  1,Alice
  2,Bob
```

**3. Mixed/List (non-uniform):**
```
items[3]:
  - type: A
  - 42
  - text
```

### Delimiters

**Comma (default, most compact):**
```
[3]: a,b,c
```

**Tab (best for data with commas):**
```
[3	]: a	b	c
```

**Pipe (markdown-like):**
```
[3|]: a|b|c
```

## Spec Compliance

Implements TOON v2.0 specification:
- **§7**: Quoting rules (keywords, numbers, delimiters, special chars)
- **§7**: Escape sequences (only 5 valid: \\ \" \n \r \t)
- **§8**: Object encoding with indentation
- **§9**: Array encoding (primitive, tabular, mixed)
- **§10**: List-item objects with tabular arrays
- **§11**: Delimiter scoping and handling
- **§12**: Indentation and whitespace

### Quoting Rules

Strings are quoted ONLY when necessary:
- Empty string
- Keywords: `true`, `false`, `null`
- Looks like number: `42`, `3.14`, `1e6`, `05`
- Special characters: `: " \ [ ] { } \n \r \t`
- Contains active delimiter
- Leading/trailing whitespace
- Equals `-` or starts with `-`

### Type Conversions

| Input | Output |
|-------|--------|
| Finite numbers | Canonical decimal (no exponent) |
| `NaN`, `Infinity` | `null` |
| `-0` | `0` |
| Scientific notation | Expanded (1e6 → 1000000) |

## Token Savings

TOON reduces tokens by 30-60% vs JSON for structured data:
- **Uniform arrays**: ~45% savings
- **Nested objects**: ~35% savings  
- **Mixed data**: ~30% savings

## Resources

- **Spec**: https://github.com/toon-format/spec
- **Official Site**: https://toonformat.dev
- **Python Implementation**: https://github.com/toon-format/toon-python
- **Playground**: https://toonformat.dev/playground

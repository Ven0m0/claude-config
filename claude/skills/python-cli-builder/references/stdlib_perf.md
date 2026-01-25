# Python Performance Stdlib Guide

Optimize Python scripts using stdlib and strategic external tool integration.

## File Operations

### File Discovery

**Problem**: Find files recursively by extension

**Options**:

```python
# Option 1: fd subprocess (fastest: ~10x faster than os.walk)
import subprocess as sp
from pathlib import Path

def find_files_fd(root: Path, exts: frozenset[str]) -> list[Path]:
  if not shutil.which('fd'): return []
  cmd = ['fd', '--type', 'f'] + [x for e in exts for x in ['-e', e.lstrip('.')]]
  cmd.extend(['.', str(root)])
  try:
    out = sp.run(cmd, capture_output=True, text=True, check=True).stdout
    return [Path(p) for p in out.strip().split('\n') if p]
  except sp.CalledProcessError:
    return []

# Option 2: os.walk (stdlib fallback, ~3x faster than Path.rglob)
def find_files_walk(root: Path, exts: frozenset[str]) -> list[Path]:
  files: list[Path] = []
  for dirpath, _, filenames in os.walk(root):
    for f in filenames:
      p = Path(dirpath) / f
      if p.suffix.lower() in exts:
        files.append(p)
  return files

# Option 3: Path.rglob (slowest, but simplest)
def find_files_glob(root: Path, exts: frozenset[str]) -> list[Path]:
  return [p for ext in exts for p in root.rglob(f'*{ext}')]

# Recommendation: Use fd with os.walk fallback
def find_files(root: Path, exts: frozenset[str]) -> list[Path]:
  return find_files_fd(root, exts) or find_files_walk(root, exts)
```

**Benchmark** (10K files):

- `fd`: 50ms
- `os.walk`: 500ms
- `Path.rglob`: 1500ms

### File Reading

**Problem**: Read large files efficiently

**Options**:

```python
# Small files (<1MB): read_text
content = Path('file.txt').read_text()

# Large files: generators (constant memory)
def read_lines(path: Path) -> Iterator[str]:
  with path.open() as f:
    for line in f:
      yield line.strip()

# Entire stdin: sys.stdin.read() (~2x faster than iteration)
import sys
data = sys.stdin.read()

# Binary data: read_bytes or chunks
with path.open('rb') as f:
  while chunk := f.read(8192):
    process(chunk)
```

## Data Structures

### Lookups

**Problem**: Check membership efficiently

**Options**:

```python
# List: O(n) lookup
items = ['a', 'b', 'c']
if 'b' in items: pass  # Slow for large lists

# Set: O(1) lookup (~100x faster for 1000+ items)
items = {'a', 'b', 'c'}
if 'b' in items: pass

# Frozenset: O(1) lookup, immutable (use for constants)
VALID_EXTS: Final = frozenset({'.py', '.txt', '.md'})
if ext in VALID_EXTS: pass

# Dict: O(1) key lookup
counts = {'a': 5, 'b': 10}
if 'a' in counts: pass
```

**Benchmark** (1000 items, 10K lookups):

- `list`: 50ms
- `set`: 0.5ms
- `frozenset`: 0.5ms
- `dict`: 0.5ms

**Recommendation**: Always use `set`/`frozenset`/`dict` for lookups, never `list`

### Counting

**Problem**: Count occurrences

**Options**:

```python
from collections import defaultdict, Counter

# Manual dict (verbose)
counts: dict[str, int] = {}
for item in items:
  counts[item] = counts.get(item, 0) + 1

# defaultdict (clean)
counts: dict[str, int] = defaultdict(int)
for item in items:
  counts[item] += 1

# Counter (most concise)
counts = Counter(items)
```

**Recommendation**: Use `Counter` for simple counting, `defaultdict(int)` for accumulation

### Deduplication

**Problem**: Remove duplicates while preserving order

**Options**:

```python
# set (fastest but loses order)
unique = list(set(items))

# dict.fromkeys (preserves order, Python 3.7+)
unique = list(dict.fromkeys(items))

# Manual with set tracking (explicit)
seen = set()
unique = [x for x in items if x not in seen and not seen.add(x)]
```

**Recommendation**: Use `dict.fromkeys()` when order matters, `set()` otherwise

## String Operations

### Find and Replace

**Problem**: Replace substrings

**Options**:

```python
# str.replace (fastest for simple literal replacements)
result = text.replace('old', 'new')

# str.translate (fastest for character mappings)
trans = str.maketrans({'a': 'A', 'b': 'B'})
result = text.translate(trans)

# re.sub (slowest, use only for patterns)
import re
result = re.sub(r'\d+', 'NUM', text)  # Precompile if reused!
pattern = re.compile(r'\d+')
result = pattern.sub('NUM', text)
```

**Benchmark** (1MB text):

- `str.replace`: 5ms
- `str.translate`: 3ms
- `re.sub` (compiled): 50ms
- `re.sub` (not compiled): 200ms

**Recommendation**: Use `str.replace` for literals, `str.translate` for char maps, precompile regex

### Splitting

**Problem**: Split text efficiently

**Options**:

```python
# str.split (fastest, use when possible)
parts = text.split(',')

# re.split (use for complex patterns only)
import re
parts = re.split(r'[,;]+', text)

# str.splitlines (optimized for line splitting)
lines = text.splitlines()  # Faster than text.split('\n')
```

## Generators vs Lists

**Problem**: Process large sequences

**Rule**: Use generators for large data, lists for small/reused data

```python
# Generator: O(1) memory, single-pass
def process_large_file(path: Path) -> Iterator[str]:
  with path.open() as f:
    for line in f:
      if line.strip():
        yield line.upper()

# List: O(n) memory, reusable
def process_small_file(path: Path) -> list[str]:
  with path.open() as f:
    return [line.upper() for line in f if line.strip()]

# Generator expression (lazy)
lines = (line.strip() for line in f if line)

# List comprehension (eager)
lines = [line.strip() for line in f if line]
```

**Recommendation**: Default to generators for pipelines, lists when you need random access

## External Tool Integration

### When to Shell Out

**Use subprocess when**:

- Tool is 5-10x faster than Python
- Pure Python requires complex algorithm
- Tool is commonly installed (fd, rg, git)

**Stay in Python when**:

- Simple operations (string replace, file read)
- Need error handling/retry logic
- Subprocess overhead > processing time

### Common Tools

```python
import shutil
import subprocess as sp

def has(cmd: str) -> bool:
  """Check if tool exists."""
  return shutil.which(cmd) is not None

# fd: File finding (~10x faster than os.walk)
if has('fd'):
  result = sp.run(['fd', '-e', 'py', '.'], capture_output=True, text=True)
  files = result.stdout.strip().split('\n')

# rg (ripgrep): Text search (~100x faster than grep)
if has('rg'):
  result = sp.run(['rg', '-l', 'pattern', '.'], capture_output=True, text=True)
  matching_files = result.stdout.strip().split('\n')

# parallel (GNU parallel): Parallel processing
if has('parallel'):
  sp.run(['parallel', 'ffmpeg', '-i', '{}', ':::'] + files)

# zstd: Compression (~3x faster than gzip)
if has('zstd'):
  sp.run(['zstd', '-q', 'file.txt'])
```

### Subprocess Best Practices

```python
# Always set timeout
sp.run(cmd, timeout=30)

# Capture output efficiently
result = sp.run(cmd, capture_output=True, text=True, check=True)

# Handle errors explicitly
try:
  result = sp.run(cmd, capture_output=True, text=True, check=True, timeout=10)
except sp.CalledProcessError as e:
  print(f"Command failed: {e.stderr}")
except sp.TimeoutExpired:
  print("Command timed out")
```

## Algorithm Complexity

### Common Patterns

```python
# O(n²) - AVOID
for i in items:
  for j in items:
    if i == j: ...

# O(n) - GOOD
seen = set()
for item in items:
  if item in seen:
    continue
  seen.add(item)

# O(n log n) - ACCEPTABLE for sorting
sorted_items = sorted(items)

# O(1) - BEST (dict/set lookups)
lookup = {item: idx for idx, item in enumerate(items)}
if key in lookup: ...
```

**Recommendation**: Target O(n) or better, avoid nested loops

## JSON Performance

**Problem**: Parse/serialize JSON

**Options**:

```python
# json (stdlib): baseline
import json
data = json.loads(text)
result = json.dumps(data)

# orjson (external): ~6x faster, requires pip
import orjson
data = orjson.loads(text)
result = orjson.dumps(data)  # Returns bytes
```

**Benchmark** (1MB JSON):

- `json.loads`: 30ms
- `orjson.loads`: 5ms
- `json.dumps`: 25ms
- `orjson.dumps`: 4ms

**Recommendation**: Use stdlib `json` by default, `orjson` for high-throughput services

## Memory Optimization

### Slots for Dataclasses

```python
from dataclasses import dataclass

# Without slots: ~400 bytes per instance
@dataclass
class Point:
  x: int
  y: int

# With slots: ~80 bytes per instance (~5x reduction)
@dataclass(slots=True)
class Point:
  x: int
  y: int

# frozen + slots: Immutable + memory efficient
@dataclass(frozen=True, slots=True)
class Point:
  x: int
  y: int
```

**Recommendation**: Always use `slots=True` for dataclasses with many instances

### String Interning

```python
# For repeated strings (like tags, categories)
import sys

# Manual intern (saves memory when string appears 100+ times)
category = sys.intern('python')

# Automatic for literals
x = 'python'  # Interned automatically
y = 'python'
assert x is y  # True
```

## Summary: Quick Reference

| Task         | Fastest              | Fallback                   |
| ------------ | -------------------- | -------------------------- |
| File finding | `fd` subprocess      | `os.walk`                  |
| Text search  | `rg` subprocess      | `str.find` / `re.search`   |
| Lookups      | `frozenset` / `dict` | Never `list`               |
| Replace      | `str.replace`        | `str.translate`            |
| Regex        | Precompile           | One-time `re.sub`          |
| Large files  | Generators           | Never full read            |
| JSON         | `json` (stdlib)      | `orjson` (high-throughput) |
| Dataclasses  | `slots=True`         | Regular class              |
| Complexity   | O(n) target          | Avoid O(n²)                |

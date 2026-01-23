# Common Python CLI Patterns

Battle-tested patterns for typical CLI tool scenarios.

## File Processor Pattern

Process files recursively with progress reporting.

```python
#!/usr/bin/env python3
"""Process files with progress tracking."""
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Final

VIDEO_EXTS: Final = frozenset({'.mp4', '.mkv', '.avi'})

@dataclass(frozen=True, slots=True)
class Stats:
  processed: int = 0
  failed: int = 0
  skipped: int = 0

def process_file(path: Path) -> bool:
  """Process single file. Returns True on success."""
  try:
    # Processing logic here
    return True
  except Exception as e:
    print(f"Failed {path.name}: {e}", file=sys.stderr)
    return False

def process_batch(files: list[Path]) -> Stats:
  """Process multiple files with stats."""
  stats = Stats()
  for i, path in enumerate(files, 1):
    print(f"[{i}/{len(files)}] {path.name}")
    if process_file(path):
      stats = Stats(stats.processed + 1, stats.failed, stats.skipped)
    else:
      stats = Stats(stats.processed, stats.failed + 1, stats.skipped)
  return stats

def main() -> int:
  root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
  files = [p for p in root.rglob('*') if p.suffix in VIDEO_EXTS]
  stats = process_batch(files)
  print(f"Processed: {stats.processed}, Failed: {stats.failed}")
  return 1 if stats.failed else 0

if __name__ == "__main__":
  sys.exit(main())
```

## Git Repository Scanner Pattern

Recursively scan git repos and aggregate data.

```python
#!/usr/bin/env python3
"""Scan git repositories for stats."""
import subprocess as sp
from pathlib import Path
from collections import defaultdict

def run_git(cmd: list[str], cwd: Path) -> str:
  """Run git command safely."""
  try:
    return sp.run(
      ["git", *cmd],
      cwd=cwd,
      capture_output=True,
      text=True,
      timeout=10,
      check=True
    ).stdout.strip()
  except (sp.CalledProcessError, sp.TimeoutExpired):
    return ""

def find_repos(root: Path) -> list[Path]:
  """Find all git repositories recursively."""
  repos: list[Path] = []
  for item in root.rglob('.git'):
    if item.is_dir():
      repos.append(item.parent)
  return repos

def get_commits(repo: Path) -> int:
  """Count commits in repository."""
  out = run_git(["rev-list", "--count", "HEAD"], repo)
  return int(out) if out else 0

def main() -> int:
  root = Path.cwd()
  repos = find_repos(root)
  total = sum(get_commits(r) for r in repos)
  print(f"Found {len(repos)} repos, {total} commits")
  return 0
```

## Data Aggregation Pattern

Collect and aggregate data from multiple sources.

```python
#!/usr/bin/env python3
"""Aggregate data with typed results."""
from dataclasses import dataclass
from collections import defaultdict
from typing import Final

@dataclass(frozen=True, slots=True)
class Result:
  count: int
  total: int
  average: float

def aggregate_data(items: list[int]) -> Result:
  """Aggregate numeric data."""
  count = len(items)
  total = sum(items)
  average = total / count if count else 0.0
  return Result(count, total, average)

def aggregate_by_key(data: dict[str, list[int]]) -> dict[str, Result]:
  """Aggregate multiple series by key."""
  return {key: aggregate_data(values) for key, values in data.items()}

def main() -> int:
  # Example: Aggregate file sizes by extension
  from pathlib import Path
  sizes: dict[str, list[int]] = defaultdict(list)
  for path in Path.cwd().rglob('*'):
    if path.is_file():
      sizes[path.suffix].append(path.stat().st_size)

  results = aggregate_by_key(sizes)
  for ext, result in sorted(results.items()):
    print(f"{ext}: {result.count} files, avg {result.average/1024:.1f}KB")
  return 0
```

## Subprocess Orchestration Pattern

Run external tools with proper error handling.

```python
#!/usr/bin/env python3
"""Orchestrate multiple external tools."""
import shutil
import subprocess as sp
from pathlib import Path

def has(cmd: str) -> bool:
  """Check if command exists."""
  return shutil.which(cmd) is not None

def run_tool(cmd: list[str], desc: str) -> bool:
  """Run tool with logging."""
  print(f"Running: {desc}")
  try:
    sp.run(cmd, check=True, timeout=60)
    return True
  except (sp.CalledProcessError, sp.TimeoutExpired) as e:
    print(f"Failed: {e}")
    return False

def main() -> int:
  if not has('ffmpeg'):
    print("Error: ffmpeg not found")
    return 1

  input_file = Path("input.mp4")
  output_file = Path("output.mp4")

  cmd = [
    'ffmpeg', '-i', str(input_file),
    '-c:v', 'libx264', '-crf', '23',
    str(output_file)
  ]

  success = run_tool(cmd, "Converting video")
  return 0 if success else 1
```

## Configuration Pattern

Type-safe configuration with validation.

```python
#!/usr/bin/env python3
"""Type-safe configuration management."""
from dataclasses import dataclass
from pathlib import Path
from typing import Final

@dataclass(frozen=True, slots=True)
class Config:
  """Immutable configuration."""
  input_dir: Path
  output_dir: Path
  max_size: int
  extensions: frozenset[str]
  verbose: bool = False

  def validate(self) -> list[str]:
    """Validate configuration. Returns list of errors."""
    errors: list[str] = []

    if not self.input_dir.exists():
      errors.append(f"Input dir not found: {self.input_dir}")
    if not self.input_dir.is_dir():
      errors.append(f"Input is not a directory: {self.input_dir}")
    if self.max_size <= 0:
      errors.append(f"Invalid max_size: {self.max_size}")
    if not self.extensions:
      errors.append("No extensions specified")

    return errors

def load_config() -> Config | None:
  """Load and validate configuration."""
  cfg = Config(
    input_dir=Path("./input"),
    output_dir=Path("./output"),
    max_size=1024 * 1024,
    extensions=frozenset({'.txt', '.md'}),
    verbose=True,
  )

  errors = cfg.validate()
  if errors:
    for err in errors:
      print(f"Config error: {err}")
    return None

  return cfg

def main() -> int:
  cfg = load_config()
  if cfg is None:
    return 1

  if cfg.verbose:
    print(f"Processing: {cfg.input_dir}")

  return 0
```

## Retry Logic Pattern

Retry operations with exponential backoff.

```python
#!/usr/bin/env python3
"""Retry pattern with backoff."""
import time
from typing import Callable, TypeVar

T = TypeVar('T')

def retry_with_backoff(
  func: Callable[[], T],
  max_attempts: int = 3,
  initial_delay: float = 1.0,
  backoff_factor: float = 2.0,
) -> tuple[bool, T | None]:
  """Retry function with exponential backoff.

  Returns:
    (success, result)
  """
  delay = initial_delay

  for attempt in range(1, max_attempts + 1):
    try:
      result = func()
      return True, result
    except Exception as e:
      if attempt == max_attempts:
        print(f"Failed after {max_attempts} attempts: {e}")
        return False, None

      print(f"Attempt {attempt} failed, retrying in {delay}s...")
      time.sleep(delay)
      delay *= backoff_factor

  return False, None

# Usage
def unstable_operation() -> str:
  # Simulated flaky operation
  import random
  if random.random() < 0.7:
    raise RuntimeError("Transient error")
  return "Success"

def main() -> int:
  success, result = retry_with_backoff(unstable_operation, max_attempts=5)
  if success:
    print(f"Result: {result}")
    return 0
  return 1
```

## Parallel Processing Pattern

Process items in parallel using concurrent.futures.

```python
#!/usr/bin/env python3
"""Parallel processing with thread pool."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Callable

def process_parallel(
  items: list[Path],
  func: Callable[[Path], bool],
  max_workers: int = 4,
) -> tuple[int, int]:
  """Process items in parallel.

  Returns:
    (success_count, failure_count)
  """
  success = 0
  failed = 0

  with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = {executor.submit(func, item): item for item in items}

    for future in as_completed(futures):
      item = futures[future]
      try:
        if future.result():
          success += 1
        else:
          failed += 1
      except Exception as e:
        print(f"Error processing {item}: {e}")
        failed += 1

  return success, failed

def process_file(path: Path) -> bool:
  """Process single file."""
  # Processing logic here
  return True

def main() -> int:
  files = list(Path.cwd().rglob('*.txt'))
  success, failed = process_parallel(files, process_file, max_workers=8)
  print(f"Success: {success}, Failed: {failed}")
  return 1 if failed else 0
```

## Summary

Core patterns for typical CLI tools:
- **File Processor**: Batch process with stats
- **Git Scanner**: Recursive repo discovery
- **Data Aggregation**: Typed results with dataclasses
- **Subprocess Orchestration**: Tool detection and error handling
- **Configuration**: Validation with frozen dataclasses
- **Retry Logic**: Exponential backoff
- **Parallel Processing**: ThreadPoolExecutor for I/O-bound tasks

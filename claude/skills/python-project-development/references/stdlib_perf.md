# Python Stdlib Performance Notes (Compact)

- Use `pathlib` and iterators for large directory traversals.
- Prefer `set`/`frozenset` membership checks over repeated list scans.
- Stream files instead of reading everything into memory.
- Use `concurrent.futures` for I/O-bound parallelism when needed.
- Measure with `time.perf_counter()` before optimizing.

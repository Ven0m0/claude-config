# Optimization Patterns

## Consolidation Strategies

### Unified Entry Point Pattern

Merge multiple scripts into one with mode selection:

```bash
#!/usr/bin/env bash
set -euo pipefail

mode=${1:-}
case $mode in
  sync) shift; sync_fn "$@";;
  clean) shift; clean_fn "$@";;
  *) printf 'Usage: %s {sync|clean} [args]\n' "$0" >&2; exit 1;;
esac
```

### Shared Function Library

Extract common code into sourced library:

```bash
# lib/common.sh
die(){ printf 'Error: %s\n' "$1" >&2; exit 1; }
has(){ command -v "$1" &>/dev/null; }
```

### Configuration-Driven Logic

Replace script proliferation with data:

```bash
declare -A configs=(
  [mode1]="opt1 opt2"
  [mode2]="opt3 opt4"
)
for mode in "${!configs[@]}"; do
  process "$mode" ${configs[$mode]}
done
```

## Performance Patterns

### Parallel Processing

```bash
# Batch operations
mapfile -t items < <(find_items)
printf '%s\n' "${items[@]}" | rust-parallel -j"$(nproc)" process_item

# GNU parallel alternative
printf '%s\n' "${items[@]}" | parallel -j"$(nproc)" process_item

# Xargs fallback
printf '%s\0' "${items[@]}" | xargs -0 -P"$(nproc)" -I{} process_item {}
```

### Caching

```bash
# Cache expensive lookups
declare -A cache
get_data(){
  local key=$1
  [[ ${cache[$key]+x} ]] || cache[$key]=$(expensive_operation "$key")
  printf '%s\n' "${cache[$key]}"
}
```

### Batch I/O

```bash
# Accumulate then write once
output=()
while read -r line; do
  output+=("processed: $line")
done < input
printf '%s\n' "${output[@]}" > result
```

### Early Exit

```bash
# Check prerequisites upfront
[[ -f required.txt ]] || die "Missing required.txt"
has jq || die "jq not found"
# ... rest of script
```

## Modern Tool Replacement

### fd over find

```bash
# Old: find . -type f -name "*.txt"
# New: fd -tf '\.txt$'
# Benefit: 3-5x faster, ignores .git by default
```

### rg over grep

```bash
# Old: grep -r "pattern" .
# New: rg "pattern"
# Benefit: 10x+ faster, respects .gitignore
```

### sd over sed

```bash
# Old: sed 's/old/new/g' file
# New: sd 'old' 'new' file
# Benefit: simpler syntax, preview mode
```

### choose over cut/awk

```bash
# Old: echo "$line" | awk '{print $2}'
# New: choose 1 <<< "$line"
# Benefit: 0-indexed, cleaner syntax
```

## Token Efficiency

### Compact Patterns

```bash
# Verbose
if [[ -f "$file" ]]; then
  process "$file"
fi

# Compact
[[ -f $file ]] && process "$file"
```

### Reduce Whitespace

```bash
# Prefer
fn(){ local x=$1; cmd "$x"; }

# Over
fn() {
  local x=$1
  cmd "$x"
}
```

### Inline Documentation

```bash
# Use ⇒ for cause-effect
# Bad network ⇒ retry with backoff

# Lists ≤7 items
# Options: sync|clean|check|build|test|deploy|status
```

## Refactoring Checklist

- [ ] Replace cat pipes with redirects
- [ ] Convert `[ ]` to `[[ ]]`
- [ ] Quote all variable expansions
- [ ] Use parameter expansion vs sed/awk
- [ ] Replace legacy tools (find→fd, grep→rg)
- [ ] Batch operations for parallelism
- [ ] Cache repeated expensive operations
- [ ] Validate inputs early (fail fast)
- [ ] Check shellcheck clean
- [ ] Verify 2-space indent

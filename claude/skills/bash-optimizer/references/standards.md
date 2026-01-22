# Bash Coding Standards

## Required Header
```bash
#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob globstar
IFS=$'\n\t'
export LC_ALL=C LANG=C
```

## Style
- 2-space indent, no tabs
- Minimize blank lines
- Short CLI args preferred (-r vs --recursive)
- No zero-width chars, non-standard whitespace

## Native Bash Patterns
```bash
# Arrays
files=(); mapfile -t files < <(find .)

# Associative arrays
declare -A map=([key]=val)

# Parameter expansion
${var#prefix} ${var%suffix} ${var/old/new} ${var,,} ${var^^}

# Tests
[[ $var =~ regex ]] [[ -f $file ]] [[ $a == $b ]]

# Loops
while IFS= read -r line; do ...; done < file
for file in *.txt; do ...; done

# Here-strings
grep pattern <<< "$var"

# Process substitution
diff <(cmd1) <(cmd2)

# Functions
fn(){ local var=$1; ...; }
capture_output(){ local -n ref=$1; ref=$(cmd); }
```

## Performance Rules
- Cache expensive operations
- Early returns/exits
- Batch I/O operations
- Minimize forks (prefer builtins)
- Avoid unnecessary subshells
- Use process substitution over pipes when possible

## Tool Preferences (modern → fallback)
- fd/fdfind → find
- rg → grep -F / grep -E
- sd → sed -E
- fzf/sk (fuzzy)
- jaq → jq
- choose → cut/awk
- rust-parallel → parallel → xargs -P
- zstd → gzip → xz
- aria2 → curl → wget2 → wget

## Antipatterns
❌ `cat file | grep` ⇒ `grep pattern < file` or `grep pattern file`
❌ `echo "$var"` ⇒ `printf '%s\n' "$var"`
❌ `$(ls *.txt)` ⇒ `*.txt` or array
❌ `[ test ]` ⇒ `[[ test ]]`
❌ `eval`, backticks, unnecessary quotes around assignments
❌ POSIX sh targeting (use bash features)
❌ `which/type` ⇒ `command -v`
❌ Unquoted variables (unless intentional glob/split)

## Flow Control
- Single condition: `cmd && action` or `cmd || action`
- Multi-action: `if [[ condition ]]; then ... fi`
- Functions return values via stdout or nameref params

## Search Optimization
- Use literal search when possible: `grep -F` / `rg -F`
- Anchor patterns: `^start` `end$`
- Narrow patterns before expansion
- Skip binary files: `grep --binary-files=without-match`

#!/bin/bash
set -euo pipefail

# AI assistant directory cleaner
# Removes logs, cache, old files and optimizes SQLite databases

readonly DIRS=(
  ".claude"
  ".gemini"
  ".copilot"
  ".qwen"
  ".cursor"
  ".opencode"
)
readonly DAYS_OLD=${DAYS_OLD:-30}
readonly DRY_RUN=${DRY_RUN:-0}

optimize_db(){
  local db="$1"
  local size_before size_after
  [[ ! -f "$db" ]] && return 1
  size_before=$(stat -f%z "$db" 2>/dev/null || stat -c%s "$db")
  echo "  Optimizing $(basename "$db")"
  if [[ $DRY_RUN -eq 0 ]]; then
    sqlite3 "$db" "VACUUM; REINDEX;" 2>/dev/null || {
      echo "  ⚠ Failed to optimize $db"
      return 1
    }
    size_after=$(stat -f%z "$db" 2>/dev/null || stat -c%s "$db")
    local saved=$((size_before - size_after))
    [[ $saved -gt 0 ]] && echo "  ✓ Saved $(numfmt --to=iec "$saved" 2>/dev/null || echo "$saved bytes")"
  fi
}
cleanup_dir(){
  local dir="$HOME/$1"
  [[ ! -d "$dir" ]] && return 0
  echo "==> Cleaning $1"
  # Remove log files
  if command -v fd &>/dev/null; then
    fd -t f -e log -e log.gz -e log.old . "$dir" -x rm -v
    fd -t f -e tmp -e temp -e cache . "$dir" -x rm -v
    fd -t d -i 'cache|tmp|temp|logs' . "$dir" -x rm -rf
    fd -t f . "$dir" --changed-before "${DAYS_OLD}d" -x rm -v
  else
    find "$dir" -type f \( -name "*.log" -o -name "*.log.gz" -o -name "*.log.old" \) -delete -print
    find "$dir" -type f \( -name "*.tmp" -o -name "*.temp" -o -name "*.cache" \) -delete -print
    find "$dir" -type d -iname '*cache*' -o -iname '*tmp*' -o -iname '*temp*' -o -iname '*logs*' -exec rm -rf {} +
    find "$dir" -type f -mtime "+$DAYS_OLD" -delete -print
  fi
  # Remove empty directories
  find "$dir" -type d -empty -delete 2>/dev/null || true
  # Optimize SQLite databases
  if command -v sqlite3 &>/dev/null; then
    if command -v fd &>/dev/null; then
      while IFS= read -r db; do
        optimize_db "$db"
      done < <(fd -t f -e db -e sqlite -e sqlite3 . "$dir")
    else
      while IFS= read -r db; do
        optimize_db "$db"
      done < <(find "$dir" -type f \( -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" \))
    fi
  fi
}

main(){
  local total_before total_after
  
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "DRY RUN MODE - no files will be deleted or optimized"
    return 0
  fi
  
  total_before=$(du -sh ~ 2>/dev/null | awk '{print $1}')
  
  for dir in "${DIRS[@]}"; do
    cleanup_dir "$dir"
  done
  
  total_after=$(du -sh ~ 2>/dev/null | awk '{print $1}')
  echo -e "\nBefore: $total_before | After: $total_after"
}

main "$@"

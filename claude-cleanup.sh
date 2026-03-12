#!/usr/bin/env bash
# claude-cleanup.sh — Clean up ~/.config/Claude/ bloat and vacuum SQLite DBs
# Run with Claude Desktop CLOSED. If running, caches/DBs are locked.
set -euo pipefail

readonly VERSION="1.1.0"
CLAUDE_DIR="${HOME}/.config/Claude"
DRY_RUN=false
FORCE=false
VERBOSE=false
ERRORS=0

# --- Helpers ---
log() { printf '\033[1;34m[cleanup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die() {
    printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2
    exit 1
}
vlog() { "$VERBOSE" && log "$*" || true; }

size_of() {
    if [[ -e "$1" ]]; then
        du -sh -- "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Wrapper: run action or log in dry-run mode
run_or_dry() {
    local desc="$1"
    shift
    if "$DRY_RUN"; then
        log "[dry-run] Would $desc"
    else
        if "$@"; then
            log "$desc"
        else
            warn "Failed: $desc"
            ((ERRORS++)) || true
        fi
    fi
}

usage() {
    cat <<'EOF'
Usage: claude-cleanup.sh [OPTIONS]

Clean up ~/.config/Claude/ bloat and vacuum SQLite DBs.
Run with Claude Desktop CLOSED.

Options:
  --dry-run   Show what would be done without making changes
  --force     Continue even if Claude Desktop is running (skip DB ops)
  --verbose   Show extra detail
  --help      Show this help
  --version   Show version
EOF
}

# --- Arg parsing ---
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --force) FORCE=true ;;
        --verbose) VERBOSE=true ;;
        --help)
            usage
            exit 0
            ;;
        --version)
            echo "claude-cleanup $VERSION"
            exit 0
            ;;
        *) die "Unknown option: $arg" ;;
    esac
done

# --- Pre-flight ---
[[ -d "$CLAUDE_DIR" ]] || die "Claude config dir not found: $CLAUDE_DIR"

# Use -x to match exact binary names, avoid matching this script's own pgrep
CLAUDE_RUNNING=false
if pgrep -x "claude" >/dev/null 2>&1 || pgrep -x "Claude" >/dev/null 2>&1; then
    CLAUDE_RUNNING=true
fi

if "$CLAUDE_RUNNING"; then
    warn "Claude Desktop appears to be running. SQLite VACUUM will fail on locked DBs."
    "$FORCE" || die "Close Claude Desktop first, or pass --force to skip DB operations."
fi

BEFORE=$(size_of "$CLAUDE_DIR")
log "Claude config dir: $BEFORE"

# --- 1. Clear Chromium caches (regenerated on next launch) ---
CACHE_DIRS=(
    "Cache/Cache_Data"
    "Cache/No_Vary_Search"
    "Code Cache/js"
    "Code Cache/wasm"
    "GPUCache"
    "DawnWebGPUCache"
    "DawnGraphiteCache"
)

for rel in "${CACHE_DIRS[@]}"; do
    d="$CLAUDE_DIR/$rel"
    if [[ -d "$d" ]]; then
        sz=$(size_of "$d")
        run_or_dry "clear $rel ($sz)" find "$d" -mindepth 1 -delete
    fi
done

# --- 2. Truncate logs (keep last 100 lines each) ---
if [[ -d "$CLAUDE_DIR/logs" ]]; then
    for f in "$CLAUDE_DIR/logs"/*.log; do
        [[ -f "$f" ]] || continue
        lines=$(wc -l <"$f")
        if [[ "$lines" -le 100 ]]; then
            vlog "Skipping $(basename "$f") (only $lines lines)"
            continue
        fi
        sz=$(size_of "$f")
        if "$DRY_RUN"; then
            log "[dry-run] Would truncate $(basename "$f") ($sz, $lines lines)"
        else
            tmp=$(mktemp "${f}.XXXXXX")
            tail -100 "$f" >"$tmp" && mv -- "$tmp" "$f"
            log "Truncated $(basename "$f") ($sz -> $(size_of "$f"))"
        fi
    done
fi

# --- 3. Clear Crashpad dumps ---
CRASHPAD_REPORTS="$CLAUDE_DIR/Crashpad/reports"
if [[ -d "$CRASHPAD_REPORTS" ]]; then
    count=$(find "$CRASHPAD_REPORTS" -maxdepth 1 -name "*.dmp" -printf '.' 2>/dev/null | wc -c)
    if [[ "$count" -gt 0 ]]; then
        run_or_dry "remove $count crash dump(s)" find "$CRASHPAD_REPORTS" -maxdepth 1 -name "*.dmp" -delete
    fi
fi

# --- 4. SQLite VACUUM + REINDEX ---
SQLITE_DBS=(
    "Cookies"
    "DIPS"
    "SharedStorage"
    "Trust Tokens"
    "Shared Dictionary/db"
    "WebStorage/QuotaManager"
)

skip_db="$CLAUDE_RUNNING"

for rel in "${SQLITE_DBS[@]}"; do
    db="$CLAUDE_DIR/$rel"
    [[ -f "$db" ]] || continue

    if "$skip_db"; then
        vlog "Skipping DB $rel (Claude running + --force)"
        continue
    fi

    sz_before=$(size_of "$db")
    wal="${db}-wal"
    if "$DRY_RUN"; then
        wal_sz="0"
        [[ -f "$wal" ]] && wal_sz=$(size_of "$wal")
        log "[dry-run] Would VACUUM+REINDEX $rel ($sz_before, WAL: $wal_sz)"
    else
        if sqlite3 "$db" "VACUUM; REINDEX;" 2>/dev/null; then
            sz_after=$(size_of "$db")
            log "VACUUM+REINDEX $rel: $sz_before -> $sz_after"
            # WAL is checkpointed into main DB by VACUUM
            [[ -f "$wal" ]] && rm -f "$wal"
        else
            warn "Failed to VACUUM $rel (locked or corrupt)"
            ((ERRORS++)) || true
        fi
    fi
done

# --- 5. Remove stale empty WAL/journal files ---
if "$DRY_RUN"; then
    stale=$(find "$CLAUDE_DIR" -maxdepth 2 \( -name "*-wal" -o -name "*-journal" \) -empty 2>/dev/null | wc -l)
    [[ "$stale" -gt 0 ]] && log "[dry-run] Would remove $stale stale empty WAL/journal file(s)"
else
    find "$CLAUDE_DIR" -maxdepth 2 \( -name "*-wal" -o -name "*-journal" \) -empty -delete 2>/dev/null || true
fi

# --- 6. Remove disabled extension data (PDF server, ~6MB) ---
DISABLED_EXT="$CLAUDE_DIR/Claude Extensions/ant.dir.gh.anthropic.pdf-server-mcp"
if [[ -d "$DISABLED_EXT" ]]; then
    sz=$(size_of "$DISABLED_EXT")
    run_or_dry "remove disabled PDF extension ($sz)" rm -rf -- "$DISABLED_EXT"
fi

# --- Summary ---
AFTER=$(size_of "$CLAUDE_DIR")
log "Done. Before: $BEFORE -> After: $AFTER"

if [[ "$ERRORS" -gt 0 ]]; then
    warn "$ERRORS operation(s) failed"
    exit 1
fi

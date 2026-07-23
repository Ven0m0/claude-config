# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Clean AI-assistant config dirs and Claude Desktop bloat; VACUUM+REINDEX any SQLite DBs found.

Usage:
    uv run cleanup.py [--dry-run] [--verbose] [--force] [--days N] [--desktop-only] [--generic-only]
    uv run cleanup.py --self-check
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

GENERIC_DIRS = (".claude", ".gemini", ".copilot", ".qwen", ".cursor", ".opencode")
JUNK_SUFFIXES = (".log", ".log.gz", ".log.old", ".tmp", ".temp", ".cache")
JUNK_DIR_NAMES = ("cache", "tmp", "temp", "logs")
DB_SUFFIXES = (".db", ".sqlite", ".sqlite3")

DESKTOP_CACHE_DIRS = (
    "Cache/Cache_Data",
    "Cache/No_Vary_Search",
    "Code Cache/js",
    "Code Cache/wasm",
    "GPUCache",
    "DawnWebGPUCache",
    "DawnGraphiteCache",
)
DESKTOP_DBS = (
    "Cookies",
    "DIPS",
    "SharedStorage",
    "Trust Tokens",
    "Shared Dictionary/db",
    "WebStorage/QuotaManager",
)
DESKTOP_DISABLED_EXTENSION = "Claude Extensions/ant.dir.gh.anthropic.pdf-server-mcp"


def log(msg: str) -> None:
    print(f"[cleanup] {msg}")


def warn(msg: str) -> None:
    print(f"[warn] {msg}", file=sys.stderr)


def human(n: int) -> str:
    size = float(n)
    for unit in ("B", "K", "M", "G", "T"):
        if size < 1024 or unit == "T":
            return f"{size:.1f}{unit}" if unit != "B" else f"{int(size)}{unit}"
        size /= 1024
    return f"{size:.1f}T"


def dir_size(path: Path) -> int:
    if path.is_file():
        return path.stat().st_size
    if not path.is_dir():
        return 0
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())


def resolve_desktop_dir() -> Path:
    if sys.platform == "win32":
        import os

        appdata = os.environ.get("APPDATA")
        return (
            Path(appdata) / "Claude"
            if appdata
            else Path.home() / "AppData/Roaming/Claude"
        )
    if sys.platform == "darwin":
        return Path.home() / "Library/Application Support/Claude"
    return Path.home() / ".config/Claude"


def is_desktop_running() -> bool:
    try:
        if sys.platform == "win32":
            out = subprocess.run(
                ["tasklist", "/FI", "IMAGENAME eq Claude.exe"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return "Claude.exe" in out.stdout
        out = subprocess.run(
            ["pgrep", "-x", "Claude"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if out.returncode == 0:
            return True
        out = subprocess.run(
            ["pgrep", "-x", "claude"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return out.returncode == 0
    except OSError, subprocess.SubprocessError:
        return False


def vacuum_db(db: Path, dry_run: bool, verbose: bool) -> bool:
    if not db.is_file():
        return True
    before = db.stat().st_size
    if dry_run:
        log(f"[dry-run] would VACUUM+REINDEX {db.name} ({human(before)})")
        return True
    try:
        conn = sqlite3.connect(str(db))
        conn.execute("VACUUM")
        conn.execute("REINDEX")
        conn.commit()
        conn.close()
    except sqlite3.Error as exc:
        warn(f"failed to VACUUM {db.name}: {exc}")
        return False
    after = db.stat().st_size
    if verbose or before != after:
        log(f"VACUUM+REINDEX {db.name}: {human(before)} -> {human(after)}")
    wal = db.with_name(db.name + "-wal")
    if wal.is_file():
        wal.unlink()
    return True


def truncate_log(path: Path, keep_lines: int, dry_run: bool, verbose: bool) -> None:
    lines = path.read_text(errors="ignore").splitlines(keepends=True)
    if len(lines) <= keep_lines:
        return
    if dry_run:
        log(
            f"[dry-run] would truncate {path.name} ({len(lines)} -> {keep_lines} lines)",
        )
        return
    path.write_text("".join(lines[-keep_lines:]))
    if verbose:
        log(f"truncated {path.name} to last {keep_lines} lines")


def plan_generic_removals(target: Path, days: int) -> tuple[list[Path], list[Path]]:
    """Return (files_to_remove, dirs_to_remove) under target, without touching disk."""
    if not target.is_dir():
        return [], []
    import time

    cutoff = time.time() - days * 86400
    files: list[Path] = []
    dirs: list[Path] = []
    for entry in target.rglob("*"):
        if entry.is_file():
            if entry.name.endswith(JUNK_SUFFIXES) or entry.stat().st_mtime < cutoff:
                files.append(entry)
        elif entry.is_dir() and entry.name.lower() in JUNK_DIR_NAMES:
            dirs.append(entry)
    return files, dirs


def clean_generic_dir(
    home: Path,
    name: str,
    days: int,
    dry_run: bool,
    verbose: bool,
) -> None:
    target = home / name
    if not target.is_dir():
        return
    log(f"==> cleaning {name}")
    files, dirs = plan_generic_removals(target, days)
    for f in files:
        if dry_run:
            log(f"[dry-run] would remove {f.relative_to(target)}")
        else:
            f.unlink(missing_ok=True)
            if verbose:
                log(f"removed {f.relative_to(target)}")
    for d in dirs:
        if not d.exists():
            continue
        if dry_run:
            log(f"[dry-run] would remove dir {d.relative_to(target)}/")
        else:
            shutil.rmtree(d, ignore_errors=True)
            if verbose:
                log(f"removed dir {d.relative_to(target)}/")
    if not dry_run:
        for d in sorted(target.rglob("*"), reverse=True):
            if d.is_dir() and not any(d.iterdir()):
                d.rmdir()
    for db in target.rglob("*"):
        if db.is_file() and db.suffix in DB_SUFFIXES:
            vacuum_db(db, dry_run, verbose)


def clean_desktop(claude_dir: Path, dry_run: bool, verbose: bool, force: bool) -> int:
    errors = 0
    if not claude_dir.is_dir():
        warn(f"Claude Desktop config dir not found: {claude_dir}")
        return 1

    running = is_desktop_running()
    if running:
        warn("Claude Desktop appears to be running; VACUUM will fail on locked DBs.")
        if not force:
            warn("Pass --force to continue anyway (DB operations will be skipped).")
            return 1

    before = dir_size(claude_dir)
    log(f"Claude Desktop dir: {human(before)}")

    for rel in DESKTOP_CACHE_DIRS:
        d = claude_dir / rel
        if d.is_dir():
            sz = dir_size(d)
            if dry_run:
                log(f"[dry-run] would clear {rel} ({human(sz)})")
            else:
                for child in d.iterdir():
                    shutil.rmtree(
                        child,
                        ignore_errors=True,
                    ) if child.is_dir() else child.unlink(missing_ok=True)
                log(f"cleared {rel} ({human(sz)})")

    logs_dir = claude_dir / "logs"
    if logs_dir.is_dir():
        for f in logs_dir.glob("*.log"):
            truncate_log(f, 100, dry_run, verbose)

    crashpad = claude_dir / "Crashpad/reports"
    if crashpad.is_dir():
        dumps = list(crashpad.glob("*.dmp"))
        if dumps:
            if dry_run:
                log(f"[dry-run] would remove {len(dumps)} crash dump(s)")
            else:
                for f in dumps:
                    f.unlink(missing_ok=True)
                log(f"removed {len(dumps)} crash dump(s)")

    if not running or force:
        for rel in DESKTOP_DBS:
            db = claude_dir / rel
            if not vacuum_db(db, dry_run, verbose):
                errors += 1

    for stale in list(claude_dir.glob("*-wal")) + list(claude_dir.glob("*-journal")):
        if stale.is_file() and stale.stat().st_size == 0:
            if dry_run:
                log(f"[dry-run] would remove empty {stale.name}")
            else:
                stale.unlink(missing_ok=True)

    ext = claude_dir / DESKTOP_DISABLED_EXTENSION
    if ext.is_dir():
        sz = dir_size(ext)
        if dry_run:
            log(f"[dry-run] would remove disabled PDF extension ({human(sz)})")
        else:
            shutil.rmtree(ext, ignore_errors=True)
            log(f"removed disabled PDF extension ({human(sz)})")

    after = dir_size(claude_dir)
    log(f"Desktop cleanup done. Before: {human(before)} -> After: {human(after)}")
    return errors


def self_check() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "keep.txt").write_text("hi")
        junk_dir = root / "cache"
        junk_dir.mkdir()
        (junk_dir / "x.tmp").write_text("junk")
        (root / "old.log").write_text("\n".join(str(i) for i in range(150)))

        assert dir_size(root) > 0, "dir_size should be nonzero"

        files, dirs = plan_generic_removals(root, days=30)
        assert any(f.name == "x.tmp" for f in files), (
            "plan should find junk suffix file"
        )
        assert any(d.name == "cache" for d in dirs), "plan should find junk-named dir"
        assert not any(f.name == "keep.txt" for f in files), (
            "plan should not flag unrelated files"
        )

        db_path = root / "t.sqlite3"
        conn = sqlite3.connect(str(db_path))
        conn.execute("CREATE TABLE t (a INTEGER)")
        conn.execute("INSERT INTO t VALUES (1)")
        conn.commit()
        conn.close()
        assert vacuum_db(db_path, dry_run=False, verbose=False), (
            "vacuum should succeed on valid db"
        )

        log_path = root / "old.log"
        truncate_log(log_path, keep_lines=100, dry_run=False, verbose=False)
        assert len(log_path.read_text().splitlines()) == 100, (
            "truncate_log should keep exactly keep_lines"
        )

    print("self-check: PASS")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--verbose", action="store_true")
    p.add_argument(
        "--force",
        action="store_true",
        help="continue even if Claude Desktop is running",
    )
    p.add_argument(
        "--days",
        type=int,
        default=30,
        help="age threshold for generic cleanup (default: 30)",
    )
    p.add_argument("--desktop-only", action="store_true")
    p.add_argument("--generic-only", action="store_true")
    p.add_argument(
        "--self-check",
        action="store_true",
        help="run internal logic checks and exit",
    )
    args = p.parse_args()

    if args.self_check:
        self_check()
        return 0

    errors = 0
    home = Path.home()

    if not args.desktop_only:
        targets = [home / name for name in GENERIC_DIRS if (home / name).is_dir()]
        before = sum(dir_size(t) for t in targets)
        for name in GENERIC_DIRS:
            clean_generic_dir(home, name, args.days, args.dry_run, args.verbose)
        after = sum(dir_size(t) for t in targets)
        log(
            f"Generic cleanup done. Tracked dirs before: {human(before)} -> after: {human(after)}",
        )

    if not args.generic_only:
        errors += clean_desktop(
            resolve_desktop_dir(),
            args.dry_run,
            args.verbose,
            args.force,
        )

    if errors:
        warn(f"{errors} operation(s) failed")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

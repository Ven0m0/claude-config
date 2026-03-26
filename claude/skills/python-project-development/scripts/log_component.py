#!/usr/bin/env python3
"""Reusable colored logging component for CLI tools."""

import sys
from typing import Final

# ANSI color codes
C_RED: Final = "\033[31m"
C_GREEN: Final = "\033[32m"
C_YELLOW: Final = "\033[33m"
C_CYAN: Final = "\033[36m"
C_RESET: Final = "\033[0m"


class Log:
    """Colored logging with support for quiet/silent modes.

    Usage:
      log = Log(quiet=False)
      log.info("Processing...")
      log.ok("Success!")
      log.warn("Warning")
      log.err("Error")
      log.prog(50, 100, "file.txt")
      log.prog_done()
    """

    def __init__(self, quiet: bool = False, silent: bool = False) -> None:
        """Initialize logger.

        Args:
          quiet: Suppress info/ok messages (keep warnings/errors)
          silent: Suppress all messages except errors

        """
        self.quiet = quiet or silent
        self.silent = silent
        self.color = sys.stdout.isatty()

    def _c(self, col: str, msg: str) -> str:
        """Apply color if terminal supports it.

        Args:
          col: ANSI color code
          msg: Message to colorize

        Returns:
          Colored message or plain message if no TTY

        """
        return f"{col}{msg}{C_RESET}" if self.color else msg

    def info(self, msg: str) -> None:
        """Log informational message (cyan)."""
        if not self.quiet:
            print(self._c(C_CYAN, f"info: {msg}"), file=sys.stdout)

    def ok(self, msg: str) -> None:
        """Log success message (green) with checkmark."""
        if not self.quiet:
            print(self._c(C_GREEN, f"✓ {msg}"), file=sys.stdout)

    def warn(self, msg: str) -> None:
        """Log warning message (yellow) to stderr."""
        if not self.silent:
            print(self._c(C_YELLOW, f"warning: {msg}"), file=sys.stderr)

    def err(self, msg: str) -> None:
        """Log error message (red) to stderr."""
        print(self._c(C_RED, f"error: {msg}"), file=sys.stderr)

    def prog(self, cur: int, tot: int, fname: str) -> None:
        """Display progress bar.

        Args:
          cur: Current item number
          tot: Total items
          fname: Current filename (truncated to 40 chars)

        """
        if not self.quiet:
            pct = (cur / tot) * 100 if tot else 0
            pct = max(0, min(100, pct))
            bar_len = int(20 * cur / tot) if tot else 0
            bar_len = max(0, min(20, bar_len))
            bar = "█" * bar_len + "░" * (20 - bar_len)
            fname_trunc = (fname[:37] + "...") if len(fname) > 40 else fname
            sys.stderr.write(f"\r{bar} {pct:3.0f}% {fname_trunc:40}")
            sys.stderr.flush()

    def prog_done(self) -> None:
        """Clear progress bar (print newline)."""
        if not self.quiet:
            sys.stderr.write("\n")
            sys.stderr.flush()


# Convenience functions for one-off usage
def info(msg: str) -> None:
    """Log info message."""
    Log().info(msg)


def ok(msg: str) -> None:
    """Log success message."""
    Log().ok(msg)


def warn(msg: str) -> None:
    """Log warning message."""
    Log().warn(msg)


def err(msg: str) -> None:
    """Log error message."""
    Log().err(msg)

#!/usr/bin/env python3
"""Safe subprocess wrappers with timeout, retry, and error handling."""

import subprocess as sp
import time
from pathlib import Path
from typing import Final

# Default timeout for subprocess calls
DEFAULT_TIMEOUT: Final = 30


def run_cmd(
    cmd: list[str],
    cwd: Path | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    check: bool = True,
) -> str:
    """Run command and return stdout.

    Args:
      cmd: Command and arguments
      cwd: Working directory
      timeout: Timeout in seconds
      check: Raise CalledProcessError on non-zero exit

    Returns:
      stdout as string (stripped)

    Raises:
      subprocess.CalledProcessError: If check=True and command fails
      subprocess.TimeoutExpired: If timeout exceeded
    """
    try:
        result = sp.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=check,
        )
        return result.stdout.strip()
    except sp.CalledProcessError:
        if check:
            raise
        return ""
    except sp.TimeoutExpired:
        raise


def run_cmd_safe(
    cmd: list[str],
    cwd: Path | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    """Run command and return stdout, returning empty string on any error.

    Args:
      cmd: Command and arguments
      cwd: Working directory
      timeout: Timeout in seconds

    Returns:
      stdout as string, or empty string on error
    """
    try:
        return run_cmd(cmd, cwd=cwd, timeout=timeout, check=True)
    except (sp.CalledProcessError, sp.TimeoutExpired, FileNotFoundError):
        return ""


def run_with_retry(
    cmd: list[str],
    retries: int = 3,
    delay: float = 1.0,
    cwd: Path | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> tuple[bool, str]:
    """Run command with retry logic.

    Args:
      cmd: Command and arguments
      retries: Number of retry attempts
      delay: Delay between retries in seconds
      cwd: Working directory
      timeout: Timeout per attempt

    Returns:
      (success: bool, output: str)
    """
    for attempt in range(1, retries + 1):
        try:
            output = run_cmd(cmd, cwd=cwd, timeout=timeout, check=True)
            return True, output
        except (sp.CalledProcessError, sp.TimeoutExpired) as e:
            if attempt < retries:
                time.sleep(delay)
            else:
                return False, str(e)
    return False, "Max retries exceeded"


def run_git(cmd: list[str], cwd: Path, timeout: int = 10) -> str:
    """Run git command safely.

    Args:
      cmd: Git command arguments (without 'git' prefix)
      cwd: Repository directory
      timeout: Timeout in seconds

    Returns:
      stdout as string, or empty string on error
    """
    return run_cmd_safe(["git", *cmd], cwd=cwd, timeout=timeout)


def run_with_live_output(cmd: list[str], cwd: Path | None = None) -> int:
    """Run command with live output streaming.

    Args:
      cmd: Command and arguments
      cwd: Working directory

    Returns:
      Exit code
    """
    try:
        result = sp.run(cmd, cwd=cwd, check=False)
        return result.returncode
    except FileNotFoundError:
        return 127  # Command not found
    except KeyboardInterrupt:
        return 130  # Interrupted


def has(cmd: str) -> bool:
    """Check if command exists in PATH.

    Args:
      cmd: Command name to check

    Returns:
      True if command exists
    """
    import shutil

    return shutil.which(cmd) is not None

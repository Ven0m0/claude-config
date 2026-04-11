#!/usr/bin/env python3
"""Template for production-ready CLI tools."""

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Final

# Constants
VERSION: Final = "1.0.0"


@dataclass(frozen=True, slots=True)
class Config:
    """Immutable configuration for the CLI."""

    input_path: Path
    output_path: Path | None = None
    verbose: bool = False
    dry_run: bool = False


def parse_args() -> Config:
    """Parse command-line arguments.

    Returns:
      Config object with validated arguments.

    """
    parser = argparse.ArgumentParser(
        prog="script_name",
        description="Brief description of what this tool does",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  %(prog)s input.txt                    # Basic usage
  %(prog)s input.txt -o output.txt      # Specify output
  %(prog)s -v input.txt                 # Verbose mode
  %(prog)s --dry-run input.txt          # Preview without changes
""",
    )

    parser.add_argument("input", type=Path, help="Input file or directory")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        metavar="PATH",
        help="Output file or directory (default: derived from input)",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "-n",
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {VERSION}")

    args = parser.parse_args()

    # Validate input
    if not args.input.exists():
        parser.error(f"Input path does not exist: {args.input}")

    return Config(
        input_path=args.input.resolve(),
        output_path=args.output.resolve() if args.output else None,
        verbose=args.verbose,
        dry_run=args.dry_run,
    )


def process(cfg: Config) -> int:
    """Main processing logic.

    Args:
      cfg: Configuration object

    Returns:
      Exit code (0=success, 1=error)

    """
    try:
        if cfg.verbose:
            pass

        if cfg.dry_run:
            pass

        # TODO: Implement core logic here

        if cfg.verbose:
            pass

        return 0

    except PermissionError:
        return 1
    except FileNotFoundError:
        return 1
    except ValueError:
        return 1


def main() -> int:
    """Entry point.

    Returns:
      Exit code

    """
    try:
        cfg = parse_args()
        return process(cfg)
    except KeyboardInterrupt:
        return 130
    except Exception:
        return 1


if __name__ == "__main__":
    sys.exit(main())

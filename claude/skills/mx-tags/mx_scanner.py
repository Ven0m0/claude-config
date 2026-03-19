import json
import os
import re
import sys
from pathlib import Path


def scan_tags(directory):
    # Using word boundaries and excluding common source patterns for the scanner itself
    patterns = {
        'ANCHOR': re.compile(r'(?://|#|--)\s*@MX:ANCHOR:\s*(.*)'),
        'WARN': re.compile(r'(?://|#|--)\s*@MX:WARN:\s*(.*)'),
        'NOTE': re.compile(r'(?://|#|--)\s*@MX:NOTE:\s*(.*)'),
        'TODO': re.compile(r'(?://|#|--)\s*@MX:TODO:\s*(.*)'),
        'REASON': re.compile(r'(?://|#|--)\s*@MX:REASON:\s*(.*)')
    }

    results = []

    for root, _, files in os.walk(directory):
        if any(ignored in root for ignored in [".git", "node_modules", ".venv"]):
            continue

        for file in files:
            if file.endswith((".py", ".js", ".ts", ".go", ".sh", ".md")):
                path = Path(root) / file
                try:
                    with Path(path).open(encoding="utf-8") as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            for tag_type, pattern in patterns.items():
                                match = pattern.search(line)
                                if match:
                                    results.append({
                                        "file": str(path),
                                        "line": i + 1,
                                        "type": tag_type,
                                        "message": match.group(1).strip(),
                                    })
                except (IOError, OSError, UnicodeDecodeError):
                    continue

    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 mx_scanner.py <directory>")
        sys.exit(1)

    directory = sys.argv[1]
    tags = scan_tags(directory)

    if not tags:
        print("No @MX tags found.")
        return

    print(f"Found {len(tags)} @MX tags:\n")

    # Simple table output
    print(f"{'TYPE':<10} | {'FILE:LINE':<40} | {'MESSAGE'}")
    print("-" * 80)
    for tag in tags:
        location = f"{tag['file']}:{tag['line']}"
        print(f"{tag['type']:<10} | {location:<40} | {tag['message']}")

if __name__ == "__main__":
    main()

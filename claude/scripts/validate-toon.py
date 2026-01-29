#!/usr/bin/env python3
"""
Validate TOON file structure and syntax.

TOON is a structured text format using schema.org-style properties.
This validator checks for required markers and structural integrity.

Exit codes:
    0 - Valid TOON file
    1 - Invalid or missing file
    2 - Usage error
"""

import argparse
import re
import sys
from pathlib import Path
from typing import NamedTuple


class ValidationResult(NamedTuple):
    valid: bool
    errors: list[str]
    warnings: list[str]


def validate_toon(content: str, filename: str) -> ValidationResult:
    """Validate TOON content structure."""
    errors = []
    warnings = []
    lines = content.split('\n')

    # Check for @type marker (required)
    has_type = any(re.match(r'^@type:\s*\S+', line) for line in lines)
    if not has_type:
        errors.append("Missing required @type marker")

    # Check for @id marker (required)
    has_id = any(re.match(r'^@id:\s*\S+', line) for line in lines)
    if not has_id:
        errors.append("Missing required @id marker")

    # Check for unclosed brackets/arrays
    bracket_stack = []
    for i, line in enumerate(lines, 1):
        # Skip comment lines
        if line.strip().startswith('#'):
            continue

        # Track array declarations like "phases[3]:" or "tasks[N,]{"
        array_match = re.search(r'\[(\d+|\w+),?\]', line)
        if array_match and '{' in line:
            bracket_stack.append((i, 'array-object'))

        # Simple bracket tracking for nested structures
        for char in line:
            if char == '{':
                bracket_stack.append((i, '{'))
            elif char == '}':
                if bracket_stack and bracket_stack[-1][1] in ('{', 'array-object'):
                    bracket_stack.pop()
                else:
                    errors.append(f"Line {i}: Unmatched closing brace '}}'" )

    # Report unclosed brackets
    for line_num, bracket_type in bracket_stack:
        if bracket_type == 'array-object':
            errors.append(f"Line {line_num}: Unclosed array-object block")
        else:
            errors.append(f"Line {line_num}: Unclosed brace '{bracket_type}'")

    # Check for common TOON patterns
    # Valid property patterns: "key: value" or "key:" on its own line
    property_pattern = re.compile(r'^(\s*)(\w[\w\-\.]*|\@\w+)(\[.*?\])?:\s*(.*)?$')

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Skip empty lines, comments, pure values (in arrays), and closing braces
        if not stripped or stripped.startswith('#') or stripped == '}':
            continue

        # Skip lines that are just values (in multi-line arrays)
        if re.match(r'^\s+\S+,\S+', line):  # CSV-style array row
            continue
        if re.match(r'^\s+-\s+', line):  # YAML-style list item
            continue

        # Check if line looks like a property
        if ':' in stripped and not property_pattern.match(line):
            # Could be a value containing colons (like URLs) - just warn
            if not stripped.startswith('http') and '://' not in stripped:
                warnings.append(f"Line {i}: Unusual property format: {stripped[:50]}...")

    # Validate specific execution-plan structure if this looks like one
    if 'execution-plan' in content.lower():
        required_sections = ['phases', 'executionOrder']
        for section in required_sections:
            pattern = rf'^{section}\[.*?\]:'
            if not any(re.match(pattern, line) for line in lines):
                warnings.append(f"Execution plan missing expected section: {section}")

    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


def validate_file(filepath: Path) -> ValidationResult:
    """Validate a TOON file."""
    if not filepath.exists():
        return ValidationResult(False, [f"File not found: {filepath}"], [])

    if not filepath.suffix == '.toon':
        return ValidationResult(False, [], [f"Expected .toon extension, got: {filepath.suffix}"])

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return ValidationResult(False, [f"Failed to read file: {e}"], [])

    if not content.strip():
        return ValidationResult(False, ["File is empty"], [])

    return validate_toon(content, filepath.name)


def main():
    parser = argparse.ArgumentParser(
        description='Validate TOON file structure and syntax',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s specs/auth-system.toon
    %(prog)s execution-plan.toon --strict
    %(prog)s *.toon --quiet
        """
    )
    parser.add_argument('files', nargs='+', type=Path, help='TOON file(s) to validate')
    parser.add_argument('--strict', action='store_true', help='Treat warnings as errors')
    parser.add_argument('--quiet', '-q', action='store_true', help='Only output on error')

    args = parser.parse_args()

    all_valid = True

    for filepath in args.files:
        result = validate_file(filepath)

        if args.strict and result.warnings:
            result = ValidationResult(False, result.errors + result.warnings, [])

        if not result.valid:
            all_valid = False
            print(f"INVALID: {filepath}", file=sys.stderr)
            for error in result.errors:
                print(f"  ERROR: {error}", file=sys.stderr)
            for warning in result.warnings:
                print(f"  WARNING: {warning}", file=sys.stderr)
        elif not args.quiet:
            print(f"VALID: {filepath}")
            for warning in result.warnings:
                print(f"  WARNING: {warning}")

    sys.exit(0 if all_valid else 1)


if __name__ == '__main__':
    main()

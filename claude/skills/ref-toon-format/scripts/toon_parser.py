#!/usr/bin/env python3
"""
TOON (Token-Oriented Object Notation) parser for CUI workflow scripts.

Provides parsing and serialization of TOON format - a compact, human-readable
encoding optimized for LLM token efficiency.

Supports:
- Simple key-value pairs (key: value)
- Nested objects via indentation
- Uniform arrays with headers (items[N]{field1,field2}:)
- Comments (#)
- Multi-line values (|)

Stdlib-only - no external dependencies.

Usage:
    from toon_parser import parse_toon, serialize_toon, ToonParseError
"""

import json
import re
from dataclasses import dataclass
from typing import Any


class ToonParseError(Exception):
    """Error during TOON parsing with line context."""

    def __init__(self, message: str, line_number: int = 0, line_content: str = ''):
        self.line_number = line_number
        self.line_content = line_content
        super().__init__(f'Line {line_number}: {message}\n  > {line_content}')


@dataclass
class ParseContext:
    """Internal parsing context."""

    lines: list[str]
    index: int = 0
    base_indent: int = 0


def _get_indent(line: str) -> int:
    """Get the indentation level of a line (count of leading spaces)."""
    return len(line) - len(line.lstrip())


def _parse_value(value_str: str) -> Any:
    """Parse a TOON value string into Python type."""
    value_str = value_str.strip()

    # Empty
    if not value_str:
        return ''

    # Null
    if value_str == 'null':
        return None

    # Boolean
    if value_str == 'true':
        return True
    if value_str == 'false':
        return False

    # Number (int or float)
    if re.match(r'^-?\d+$', value_str):
        return int(value_str)
    if re.match(r'^-?\d+\.\d+$', value_str):
        return float(value_str)

    # Percentage (convert to int)
    if re.match(r'^\d+%$', value_str):
        return int(value_str[:-1])

    # String (possibly quoted)
    if value_str.startswith('"') and value_str.endswith('"'):
        inner = value_str[1:-1]
        # Unescape internal quotes
        inner = inner.replace('\\"', '"')
        # Check if it's an embedded JSON array or object
        if (inner.startswith('[') and inner.endswith(']')) or (inner.startswith('{') and inner.endswith('}')):
            try:
                return json.loads(inner)
            except json.JSONDecodeError:
                pass
        return inner

    return value_str


def _parse_csv_row(row: str, fields: list[str]) -> dict[str, Any]:
    """Parse a CSV-style row into a dictionary using field headers."""
    result = {}

    # Handle quoted values with commas and escaped quotes
    values = []
    current = ''
    in_quotes = False
    i = 0

    while i < len(row):
        char = row[i]
        # Handle escaped quotes within quoted strings
        if in_quotes and char == '\\' and i + 1 < len(row) and row[i + 1] == '"':
            current += '\\"'
            i += 2
            continue
        if char == '"':
            current += char
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            values.append(current.strip())
            current = ''
        else:
            current += char
        i += 1

    values.append(current.strip())

    # Map values to fields
    for i, field in enumerate(fields):
        if i < len(values):
            result[field] = _parse_value(values[i])
        else:
            result[field] = None

    return result


def _parse_uniform_array(ctx: ParseContext, count: int, fields: list[str], min_indent: int) -> list[dict]:
    """Parse uniform array rows.

    Args:
        ctx: Parse context
        count: Expected number of rows
        fields: Field names for CSV parsing
        min_indent: Minimum indentation for array rows (rows must be >= this)
    """
    result: list[dict[str, Any]] = []

    while ctx.index < len(ctx.lines) and len(result) < count:
        line = ctx.lines[ctx.index]

        # Skip empty lines
        if not line.strip():
            ctx.index += 1
            continue

        # Skip comments
        if line.strip().startswith('#'):
            ctx.index += 1
            continue

        indent = _get_indent(line)
        content = line.strip()

        # Check if we've exited the array (less indentation than required)
        if indent < min_indent and content:
            break

        # Parse the row if it's at the right indentation
        if indent >= min_indent and content and not content.startswith('#'):
            # Check if this looks like a new key-value pair (word followed by colon at start)
            # Skip this check if the line looks like CSV data (starts with alphanumeric or quote)
            if re.match(r'^[a-zA-Z_][\w_]*\s*:', content) and not re.match(r'^[a-zA-Z_][\w_]*,', content):
                # This is a new key-value pair, stop parsing array
                break
            result.append(_parse_csv_row(content, fields))

        ctx.index += 1

    return result


def _parse_simple_array(ctx: ParseContext, min_indent: int) -> list[Any]:
    """Parse a simple list with - markers.

    Args:
        ctx: Parse context
        min_indent: Minimum indentation for array items (items must be >= this)
    """
    result = []

    while ctx.index < len(ctx.lines):
        line = ctx.lines[ctx.index]

        # Skip empty lines
        if not line.strip():
            ctx.index += 1
            continue

        # Skip comments
        if line.strip().startswith('#'):
            ctx.index += 1
            continue

        indent = _get_indent(line)
        content = line.strip()

        # Check if we've exited the array (less indentation)
        if indent < min_indent and content:
            break

        # Check for list item marker
        if content.startswith('- '):
            result.append(_parse_value(content[2:]))
            ctx.index += 1
        elif indent >= min_indent and not content.startswith('-'):
            # Non-list-item at same or greater indent = end of array
            break
        else:
            ctx.index += 1

    return result


def _parse_multiline_value(ctx: ParseContext, base_indent: int) -> str:
    """Parse a multi-line string value (indicated by |)."""
    lines = []

    while ctx.index < len(ctx.lines):
        line = ctx.lines[ctx.index]
        indent = _get_indent(line)

        # Empty line within multi-line is preserved
        if not line.strip():
            lines.append('')
            ctx.index += 1
            continue

        # Check if we're still in the multi-line value
        if indent <= base_indent and line.strip():
            break

        lines.append(line[base_indent + 2 :] if len(line) > base_indent + 2 else line.strip())
        ctx.index += 1

    return '\n'.join(lines).strip()


def _parse_object(ctx: ParseContext, base_indent: int) -> dict[str, Any]:
    """Parse a TOON object at the given indentation level."""
    result: dict[str, Any] = {}

    while ctx.index < len(ctx.lines):
        line = ctx.lines[ctx.index]

        # Skip empty lines
        if not line.strip():
            ctx.index += 1
            continue

        # Skip comments
        if line.strip().startswith('#'):
            ctx.index += 1
            continue

        indent = _get_indent(line)
        content = line.strip()

        # Check if we've exited this indentation level
        if indent < base_indent:
            break

        # Check if this is at our level
        if indent > base_indent:
            ctx.index += 1
            continue

        # Parse key: value
        if ':' in content:
            # Check for uniform array pattern: key[N]{fields}:
            # Note: Key can contain hyphens (e.g., oauth-sheriff-core[1]{...}:)
            array_match = re.match(r'^([\w_-]+)\[(\d+)\]\{([^}]+)\}:\s*$', content)
            if array_match:
                key = array_match.group(1)
                count = int(array_match.group(2))
                fields = [f.strip() for f in array_match.group(3).split(',')]
                ctx.index += 1
                # Array items should be at current indent level (for top-level) or indented
                min_array_indent = 0 if indent == 0 else indent
                result[key] = _parse_uniform_array(ctx, count, fields, min_array_indent)
                continue

            # Check for simple array pattern: key[N]:
            # Note: Key can contain hyphens (e.g., oauth-sheriff-core[1]:)
            simple_array_match = re.match(r'^([\w_-]+)\[(\d+)\]:\s*$', content)
            if simple_array_match:
                key = simple_array_match.group(1)
                ctx.index += 1
                # Array items should be at current indent level (for top-level) or indented
                min_array_indent = 0 if indent == 0 else indent
                result[key] = _parse_simple_array(ctx, min_array_indent)
                continue

            # Regular key: value
            colon_pos = content.index(':')
            key = content[:colon_pos].strip()
            value_part = content[colon_pos + 1 :].strip()

            ctx.index += 1

            # Check for multi-line value
            if value_part == '|':
                result[key] = _parse_multiline_value(ctx, indent)
            # Check for nested object (no value after colon)
            elif not value_part:
                # Peek ahead to see if there's actually nested content
                has_nested_content = False
                peek_idx = ctx.index
                while peek_idx < len(ctx.lines):
                    peek_line = ctx.lines[peek_idx]
                    if not peek_line.strip():
                        peek_idx += 1
                        continue
                    if peek_line.strip().startswith('#'):
                        peek_idx += 1
                        continue
                    # Check if next non-empty line is indented more than current
                    peek_indent = _get_indent(peek_line)
                    if peek_indent > indent:
                        has_nested_content = True
                    break

                if has_nested_content:
                    result[key] = _parse_object(ctx, indent + 2)
                else:
                    result[key] = ''
            else:
                result[key] = _parse_value(value_part)
        else:
            # Unknown line format, skip
            ctx.index += 1

    return result


def parse_toon(content: str) -> dict[str, Any]:
    """Parse TOON content into a Python dictionary.

    Args:
        content: TOON formatted string

    Returns:
        Parsed dictionary

    Raises:
        ToonParseError: If parsing fails

    Example:
        >>> toon = '''
        ... name: Alice
        ... age: 30
        ... roles[2]{id,name}:
        ... 1,admin
        ... 2,user
        ... '''
        >>> parse_toon(toon)
        {'name': 'Alice', 'age': 30, 'roles': [{'id': 1, 'name': 'admin'}, {'id': 2, 'name': 'user'}]}
    """
    lines = content.split('\n')
    ctx = ParseContext(lines=lines)

    try:
        return _parse_object(ctx, 0)
    except Exception as e:
        raise ToonParseError(
            str(e), line_number=ctx.index + 1, line_content=ctx.lines[ctx.index] if ctx.index < len(ctx.lines) else ''
        ) from e


def _serialize_value(value: Any, indent: int = 0) -> str:
    """Serialize a Python value to TOON format.

    Args:
        value: Value to serialize
        indent: Current indentation level for nested structures

    Returns:
        TOON formatted string (may be multi-line for complex types)
    """
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        # Quote if contains special characters
        if ',' in value or ':' in value or '\n' in value:
            return f'"{value}"'
        return value
    if isinstance(value, dict):
        # Serialize dict as JSON string (wrapped in quotes, internal quotes escaped)
        json_str = json.dumps(value).replace('"', '\\"')
        return f'"{json_str}"'
    if isinstance(value, list):
        # Serialize list as JSON string (wrapped in quotes, internal quotes escaped)
        json_str = json.dumps(value).replace('"', '\\"')
        return f'"{json_str}"'
    return str(value)


def _is_uniform_array(arr: list) -> tuple[bool, list[str]]:
    """Check if array is uniform (all dicts with compatible keys).

    Returns True if all items are dicts. Uses union of all keys found,
    allowing optional fields (missing keys serialize as empty).

    Args:
        arr: List to check

    Returns:
        Tuple of (is_uniform, field_names)
    """
    if not arr:
        return False, []

    if not all(isinstance(item, dict) for item in arr):
        return False, []

    # Collect union of all keys across all items (preserves order from first occurrence)
    all_keys = []
    seen_keys = set()
    for item in arr:
        for key in item.keys():
            if key not in seen_keys:
                all_keys.append(key)
                seen_keys.add(key)

    return True, all_keys


def serialize_toon(data: dict[str, Any], indent: int = 0) -> str:
    """Serialize a Python dictionary to TOON format.

    Args:
        data: Dictionary to serialize
        indent: Current indentation level (internal use)

    Returns:
        TOON formatted string

    Example:
        >>> data = {'name': 'Alice', 'active': True}
        >>> print(serialize_toon(data))
        name: Alice
        active: true
    """
    lines = []
    prefix = '  ' * indent

    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f'{prefix}{key}:')
            lines.append(serialize_toon(value, indent + 1))
        elif isinstance(value, list):
            is_uniform, fields = _is_uniform_array(value)
            if is_uniform and fields:
                # Uniform array with headers
                lines.append(f'{prefix}{key}[{len(value)}]{{{",".join(fields)}}}:')
                for item in value:
                    row_values = [_serialize_value(item.get(f, '')) for f in fields]
                    lines.append(f'{prefix}  {",".join(row_values)}')
            else:
                # Simple array
                lines.append(f'{prefix}{key}[{len(value)}]:')
                for item in value:
                    lines.append(f'{prefix}  - {_serialize_value(item)}')
        else:
            lines.append(f'{prefix}{key}: {_serialize_value(value)}')

    return '\n'.join(lines)


if __name__ == '__main__':
    # Quick self-test
    print('toon_parser.py - TOON Parser Module')
    print('=' * 50)

    test_toon = """
# Example TOON document
name: Alice
age: 30
active: true
score: 95.5

metadata:
  created: 2025-12-02
  version: 1.0

roles[2]{id,name,level}:
1,admin,10
2,user,5

tags[3]:
- python
- toon
- parser
"""

    print('\nInput TOON:')
    print(test_toon)

    parsed = parse_toon(test_toon)
    print('\nParsed Python dict:')
    print(parsed)

    print('\nRe-serialized TOON:')
    print(serialize_toon(parsed))

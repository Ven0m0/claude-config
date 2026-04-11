#!/usr/bin/env -S uv run --script
"""Format embedded Python/Bash blocks in markdown files and run Prettier."""

import contextlib
import hashlib
import json
import re

PYTHON_BLOCK_PATTERN = (
    r"^(?P<indentation> *)```(?:python|py|\{[ ]*\.py[ ]*\.annotate[ ]*\})\n(?P<code>.*?)\n(?P=indentation)```"
)
BASH_BLOCK_PATTERN = r"^(?P<indentation> *)```(?:bash|sh|shell)\n(?P<code>.*?)\n(?P=indentation)```"


def extract_code_blocks(markdown_content: str) -> dict[str, list[tuple[str, str]]]:
    """Extract code blocks from markdown content.

    Args:
        markdown_content (str): Markdown text to inspect.

    Returns:
        (dict): Mapping of language names to lists of (indentation, block) pairs.

    """
    python_blocks = re.compile(PYTHON_BLOCK_PATTERN, re.DOTALL | re.MULTILINE).findall(markdown_content)
    bash_blocks = re.compile(BASH_BLOCK_PATTERN, re.DOTALL | re.MULTILINE).findall(markdown_content)
    return {"python": python_blocks, "bash": bash_blocks}


def remove_indentation(code_block: str, num_spaces: int) -> str:
    """Remove indentation from a block of code.

    Args:
        code_block (str): Code snippet to adjust.
        num_spaces (int): Leading space count to strip.

    Returns:
        (str): Code with indentation removed.

    """
    lines = code_block.split("\n")
    stripped_lines = [line[num_spaces:] if len(line) >= num_spaces else line for line in lines]
    return "\n".join(stripped_lines)


def add_indentation(code_block: str, num_spaces: int) -> str:
    """Add indentation back to non-empty lines in a code block.

    Args:
        code_block (str): Code snippet to indent.
        num_spaces (int): Space count to prefix.

    Returns:
        (str): Code with indentation restored.

    """
    indent = " " * num_spaces
    lines = code_block.split("\n")
    return "\n".join([indent + line if line.strip() else line for line in lines])


def format_code_with_ruff(temp_dir: Path) -> None:
    """Format Python files in a temporary directory with Ruff.

    Args:
        temp_dir (Path): Directory containing extracted Python blocks.

    """
    with contextlib.suppress(Exception):
        subprocess.run(["ruff", "format", "--line-length=120", str(temp_dir)], check=True)

    with contextlib.suppress(Exception):
        subprocess.run(
            [
                "ruff",
                "check",
                "--fix",
                "--extend-select=F,I,D,UP,RUF,FA",
                "--target-version=py39",
                "--ignore=D100,D101,D103,D104,D203,D205,D212,D213,D401,D406,D407,D413,F821,F841,RUF001,RUF002,RUF012",
                str(temp_dir),
            ],
            check=True,
        )


def generate_temp_filename(file_path: Path, index: int, code_type: str) -> str:
    """Generate a deterministic filename for a temporary code block.

    Args:
        file_path (Path): Source markdown path.
        index (int): Block index for uniqueness.
        code_type (str): Language identifier.

    Returns:
        (str): Safe filename for the temporary code file.

    """
    stem = file_path.stem
    code_letter = code_type[0]
    path_part = str(file_path.parent).replace("/", "_").replace("\\", "_").replace(" ", "-")
    hash_val = hashlib.md5(f"{file_path}_{index}".encode(), usedforsecurity=False).hexdigest()[:6]
    ext = ".py" if code_type == "python" else ".sh"
    filename = f"{stem}_{path_part}_{code_letter}{index}_{hash_val}{ext}"
    return re.sub(r"[^\w\-.]", "_", filename)


def process_markdown_file(
    file_path: Path,
    temp_dir: Path,
    process_python: bool = True,
    process_bash: bool = True,
) -> tuple[str, list[tuple[int, str, Path, str]]]:
    """Extract code blocks from a markdown file and store them as temporary files.

    Args:
        file_path (Path): Markdown path to process.
        temp_dir (Path): Directory to store temporary files.
        process_python (bool, optional): Enable Python block extraction.
        process_bash (bool, optional): Enable Bash block extraction.

    Returns:
        markdown_content (str): Original markdown content.
        temp_files (list): Extracted block metadata.

    """
    try:
        markdown_content = file_path.read_text()
    except Exception:
        return "", []

    code_blocks_by_type = extract_code_blocks(markdown_content)
    temp_files: list[tuple[int, str, Path, str]] = []
    code_types: list[tuple[str, int]] = []
    if process_python:
        code_types.append(("python", 0))
    if process_bash:
        code_types.append(("bash", 1000))

    for code_type, offset in code_types:
        for i, (indentation, code_block) in enumerate(code_blocks_by_type[code_type]):
            num_spaces = len(indentation)
            code_without_indentation = remove_indentation(code_block, num_spaces)
            temp_file_path = temp_dir / generate_temp_filename(file_path, i + offset, code_type)
            try:
                temp_file_path.write_text(code_without_indentation)
            except Exception:
                continue
            temp_files.append((num_spaces, code_block, temp_file_path, code_type))

    return markdown_content, temp_files


def update_markdown_file(file_path: Path, markdown_content: str, temp_files: list[tuple[int, str, Path, str]]) -> None:
    """Replace markdown code blocks with formatted versions.

    Args:
        file_path (Path): Markdown file to update.
        markdown_content (str): Original content.
        temp_files (list): Metadata for formatted code blocks.

    """
    lookup = {}
    for num_spaces, original_code_block, temp_file_path, code_type in temp_files:
        try:
            formatted_code = temp_file_path.read_text().rstrip("\n")
        except Exception:
            continue
        formatted_code_with_indentation = add_indentation(formatted_code, num_spaces)
        lookup[(num_spaces, original_code_block, code_type)] = formatted_code_with_indentation

    if not lookup:
        with contextlib.suppress(Exception):
            file_path.write_text(markdown_content)
        return

    python_pattern = re.compile(PYTHON_BLOCK_PATTERN, re.DOTALL | re.MULTILINE)
    bash_pattern = re.compile(BASH_BLOCK_PATTERN, re.DOTALL | re.MULTILINE)

    def replacer(match: re.Match, code_type: str) -> str:
        indentation = match.group("indentation")
        num_spaces = len(indentation)
        code = match.group("code")

        key = (num_spaces, code, code_type)
        if key in lookup:
            formatted_code = lookup[key]
            first_line = match.group(0).split("\n", 1)[0]
            return f"{first_line}\n{formatted_code}\n{indentation}```"
        return match.group(0)

    markdown_content = python_pattern.sub(lambda m: replacer(m, "python"), markdown_content)
    markdown_content = bash_pattern.sub(lambda m: replacer(m, "bash"), markdown_content)

    with contextlib.suppress(Exception):
        file_path.write_text(markdown_content)


def run_prettier(markdown_file: Path) -> None:
    """Format a markdown file with Prettier when available.

    Args:
        markdown_file (Path): Markdown file to format.

    """
    if not check_prettier_version():
        return
    is_docs = "docs" in markdown_file.parts and "reference" not in markdown_file.parts
    command = ["npx", "prettier", "--write", "--list-different", str(markdown_file)]
    if is_docs:
        command = ["npx", "prettier", "--tab-width", "4", "--write", "--list-different", str(markdown_file)]
    subprocess.run(command, capture_output=True, check=False, cwd=markdown_file.parent)


def format_markdown_file(markdown_file: Path) -> None:
    """Format markdown-embedded code and run Prettier on the file.

    Args:
        markdown_file (Path): Markdown file to process.

    """
    with TemporaryDirectory() as tmp_dir_name:
        temp_dir = Path(tmp_dir_name)
        markdown_content, temp_files = process_markdown_file(markdown_file, temp_dir)
        if not temp_files:
            run_prettier(markdown_file)
            return

        has_python = any(code_type == "python" for *_, code_type in temp_files)
        has_bash = any(code_type == "bash" for *_, code_type in temp_files)
        if has_python:
            format_code_with_ruff(temp_dir)
        if has_bash:
            format_bash_with_prettier(temp_dir)
        update_markdown_file(markdown_file, markdown_content, temp_files)

    run_prettier(markdown_file)


def read_markdown_path() -> Path | None:
    """Read the markdown path from stdin payload.

    Returns:
        markdown_path (Path | None): Markdown path when present and valid.

    """
    try:
        data = json.load(sys.stdin)
    except Exception:
        return None
    file_path = data.get("tool_input", {}).get("file_path", "")
    path = Path(file_path) if file_path else None
    if not path or path.suffix.lower() != ".md" or not path.exists():
        return None
    if any(p in path.parts for p in [".venv", "venv", "site-packages", "__pycache__", ".claude"]):
        return None
    return path


def main() -> None:
    """Run markdown formatting hook."""
    markdown_file = read_markdown_path()
    if markdown_file:
        format_markdown_file(markdown_file)
    sys.exit(0)


if __name__ == "__main__":
    main()

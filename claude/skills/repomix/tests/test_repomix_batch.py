import importlib.util
import sys
from pathlib import Path

# Load repomix_batch.py dynamically
REPOMIX_BATCH_PATH = Path(__file__).parent.parent / "scripts" / "repomix_batch.py"
spec = importlib.util.spec_from_file_location("repomix_batch", REPOMIX_BATCH_PATH)
repomix_batch = importlib.util.module_from_spec(spec)
sys.modules["repomix_batch"] = repomix_batch
spec.loader.exec_module(repomix_batch)


def test_parse_env_file_basic(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("KEY=VALUE\nFOO=BAR", encoding="utf-8")

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {"KEY": "VALUE", "FOO": "BAR"}


def test_parse_env_file_comments_and_empty_lines(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        """
# This is a comment
KEY=VALUE

  # Another comment
FOO=BAR
""",
        encoding="utf-8",
    )

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {"KEY": "VALUE", "FOO": "BAR"}


def test_parse_env_file_whitespace(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("  KEY  =  VALUE  \n  FOO=BAR  ", encoding="utf-8")

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {"KEY": "VALUE", "FOO": "BAR"}


def test_parse_env_file_quotes(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "DOUBLE_QUOTED=\"value with spaces\"\nSINGLE_QUOTED='another value'\nMIXED=\"'quoted'\"",
        encoding="utf-8",
    )

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {
        "DOUBLE_QUOTED": "value with spaces",
        "SINGLE_QUOTED": "another value",
        "MIXED": "'quoted'",
    }


def test_parse_env_file_with_equals(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("KEY=VALUE=WITH=EQUALS\nFOO=BAR=", encoding="utf-8")

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {"KEY": "VALUE=WITH=EQUALS", "FOO": "BAR="}


def test_parse_env_file_malformed(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("MALFORMED_LINE\nKEY=VALUE", encoding="utf-8")

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {"KEY": "VALUE"}


def test_parse_env_file_non_existent() -> None:
    # Should handle Exception and return empty dict
    result = repomix_batch.EnvLoader._parse_env_file(Path("/non/existent/path"))
    assert result == {}


def test_parse_env_file_empty_file(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("", encoding="utf-8")

    result = repomix_batch.EnvLoader._parse_env_file(env_file)
    assert result == {}

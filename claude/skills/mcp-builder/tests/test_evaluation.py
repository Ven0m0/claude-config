import importlib.util
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Mock external dependencies before they are imported
sys.modules["anthropic"] = MagicMock()
sys.modules["mcp"] = MagicMock()
sys.modules["mcp.client"] = MagicMock()
sys.modules["mcp.client.sse"] = MagicMock()
sys.modules["mcp.client.stdio"] = MagicMock()
sys.modules["mcp.client.streamable_http"] = MagicMock()

# Also mock connections.py which is in the same directory as evaluation.py
sys.modules["connections"] = MagicMock()

# Load evaluation.py dynamically
EVAL_PATH = Path(__file__).parent.parent / "scripts" / "evaluation.py"
spec = importlib.util.spec_from_file_location("evaluation", EVAL_PATH)
evaluation = importlib.util.module_from_spec(spec)
sys.modules["evaluation"] = evaluation
spec.loader.exec_module(evaluation)


def test_parse_headers_empty():
    assert evaluation.parse_headers([]) == {}
    assert evaluation.parse_headers(None) == {}


def test_parse_headers_single():
    assert evaluation.parse_headers(["Content-Type: application/json"]) == {
        "Content-Type": "application/json",
    }


def test_parse_headers_multiple():
    headers = ["Content-Type: application/json", "Authorization: Bearer token"]
    expected = {"Content-Type": "application/json", "Authorization": "Bearer token"}
    assert evaluation.parse_headers(headers) == expected


def test_parse_headers_whitespace():
    headers = ["  Key  :   Value  "]
    assert evaluation.parse_headers(headers) == {"Key": "Value"}


def test_parse_headers_multiple_colons():
    headers = ["URL: https://example.com"]
    assert evaluation.parse_headers(headers) == {"URL": "https://example.com"}


def test_parse_headers_invalid():
    headers = ["InvalidHeader"]
    assert evaluation.parse_headers(headers) == {}


def test_parse_headers_mixed_valid_invalid():
    headers = ["Valid: header", "InvalidHeader", "Another: Valid"]
    assert evaluation.parse_headers(headers) == {"Valid": "header", "Another": "Valid"}

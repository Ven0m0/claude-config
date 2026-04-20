import importlib.util
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Load common_utils.py dynamically due to hyphen in path
SKILL_DIR = Path(__file__).parent.parent
UTILS_PATH = SKILL_DIR / "scripts" / "common_utils.py"
spec = importlib.util.spec_from_file_location("common_utils", UTILS_PATH)
common_utils = importlib.util.module_from_spec(spec)
sys.modules["common_utils"] = common_utils
spec.loader.exec_module(common_utils)


def test_get_file_size_happy_path(tmp_path):
    """Test get_file_size with a real file."""
    test_file = tmp_path / "test.txt"
    content = "Hello, world!"
    test_file.write_text(content)

    size = common_utils.get_file_size(test_file)
    assert size == len(content)


def test_get_file_size_not_found():
    """Test get_file_size with a non-existent file."""
    test_file = Path("/non/existent/path/to/file")

    size = common_utils.get_file_size(test_file)
    assert size == 0


def test_get_file_size_permission_error():
    """Test get_file_size when a PermissionError occurs."""
    mock_path = MagicMock(spec=Path)
    mock_path.stat.side_effect = PermissionError

    size = common_utils.get_file_size(mock_path)
    assert size == 0


def test_get_file_size_generic_oserror():
    """Test get_file_size when a generic OSError occurs (not handled)."""
    mock_path = MagicMock(spec=Path)
    mock_path.stat.side_effect = OSError("Generic error")

    # This should raise OSError because it's not in the caught exceptions
    try:
        common_utils.get_file_size(mock_path)
        assert False, "Should have raised OSError"
    except OSError:
        pass

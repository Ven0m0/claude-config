#!/usr/bin/env python3
"""Unit tests for ToolPerformanceAnalyzer."""

import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Load the module dynamically
script_path = Path(__file__).parent.parent.parent.parent / "scripts" / "tool_performance_analyzer.py"
import importlib.util
spec = importlib.util.spec_from_file_location("tool_performance_analyzer", script_path)
tool_performance_analyzer = importlib.util.module_from_spec(spec)
sys.modules["tool_performance_analyzer"] = tool_performance_analyzer
spec.loader.exec_module(tool_performance_analyzer)

ToolPerformanceAnalyzer = tool_performance_analyzer.ToolPerformanceAnalyzer


@pytest.fixture
def mock_skills_dir(tmp_path: Path) -> Path:
    """Create a mock skills directory with various file types."""
    skills_dir = tmp_path / "skills"
    skills_dir.mkdir()

    # Executable tool
    tool1 = skills_dir / "tool1.sh"
    tool1.write_text("#!/bin/bash\necho 'hello'")
    tool1.chmod(0o755)

    # Non-executable file
    readme = skills_dir / "README.md"
    readme.write_text("documentation")

    # Dotfile
    dotfile = skills_dir / ".hidden"
    dotfile.write_text("hidden")
    dotfile.chmod(0o755)

    # Test file
    test_file = skills_dir / "test_tool.py"
    test_file.write_text("test")
    test_file.chmod(0o755)

    # Executable in subdirectory
    subdir = skills_dir / "subdir"
    subdir.mkdir()
    tool2 = subdir / "tool2.py"
    tool2.write_text("#!/usr/bin/env python3")
    tool2.chmod(0o755)

    return skills_dir


class TestToolPerformanceAnalyzer:
    """Test suite for ToolPerformanceAnalyzer."""

    def test_analyze_tools_discovery(self, mock_skills_dir: Path) -> None:
        """Test that analyze_tools correctly discovers executable tools."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout="success", stderr="")
            results = analyzer.analyze_tools()

        # Should discover tool1.sh and tool2.py
        # Should NOT discover README.md (not executable), .hidden (dotfile), test_tool.py (contains 'test')
        assert results["total_tools"] == 2
        assert "tool1.sh" in results["tools"]
        assert "tool2.py" in results["tools"]
        assert "README.md" not in results["tools"]
        assert ".hidden" not in results["tools"]
        assert "test_tool.py" not in results["tools"]

    def test_analyze_tools_success(self, mock_skills_dir: Path) -> None:
        """Test analyze_tools with successful tool execution."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="Success output", stderr="",
            )
            results = analyzer.analyze_tools()

            tool1_res = results["tools"]["tool1.sh"]
            assert tool1_res["success"] is True
            assert tool1_res["exit_code"] == 0
            assert tool1_res["output_length"] == len("Success output")
            assert "execution_time" in tool1_res

    def test_analyze_tools_failure(self, mock_skills_dir: Path) -> None:
        """Test analyze_tools with failing tool execution."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1, stdout="", stderr="Error message",
            )
            results = analyzer.analyze_tools()

            tool1_res = results["tools"]["tool1.sh"]
            assert tool1_res["success"] is False
            assert tool1_res["exit_code"] == 1
            assert tool1_res["output_length"] == len("Error message")

    def test_analyze_tools_timeout(self, mock_skills_dir: Path) -> None:
        """Test analyze_tools with tool timeout."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd=["tool"], timeout=5)
            results = analyzer.analyze_tools()

            tool1_res = results["tools"]["tool1.sh"]
            assert tool1_res["success"] is False
            assert tool1_res["exit_code"] == -1
            assert tool1_res.get("timeout") is True
            assert tool1_res["execution_time"] == 5.0

    def test_analyze_tools_exception(self, mock_skills_dir: Path) -> None:
        """Test analyze_tools with unexpected exception."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = Exception("Unexpected error")
            results = analyzer.analyze_tools()

            tool1_res = results["tools"]["tool1.sh"]
            assert tool1_res["success"] is False
            assert tool1_res["exit_code"] == -1
            assert tool1_res.get("error") is True

    def test_get_performance_report(self, mock_skills_dir: Path) -> None:
        """Test generation of performance report."""
        analyzer = ToolPerformanceAnalyzer(mock_skills_dir)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0, stdout="OK", stderr="",
            )
            report = analyzer.get_performance_report()

            assert "# Tool Performance Report" in report
            assert f"**Skills Directory:** {mock_skills_dir}" in report
            assert "- **Total Tools:** 2" in report
            assert "| Tool | Execution Time | Success | Output Length |" in report
            assert "tool1.sh" in report
            assert "tool2.py" in report
            assert "True" in report  # Success status

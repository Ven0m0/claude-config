#!/usr/bin/env python3
"""Tests for the prompt-improver hook
Tests bypass prefixes, skill invocation, and JSON output format.
"""

import json
import subprocess
import sys
from pathlib import Path

# Path to the hook script
HOOK_SCRIPT = Path(__file__).parent.parent / "scripts" / "improve-prompt.py"


def run_hook(prompt):
    """Run the hook script with given prompt and return parsed output."""
    input_data = json.dumps({"prompt": prompt})

    result = subprocess.run(
        [sys.executable, str(HOOK_SCRIPT)],
        input=input_data,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        msg = f"Hook failed: {result.stderr}"
        raise Exception(msg)

    return json.loads(result.stdout)


def test_bypass_asterisk() -> None:
    """Test that * prefix strips the prefix and passes through."""
    output = run_hook("* just add a comment")

    assert "hookSpecificOutput" in output
    assert output["hookSpecificOutput"]["hookEventName"] == "UserPromptSubmit"

    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "just add a comment"
    assert not context.startswith("*")


def test_bypass_slash() -> None:
    """Test that / prefix passes through unchanged (slash commands)."""
    output = run_hook("/commit")

    assert "hookSpecificOutput" in output
    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "/commit"


def test_bypass_hash() -> None:
    """Test that # prefix passes through unchanged (memorize feature)."""
    output = run_hook("# remember to use TypeScript")

    assert "hookSpecificOutput" in output
    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "# remember to use TypeScript"


def test_evaluation_prompt() -> None:
    """Test that normal prompts get evaluation wrapper."""
    output = run_hook("fix the bug")

    assert "hookSpecificOutput" in output
    assert output["hookSpecificOutput"]["hookEventName"] == "UserPromptSubmit"

    context = output["hookSpecificOutput"]["additionalContext"]

    # Should contain evaluation prompt
    assert "PROMPT EVALUATION" in context
    assert "fix the bug" in context
    assert "EVALUATE:" in context or "evaluate" in context.lower()

    # Should mention using the skill for vague cases
    assert "prompt-improver skill" in context.lower() or "skill" in context.lower()

    # Should have proceed/clear logic
    assert "clear" in context.lower() or "proceed" in context.lower()



def test_json_output_format() -> None:
    """Test that output follows correct JSON schema."""
    output = run_hook("test prompt")

    # Verify structure
    assert isinstance(output, dict)
    assert "hookSpecificOutput" in output
    assert isinstance(output["hookSpecificOutput"], dict)

    hook_output = output["hookSpecificOutput"]
    assert "hookEventName" in hook_output
    assert "additionalContext" in hook_output
    assert hook_output["hookEventName"] == "UserPromptSubmit"
    assert isinstance(hook_output["additionalContext"], str)



def test_empty_prompt() -> None:
    """Test handling of empty prompt."""
    output = run_hook("")

    assert "hookSpecificOutput" in output
    context = output["hookSpecificOutput"]["additionalContext"]

    # Should still invoke skill even for empty prompt
    assert "prompt-improver skill" in context.lower()


def test_multiline_prompt() -> None:
    """Test handling of multiline prompts."""
    prompt = """refactor the auth system
to use async/await
and add error handling"""

    output = run_hook(prompt)

    assert "hookSpecificOutput" in output
    context = output["hookSpecificOutput"]["additionalContext"]

    # Should preserve multiline content in skill invocation
    assert "refactor the auth system" in context


def test_special_characters() -> None:
    """Test handling of special characters in prompts."""
    output = run_hook('fix the "bug" in user\'s code & database')

    assert "hookSpecificOutput" in output
    context = output["hookSpecificOutput"]["additionalContext"]

    # Should contain the original prompt
    assert "bug" in context
    assert "user" in context or "users" in context


def run_all_tests() -> None:
    """Run all tests."""
    tests = [
        test_bypass_asterisk,
        test_bypass_slash,
        test_bypass_hash,
        test_evaluation_prompt,
        test_json_output_format,
        test_empty_prompt,
        test_multiline_prompt,
        test_special_characters,
    ]


    failed = []
    for test in tests:
        try:
            test()
        except Exception as e:
            failed.append((test.__name__, e))

    if failed:
        for _name, _error in failed:
            pass
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    run_all_tests()

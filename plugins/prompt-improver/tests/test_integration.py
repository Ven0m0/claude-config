#!/usr/bin/env python3
"""Integration tests for the prompt-improver system
Tests the complete flow from hook to skill.
"""

import json
import subprocess
import sys
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
HOOK_SCRIPT = PROJECT_ROOT / "scripts" / "improve-prompt.py"
PLUGIN_JSON = PROJECT_ROOT / ".claude-plugin" / "plugin.json"
SKILL_DIR = PROJECT_ROOT / "skills" / "prompt-improver"


def run_hook(prompt):
    """Run the hook script with given prompt."""
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


def test_plugin_configuration() -> None:
    """Test that plugin.json is properly configured."""
    assert PLUGIN_JSON.exists(), "plugin.json not found"

    config = json.loads(PLUGIN_JSON.read_text())

    # Check version is 0.5.0
    assert config["version"] == "0.5.0", f"Expected version 0.5.0, got {config['version']}"

    # Check skills field exists
    assert "skills" in config, "Missing 'skills' field in plugin.json"
    assert isinstance(config["skills"], list), "'skills' should be a list"
    assert len(config["skills"]) > 0, "'skills' list is empty"

    # Check hooks field is NOT present (standard hooks/hooks.json is auto-discovered)
    assert "hooks" not in config, "The 'hooks' field should not be present (standard location is auto-discovered)"

    # Check skill path
    skill_path = config["skills"][0]
    assert skill_path == "./skills/prompt-improver", f"Unexpected skill path: {skill_path}"

    # Verify skill directory exists
    resolved_skill_path = PROJECT_ROOT / skill_path.lstrip("./")
    assert resolved_skill_path.exists(), f"Skill directory not found: {resolved_skill_path}"



def test_end_to_end_flow() -> None:
    """Test complete flow from prompt to evaluation."""
    # Test normal prompt
    output = run_hook("add authentication")

    # Should get evaluation wrapper
    context = output["hookSpecificOutput"]["additionalContext"]
    assert "PROMPT EVALUATION" in context or "EVALUATE" in context
    assert "add authentication" in context

    # Should mention skill for vague cases
    assert "skill" in context.lower()



def test_bypass_flow() -> None:
    """Test that bypass mechanism works end-to-end."""
    # Test asterisk bypass
    output = run_hook("* just do it")
    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "just do it"
    assert "skill" not in context.lower()

    # Test slash command
    output = run_hook("/commit")
    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "/commit"

    # Test hash prefix
    output = run_hook("# note for later")
    context = output["hookSpecificOutput"]["additionalContext"]
    assert context == "# note for later"



def test_skill_file_integrity() -> None:
    """Test that all skill files are present and valid."""
    # Check SKILL.md
    skill_md = SKILL_DIR / "SKILL.md"
    assert skill_md.exists(), "SKILL.md missing"

    content = skill_md.read_text()
    assert content.startswith("---\n"), "SKILL.md missing YAML frontmatter"
    assert "name: prompt-improver" in content, "Skill name incorrect"

    # Check reference files
    references_dir = SKILL_DIR / "references"
    assert references_dir.exists(), "references directory missing"

    expected_refs = [
        "question-patterns.md",
        "research-strategies.md",
        "examples.md",
    ]

    for ref in expected_refs:
        ref_file = references_dir / ref
        assert ref_file.exists(), f"Missing reference file: {ref}"



def test_token_overhead() -> None:
    """Test that hook overhead is reasonable."""
    output = run_hook("test")

    context = output["hookSpecificOutput"]["additionalContext"]

    # Rough character count (tokens ≈ chars/4 for English)
    char_count = len(context)
    estimated_tokens = char_count // 4

    # New version should be ~200-220 tokens (evaluation prompt with preface instruction)
    # Old v0.3.2 was ~275 tokens (embedded evaluation logic)
    assert estimated_tokens < 250, f"Hook overhead too high: ~{estimated_tokens} tokens (expected <250)"

    # Should be less than old version
    old_estimated_tokens = 275
    if estimated_tokens < old_estimated_tokens:
        ((old_estimated_tokens - estimated_tokens) / old_estimated_tokens) * 100
    else:
        pass


def test_hook_output_consistency() -> None:
    """Test that hook output is consistent across different prompts."""
    prompts = [
        "fix the bug",
        "add tests",
        "refactor code",
        "implement feature X",
    ]

    for prompt in prompts:
        output = run_hook(prompt)

        # All should have same structure
        assert "hookSpecificOutput" in output
        assert "hookEventName" in output["hookSpecificOutput"]
        assert "additionalContext" in output["hookSpecificOutput"]

        # All should have evaluation wrapper
        context = output["hookSpecificOutput"]["additionalContext"]
        assert "EVALUATE" in context or "evaluate" in context.lower()
        assert prompt in context



def test_architecture_separation() -> None:
    """Test that architecture properly separates concerns."""
    # Hook should be reasonably sized (< 80 lines)
    hook_lines = len(HOOK_SCRIPT.read_text().split("\n"))
    assert hook_lines < 80, f"Hook too large: {hook_lines} lines (expected <80)"

    # Hook should contain evaluation logic
    hook_content = HOOK_SCRIPT.read_text()
    assert "PROMPT EVALUATION" in hook_content or "EVALUATE" in hook_content

    # SKILL.md should contain research and question logic (now 4 phases)
    skill_content = (SKILL_DIR / "SKILL.md").read_text()
    assert "Phase 1" in skill_content or "phase 1" in skill_content.lower()
    assert "Phase 2" in skill_content or "phase 2" in skill_content.lower()
    assert "Research" in skill_content

    # Skill should mention being invoked for vague prompts
    assert "vague" in skill_content.lower()



def run_all_tests() -> None:
    """Run all integration tests."""
    tests = [
        test_plugin_configuration,
        test_end_to_end_flow,
        test_bypass_flow,
        test_skill_file_integrity,
        test_token_overhead,
        test_hook_output_consistency,
        test_architecture_separation,
    ]


    failed = []
    for test in tests:
        try:
            test()
        except AssertionError as e:
            failed.append((test.__name__, e))
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

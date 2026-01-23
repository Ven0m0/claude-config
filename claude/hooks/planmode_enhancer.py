#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
planmode_enhancer.py - Enhances plan mode with swarm guidance.

PreToolUse hook: Provides context when entering or exiting plan mode.
Suggests swarm execution for multi-task plans.

PostToolUse hook: Injects ultrawork execution context after plan approval.

Environment variables:
- OMC_PLANMODE_SWARM: Swarm suggestion mode (suggest|always|never), default: always
- OMC_SWARM_WORKERS: Default worker count for swarm, default: 3
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from hook_utils import (
    get_nested,
    hook_main,
    log_debug,
    output_context,
    output_empty,
    parse_hook_input,
    read_stdin_safe,
)


# =============================================================================
# Configuration
# =============================================================================


def get_swarm_mode() -> str:
    """
    Get swarm suggestion mode from environment variable.

    Returns:
        One of: 'suggest', 'always', 'never'
    """
    mode = os.environ.get("OMC_PLANMODE_SWARM", "always").lower()
    if mode not in ("suggest", "always", "never"):
        log_debug(f"Invalid OMC_PLANMODE_SWARM '{mode}', defaulting to 'always'")
        return "always"
    return mode


def get_default_workers() -> int:
    """
    Get default worker count from environment variable.

    Returns:
        Number of workers (minimum 1, maximum 10)
    """
    try:
        workers = int(os.environ.get("OMC_SWARM_WORKERS", "3"))
        if workers < 1:
            log_debug(f"OMC_SWARM_WORKERS too low ({workers}), using 1")
            return 1
        if workers > 10:
            log_debug(f"OMC_SWARM_WORKERS too high ({workers}), using 10")
            return 10
        return workers
    except ValueError:
        log_debug("Invalid OMC_SWARM_WORKERS, defaulting to 3")
        return 3


# =============================================================================
# Guidance Templates
# =============================================================================

ENTER_GUIDANCE = """[PLAN MODE GUIDANCE]

You are entering plan mode. Best practices for effective planning:

## Task Decomposition
- Break work into atomic, independent tasks
- Each task should have a clear completion criteria
- Avoid dependencies between tasks where possible

## Parallelization
- Identify tasks that can run concurrently
- Group related but independent work
- Consider file boundaries for parallel edits

## Swarm Readiness
When you exit plan mode, you can launch a swarm to execute tasks in parallel.
Structure your plan with this in mind:
- Tasks should be self-contained with clear inputs/outputs
- Include enough context in each task for independent execution
- Aim for 3-7 well-defined tasks for optimal swarm efficiency

Plan thoroughly, then execute decisively."""

EXIT_GUIDANCE_TEMPLATE = """[PLAN MODE EXIT - SWARM GUIDANCE]

Your plan is ready for execution. Consider launching a swarm for parallel execution.

## Swarm Mode Available
Claude Code supports native swarm execution via ExitPlanMode parameters:
- `launchSwarm: true` - Spawns a team to execute tasks in parallel
- `teammateCount: {workers}` - Number of parallel workers (default: {workers})

## When to Use Swarm
{swarm_recommendation}

## How Swarm Works
1. Tasks from your plan are distributed to parallel workers
2. Each worker operates independently using TaskCreateTool
3. Workers coordinate via TeammateTool for shared state
4. Results are aggregated when all workers complete

## Swarm Parameters
If launching swarm, include in your ExitPlanMode call:
```
launchSwarm: true
teammateCount: {workers}
```

Mode: {mode} (set OMC_PLANMODE_SWARM to 'always', 'suggest', or 'never')"""

SWARM_RECOMMENDATION_SUGGEST = """- If your plan has 3+ independent tasks, consider `launchSwarm: true`
- If tasks have heavy dependencies, execute sequentially instead
- For quick plans (<3 tasks), swarm overhead may not be worth it"""

SWARM_RECOMMENDATION_ALWAYS = """- Swarm mode is RECOMMENDED for this session
- Launch swarm for parallel execution of your planned tasks
- Set `launchSwarm: true` in your ExitPlanMode parameters"""

SWARM_RECOMMENDATION_NEVER = """- Swarm mode is DISABLED for this session
- Execute tasks sequentially as planned
- Change OMC_PLANMODE_SWARM to 'suggest' or 'always' to enable"""

ULTRAWORK_EXECUTION_CONTEXT = """[PLAN APPROVED - ULTRAWORK EXECUTION MODE]

Your plan has been approved. Execute with ULTRAWORK intensity.

## EXECUTION PROTOCOL

You are now an ORCHESTRATOR. You PLAN and DELEGATE. You do NOT implement directly.

### Agent Delegation
| Task Type | Agent |
|-----------|-------|
| Find files | oh-my-claude:scout |
| Read/summarize | oh-my-claude:librarian |
| Implement code | oh-my-claude:worker |
| Run tests | oh-my-claude:validator |
| Complex planning | oh-my-claude:architect |
| Review plans | oh-my-claude:critic |

### Execution Rules
1. PARALLELIZE - Launch independent agents in ONE message
2. DELEGATE - You orchestrate, agents implement
3. VERIFY - Check agent work before accepting claims
4. COMPLETE - Do not stop until ALL tasks done

### Swarm Active
If swarm was launched, your teammates are executing tasks in parallel.
Monitor progress via TaskList and coordinate via TeammateTool.

### Completion Standard
- ALL planned tasks must be completed
- ALL changes must be validated (tests, linters)
- NO partial implementations accepted

Execute relentlessly until the plan is FULLY implemented."""


# =============================================================================
# Main Hook
# =============================================================================


@hook_main("PreToolUse")  # Keep this - it's overridden by actual event
def main() -> None:
    """Inject guidance for plan mode (PreToolUse) and ultrawork execution (PostToolUse)."""
    raw = read_stdin_safe()
    data = parse_hook_input(raw)

    if not data:
        return output_empty()

    tool_name = get_nested(data, "tool_name", default="")

    # Detect PostToolUse by presence of tool_result
    is_post_tool_use = "tool_result" in data

    if is_post_tool_use:
        # PostToolUse handling
        if tool_name == "ExitPlanMode":
            log_debug("Plan approved - injecting ultrawork execution context")
            return output_context("PostToolUse", ULTRAWORK_EXECUTION_CONTEXT)
        return output_empty()

    # PreToolUse handling (existing logic)
    if tool_name == "EnterPlanMode":
        log_debug("Injecting plan mode entry guidance")
        return output_context("PreToolUse", ENTER_GUIDANCE)

    if tool_name == "ExitPlanMode":
        log_debug("Injecting plan mode exit guidance with swarm info")
        mode = get_swarm_mode()
        workers = get_default_workers()

        # Select recommendation based on mode
        if mode == "always":
            recommendation = SWARM_RECOMMENDATION_ALWAYS
        elif mode == "never":
            recommendation = SWARM_RECOMMENDATION_NEVER
        else:
            recommendation = SWARM_RECOMMENDATION_SUGGEST

        exit_guidance = EXIT_GUIDANCE_TEMPLATE.format(
            workers=workers,
            mode=mode,
            swarm_recommendation=recommendation,
        )

        return output_context("PreToolUse", exit_guidance)

    # Not a plan mode tool, pass through
    return output_empty()


if __name__ == "__main__":
    main()

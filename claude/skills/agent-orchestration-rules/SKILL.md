---
name: agent-orchestration-rules
description: Rules for background agent execution - no polling, no TaskOutput, trust system reminders
user-invocable: false
---

# Agent Orchestration Rules

## No Polling for Background Agents

When launching background agents, do NOT poll with sleep loops. Trust the system notification mechanism.

### DO

- Launch agents with `run_in_background: true`
- Continue with other work while agents run
- Trust system reminders for agent progress notifications
- Check output files only when agent signals completion or when results are needed

### DON'T

- Run `sleep 10 && cat status.txt` in loops
- Continuously poll for completion
- Waste tokens checking status repeatedly
- Block on agents unless absolutely necessary

## Never Use TaskOutput

TaskOutput floods the main context window with agent transcripts (70k+ tokens).

**NEVER use `TaskOutput` tool.** Use synchronous `Task` instead.

```
# WRONG - floods context
Task(run_in_background=true)
TaskOutput(task_id="...")  // 70k tokens dumped

# RIGHT - isolated context, returns summary
Task(run_in_background=false)  // Agent runs, returns summary
```

## Background Execution

**Run in Background** (`run_in_background: true`):
- Package installation: npm install, pip install, cargo build
- Build processes: npm run build, make, tsc
- Test suites: npm test, pytest, cargo test

**Run Blocking** (foreground):
- Quick status checks: git status, ls, pwd
- File reads and edits
- Simple commands needing immediate results

## System Reminders

System reminders are free - they are pushed to you automatically:
- Agent progress: `Agent <id> progress: X new tools used, Y new tokens`
- Agent writes output file (check the path you specified)

Continue productive work while waiting. Polling burns tokens on repeated checks.

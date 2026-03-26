---
description: Parallel execution engine — fire independent tasks simultaneously across model tiers
agent: build
subtask: true
---

# Ultrawork

Parallel execution engine for high-throughput task completion. Fire all independent tasks simultaneously. Never serialize work that can run in parallel.

## Task

$ARGUMENTS

---

## Your Job as Orchestrator

You receive a set of tasks (or derive them from context). Your role is to:

1. **Classify each task by tier and independence**
2. **Fire all independent tasks simultaneously** via subtask delegation
3. **Run dependent tasks sequentially** after their prerequisites complete
4. **Aggregate results** and report completion status

## Model Tier Routing

Route each task to the agent that fits its complexity. Do NOT over-provision.

| Tier | When to use | Agent |
|------|-------------|-------|
| LOW | Simple fix, rename, add export, type annotation, one-liner | `executor` |
| MEDIUM | Feature implementation, endpoint, component, test suite | `coder` |
| HIGH | Complex refactor, multi-file migration, architecture change | `build` |
| CRITICAL | Deep review, architectural validation, high-risk changes | `reviewer` |

## Execution Rules

**Fire in parallel:** All tasks without dependencies run simultaneously. Do not wait for one before starting another.

**Use background for long ops:** Builds, test suites, package installs, and large refactors should run as background tasks (if the background plugin is available). Short checks run in foreground.

**Dependency ordering:** If task B reads output from task A, run A first, then B. For everything else, parallel.

**Tier examples:**
- LOW: "add missing type export for Config", "rename variable foo to bar in utils.ts"
- MEDIUM: "implement /api/users endpoint with validation and error handling"
- HIGH: "migrate authentication from JWT to session-based across all middleware"
- CRITICAL: "audit the payment flow for security vulnerabilities"

## Step-by-Step

1. List all tasks with their classified tier and any dependencies between them
2. Group tasks into parallel batches (batch 0 = no deps, batch 1 = depends on batch 0, etc.)
3. For each batch: delegate all tasks simultaneously to the appropriate agent
4. After each batch completes: verify no new errors were introduced before starting next batch
5. Lightweight final check: build passes, affected tests pass, no new lint errors

## Verification (lightweight — not full QA)

After all tasks complete:
- Run build/typecheck
- Run only tests affected by the changes
- Report any failures with which task caused them

For full plan-first execution and review loops, use the Flow Next commands when you need a heavier workflow.

## Output Format

```markdown
## Ultrawork Complete

### Tasks Executed
| Tier | Agent | Task | Status |
|------|-------|------|--------|
| MEDIUM | coder | Implement /api/users endpoint | DONE |
| LOW | executor | Add Config type export | DONE |
| LOW | executor | Rename foo -> bar in utils.ts | DONE |

### Verification
- Build: [PASS | FAIL]
- Tests: [PASS | FAIL | N/A]
- Lint: [PASS | FAIL]

### Notes
[Failures, surprises, or follow-up items]
```

## Anti-Patterns (avoid these)

- Serializing independent work: each task waiting for the previous one to finish
- Using HIGH tier for trivial fixes: costs 10x more for no benefit
- Skipping verification: leaves broken state for the user
- Delegating to a single coder for multiple independent files: always parallelize

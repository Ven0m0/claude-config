---
description: Full autonomous execution from idea to working, validated code
agent: build
subtask: true
---

# Autopilot

Full autonomous execution pipeline: idea → spec → plan → parallel implementation → QA → validation → done.

## Input

$ARGUMENTS

---

## When to Use This

- End-to-end feature development from a description
- Multi-phase tasks requiring planning, coding, testing, and review
- Hands-off execution where you want to describe the goal and receive working code

Not for: single focused bug fixes, brainstorming, or exploration. Use `/ultrawork` for parallel tasks without the full pipeline.

---

## Execution Policy

- Each phase must complete before the next begins
- Parallel execution is used within phases where possible (Phase 2 and Phase 4)
- QA cycles repeat up to 5 times; stop after 3 identical errors (fundamental issue)
- Validation requires all reviewers to approve; fix and re-validate on rejection
- Stop conditions: user says "stop", "cancel", or "abort"; or escalation threshold hit

---

## Phase 0 — Expansion

**Skip this phase if**: a plan file already exists at `.opencode/plans/` or a spec at `.opencode/specs/`.

**If input is vague** (no file paths, function names, or concrete constraints): ask one clarifying question before expanding. Do not hallucinate requirements.

**Otherwise**:
- Delegate to `researcher` agent: extract requirements, identify constraints, research relevant APIs/patterns
- Delegate to `build` agent: produce a technical specification

Output: `.opencode/specs/autopilot-spec.md`

Spec must include:
- Problem statement (1 paragraph)
- Scope: what's in and out
- Technical approach: data model, API shape, file structure
- Acceptance criteria (testable)
- Open questions (if any)

---

## Phase 1 — Planning

**Skip this phase if**: plan file already exists at `.opencode/plans/autopilot-plan.md`.

Delegate to `plan` agent with the spec from Phase 0.

Output: `.opencode/plans/autopilot-plan.md`

Plan must include:
- Ordered task list with tier (LOW/MEDIUM/HIGH) and agent assignment
- Dependency graph (which tasks block which)
- Parallel batches explicitly identified
- Risk items flagged

Delegate to `reviewer` agent to validate the plan before proceeding to Phase 2.

---

## Phase 2 — Execution (via Ultrawork)

Read the plan from Phase 1. Execute using ultrawork principles:

**Fire all independent tasks simultaneously.** Do not serialize parallel-safe work.

Tier routing:
- LOW tasks → `executor` agent
- MEDIUM tasks → `coder` agent
- HIGH tasks → `build` agent
- Architectural/security tasks → `reviewer` or `security-auditor` agent

Run batch 0 (no dependencies) in parallel, then batch 1, etc.

Save progress state to `.opencode/state/autopilot-state.json` after each batch so execution can be resumed.

---

## Phase 3 — QA Loop

Run up to 5 build/test/fix cycles:

```
for cycle in 1..5:
  run: build + lint + typecheck + full test suite
  if all pass: break
  if same error appeared 3 times: STOP — report fundamental issue to user
  delegate failing tests/errors to coder agent with specific error output
```

Delegate fixes to `coder` (MEDIUM tier for test failures, HIGH for compilation errors).

Track error signatures. If the same error recurs across 3 cycles, it is a fundamental issue requiring human input. Stop and report clearly:
- What the error is
- Which files are involved
- What was tried
- What input from the user is needed

---

## Phase 4 — Validation (parallel)

Fire all three validators simultaneously:

1. **`reviewer` agent** — functional completeness, philosophy compliance, code quality
2. **`security-auditor` agent** — vulnerability check against the changed surface area
3. **`build` agent** (as architect) — architectural soundness, API design, consistency

All three must return APPROVE. If any return REQUEST_CHANGES:
1. Delegate fixes to `coder`
2. Re-run the failing validator(s) only
3. Repeat up to 3 rounds; stop and report if still failing after 3

---

## Phase 5 — Cleanup

On successful completion:
1. Delete state files: `.opencode/state/autopilot-state.json`
2. Run `git status` and report what changed
3. Summarize for the user: what was built, key decisions made, files touched

Do NOT commit. The user reviews and commits.

---

## Resume

If autopilot was interrupted, re-run `/autopilot` with the same input. It will detect existing spec/plan/state files and resume from where it stopped.

---

## Escalation and Stop Conditions

Stop and report immediately (do not retry) when:
- The same QA error repeats across 3 cycles
- Validation keeps failing after 3 re-validation rounds
- Requirements are contradictory (report the contradiction)
- A task would require destructive operations (dropping tables, deleting branches)
- User says "stop", "cancel", or "abort"

---

## Final Checklist

- [ ] Phase 0: Spec created (or skipped — pre-existing plan detected)
- [ ] Phase 1: Plan created and reviewer-approved (or skipped)
- [ ] Phase 2: All plan tasks executed, state saved per batch
- [ ] Phase 3: Build, lint, types, and tests all pass
- [ ] Phase 4: reviewer + security-auditor + architect all approved
- [ ] Phase 5: State cleaned up, git status reported, summary delivered

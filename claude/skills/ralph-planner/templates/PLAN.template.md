---
phase: {PHASE_DIR}
plan: {PLAN_ID}
type: execute
---

# Objective
{OBJECTIVE}

# Context (read these files first)
- .planning/BRIEF.md
- .planning/ROADMAP.md
- {ADDITIONAL_CONTEXT_FILES}

# Tasks

## Task 1
type: auto
name: {TASK_NAME}
files:
- {FILE_1}
action:
- {WHAT_TO_DO_PRECISELY}
verify:
- {COMMAND_OR_CHECK}
done_when:
- {MEASURABLE_ACCEPTANCE_CRITERIA}

## Task 2
type: checkpoint/human-verify
name: {VERIFY_NAME}
files:
- {FILE_TO_REVIEW}
action:
- Present what was built and how to verify.
verify:
- Ask the user to confirm verification outcome.
done_when:
- User explicitly approves.

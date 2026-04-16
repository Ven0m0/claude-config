---
name: todo-triage
description: >
  Collect, deduplicate, enrich, triage, and convert code comments (TODO/FIXME/HACK/NOTE/OPTIMIZE/SECURITY/DEBT)
  into structured, dependency-ordered task lists ready for autonomous agents. Use when processing technical
  debt, converting code notes into tracked work, preparing task backlogs, or generating executable task graphs.
  Triggers: TODO triage, fixme list, tech debt scan, task extraction, comment analysis.
allowed-tools: Bash, Read, Grep, Glob
---

# todo-triage

Convert inline code comments into a machine-parseable, dependency-ordered task backlog.

## Quick Start

```bash
# Collect all comment markers from a repo
python3 scripts/collect.py /path/to/repo

# Collect from specific paths or file types
python3 scripts/collect.py /path/to/repo --include "*.py" "*.ts" --output raw.json
```

The script emits `raw.json`. Run the six-phase pipeline below to produce the final task list.

---

## Six-Phase Pipeline

### Phase 1 — Collect

Run the collection script to extract every comment marker:

```bash
python3 scripts/collect.py <root> [--include GLOB …] [--output raw.json]
```

Each raw item contains:

| Field     | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| `file`    | Repo-relative file path                                                   |
| `line`    | 1-indexed line number                                                     |
| `marker`  | `TODO \| FIXME \| HACK \| NOTE \| OPTIMIZE \| SECURITY \| DEBT`           |
| `text`    | Full comment text, stripped of leading `#`, `//`, `/*` markers            |
| `context` | 5 lines before + target line + 5 lines after (indices relative to `line`) |

### Phase 2 — Deduplicate

Merge pairs where **both** conditions hold:

1. The two items point to the same logical code path (same file, or a caller/callee within 10 lines).
2. Token edit distance between `text` fields is < 10 (compute with a simple word-diff count).

Keep the item with the more complete `text`. Discard the other. Log merged pairs.

### Phase 3 — Enrich

For each surviving item, read the surrounding context and set:

| Field            | How to determine                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intent`         | One sentence: what was the author trying to accomplish? Infer from function name, variable names, and adjacent comments.                          |
| `category`       | `bug \| performance \| refactor \| feature \| security \| debt \| docs` — pick exactly one.                                                       |
| `blocking_paths` | List of `file:line` references that must change before this item can be addressed (e.g. an interface definition, a config key, a shared utility). |

Rules:

- `security` beats all other categories when the comment text contains words: `auth`, `sanitize`, `escape`, `inject`, `secret`, `token`, `password`, `cve`, `xss`, `sqli`.
- `bug` beats `refactor` and `debt` when the comment contains `broken`, `wrong`, `incorrect`, `fails`, `crash`, `panic`, `null`, `undefined`.
- Default to `debt` when no other rule matches.

### Phase 4 — Triage Severity

Assign exactly one severity per item:

| Severity   | Criteria                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `critical` | data loss risk, security hole, crash path, broken public API contract                              |
| `high`     | incorrect observable behavior, major perf regression (>2×), missing error handling on external I/O |
| `medium`   | code smell, partial implementation, outdated abstraction, silent failure                           |
| `low`      | docs gap, naming, style, optional improvement, informational NOTE                                  |

Use marker as a prior: `FIXME → high`, `HACK → medium`, `TODO → low`, `SECURITY → critical`, `OPTIMIZE → medium`, `DEBT → medium`, `NOTE → low`. Escalate when context evidence demands it; never downgrade below the marker prior.

### Phase 5 — Build Dependency Graph

1. Assign each task a stable ID using the format `T\d{4}` (e.g. `T0001`, `T0002`).
2. For each task, inspect `blocking_paths`: if a blocking path is itself a task location, record that task's ID in `blocking_ids`.
3. Topological sort the resulting DAG. Tasks with no `blocking_ids` are in wave 0; tasks whose entire dependency set is in wave N go into wave N+1.
4. Within the same wave, sort by severity descending (`critical` → `high` → `medium` → `low`).

If a cycle is detected, break it by demoting the lowest-severity task in the cycle to a new leaf node and logging a `CYCLE_BREAK` warning.

### Phase 6 — Generate Task Records

Emit one record per task in the sorted order. Use this exact schema:

```json
{
  "id": "T0001",
  "wave": 0,
  "title": "<imperative verb phrase ≤72 chars>",
  "anchor": "src/auth/session.py:142",
  "severity": "high",
  "category": "security",
  "intent": "Rotate session tokens after privilege escalation to prevent fixation attacks.",
  "acceptance_criteria": [
    "Call rotate_session_token(user_id) immediately after set_role() in src/auth/session.py:145.",
    "Add test asserting token value differs before and after role change.",
    "Verify no 401 regression on existing integration tests."
  ],
  "implementation_hint": "Use existing rotate_session_token(user_id: str) -> str at src/auth/tokens.py:38. Pass result to session.update_token().",
  "loc_delta": "S",
  "blocking_ids": []
}
```

Field rules:

| Field                 | Constraint                                                                      |
| --------------------- | ------------------------------------------------------------------------------- |
| `id`                  | `T\d{4}`, unique, zero-padded, assigned in topo-sort order                      |
| `wave`                | Integer ≥ 0                                                                     |
| `title`               | Imperative, ≤72 chars, no pronouns                                              |
| `anchor`              | `file:line` — the exact location of the original comment                        |
| `severity`            | One of: `critical`, `high`, `medium`, `low`                                     |
| `category`            | One of: `bug`, `performance`, `refactor`, `feature`, `security`, `debt`, `docs` |
| `intent`              | One sentence, past-tense ("was trying to …") — do not use "maybe" or "consider" |
| `acceptance_criteria` | 2–5 bullets, each testable, anchored to `file:line`, no vague language          |
| `implementation_hint` | Exact function/type/pattern to use, with `file:line`; no prose explanations     |
| `loc_delta`           | `S` (<20 LOC), `M` (20–100), `L` (100–300), `XL` (300+)                         |
| `blocking_ids`        | List of `T\d{4}` strings; empty list `[]` if none                               |

---

## Output Format

Write the final task list to `todo-tasks.json`:

```json
{
  "generated_at": "<ISO-8601 timestamp>",
  "repo": "<root path>",
  "stats": {
    "raw_collected": 42,
    "after_dedup": 38,
    "critical": 2,
    "high": 8,
    "medium": 18,
    "low": 10
  },
  "tasks": [ ... ]
}
```

Print a summary table to stdout:

```
Wave  ID    Sev       Cat          Title
─────────────────────────────────────────────────────────────────────────────
0     T0001  critical  security     Rotate session tokens after privilege escalation
0     T0002  high      bug          Fix null-dereference in UserService.resolve()
1     T0003  medium    refactor     Extract duplicate auth middleware into shared util
```

---

## Targeting Note

Acceptance criteria and implementation hints are written for autonomous agent execution (claude-sonnet-4-6, minimax-m2.7, gpt-5, glm-5). Adhere to these style rules without exception:

- Use imperative language throughout. No "you should", "consider", or "maybe".
- Anchor every criterion to `file:line`. Never reference a function without its location.
- Emit only machine-parseable task IDs (`T\d{4}`) in `blocking_ids`. No prose references.
- Acceptance criteria must be independently verifiable (shell command, test run, or static check).

---

## Collection Script

See [scripts/collect.py](scripts/collect.py) for the automated Phase 1 collector.

Run `python3 scripts/collect.py --help` for full usage.

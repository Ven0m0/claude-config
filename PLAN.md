# Implementation Plan

_Updated: 2026-04-20 · 17 tracked tasks · 10 open · Est. 320–1040 LOC remaining_

## Sources

This plan is derived from the structured backlogs in:

- `TODO.md`
- `claude/TODO.md`
- `opencode/TODO.md`
- `opencode-remote/install.sh` (newly discovered TODO)

## Supplemental Marker Scan Results

**Scan date:** 2026-04-20
**Patterns searched:** `TODO`, `FIXME`, `HACK`, `XXX`, `WARN`, `DEPRECATED`, `NOTE(`
**File types:** `.py`, `.sh`, `.bash`, `.js`, `.ts`, `.tsx`, `.mjs`, `.md`, `.yaml`, `.yml`, `.toml`, `.json`
**Directories excluded:** `.venv`, `node_modules`, `.git`

### Findings Not in Existing Plan

| File | Line | Marker | Comment | Severity |
|------|------|--------|---------|----------|
| `opencode-remote/install.sh` | 201 | TODO | `# TODO: add pm2 support` | medium |

### Zero-Occurrence Markers (No Action Needed)
| Marker | Count |
|--------|-------|
| FIXME | 0 |
| HACK | 0 |
| XXX (comment marker) | 0 |
| NOTE( | 0 |
| DEPRECATED (comment) | 0 |

### Filtered Noise
- `mktemp ... XXXXXX` patterns (shell temp file naming)
- `WARN` in shell echo/printf (runtime output, not comment markers)
- `WARN` in YAML/JSON (configuration values, e.g., `DISABLE_COST_WARNINGS`)
- Documentation references to `TODO.md`, `PLAN.md` files
- Markdown skill files describing TODO workflows
- Meta-code: `claude/skills/todo-triage/scripts/collect.py` defines MARKERS constant

## Legend

<!-- severity: critical high medium low -->
<!-- category: bug perf refactor feature security debt docs -->
<!-- size: S <=20 LOC, M 20-100 LOC, L 100-300 LOC, XL 300+ LOC -->

## Summary

The root backlog still has two large open Phase 2 integration tracks (`T006`, `T007`).
The Claude-specific backlog adds three implementation tasks and two housekeeping tasks (`T012`–`T015`).
The OpenCode backlog adds one broken reference fix, one fork-triage task, and one status-table cleanup task (`T010`, `T011`, `T016`).

## Dependency Graph

Topological order for the open work:

1. `T010`
2. `T011`
3. `T013`
4. `T014`
5. `T006`
6. `T007`
7. `T016`
8. `T012`
9. `T015`
10. `T017`

Open dependency edges:

- `T011 -> T016`
- `T014 -> T012`
- `T013 -> T015`
- `T014 -> T015`

## Task Index

| #   | ID   | Title                                                   | Sev    | Cat     | Size | Blocking IDs | Status |
| --- | ---- | ------------------------------------------------------- | ------ | ------- | ---- | ------------ | ------ |
| 1   | T001 | Wire systemctl cowork service behind opt-in flag        | —      | feature | S    | —            | done   |
| 2   | T002 | Implement scaffold script template body                 | —      | feature | S    | —            | done   |
| 3   | T003 | Add Copilot CLI config once format stabilizes           | —      | feature | S    | —            | done   |
| 4   | T004 | Register 5 pending MCP servers in settings              | —      | feature | S    | —            | done   |
| 5   | T005 | Phase 1 — inventory and classify external candidates    | —      | feature | M    | —            | done   |
| 6   | T006 | Phase 2a/b — integrate skills, hooks, and prompts       | medium | feature | L    | —            | open   |
| 7   | T007 | Phase 2c — evaluate plugin and ecosystem candidates     | medium | feature | L    | —            | open   |
| 8   | T008 | Phase 3 — ship vetted items and update marketplace.json | —      | feature | XL   | T006, T007   | done   |
| 9   | T009 | Mirror opencode triage results into opencode/TODO.md    | —      | docs    | S    | T008         | done   |
| 10  | T010 | Add missing fast-apply skill document                   | medium | bug     | S    | —            | open   |
| 11  | T011 | Triage aggreggator fork note                            | low    | docs    | S    | —            | open   |
| 12  | T012 | Create codebase indexer skill                           | medium | feature | L    | T014         | open   |
| 13  | T013 | Decide all-for-claudecode disposition                   | low    | feature | S    | —            | open   |
| 14  | T014 | Classify token-pilot reference                          | low    | docs    | S    | —            | open   |
| 15  | T015 | Restructure claude TODO backlog                         | low    | debt    | S    | T013, T014   | open   |
| 16  | T016 | Mark opencode defer status correctly                    | low    | debt    | S    | T011         | open   |
| 17  | T017 | Add PM2 support to opencode-remote installer           | medium | feature | S    | —            | open   |

## Completed Tasks

### T001 · Wire systemctl cowork service behind opt-in flag

- **File:** `setup.sh`
- **Status:** complete

### T002 · Implement scaffold script template body

- **File:** `plugins/config-wizard/skills/designing-claude-skills/scripts/init_skill.py`
- **Status:** complete

### T003 · Add Copilot CLI config once format stabilizes

- **File:** `copilot-cli/config.json`
- **Status:** complete

### T004 · Register 5 pending MCP servers in settings

- **File:** `claude/settings.json`
- **Status:** complete

### T005 · Phase 1 — inventory and classify external candidates

- **File:** `docs/external-integration-triage.md`
- **Status:** complete

### T008 · Phase 3 — ship vetted items and update marketplace.json

- **Status:** complete

### T009 · Mirror opencode triage results into opencode/TODO.md

- **Status:** complete

## Open Tasks

### T006 · Phase 2a/b — integrate skills, hooks, and prompts

- **File:** `TODO.md:28`
- **Severity:** medium
- **Category:** feature
- **Size:** L
- **Blocking IDs:** `[]`
- **Intent:** Turn the remaining Phase 2 skill, utility, and hook candidates into shipped repo assets or explicit references.
- **Acceptance criteria:**
  - Create local assets for every Phase 2 candidate that is still judged fit for integration.
  - Add reference-only candidates to existing docs instead of creating placeholder implementations.
  - Add `claude/skills/maintenance/SKILL.md` if no equivalent maintenance skill exists.
  - Run the repo's agent-doc lint on touched instruction files.
- **Implementation hint:** Use existing `claude/skills/*/SKILL.md` and `claude/hooks/warden/` layouts as the implementation baseline.

### T007 · Phase 2c — evaluate plugin and ecosystem candidates

- **File:** `TODO.md:55`
- **Severity:** medium
- **Category:** feature
- **Size:** L
- **Blocking IDs:** `[]`
- **Intent:** Finish plugin and ecosystem triage without duplicating functionality already shipped in `plugins/`.
- **Acceptance criteria:**
  - Create new plugin directories only for candidates that pass proof-of-fit.
  - Document reference-only ecosystem packages in `opencode/` docs instead of installing them.
  - Validate any new plugin with the existing plugin validator.
  - Avoid adding plugins that overlap with current repo coverage.
- **Implementation hint:** Use `plugins/conserve/` or `plugins/dependency-blocker/` as the structural reference for any new plugin.

### T010 · Add missing fast-apply skill document

- **File:** `opencode/TODO.md:49`
- **Severity:** medium
- **Category:** bug
- **Size:** S
- **Blocking IDs:** `[]`
- **Intent:** Repair the broken `opencode-fast-apply` reference by creating the missing skill document.
- **Acceptance criteria:**
  - Create `opencode/skill/fast-apply/SKILL.md`.
  - Document anchored fast-apply editing patterns with pre-context and post-context markers.
  - Keep the `opencode/TODO.md` Reference table link valid.
  - Run agent-doc lint on the new skill file.
- **Implementation hint:** Mirror the structure used by `opencode/skill/codebase-index/SKILL.md` and focus on `rg` or `sd` anchored replacements.

### T011 · Triage aggreggator fork note

- **File:** `opencode/TODO.md:22`
- **Severity:** low
- **Category:** docs
- **Size:** S
- **Blocking IDs:** `[]`
- **Intent:** Replace the loose fork note with a classified backlog entry or remove it with rationale.
- **Acceptance criteria:**
  - Remove the loose note from its current position.
  - Inspect `aggreggator/opencode` for changes relevant to this repo.
  - Add one explicit Defer or Reference entry with rationale.
  - Update the `opencode/TODO.md` status counts to match the final tables.
- **Implementation hint:** Compare the fork against upstream OpenCode and record the outcome as a single table row.

### T012 · Create codebase indexer skill

- **File:** `claude/TODO.md:1`
- **Severity:** medium
- **Category:** feature
- **Size:** L
- **Blocking IDs:** `[T014]`
- **Intent:** Add a Claude skill or agent for codebase indexing that combines structural extraction, packing, and token-efficient output.
- **Acceptance criteria:**
  - Create either `claude/skills/codebase-indexer/SKILL.md` or `claude/agents/codebase-indexer.md`.
  - Specify a pipeline that uses `serena` or `ast-grep` and `tree-sitter` for indexing.
  - Specify `repomix` packing, `toon` output shaping, and an optional SQL or Turso persistence path.
  - Remove or check off the originating todo item after implementation.
  - Run agent-doc lint on the new file.
- **Implementation hint:** Prefer a skill unless the workflow needs agent-only orchestration.

### T013 · Decide all-for-claudecode disposition

- **File:** `claude/TODO.md:8`
- **Severity:** low
- **Category:** feature
- **Size:** S
- **Blocking IDs:** `[]`
- **Intent:** Resolve whether `jhlee0409/all-for-claudecode` should be adopted or deferred.
- **Acceptance criteria:**
  - Review the plugin's functionality, license, and overlap.
  - Either add the plugin to tracked config or record a defer rationale in `claude/TODO.md`.
  - Remove the raw install command from the unstructured section.
- **Implementation hint:** Use `claude/settings.json` as the only install target if the plugin is adopted.

### T014 · Classify token-pilot reference

- **File:** `claude/TODO.md:3`
- **Severity:** low
- **Category:** docs
- **Size:** S
- **Blocking IDs:** `[]`
- **Intent:** Decide whether `token-pilot` informs the indexing work or should be deferred or discarded.
- **Acceptance criteria:**
  - Review the package purpose, license, and overlap.
  - Connect it to `T012` or move it into a deferred note with rationale.
  - Remove the bare URL from `claude/TODO.md`.
- **Implementation hint:** Reference it from the codebase-indexer skill only if it contributes token-budget handling.

### T015 · Restructure claude TODO backlog

- **File:** `claude/TODO.md:13`
- **Severity:** low
- **Category:** debt
- **Size:** S
- **Blocking IDs:** `[T013, T014]`
- **Intent:** Normalize `claude/TODO.md` after plugin and token-pilot triage and remove the stale completed LSP item.
- **Acceptance criteria:**
  - Convert `claude/TODO.md` into a structured backlog with explicit statuses.
  - Mark the `.lsp.json` work complete or remove it.
  - Leave no bare URLs or install commands without status.
  - Run agent-doc lint on the updated file.
- **Implementation hint:** Use `opencode/TODO.md` as the formatting baseline and verify the LSP item against `claude/.lsp.json`.

### T016 · Mark opencode defer status correctly

- **File:** `opencode/TODO.md:9`
- **Severity:** low
- **Category:** debt
- **Size:** S
- **Blocking IDs:** `[T011]`
- **Intent:** Change the misleading Defer status label and keep the table counts accurate.
- **Acceptance criteria:**
  - Change the Defer status text from `Pending` to `Deferred`.
  - Update the Defer count after `T011` finishes.
  - Run agent-doc lint on `opencode/TODO.md`.
- **Implementation hint:** Edit the status row only after the fork-note triage is complete.

### T017 · Add PM2 support to opencode-remote installer

- **File:** `opencode-remote/install.sh:201`
- **Severity:** medium
- **Category:** feature
- **Size:** S
- **Blocking IDs:** `[]`
- **Intent:** The installer lacks PM2 process manager support as an alternative for environments without systemd.
- **Acceptance criteria:**
  - Add `install_pm2()` function that installs PM2 globally via npm
  - Add `start_pm2_services()` function that starts openchamber via PM2 with auto-restart
  - Add PM2 configuration for cloudflared tunnel management
  - Document PM2 as alternative in install output when systemd is unavailable
  - Ensure PM2 commands work post-installation
- **Implementation hint:** See `opencode-remote/install.sh:201` for commented stub; implement `install_pm2()` and `start_pm2_services()` following the existing `install_systemd_services()` pattern.
- **Estimated LOC delta:** ~25 lines

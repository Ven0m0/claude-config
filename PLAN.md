# Implementation Plan
_Updated: 2026-03-29 · 16 tasks (9 original + 7 from TODO audit) · Est. 700–1400 LOC_

## Legend
<!-- severity:  critical  high  medium  low -->
<!-- category: bug perf refactor feature security debt docs -->

## Summary
No inline TODO/FIXME/HACK/XXX/WARN/DEPRECATED code markers were found in the repository. All tracked work originates from the structured backlogs in `TODO.md`, `opencode/TODO.md`, and `claude/TODO.md`. Original tasks T001–T005 and T008–T009 are complete. T006–T007 (Phase 2 skill/plugin integrations) remain open. A 2026-03-29 audit of `opencode/TODO.md` and `claude/TODO.md` surfaced 7 new tasks (T010–T016): one broken reference link, one untracked fork integration note, one genuine new indexing feature, three untriaged items, and two housekeeping fixes.

## Task Index (topological order)

| # | ID | Title | Sev | Cat | Size | Blocks | Status |
|---|-----|-------|-----|-----|------|--------|--------|
| 1 | T001 | Wire systemctl cowork service behind opt-in flag |  | feature | S | — | ✅ done |
| 2 | T002 | Implement scaffold script template body |  | feature | S | — | ✅ done |
| 3 | T003 | Add Copilot CLI config once format stabilizes |  | feature | S | — | ✅ done |
| 4 | T004 | Register 5 pending MCP servers in settings |  | feature | S | — | ✅ done |
| 5 | T005 | Phase 1 — inventory and classify external candidates |  | feature | M | — | ✅ done |
| 6 | T006 | Phase 2a/b — integrate skills, hooks, and prompts |  | feature | L | T005 | open |
| 7 | T007 | Phase 2c — evaluate plugin and ecosystem candidates |  | feature | L | T005 | open |
| 8 | T008 | Phase 3 — ship vetted items and update marketplace.json |  | feature | XL | T006, T007 | ✅ done |
| 9 | T009 | Mirror opencode triage results into opencode/TODO.md |  | docs | S | T008 | ✅ done |
| 10 | T010 | Create opencode/skill/fast-apply/SKILL.md (broken reference) |  | bug | S | — | open |
| 11 | T011 | Triage aggreggator/opencode fork note in opencode/TODO.md |  | docs | S | — | open |
| 12 | T012 | Create indexing command/agent for claude |  | feature | L | — | open |
| 13 | T013 | Decide on all-for-claudecode plugin (install or defer) |  | feature | S | — | open |
| 14 | T014 | Triage token-pilot npm package |  | docs | S | — | open |
| 15 | T015 | Housekeep claude/TODO.md (remove done item, reformat) |  | debt | S | — | open |
| 16 | T016 | Fix opencode/TODO.md stale "Pending" label in Defer row |  | debt | S | — | open |

---

## Tasks

[@opencode-remote/PLAN.md](opencode-remote/PLAN.md)
[@opencode-remote/TODO.md](opencode-remote/TODO.md)

### T001 · Wire systemctl cowork service behind opt-in flag ✅
**File:** `setup.sh`
**Status:** Complete — `--with-cowork` flag implemented in `setup.sh`, `setup_cowork()` function present, opt-in gate in `main()`.

---

### T002 · Implement scaffold script template body ✅
**File:** `plugins/config-wizard/skills/designing-claude-skills/scripts/init_skill.py`
**Status:** Complete — placeholder TODO comment removed; script template updated.

---

### T003 · Add Copilot CLI config once format stabilizes ✅
**File:** `copilot-cli/config.json`
**Status:** Complete — `copilot-cli/config.json` added with user-level template.

---

### T004 · Register 5 pending MCP servers in settings ✅
**File:** `claude/settings.json`
**Status:** Complete — all 5 servers (`server-github`, `server-memory`, `server-sequential-thinking`, `context7`, `server-filesystem`) are registered in `claude/settings.json`.

---

### T005 · Phase 1 — inventory and classify external candidates ✅
**File:** `docs/external-integration-triage.md`
**Status:** Complete — triage table created; all candidates classified into integrate/reference/defer buckets.

---

### T006 · Phase 2a/b — integrate skills, hooks, and prompts
**File:** `TODO.md:34-57`
**Severity:** medium · **Category:** feature · **Size:** L
**Blocks:** T008 **Blocked by:** T005

**Context:**
> Skills candidates: `modu-ai/moai-adk`, `daymade/claude-code-skills`, `Piebald-AI/tweakcc`
> Hook/bootstrap candidates: `vtemian/claude-env`, `add-mcp`, `opencode-plugin-preload-skills`, `johnzfitch/claude-warden`, `johnzfitch/llmx`, `1rgs/nanocode`
> Utility candidates: `DanielNappa/tweakgc-cli`, `mangiucugna/json_repair`, `ziad-hsn/code-mode-toon`, `Sharper-Flow/lgrep`

**Intent:** Candidates that pass Phase 1 triage need concrete implementations: new skill files, hook additions, or reference docs in the appropriate directories.

**Acceptance criteria:**
- [ ] Every candidate marked "integrate" in the triage table has a corresponding diff in `claude/skills/`, `claude/hooks/`, or `plugins/`.
- [ ] Every candidate marked "reference" is cited in a relevant existing doc (link only, no copy-paste).
- [ ] No candidate is merged without a passing `uv tool run "claudelint@0.3.3" --strict` on touched files.
- [ ] Maintenance-skill prototype (`claudelint check-all --fix` + `ruff check --fix-only`) exists as a skill under `claude/skills/maintenance/`.

**Implementation:**
For each "integrate" candidate: create the minimal skill/hook file following CLAUDE.md naming and structure conventions. For the maintenance skill: `claude/skills/maintenance/SKILL.md` with two sequential commands.

---

### T007 · Phase 2c — evaluate plugin and ecosystem candidates
**File:** `TODO.md:61-86`
**Severity:** medium · **Category:** feature · **Size:** L
**Blocks:** T008 **Blocked by:** T005

**Context:**
> Plugin candidates: `mattzcarey/zagi`, `siteboon/claudecodeui`, `zeroclaw-labs/zeroclaw`, `proliferate-ai/proliferate`, `pchalasani/claude-code-tools`, `tiann/hapi`, `glommer/cachebro`, `glommer/codemogger`
> Ecosystem packages: `context-mode`, `@azumag/opencode-rate-limit-fallback`, `opencode-kilo-auth`, `@dallay/agentsync`, `@tuanhung303/opencode-acp`, `opencode-dir`, `opencode-websearch`, `@bastiangx/opencode-unmoji`, `@kitlangton/tailcode`, `opencode-fastedit`, `opencode-plugin-auto-update`, `opencode-codebase-index`, `opencode-fast-apply`, `opencode-cachebro`, `@old-mikser/occontext-thinking-trim`, `opencode-image-compress`

**Intent:** Plugin candidates that fit the marketplace model need proof-of-fit before any `plugins/` directory is created.

**Acceptance criteria:**
- [ ] Each "integrate" candidate has a minimal `plugins/<name>/` stub with a `README.md` and `package.json` (or `pyproject.toml`) following existing plugin conventions.
- [ ] Each "reference" candidate is linked from `opencode/` or the appropriate plugin's README.
- [ ] `node plugins/plugin-validator/test.js` passes on any new plugin directory.
- [ ] No plugin is added that duplicates functionality already present in `plugins/`.

**Implementation:**
Use `plugins/conserve/` or `plugins/dependency-blocker/` as structural reference. For ecosystem packages, add entries to `opencode/` config docs rather than installing them globally.

---

### T008 · Phase 3 — ship vetted items and update marketplace.json ✅
**Status:** Complete — `claude-code-tools` plugin promoted and `marketplace.json` updated; `claude-warden` hooks shipped under `claude/hooks/warden/`; deferred candidates recorded.

---

### T009 · Mirror opencode triage results into opencode/TODO.md ✅
**Status:** Complete — `opencode/TODO.md` created with Defer/Reference tables; root `TODO.md` item closed.

---

## New Tasks (from 2026-03-29 TODO audit)

### T010 · Create opencode/skill/fast-apply/SKILL.md (broken reference)
**File:** `opencode/TODO.md` (Reference table row for `opencode-fast-apply`)
**Severity:** medium · **Category:** bug · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
The Reference table in `opencode/TODO.md` lists `opencode-fast-apply` as implemented at `skill/fast-apply/SKILL.md`, but neither `opencode/skill/fast-apply/` nor `opencode/skill/fast-apply/SKILL.md` exists on disk. All other 7 Reference entries link to real files. This is a broken internal link masquerading as done work.

**Acceptance criteria:**
- [ ] `opencode/skill/fast-apply/SKILL.md` exists and documents fast-apply editing patterns (pattern-based find-replace with pre-context and post-context anchors, as implemented by the upstream `opencode-fast-apply` package).
- [ ] `uv tool run "claudelint@0.3.3" --strict opencode/skill/fast-apply/SKILL.md` passes.
- [ ] The Reference table link in `opencode/TODO.md` resolves correctly.

**Implementation:**
Create `opencode/skill/fast-apply/SKILL.md` following the pattern of `opencode/skill/cachebro/SKILL.md` or `opencode/skill/codebase-index/SKILL.md`. Document the fast-apply editing pattern: use short unique context anchors before and after the target block; avoid whole-file rewrites; prefer `sd` or `rg --replace` for single-pass edits.

---

### T011 · Triage aggreggator/opencode fork note in opencode/TODO.md
**File:** `opencode/TODO.md` (loose note above the Defer table)
**Severity:** low · **Category:** docs · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
`opencode/TODO.md` contains an untriaged loose line between the Resources block and the Defer table:
> `extract plugin based on changes of this fork: https://github.com/aggreggator/opencode`

This sits outside both the Defer and Reference buckets with no status, owner, or rationale. It needs a decision: inspect the fork, determine if any changes warrant a new skill/plugin or reference entry, then either add it to the Defer table (with notes), add it to the Reference table (with an implementation link), or discard it with a rationale comment.

**Acceptance criteria:**
- [ ] The loose note is removed from its current position.
- [ ] The fork at `aggreggator/opencode` is inspected; changes relevant to this repo are identified.
- [ ] An entry is added to the Defer table (if no actionable changes found) or the Reference table (if an implementation is created).
- [ ] The Defer/Reference count in the Status table is updated accordingly.

**Implementation:**
Browse `https://github.com/aggreggator/opencode` commits and diffs vs upstream. If only config changes: add to Defer with note "fork-only config tweaks; no extractable skill". If plugin or skill patterns found: create the corresponding `opencode/skill/<name>/SKILL.md` and add to Reference.

---

### T012 · Create indexing command/agent for claude
**File:** `claude/TODO.md` (first item)
**Severity:** medium · **Category:** feature · **Size:** L
**Blocks:** — **Blocked by:** —

**Context:**
`claude/TODO.md` calls for an indexing command or agent that integrates:
- **serena** — semantic code index
- **ast-grep** — structural pattern search
- **tree-sitter** — syntax-level parsing
- **repomix** — codebase-to-text packing
- **toon** — efficient token output
- sql/turso indexing — persistent structured storage

The `token-pilot` npm package (`https://www.npmjs.com/package/token-pilot`) is also listed as a possible reference. No equivalent agent or command exists under `claude/agents/` or `claude/skills/`.

**Acceptance criteria:**
- [ ] A new agent or skill exists at `claude/agents/codebase-indexer.md` (agent) or `claude/skills/codebase-indexer/SKILL.md` (skill).
- [ ] The implementation chains serena (or ast-grep) for structural indexing, repomix for text packing, and toon for output formatting.
- [ ] A sql/turso storage option is documented or stubbed for persistent index reuse.
- [ ] `uv tool run "claudelint@0.3.3" --strict <path>` passes on the new file.
- [ ] The `claude/TODO.md` item is removed or checked off after implementation.

**Implementation:**
Decide on agent vs. skill based on whether the indexing task is interactive (agent) or invoked as a command (skill). Likely a skill. Create `claude/skills/codebase-indexer/SKILL.md` that: (1) runs `ast-grep` or serena to extract symbol index, (2) pipes through `repomix` for token-efficient packing, (3) uses `toon` for output. Document turso as optional persistent backend. Check `token-pilot` for any reusable patterns before writing from scratch.

---

### T013 · Decide on all-for-claudecode plugin (install or defer)
**File:** `claude/TODO.md` (claude auto-run section)
**Severity:** low · **Category:** feature · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
`claude/TODO.md` contains an install command with no triage decision:
```bash
claude /plugin marketplace add jhlee0409/all-for-claudecode && claude /plugin install afc@all-for-claudecode
```
The plugin is not installed in `claude/settings.json`. No defer rationale exists. A decision is needed.

**Acceptance criteria:**
- [ ] `jhlee0409/all-for-claudecode` is inspected for functionality, license, and overlap with existing plugins.
- [ ] Either: the plugin is installed and `claude/settings.json` is updated, **or** it is added to a Defer section in `claude/TODO.md` with a one-line rationale.
- [ ] The bare install command is removed from the unstructured section of `claude/TODO.md`.

**Implementation:**
Browse `https://github.com/jhlee0409/all-for-claudecode`. Evaluate: does it duplicate existing hooks or skills? Is the license compatible? If yes to fit: run the install command and commit the settings change. If not: add to a Defer table in `claude/TODO.md`.

---

### T014 · Triage token-pilot npm package
**File:** `claude/TODO.md` (first item, linked URL)
**Severity:** low · **Category:** docs · **Size:** S
**Blocks:** T012 **Blocked by:** —

**Context:**
`claude/TODO.md` lists `https://www.npmjs.com/package/token-pilot` as a reference with no context. It is unclear whether this is an input to the indexing feature (T012), a standalone skill candidate, or just a bookmark. It needs a disposition before T012 can be considered fully scoped.

**Acceptance criteria:**
- [ ] `token-pilot` is reviewed for purpose, license, and overlap.
- [ ] Either: it is referenced in the T012 implementation as a pattern source, **or** it is added as a Defer entry in `claude/TODO.md`, **or** it is discarded with a one-line note.
- [ ] The bare URL line is removed from `claude/TODO.md`.

**Implementation:**
Browse `https://www.npmjs.com/package/token-pilot`. If it offers token-budget management patterns useful for the indexing skill: cite it in T012's SKILL.md references. Otherwise defer.

---

### T015 · Housekeep claude/TODO.md (remove done item, reformat)
**File:** `claude/TODO.md`
**Severity:** low · **Category:** debt · **Size:** S
**Blocks:** — **Blocked by:** T013, T014

**Context:**
`claude/TODO.md` has three structural problems:
1. The `.lsp.json` enhancement item is **fully done** — all 11 listed LSP servers (tombi, vtsls, basedpyright, yaml-language-server, vscode-json/html/css-language-server, rust-analyzer, dockerfile-language-server, bash-language-server, fish-lsp) are present in `claude/.lsp.json` — but the item was never removed or checked off.
2. The file is unstructured prose with no checkboxes, no triage buckets, and no status labels, unlike `opencode/TODO.md`.
3. After T013 and T014 resolve, leftover bare commands and URLs should be removed.

**Acceptance criteria:**
- [ ] The `.lsp.json` item is removed (it is done) or replaced with a `[x]` checkbox noting completion.
- [ ] `claude/TODO.md` is reformatted with checkboxes for open items.
- [ ] No bare URLs or install commands remain without a status label.
- [ ] `uv tool run "claudelint@0.3.3" --strict claude/TODO.md` passes.

**Implementation:**
Rewrite `claude/TODO.md` as a minimal checklist. Mark `.lsp.json` as `[x]` done. Convert remaining open items (T012 indexing feature, T013 plugin decision) to `[ ]` checkboxes. Remove items resolved by T013 and T014.

---

### T016 · Fix opencode/TODO.md stale "Pending" label in Defer row
**File:** `opencode/TODO.md` (Status table)
**Severity:** low · **Category:** debt · **Size:** S
**Blocks:** — **Blocked by:** T011

**Context:**
The Status table in `opencode/TODO.md` reads:

| Category | Count | Status |
|----------|-------|--------|
| Defer | 8 | Pending |
| Reference | 8 | Implemented |

"Pending" is a misleading label for the Defer bucket — those items are consciously deferred, not awaiting action. The count will also change after T011 resolves the aggreggator fork note.

**Acceptance criteria:**
- [ ] The Defer row Status is changed from "Pending" to "Deferred".
- [ ] The Defer count is updated if T011 adds or removes a Defer entry.
- [ ] `uv tool run "claudelint@0.3.3" --strict opencode/TODO.md` passes.

**Implementation:**
Edit the Status table in `opencode/TODO.md`. Change `Pending` → `Deferred` in the Defer row. Adjust count after T011.

---

## Inline Markers Scan Result

**Scan date:** 2026-03-29
**Pattern:** `TODO|FIXME|HACK|XXX|WARN|DEPRECATED|NOTE\(|TODO:`
**Scopes:** All source files, configs, docs (excluding vendor, node_modules, .venv, dist, generated, lock files)
**Result:** 0 matches

No inline code markers exist in this repository. All tracked work originates from structured backlog items in `TODO.md`, `opencode/TODO.md`, and `claude/TODO.md`.

---

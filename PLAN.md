# Implementation Plan
_Generated: 2026-03-21 · 9 tasks · Est. 500–1000 LOC_

## Legend
<!-- severity: 🔴 critical 🟠 high 🟡 medium 🔵 low -->
<!-- category: bug perf refactor feature security debt docs -->

## Summary
Two inline code markers exist in source files: an unfinished `systemctl` cowork integration in `setup.sh` and a stub script body in the skill-scaffolding generator. The remainder of the work is structured backlog from `TODO.md` covering external-integration triage across skills, hooks, and plugins. All items are additive features or research gates with no crash paths or data-loss risk.

## Task Index (topological order)

| # | ID | Title | Sev | Cat | Size | Blocks |
|---|-----|-------|-----|-----|------|--------|
| 1 | T001 | Wire systemctl cowork service behind opt-in flag | 🟡 | feature | S | — |
| 2 | T002 | Implement scaffold script template body | 🔵 | feature | S | — |
| 3 | T003 | Add Copilot CLI config once format stabilizes | 🔵 | feature | S | — |
| 4 | T004 | Register 5 pending MCP servers in settings | 🔵 | feature | S | — |
| 5 | T005 | Phase 1 — inventory and classify external candidates | 🟡 | feature | M | — |
| 6 | T006 | Phase 2a/b — integrate skills, hooks, and prompts | 🟡 | feature | L | T005 |
| 7 | T007 | Phase 2c — evaluate plugin and ecosystem candidates | 🟡 | feature | L | T005 |
| 8 | T008 | Phase 3 — ship vetted items and update marketplace.json | 🟡 | feature | XL | T006, T007 |
| 9 | T009 | Mirror opencode triage results into opencode/TODO.md | 🔵 | docs | S | T008 |

---

## Tasks

[@opencode-remote/PLAN.md](opencode-remote/PLAN.md)
[@opencode-remote/TODO.md](opencode-remote/TODO.md)

### T001 · Wire systemctl cowork service behind opt-in flag
**File:** `setup.sh:230`
**Severity:** medium · **Category:** feature · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
> `# TODO: integrate into main() with opt-in flag before enabling`
> `# systemctl --user enable --now claude-cowork`

**Intent:** The author wanted to expose `claude-cowork` systemd unit activation as an optional install step controlled by a CLI flag, consistent with how other optional components (`--with-prunize`, `--with-tweakcc`) are wired.

**Acceptance criteria:**
- [ ] A new `--with-cowork` flag is parsed in `main()` alongside existing opt-in flags.
- [ ] `setup_cowork()` function calls `systemctl --user enable --now claude-cowork`.
- [ ] `setup_cowork()` is only invoked when `with_cowork -eq 1`.
- [ ] `shellcheck` passes on the modified `setup.sh`.
- [ ] Running `setup.sh` without `--with-cowork` does not touch the systemd unit.

**Implementation:**
```bash
# pattern mirrors existing opt-in gates in main():
with_cowork=0
# arg parsing:
--with-cowork) with_cowork=1 ;;
# in main() dispatch block:
[[ $with_cowork -eq 1 ]] && setup_cowork
# new function:
setup_cowork() {
  systemctl --user enable --now claude-cowork || warn "cowork unit not found; skipping"
}
```

---

### T002 · Implement scaffold script template body
**File:** `plugins/config-wizard/skills/designing-claude-skills/scripts/init_skill.py:118`
**Severity:** low · **Category:** feature · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
> `# TODO: Add actual script logic here`
> `# This could be data processing, file conversion, API calls, etc.`

**Intent:** The `EXAMPLE_SCRIPT` template string used by `init_skill.py` to seed new skills contains a placeholder body that just prints a greeting. The generated file gives no real starting point for implementers.

**Acceptance criteria:**
- [ ] The template body demonstrates argument parsing via `argparse` (input path, output path).
- [ ] The template includes a minimal read-transform-write skeleton with clear replace-me comments.
- [ ] Template is still a valid Python file that runs without errors.
- [ ] Existing `init_skill.py` tests (if any) continue to pass under `uv run pytest`.

**Implementation:**
```python
# Replace placeholder body with argparse skeleton:
import argparse, pathlib, sys

def main() -> None:
    parser = argparse.ArgumentParser(description="TODO: describe {skill_name}")
    parser.add_argument("input", type=pathlib.Path)
    parser.add_argument("-o", "--output", type=pathlib.Path, default=None)
    args = parser.parse_args()
    # TODO: implement transform logic
    data = args.input.read_text()
    result = data  # replace with real transform
    out = args.output or pathlib.Path("/dev/stdout")
    out.write_text(result)

if __name__ == "__main__":
    main()
```

---

### T003 · Add Copilot CLI config once format stabilizes
**File:** `TODO.md:3`
**Severity:** low · **Category:** feature · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
> `- Add Copilot CLI config when local settings format is stable.`

**Intent:** Copilot CLI local settings were unstable at write time; this should be revisited and a config file added to `copilot-cli/` once the format is confirmed.

**Acceptance criteria:**
- [ ] Upstream Copilot CLI local settings format is confirmed stable (check release notes / changelog).
- [ ] A config file is added under `copilot-cli/` following the confirmed schema.
- [ ] The entry in `TODO.md` is removed or replaced with a link to the new file.
- [ ] `bunx @biomejs/biome check` passes on any new JS/JSON files.

**Implementation:**
Consult `copilot-cli/` directory structure and upstream Copilot CLI docs; add `copilot-cli/settings.json` or equivalent using the stable schema.

---

### T004 · Register 5 pending MCP servers in settings
**File:** `TODO.md:4-9`
**Severity:** low · **Category:** feature · **Size:** S
**Blocks:** — **Blocked by:** —

**Context:**
> `- Add MCP servers:`
> `  - bunx @modelcontextprotocol/server-github`
> `  - bunx @modelcontextprotocol/server-memory`
> `  - bunx @modelcontextprotocol/server-sequential-thinking`
> `  - bunx @context7/mcp-server`
> `  - bunx @modelcontextprotocol/server-filesystem`

**Intent:** Five MCP servers are identified for addition to the Claude Code settings but were deferred, likely pending stability or permission decisions.

**Acceptance criteria:**
- [ ] Each server entry is added to `claude/settings.json` under `mcpServers`.
- [ ] Each entry uses `bunx <package>` as the command with an empty `args` array.
- [ ] `bunx @biomejs/biome check claude/settings.json` passes.
- [ ] The TODO.md lines are removed after integration.

**Implementation:**
```jsonc
// claude/settings.json mcpServers block additions:
"server-github":              { "command": "bunx", "args": ["@modelcontextprotocol/server-github"] },
"server-memory":              { "command": "bunx", "args": ["@modelcontextprotocol/server-memory"] },
"server-sequential-thinking": { "command": "bunx", "args": ["@modelcontextprotocol/server-sequential-thinking"] },
"context7":                   { "command": "bunx", "args": ["@context7/mcp-server"] },
"server-filesystem":          { "command": "bunx", "args": ["@modelcontextprotocol/server-filesystem"] }
```

---

### T005 · Phase 1 — inventory and classify external candidates
**File:** `TODO.md:26-28`
**Severity:** medium · **Category:** feature · **Size:** M
**Blocks:** T006, T007 **Blocked by:** —

**Context:**
> `- [ ] Confirm the target surface for each candidate (claude/agents, claude/skills, claude/hooks, plugins, opencode, or docs only).`
> `- [ ] Record license, maintenance status, install method, and overlap with existing marketplace entries before adding anything user-facing.`
> `- [ ] Split candidates into three buckets: direct integration, reference-only inspiration, and deferred follow-up.`

**Intent:** Before integrating any external repo, a triage table must exist so later phases can act on firm decisions rather than re-researching.

**Acceptance criteria:**
- [ ] A triage table (markdown) exists at `docs/external-integration-triage.md` listing each candidate with columns: name, URL, license, last-commit, target surface, bucket (integrate/reference/defer), notes.
- [ ] All candidates from TODO.md Phase 2 are present in the table.
- [ ] Each bucket decision has a one-line rationale.
- [ ] `TODO.md` Phase 1 checkboxes are checked or replaced with a link to the triage file.

**Implementation:**
Create `docs/external-integration-triage.md` with a markdown table. Populate by fetching each repo's README/license via web or `gh repo view`. Use columns: `| Candidate | License | Last commit | Surface | Bucket | Notes |`.

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

### T008 · Phase 3 — ship vetted items and update marketplace.json
**File:** `TODO.md:90-93`
**Severity:** medium · **Category:** feature · **Size:** XL
**Blocks:** T009 **Blocked by:** T006, T007

**Context:**
> `- [ ] Promote validated candidates into plugins/, claude/skills/, or claude/hooks/ only after a narrow proof-of-fit and minimal implementation plan exists for each item.`
> `- [ ] Update .claude-plugin/marketplace.json only for integrations that are actually shipped in this repo.`
> `- [ ] Keep this file as the source of truth for inbound references until each item is either integrated, documented elsewhere, or explicitly deferred.`

**Intent:** Phase 3 converts the research and stubs from T006/T007 into fully shipped, tested, and marketplace-registered entries, then closes out the TODO backlog.

**Acceptance criteria:**
- [ ] `.claude-plugin/marketplace.json` contains entries only for plugins present in `plugins/`.
- [ ] Each new plugin or skill passes `uv tool run "claudelint@0.3.3" --strict <path>`.
- [ ] All Phase 2 items in `TODO.md` are either checked off, linked to an implementation, or explicitly marked "deferred" with rationale.
- [ ] The whole-repo lint suite (`ruff`, `biome`, `tsc --noEmit`, `claudelint`) passes.

**Implementation:**
Iterate the triage table from T005. For each "integrate" item: finalize implementation from T006/T007, add marketplace.json entry using the existing schema, run validation. For "defer" items: add a `<!-- deferred: <reason> -->` comment in `TODO.md` and close the checkbox.

---

### T009 · Mirror opencode triage results into opencode/TODO.md
**File:** `TODO.md:92`
**Severity:** low · **Category:** docs · **Size:** S
**Blocks:** — **Blocked by:** T008

**Context:**
> `- [ ] Mirror opencode-specific results into opencode/TODO.md once the package-level triage is complete.`

**Intent:** After T008 completes, opencode-specific backlog items should live close to their implementation area rather than in the root TODO.md.

**Acceptance criteria:**
- [ ] `opencode/TODO.md` exists and lists all opencode-specific deferred or future items extracted from root `TODO.md`.
- [ ] Root `TODO.md` no longer duplicates the opencode-specific list (links to `opencode/TODO.md` instead).
- [ ] `uv tool run "claudelint@0.3.3" --strict opencode/TODO.md` passes.

**Implementation:**
Create `opencode/TODO.md` with a heading per candidate type (plugins, ecosystem packages). Move opencode-specific rows from the triage table. Update root `TODO.md` line 92 to `[x]` with a link.

---

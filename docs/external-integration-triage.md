# External Integration Triage

Current disposition for the Phase 2 candidates listed in [`../TODO.md`](../TODO.md).

## Skills, prompts, and local automation

| Candidate | Disposition | Local target | Notes |
|---|---|---|---|
| `modu-ai/moai-adk` | Integrated | `../claude/skills/moai/SKILL.md` | Reused for extension-authoring workflow patterns. |
| `daymade/claude-code-skills` | Reference | Marketplace only | Useful external source, but no local mirror because the repo already ships curated local skills. |
| `Piebald-AI/tweakcc` | Integrated | `../claude/tweakcc/config.json`, `../setup.sh`, `../update.sh` | Kept as tracked config plus optional setup/update flow. |
| `DanielNappa/tweakgc-cli` | Reference | `../claude/skills/maintenance/SKILL.md` | Similar optimization lane already covered by `tweakcc` and local maintenance flows. |
| `mangiucugna/json_repair` | Integrated | `../claude/skills/json-repair/SKILL.md` | Shipped as a dedicated repair skill. |
| `ziad-hsn/code-mode-toon` | Integrated | `../claude/skills/toon-formatter/SKILL.md`, `../claude/hooks/json-to-toon.mjs` | Kept as local TOON guidance plus formatter hook. |
| `Sharper-Flow/lgrep` | Deferred | — | Repo guidance standardizes on `rg`; no value in adding another search wrapper. |
| Maintenance autofix flow | Integrated | `../claude/skills/maintenance/SKILL.md` | Runs `claudelint` and `ruff` autofix commands before validation. |

## Hooks, environment management, and bootstrap

| Candidate | Disposition | Local target | Notes |
|---|---|---|---|
| `vtemian/claude-env` | Reference | `../setup.sh`, `../claude/settings.json` | Environment/bootstrap concerns are already handled in local setup scripts and settings. |
| `add-mcp` | Reference | `../claude/settings.json` | MCP servers are tracked directly in repo config instead of through another wrapper. |
| `@mathew-cf/opencode-mcp-auto-reauth` | Deferred | — | OpenCode-specific auth helper; not a fit for Claude config. |
| `opencode-plugin-preload-skills` | Integrated | `../claude/hooks/load-mcp-skills.sh` | Local hook already covers preload behavior. |
| `johnzfitch/claude-warden` | Integrated | `../claude/hooks/claude-warden.sh`, `../claude/hooks/warden/` | Shipped as local hook assets. |
| `johnzfitch/llmx` | Reference | `../claude/hooks/warden/`, `../claude/settings.json` | Guardrail ideas are covered by existing hook and settings policy. |
| `1rgs/nanocode` | Reference | This document only | Preserve the validation note `nohup nanobot agent > nanobot.log 2>&1 &` as an external pattern, not a local dependency. |

## Plugins and ecosystem packages

| Candidate | Disposition | Local target | Notes |
|---|---|---|---|
| `mattzcarey/zagi` | Deferred | — | Interesting CLI, but no repo-local plugin package or config change is justified yet. |
| `siteboon/claudecodeui` | Deferred | — | UI wrapper does not fit this config-first repo. |
| `zeroclaw-labs/zeroclaw` | Deferred | — | Overlaps with existing agent/hook coverage. |
| `proliferate-ai/proliferate` | Deferred | — | Heavy orchestration overlap with local workflows and enabled bundles. |
| `pchalasani/claude-code-tools` | Reference | `../.claude-plugin/marketplace.json` | Retained as a marketplace-tracked external plugin without adding a local mirror package. |
| `tiann/hapi` | Deferred | — | No clear fit beyond existing shell and process workflows. |
| `glommer/cachebro` | Reference | `../opencode/plugins/cachebro.ts`, `../opencode/skill/cachebro/SKILL.md` | Keep as OpenCode-side reference instead of a new Claude plugin. |
| `glommer/codemogger` | Reference | `../opencode/plugins/codemogger.ts` | Useful OpenCode-side experiment, but not a root plugin package. |
| `context-mode` | Deferred | `../opencode/README.md` | Current OpenCode/Bun environment still treats it as unreliable. |
| `@azumag/opencode-rate-limit-fallback` | Deferred | `../opencode/TODO.md` | OpenCode-specific fallback plugin; out of Claude scope. |
| `opencode-kilo-auth` | Deferred | `../opencode/TODO.md` | Auth overlap with current provider strategy. |
| `@dallay/agentsync` | Reference | `../opencode/command/agentsync.md` | Local command captures the useful sync pattern. |
| `@tuanhung303/opencode-acp` | Reference | `../opencode/skill/context-prune/SKILL.md` | Mapped to a lighter local context-prune skill. |
| `opencode-dir` | Deferred | `../opencode/TODO.md` | Niche workflow, not worth baseline prompt weight. |
| `opencode-websearch` | Reference | `../opencode/skill/websearch/SKILL.md` | Covered by existing web search docs and tools. |
| `@bastiangx/opencode-unmoji` | Deferred | `../opencode/TODO.md` | Cosmetic-only utility. |
| `@kitlangton/tailcode` | Reference | `../opencode/skill/tailnet-publish/SKILL.md` | Kept as an operational pattern rather than a dependency. |
| `opencode-fastedit` | Deferred | `../opencode/README.md` | Overlaps with Morph and the lean editing flow. |
| `opencode-plugin-auto-update` | Deferred | `../opencode/TODO.md` | Extra lifecycle complexity for low value here. |
| `opencode-codebase-index` | Reference | `../opencode/skill/codebase-index/SKILL.md` | Local skill is enough; no package install needed. |
| `opencode-fast-apply` | Reference | `../opencode/skill/fast-apply/SKILL.md` | Captured as editing guidance rather than an installed package. |
| `opencode-cachebro` | Reference | `../opencode/skill/cachebro/SKILL.md` | Documented as a local pattern tied to the repo plugin file. |
| `@old-mikser/occontext-thinking-trim` | Deferred | `../opencode/TODO.md` | Overlaps with existing context-prune flows. |
| `opencode-image-compress` | Reference | `../opencode/skill/image-compress/SKILL.md` | Local skill already covers the practical workflow. |

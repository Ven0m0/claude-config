# TODO

- [x] Add Copilot CLI config - `copilot-cli/config.json` (user-level `~/.copilot/config.json` template with `model` and `reasoning_effort`).

[Claude tool usage](https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool)

```python
def truncate_output(output, max_lines=100):
    lines = output.split("\n")
    if len(lines) > max_lines:
        truncated = "\n".join(lines[:max_lines])
        return f"{truncated}\n\n... Output truncated ({len(lines)} total lines) ..."
    return output
```

## External integration implementation plan

See [external-integration-triage.md](./docs/external-integration-triage.md) for the current disposition of every Phase 2 candidate.

### Phase 1: Inventory and classify candidates

- [x] Confirm the target surface for each candidate (`claude/agents`, `claude/skills`, `claude/hooks`, `plugins`, `opencode`, or docs only) — see [external-integration-triage.md](./docs/external-integration-triage.md).
- [x] Record license, maintenance status, install method, and overlap with existing marketplace entries before adding anything user-facing — see triage table.
- [x] Split candidates into three buckets: direct integration, reference-only inspiration, and deferred follow-up — see triage table.

### Phase 2: Prioritize by repo area

#### Skills, prompts, and local automation

- [x] Review for reusable skill layout, prompt modules, and workflow conventions that fit `claude/skills/`:
  - [`modu-ai/moai-adk`](https://github.com/modu-ai/moai-adk)
  - [`daymade/claude-code-skills`](https://github.com/daymade/claude-code-skills)
  - [`Piebald-AI/tweakcc`](https://github.com/Piebald-AI/tweakcc)
  - Integrated `moai-adk` patterns into `claude/skills/moai/SKILL.md`.
  - Kept `daymade/claude-code-skills` as a marketplace/reference-only source; no local mirror.
  - Kept `tweakcc` as a tracked config/bootstrap integration via `claude/tweakcc/config.json`, `setup.sh`, and `update.sh`.
- [x] Review for standalone utilities or wrappers that can become new skills or references in existing skill docs:
  - [`DanielNappa/tweakgc-cli`](https://github.com/DanielNappa/tweakgc-cli)
  - [`mangiucugna/json_repair`](https://github.com/mangiucugna/json_repair)
  - [`ziad-hsn/code-mode-toon`](https://github.com/ziad-hsn/code-mode-toon)
  - [`Sharper-Flow/lgrep`](https://github.com/Sharper-Flow/lgrep)
  - Added or kept local references at `claude/skills/json-repair/SKILL.md`, `claude/skills/toon-formatter/SKILL.md`, and `claude/skills/codebase-indexer/SKILL.md`.
  - Left `tweakgc-cli` and `lgrep` as reference-only because existing `tweakcc` and `rg` coverage already fit this repo better.
- [x] Prototype a maintenance skill that runs the requested autofix commands before validation:
  - `claudelint check-all --fix >/dev/null 2>&1`
  - `ruff check --fix-only --unsafe-fixes . >/dev/null 2>&1`
  - Implemented at `claude/skills/maintenance/SKILL.md`.

#### Hooks, environment management, and session bootstrap

- [x] Review for hook or bootstrap improvements under `claude/hooks/`:
  - [`vtemian/claude-env`](https://github.com/vtemian/claude-env)
  - [`add-mcp`](https://www.npmjs.com/package/add-mcp)
  - [`@mathew-cf/opencode-mcp-auto-reauth`](https://www.npmjs.com/package/@mathew-cf/opencode-mcp-auto-reauth)
  - [`opencode-plugin-preload-skills`](https://www.npmjs.com/package/opencode-plugin-preload-skills)
  - Kept environment/bootstrap work in `setup.sh`, `claude/settings.json`, and `claude/hooks/load-mcp-skills.sh`.
  - Left OpenCode-only reauth automation as reference-only instead of adding Claude-specific placeholders.
- [x] Review for policy, environment, and session guardrails that complement existing hook protections:
  - [`johnzfitch/claude-warden`](https://github.com/johnzfitch/claude-warden)
  - [`johnzfitch/llmx`](https://github.com/johnzfitch/llmx)
  - `claude-warden` shipped locally at `claude/hooks/claude-warden.sh` and `claude/hooks/warden/`.
  - `llmx` remains reference-only because current hook and settings guardrails already cover the needed policy surface.
- [x] Review [`1rgs/nanocode`](https://github.com/1rgs/nanocode) and preserve the background-run note for validation: `nohup nanobot agent > nanobot.log 2>&1 &`.
  - Preserved as an external reference in [`docs/external-integration-triage.md`](./docs/external-integration-triage.md) only; no local runtime integration.

#### Plugins, ecosystem integrations, and marketplace references

- [x] Compare against existing plugin coverage before creating new plugin packages:
  - [`mattzcarey/zagi`](https://github.com/mattzcarey/zagi)
  - [`siteboon/claudecodeui`](https://github.com/siteboon/claudecodeui)
  - [`zeroclaw-labs/zeroclaw`](https://github.com/zeroclaw-labs/zeroclaw)
  - [`proliferate-ai/proliferate`](https://github.com/proliferate-ai/proliferate)
  - [`pchalasani/claude-code-tools`](https://github.com/pchalasani/claude-code-tools)
  - [`tiann/hapi`](https://github.com/tiann/hapi)
  - [`glommer/cachebro`](https://github.com/glommer/cachebro)
  - [`glommer/codemogger`](https://github.com/glommer/codemogger)
  - Kept the only fit candidate as a tracked marketplace entry: `pchalasani/claude-code-tools` in `.claude-plugin/marketplace.json`.
  - Kept overlap-heavy or UI-only candidates as reference/deferred items instead of adding new local plugin directories.
- [x] Evaluate ecosystem packages for the `opencode/` backlog and shared plugin patterns:
  - [`context-mode`](https://www.npmjs.com/package/context-mode)
  - [`@azumag/opencode-rate-limit-fallback`](https://www.npmjs.com/package/@azumag/opencode-rate-limit-fallback)
  - [`opencode-kilo-auth`](https://www.npmjs.com/package/opencode-kilo-auth)
  - [`@dallay/agentsync`](https://www.npmjs.com/package/@dallay/agentsync)
  - [`@tuanhung303/opencode-acp`](https://www.npmjs.com/package/@tuanhung303/opencode-acp)
  - [`opencode-dir`](https://www.npmjs.com/package/opencode-dir)
  - [`opencode-websearch`](https://www.npmjs.com/package/opencode-websearch)
  - [`@bastiangx/opencode-unmoji`](https://www.npmjs.com/package/@bastiangx/opencode-unmoji)
  - [`@kitlangton/tailcode`](https://www.npmjs.com/package/@kitlangton/tailcode)
  - [`opencode-fastedit`](https://www.npmjs.com/package/opencode-fastedit)
  - [`opencode-plugin-auto-update`](https://www.npmjs.com/package/opencode-plugin-auto-update)
  - [`opencode-codebase-index`](https://www.npmjs.com/package/opencode-codebase-index)
  - [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply)
  - [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro)
  - [`@old-mikser/occontext-thinking-trim`](https://www.npmjs.com/package/@old-mikser/occontext-thinking-trim)
  - [`opencode-image-compress`](https://www.npmjs.com/package/opencode-image-compress)
  - Recorded final OpenCode dispositions in `opencode/TODO.md` and [`docs/external-integration-triage.md`](./docs/external-integration-triage.md).
  - Added local reference skills for `opencode-fast-apply` and `opencode-cachebro` without installing extra ecosystem packages.

### Phase 3: Turn references into tracked work

- [x] Promote validated candidates into `plugins/`, `claude/skills/`, or `claude/hooks/` only after a narrow proof-of-fit and minimal implementation plan exists for each item.
  - `johnzfitch/claude-warden` implemented at `claude/hooks/claude-warden.sh` and `claude/hooks/warden/`
  - `pchalasani/claude-code-tools` retained as a marketplace-tracked external plugin; no extra local mirror added
  - `daymade/claude-code-skills` deferred - external marketplace reference only, no local skill implementation
- [x] Update `.claude-plugin/marketplace.json` only for integrations that are actually shipped in this repo.
  - Added `claude-code-tools` plugin entry (lines 125-139)
  - Note: `claude-warden` hooks shipped at `claude/hooks/warden/` but hooks are not in marketplace.json schema
- [x] Mirror opencode-specific results into [`opencode/TODO.md`](./opencode/TODO.md) — see T009.
- [x] Keep this file as the source of truth for inbound references until each item is either integrated, documented elsewhere, or explicitly deferred.

<details><summary><b>Resources</b></summary>

### Directories and marketplaces

- [smithery.ai](https://smithery.ai)
- [claude-plugins.dev](https://claude-plugins.dev)
- [buildwithclaude.com/plugins](https://buildwithclaude.com/plugins)
- [happy.engineering/tools](https://happy.engineering/tools)
- [codeagent.directory](https://codeagent.directory)
- [skillsdirectory.com](https://skillsdirectory.com)
- [mcpdirectory.ai](https://mcpdirectory.ai)
- [skills.sh](https://skills.sh)
- [skillsmp.com](https://skillsmp.com)
- [aiagentslist.com](https://aiagentslist.com)
- [pulsemcp.com](https://pulsemcp.com)
- [desktopcommander.app](https://desktopcommander.app)
- [clawhub.ai](https://clawhub.ai)
- [skills.cokac.com](https://skills.cokac.com)
- [prompts.chat](https://prompts.chat)
- [mcp.so](https://mcp.so)
- [creati.ai](https://creati.ai)
- [mcpservers.org](https://mcpservers.org)
- [mseep.ai](https://mseep.ai)
- [playbooks.com](https://playbooks.com)
- [lxgicstudios.com](https://lxgicstudios.com)
- [cursorlist.com](https://cursorlist.com)
- [cursor.directory](https://cursor.directory)
- [opencode.cafe](https://opencode.cafe)
- [skills.rest](https://skills.rest)

### Candidate repos and packages

- See the Phase 2 checklist above for the linked repo and package inventory that needs triage.
</details>

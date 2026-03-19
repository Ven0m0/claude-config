# TODO

- Add Copilot CLI config when local settings format is stable.
- Add MCP servers:
  - `bunx @modelcontextprotocol/server-github`
  - `bunx @modelcontextprotocol/server-memory`
  - `bunx @modelcontextprotocol/server-sequential-thinking`
  - `bunx @context7/mcp-server`
  - `bunx @modelcontextprotocol/server-filesystem`

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

### Phase 1: Inventory and classify candidates

- [ ] Confirm the target surface for each candidate (`claude/agents`, `claude/skills`, `claude/hooks`, `plugins`, `opencode`, or docs only).
- [ ] Record license, maintenance status, install method, and overlap with existing marketplace entries before adding anything user-facing.
- [ ] Split candidates into three buckets: direct integration, reference-only inspiration, and deferred follow-up.

### Phase 2: Prioritize by repo area

#### Skills, prompts, and local automation

- [ ] Review for reusable skill layout, prompt modules, and workflow conventions that fit `claude/skills/`:
  - [`modu-ai/moai-adk`](https://github.com/modu-ai/moai-adk)
  - [`daymade/claude-code-skills`](https://github.com/daymade/claude-code-skills)
  - [`Piebald-AI/tweakcc`](https://github.com/Piebald-AI/tweakcc)
- [ ] Review for standalone utilities or wrappers that can become new skills or references in existing skill docs:
  - [`DanielNappa/tweakgc-cli`](https://github.com/DanielNappa/tweakgc-cli)
  - [`mangiucugna/json_repair`](https://github.com/mangiucugna/json_repair)
  - [`ziad-hsn/code-mode-toon`](https://github.com/ziad-hsn/code-mode-toon)
  - [`Sharper-Flow/lgrep`](https://github.com/Sharper-Flow/lgrep)
- [ ] Prototype a maintenance skill that runs the requested autofix commands before validation:
  - `claudelint check-all --fix >/dev/null 2>&1`
  - `ruff check --fix-only --unsafe-fixes . >/dev/null 2>&1`

#### Hooks, environment management, and session bootstrap

- [ ] Review for hook or bootstrap improvements under `claude/hooks/`:
  - [`vtemian/claude-env`](https://github.com/vtemian/claude-env)
  - [`add-mcp`](https://www.npmjs.com/package/add-mcp)
  - [`@mathew-cf/opencode-mcp-auto-reauth`](https://www.npmjs.com/package/@mathew-cf/opencode-mcp-auto-reauth)
  - [`opencode-plugin-preload-skills`](https://www.npmjs.com/package/opencode-plugin-preload-skills)
- [ ] Review for policy, environment, and session guardrails that complement existing hook protections:
  - [`johnzfitch/claude-warden`](https://github.com/johnzfitch/claude-warden)
  - [`johnzfitch/llmx`](https://github.com/johnzfitch/llmx)
- [ ] Review [`1rgs/nanocode`](https://github.com/1rgs/nanocode) and preserve the background-run note for validation: `nohup nanobot agent > nanobot.log 2>&1 &`.

#### Plugins, ecosystem integrations, and marketplace references

- [ ] Compare against existing plugin coverage before creating new plugin packages:
  - [`mattzcarey/zagi`](https://github.com/mattzcarey/zagi)
  - [`siteboon/claudecodeui`](https://github.com/siteboon/claudecodeui)
  - [`zeroclaw-labs/zeroclaw`](https://github.com/zeroclaw-labs/zeroclaw)
  - [`proliferate-ai/proliferate`](https://github.com/proliferate-ai/proliferate)
  - [`pchalasani/claude-code-tools`](https://github.com/pchalasani/claude-code-tools)
  - [`tiann/hapi`](https://github.com/tiann/hapi)
  - [`glommer/cachebro`](https://github.com/glommer/cachebro)
  - [`glommer/codemogger`](https://github.com/glommer/codemogger)
- [ ] Evaluate ecosystem packages for the `opencode/` backlog and shared plugin patterns:
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

### Phase 3: Turn references into tracked work

- [ ] Promote validated candidates into `plugins/`, `claude/skills/`, or `claude/hooks/` only after a narrow proof-of-fit and minimal implementation plan exists for each item.
- [ ] Update `.claude-plugin/marketplace.json` only for integrations that are actually shipped in this repo.
- [ ] Mirror opencode-specific results into `opencode/TODO.md` once the package-level triage is complete.
- [ ] Keep this file as the source of truth for inbound references until each item is either integrated, documented elsewhere, or explicitly deferred.

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

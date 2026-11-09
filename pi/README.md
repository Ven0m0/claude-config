# pi (Windows) config

Snapshot of `~/.pi/agent/` for pi 1.5.0 (winget `EarendilWorks.pi`), set up to mirror Claude Code: Claude models through `pi-claude-bridge`, the same MCP servers, skills, agents, Claude plugins and hooks. Canonical write-up: vault note `Knowledge/pi_coding_agent_setup.md`.

## Files

| Repo path | Target |
|---|---|
| `settings.json` | `~/.pi/agent/settings.json` (packages, default model, skills, prompts) |
| `mcp.json` | `~/.pi/agent/mcp.json` (codegraph, obsidian-hybrid-search, rea, icm, patchright) |
| `claude-bridge.json` | `~/.pi/agent/claude-bridge.json` |
| `claude-hooks.json` | `~/.pi/agent/claude-hooks.json` |
| `AGENTS.md` | `~/.pi/agent/AGENTS.md` (portable part of the global CLAUDE.md) |
| `agents/` | `~/.pi/agent/agents/` (13 agents translated for pi-subagents) |
| `extensions/pi-permission-system/config.json` | `~/.pi/agent/extensions/pi-permission-system/config.json` |
| `pi-lens/config.json` | `~/.pi-lens/config.json` |

Not tracked on purpose: `auth.json` (holds the openrouter key), sessions, caches, logs, `claude-plugins.json` (regenerated), `mcp-cache.json`.

## Setup

1. Install pi: `winget install EarendilWorks.pi`. Install Claude Code and log in first; the bridge reuses its login.
2. Copy the files above to their targets (paths in `mcp.json` are absolute and Windows/user specific; adjust if the machine differs).
3. Start pi once so it installs the `packages` from `settings.json` into `~/.pi/agent/npm`.
4. Add `OPENROUTER_API_KEY` via `pi` login if wanted. Zen free models do not work in pi (served only to the official opencode client).
5. Install Claude plugins with `/claude:plugin` (pi-claude-marketplace): skill-creator, claude-md-management, claude-code-setup, mattpocock-skills, cli-anything, ven0m0-agents, ven0m0-commands.
6. Apply the fixes below.

## Required fixes

### Windows runtime bugs (pi.exe is bun 1.4.4)
Both live in `~/.pi/agent/npm/node_modules` and are lost when npm reinstalls those packages.
- `signal-exit` (hoisted v3.0.7): append `module.exports.onExit = module.exports` to its entry file (bun resolves `write-file-atomic@8` to it).
- `proper-lockfile/lib/mtime-precision.js`: cache the precision in a `WeakMap` instead of symbol property access on the fs proxy (otherwise pi.exe crashes at startup once a Claude plugin is installed).
- Plugin management also works under the Node build, which avoids both bugs: `npm i @earendil-works/pi-coding-agent@1.5.0` in a scratch dir, then `node dist/bundle/cli.js --mode json -p "/claude:plugin ..."`.

### pi-claude-hooks shell patch
It ignores a hook's own `"shell"` and spawns via cmd.exe, which breaks `.ps1` hooks. Local patch in `src/{types,config,engine}.ts`: honor per-hook `shell`, map `powershell` to `pwsh`, default shell Git Bash (`claude-hooks.json`). Re-apply after reinstalling the package.

### Hook double-fire guard (`~/.claude/settings.json`)
The bridge's Claude Code child also runs user hooks, so context-injecting hooks run twice. Prefix those commands (`icm hook start`, `icm hook prompt`, `codegraph prompt-hook`) with:

```
[[ -n $PI_CODING_AGENT && -z $PI_CLAUDE_HOOKS ]] && exit 0; exec ...
```

Any new Claude hook that injects context needs the same guard.

### conserve plugin
`conserve@claude-night-market` fails to install on Windows (a dependency file name contains a colon). `settings.json` points at Claude's cached `conserve/1.10.0` for `skills` and `prompts`; update the version by hand.

## Gotchas
- `pi auth check --provider claude-bridge` always reports `provider_not_found`; test with a real `-p` turn.
- Headless `pi --mode json -p ...` hangs if stdin is an open pipe; pass `< /dev/null`.
- Do not add `pi-rtk-optimizer` or `rtk init --agent pi`: the bridged `rtk hook claude` already rewrites commands.
- Do not install `@tintinweb/pi-subagents` next to `pi-subagents`.
- Hashline `replace`/`insert` do not match `Edit|Write|MultiEdit` hook matchers.
- The 7 repo-marketplace plugins pointing at missing directories show "unsupported source".

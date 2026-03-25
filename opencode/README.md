# OpenCode
> [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode)
OpenCode configuration, agent prompts, local package setup, plus lean plugin, LSP, and formatter guidance.

This subtree also keeps a deliberately small custom `command/`, `agents/`, `skill/`, and `plugin/` layer. Heavier workflow orchestration now comes from installed plugins like `oh-my-opencode` and `flow-next-opencode`, so local prompts are trimmed to avoid duplicate behavior.

## Config Files

- Repo template: `opencode/opencode.jsonc`
- Local runtime config: `~/.config/opencode/opencode.json`
- Local package install root: `~/.config/opencode/`
- Subtree rules: `opencode/AGENTS.md`
- LSP server config reference: `opencode/cclsp.json`

## Instructions Loaded

The OpenCode config loads these instruction files in order:

1. `opencode/AGENTS.md`
2. `../.github/copilot-instructions.md`
3. `opencode/MORPH_INSTRUCTIONS.md`

`opencode/AGENTS.md` is now the canonical OpenCode base instruction file for this repo.

## Lean Plugin Set

After reviewing the official docs, ecosystem pages, `awesome-opencode`, and `opencode.cafe`, the setup now prefers one plugin per concern and avoids packages that are redundant, noisy, or currently unreliable under Bun/OpenCode.

- Keep one orchestration layer: `oh-my-opencode`
- Keep one Morph path: `@morphllm/opencode-morph-plugin@2.0.7`
- Keep only the auth plugins still useful for this model/provider setup
- Remove broken `context-mode` from active config because Bun/OpenCode still trips over its runtime path
- Remove overlapping agent/context/cache/helper plugins that duplicate `oh-my-opencode` or built-in OpenCode features
- Remove stale Cursor-specific repo config from the active runtime path

## Plugins (10 total)

### Editing and terminal

| Plugin | Purpose |
|---|---|
| `@morphllm/opencode-morph-plugin@2.0.7` | Single Morph plugin path |
| `opencode-pty` | PTY integration |

### Auth and session continuity

| Plugin | Purpose |
|---|---|
| `opencode-antigravity-auth` | Antigravity auth |
| `opencode-gemini-auth` | Gemini auth |
| `opencode-session-handoff` | Session handoff |

### Safety, search, and orchestration

| Plugin | Purpose |
|---|---|
| `opencode-image-compress` | Image compression |
| `opencode-websearch` | Web search |
| `opencode-ignore` | Ignore rules |
| `oh-my-opencode` | Broad OpenCode orchestration bundle |
| `flow-next-opencode` | Flow-based planning, work, and review commands |

## Flow Next

`flow-next-opencode` is installed from GitHub because it is not published on npm. It adds a Flow-centric task system on top of OpenCode, including slash commands like `/flow-next:plan`, `/flow-next:work`, `/flow-next:plan-review`, `/flow-next:impl-review`, and `/flow-next:setup`.

- Plugin spec: `github:gmickel/flow-next-opencode#276713a0d61b01d6356f79ec937d97cd8d39a039`
- Install source: GitHub pin, not npm
- Required follow-up: run `/flow-next:setup` inside OpenCode after the plugin is loaded
- Optional backend knob: `FLOW_REVIEW_BACKEND=opencode|rp|none`
- Caveat: it overlaps with `oh-my-opencode` in orchestration and planning, so this setup keeps both available intentionally rather than pretending they are fully independent

Flow Next project scaffolding now lives in `opencode/` as the source-of-truth tree for agents, commands, skills, and plugin hooks. `.opencode/` is kept as a compatibility layer that symlinks back into `opencode/`. The generated `.opencode/opencode.json` was adjusted to use this config's available models instead of Flow Next's default OpenAI assumptions:

- `ralph-runner` -> `minimax/MiniMax-M2.7`
- `opencode-reviewer` -> `google/antigravity-claude-opus-4-6`

After you run `/flow-next:setup`, Flow Next should create `.flow/` workspace metadata in the repo and copy its `flowctl` helper into `.flow/bin/`.

## Removed As Overlap Or Risk

- `context-mode` - currently not reliable in this OpenCode/Bun environment
- `opencode-fastedit`, `openslimedit`, `opentmux` - overlap with Morph, PTY, or the lean built-in editing flow
- `@spoons-and-mirrors/subtask2`, `better-opencode-async-agents`, `opencode-agent-memory`, `@tarquinen/opencode-dcp`, `@old-mikser/occontext-thinking-trim`, `@tuanhung303/opencode-acp`, `opencode-codebase-index` - too much overlap with `oh-my-opencode` and native features
- `opencode-repos`, `opencode-dir`, `opencode-plugin-auto-update`, `opencode-plugin-search` - useful in niche workflows, but not worth the baseline prompt/tooling weight
- `@ramarivera/opencode-model-announcer`, `@bastiangx/opencode-unmoji` - cosmetic only
- `opencode-blocker-diverter`, `opencode-cachebro`, `superpowers` - extra complexity for low practical value here
- `opencode-anthropic-auth`, `opencode-copilot-auth`, `opencode-kilo-auth` - removed from the lean baseline because Antigravity plus Gemini cover the current provider strategy better

## Model Strategy

The optimized config uses a split-by-cost strategy instead of Cursor models:

- Default/global: `zai-coding-plan/glm-5`
- Small/cheap path: `minimax/MiniMax-M2.5`
- Heavy coding agents: `minimax/MiniMax-M2.7`
- Research: `google/gemini-3.1-pro-preview`
- Review/build lanes: Antigravity Claude 4.6 variants

Configured latest-leaning variants:

- `zai-coding-plan/glm-5`
- `minimax/MiniMax-M2.5`
- `minimax/MiniMax-M2.7`
- `google/gemini-3.1-pro-preview`
- `google/antigravity-claude-sonnet-4-6`
- `google/antigravity-claude-opus-4-6`

## Edgee Token Compression

Edgee is configured as an extra OpenCode provider, not as a plugin. Its OpenCode integration is the documented `@ai-sdk/openai-compatible` provider path pointing at `https://api.edgee.ai/v1`.

- Provider key: `edgee`
- Package: `@ai-sdk/openai-compatible`
- Auth: `EDGEE_API_KEY`
- Purpose: prompt/token compression before requests reach supported upstream models
- Claimed by Edgee: compression starts on the first request and can reduce token usage significantly

Configured Edgee-backed models:

- `edgee/mistral-small`
- `edgee/gpt-4`
- `edgee/claude-3-haiku`

The config keeps Edgee parallel to the existing providers instead of replacing them. Use an `edgee/*` model when you want the compression path.

## LSP Setup

OpenCode's built-in LSP tool surface is active. The current config adds explicit `lsp` entries for the languages used most often in this repo and local workflow.

- Built-in tools observed in runtime: `lsp_goto_definition`, `lsp_find_references`, `lsp_symbols`, `lsp_diagnostics`, `lsp_prepare_rename`, `lsp_rename`
- Configured LSP entries follow the official `lsp` schema using `command`, `extensions`, and `initialization`
- The old `cclsp` reference file is still present as a reference, but it is not part of the active runtime setup

Configured language servers:

- TypeScript / JavaScript: `typescript-language-server --stdio`
- Python: `pyright-langserver --stdio`
- Rust: `/home/ven0m0/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu/bin/rust-analyzer`
- Bash: `bash-language-server start`
- YAML: `yaml-language-server --stdio`

Observed built-in servers available in the resolved runtime also include many OpenCode defaults such as `vue`, `eslint`, `gopls`, `ruby-lsp`, `terraform`, `clangd`, and others when their requirements are present.

## Formatter Setup

The config now uses the official `formatter` block and routes by extension.

- JS / TS / JSON / JSONC / Markdown / CSS / HTML / YAML: `prettier --write $FILE`
- Python: `uv tool run ruff format $FILE`
- Shell: `shfmt -w $FILE`
- Rust: `/home/ven0m0/.rustup/toolchains/nightly-x86_64-unknown-linux-gnu/bin/rustfmt $FILE`

This matches the repo's existing tool choices better than adding another formatter stack.

## Local Sync Workflow

Use the repo config as the source of truth, then sync it into the local OpenCode directory.

Typical steps:

```bash
bun add <plugin-spec>...
bun add @ai-sdk/openai-compatible
bun add "github:gmickel/flow-next-opencode#276713a0d61b01d6356f79ec937d97cd8d39a039"
cp opencode/opencode.jsonc ~/.config/opencode/opencode.jsonc
cp opencode/cclsp.json ~/.config/opencode/cclsp.json
```

The local runtime config stays as pure JSON and can include extra machine-local entries like `icm`. The `cclsp` file is kept only as a ready-to-use external reference because the active OpenCode setup does not need it.

For Flow Next, the project-local runtime overlay remains in `.opencode/`, but the reusable source files now live in `opencode/agents/`, `opencode/command/flow-next/`, `opencode/skill/`, and `opencode/plugin/`.

## Validation

- Validate repo JSONC: `bunx json5 -c opencode/opencode.jsonc`
- Validate local JSON: `python -m json.tool ~/.config/opencode/opencode.json >/dev/null`
- Inspect local packages: `bun pm ls` from `~/.config/opencode`
- Inspect resolved config: `opencode debug config`
- Verify Edgee provider package: `bun pm ls | rg '@ai-sdk/openai-compatible'`
- Verify Flow Next install: `bun pm ls | rg 'flow-next-opencode'`
- Verify Flow Next source files: `ls opencode/command/flow-next && ls opencode/skill && ls opencode/plugin`
- Verify `.opencode` compatibility links: `ls -l .opencode/agent .opencode/command .opencode/skill .opencode/plugin`
- Verify core tooling: `command -v typescript-language-server pyright-langserver bash-language-server yaml-language-server prettier shfmt`
- Verify Rust toolchain paths: `rustup which rust-analyzer && rustup which rustfmt`

## Related Files

- `opencode/opencode.jsonc`
- `opencode/opencode.json`
- `opencode/cclsp.json`
- `opencode/command/flow-next`
- `opencode/skill/flow-next-opencode-plan/SKILL.md`
- `opencode/plugin/flow-next-ralph-guard.ts`
- `.opencode/opencode.json`
- `opencode/AGENTS.md`
- `opencode/MORPH_INSTRUCTIONS.md`

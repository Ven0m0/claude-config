# OpenCode

> [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode)

OpenCode configuration, agent prompts, local package setup, plus lean plugin, LSP, and formatter guidance.

This subtree also keeps a deliberately small custom `command/`, `agents/`, `skill/`, and `plugin/` layer. Heavier workflow orchestration now comes from installed plugins like `oh-my-opencode` and `flow-next-opencode`, so local prompts are trimmed to avoid duplicate behavior.

## Config Files

- Repo-tracked shared config: `opencode/opencode.json`
- Repo runtime overlay: `.opencode/opencode.json`
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

The tracked config now stays intentionally lean and relies on built-in OpenCode provider support where possible.

- Keep one orchestration layer: `oh-my-opencode`
- Keep the PTY, ignore, session handoff, image compression, and web search plugins
- Prefer built-in provider auth over plugin-based auth shims
- Remove overlapping helper plugins and broken MCP wrappers from the baseline

## Plugins (6 total)

| Plugin                           | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `oh-my-opencode@3.16.0`          | Broad OpenCode orchestration bundle |
| `opencode-image-compress@0.3.2`  | Image compression                   |
| `opencode-ignore@1.1.0`          | Ignore rules                        |
| `opencode-pty@0.3.2`             | PTY integration                     |
| `opencode-session-handoff@1.1.6` | Session handoff                     |
| `opencode-websearch@0.5.0`       | Web search                          |

## Providers and Model Strategy

The current config is centered on GitHub Copilot as the default cached provider, while keeping Anthropic, Gemini, and Kilo available as env-driven fallbacks.

- Default/global: `github-copilot/gpt-5`
- Small/cheap path: `github-copilot/gpt-5-mini`
- Build and coding agents: `github-copilot/gpt-5.1-codex`
- Explore: `github-copilot/gpt-5.1-codex-mini`
- Research: `github-copilot/gemini-3.1-pro-preview`
- Review: `github-copilot/claude-sonnet-4.5`

Provider auth stays in the config through env variables and cache-friendly provider options:

- `GITHUB_TOKEN`
- `GITHUB_ENTERPRISE_URL` (optional)
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `KILO_API_KEY`

## MCP Servers

The tracked MCP set is now all-remote so the same JSON works on Linux and Windows 10/11 without shell-specific wrappers.

| MCP                 | Purpose                      | Auth                                       |
| ------------------- | ---------------------------- | ------------------------------------------ |
| `github-mcp-server` | GitHub tools via Copilot MCP | `Authorization: Bearer {env:GITHUB_TOKEN}` |
| `ref-tools`         | Docs and reference search    | `x-ref-api-key: {env:REF_API_KEY}`         |
| `exa`               | Web and code search          | `x-api-key: {env:EXA_API_KEY}`             |
| `gh_grep`           | Public code search           | none                                       |

Removed from the baseline:

- `context7` - replaced by `ref-tools`
- `icm` - removed to avoid local binary/runtime drift
- `context-mode` - removed because it was already unreliable in this environment

## LSP Setup

OpenCode's built-in LSP tool surface is active. The tracked config uses the current schema with platform-neutral command arrays and explicit extensions.

- Configured LSP entries follow the official `lsp` schema using `command` arrays and `extensions`
- The old `cclsp` reference file is still present as a reference, but it is not part of the active runtime setup

Configured language servers:

- TypeScript / JavaScript: `vtsls --stdio`
- Python: `basedpyright-langserver --stdio`
- Rust: `rust-analyzer`
- Bash: `bash-language-server start`
- YAML: `yaml-language-server --stdio`

## Formatter Setup

The tracked JSON no longer pins formatter commands. Use local OpenCode defaults or machine-local formatter overrides in `~/.config/opencode/opencode.json` if needed.

## Local Sync Workflow

Use the repo config as the source of truth, then sync it into the local OpenCode directory.

Typical steps:

```bash
bun add <plugin-spec>...
cp opencode/opencode.json ~/.config/opencode/opencode.json
```

The local runtime config stays as pure JSON. Keep machine-local overrides in `~/.config/opencode/opencode.json` instead of reintroducing repo-tracked local-only MCP wrappers.

## Validation

- Validate repo JSON: `python -m json.tool opencode/opencode.json >/dev/null`
- Validate runtime overlay JSON: `python -m json.tool .opencode/opencode.json >/dev/null`
- Validate local JSON: `python -m json.tool ~/.config/opencode/opencode.json >/dev/null`
- Inspect local packages: `bun pm ls` from `~/.config/opencode`
- Inspect resolved config: `opencode debug config`
- Verify the tracked overlay file: `python -m json.tool .opencode/opencode.json >/dev/null`
- Verify core tooling: `command -v vtsls basedpyright-langserver bash-language-server yaml-language-server`
- Verify Rust toolchain paths: `rustup which rust-analyzer && rustup which rustfmt`

## Related Files

- `opencode/opencode.jsonc`
- `opencode/opencode.json`
- `opencode/cclsp.json`
- `opencode/command/flow-next`
- `opencode/skill/flow-next-opencode-plan/SKILL.md`
- `opencode/plugins/`
- `.opencode/opencode.json`
- `opencode/AGENTS.md`
- `opencode/MORPH_INSTRUCTIONS.md`

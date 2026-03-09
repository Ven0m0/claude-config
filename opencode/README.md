# OpenCode

References and setup notes for OpenCode related tooling.

## Plugins (47 total)

All plugins are configured in `opencode.json`.

### Authentication

| Plugin | Description |
|---|---|
| `opencode-antigravity-auth` | Antigravity authentication |
| `opencode-anthropic-auth` | Anthropic API authentication |
| `opencode-copilot-auth` | GitHub Copilot authentication |
| `opencode-cursor-auth` | Cursor authentication |
| `opencode-gemini-auth` | Google Gemini authentication |
| `opencode-kilo-auth` | Kilo authentication |
| `@mathew-cf/opencode-mcp-auto-reauth` | MCP auto re-authentication |

### Performance and Caching

| Plugin | Description |
|---|---|
| `opencode-cachebro` | Caching support |
| `cachebro` | GitHub repo caching |
| `@tarquinen/opencode-dcp` | Dynamic context pruning |
| `opencode-optimal-model-temps` | Model temperature optimization |
| `opencode-fast-apply` | Fast code application |
| `opencode-fastedit` | Fast file editing |
| `opencode-image-compress` | Image compression |

### Agent Management

| Plugin | Description |
|---|---|
| `opencode-agent-skills` | Agent skill system |
| `opencode-agent-memory` | Agent memory persistence |
| `agentsync` | Agent synchronization |
| `better-opencode-async-agents` | Async agent improvements |
| `@zenobius/opencode-background` | Background task execution |
| `@zenobius/opencode-skillful` | Skill-based agent system |
| `opencode-plugin-preload-skills` | Preload skills on startup |

### Context and Editing

| Plugin | Description |
|---|---|
| `context-mode` | Context management |
| `opencode-morphllm` | AI-powered code editing (morph) |
| `openslimedit` | Slim editing interface |
| `@old-mikser/occontext-thinking-trim` | Thinking context trimming |
| `opencode-codebase-index` | Codebase indexing |
| `@tuanhung303/opencode-acp` | Agentic context protocol |

### Git and Session

| Plugin | Description |
|---|---|
| `opencode-gitbutler` | Git workflow integration |
| `opencode-session-handoff` | Session handoff between agents |
| `opencode-repos` | Multi-repo management |

### UI and Output

| Plugin | Description |
|---|---|
| `@franlol/opencode-md-table-formatter` | Markdown table formatting |
| `@ramarivera/opencode-model-announcer` | Model announcement display |
| `@bastiangx/opencode-unmoji` | Emoji removal |

### Infrastructure

| Plugin | Description |
|---|---|
| `opencode-pty` | PTY integration |
| `opencode-ignore` | File/directory ignore rules |
| `opencode-blocker-diverter` | Request blocking and diversion |
| `opencode-lazy-loader` | Lazy plugin loading |
| `opencode-plugin-auto-update` | Auto-update plugins |
| `opencode-plugin-search` | Search plugin registry |
| `opencode-dir` | Directory management |
| `opencode-websearch` | Web search integration |
| `opentmux` | Tmux integration |
| `opencode-ralph-loop` | Ralph loop orchestration |
| `tailcode` | Tailcode integration |
| `everything-opencode` | Meta-plugin bundle |
| `@spoons-and-mirrors/subtask2` | Subtask delegation |
| `oh-my-opencode-slim` | Slim configuration presets |

## Recommended Extensions

- https://github.com/ramarivera/opencode-model-announcer
- https://github.com/shekohex/opencode-pty
- https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
- https://github.com/Th0rgal/opencode-ralph-wiggum
- https://github.com/selcukcift/opencode-qwen-auth
- https://github.com/gunnarnordqvist/opencode-context-filter
- https://github.com/zenobi-us/opencode-skillful
- https://github.com/spoons-and-mirrors/subtask2
- https://github.com/JRedeker/opencode-morph-fast-apply

## Related Tooling

- https://github.com/hosenur/portal
- https://github.com/open-webui/open-webui
- https://github.com/different-ai/openwork

See ../LLM_CONFIG_STANDARDS.md for shared defaults.

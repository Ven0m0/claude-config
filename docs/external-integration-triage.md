# External Integration Triage

Triage table for external candidates from `TODO.md` Phase 1 and Phase 2.

## Triage Criteria

- **Bucket: integrate** — candidate has clear fit, active maintenance, and compatible license; proceed to Phase 2 implementation.
- **Bucket: reference** — candidate is useful for inspiration or citation; do not copy code but link in docs.
- **Bucket: defer** — candidate is out of scope, stalled, license-incompatible, or needs more research before considering.

---

## Skills, Prompts, and Local Automation

| Candidate | License | Last Commit | Surface | Bucket | Notes |
|-----------|---------|------------|---------|--------|-------|
| [`modu-ai/moai-adk`](https://github.com/modu-ai/moai-adk) | Apache-2.0 | 2026-03-16 | `claude/skills` | reference | Multi-agent orchestration with 27 specialized agents and 52 skills; rich SPEC-first DDD methodology to study, not copy. |
| [`daymade/claude-code-skills`](https://github.com/daymade/claude-code-skills) | MIT | 2026-03-16 | `claude/skills` | integrate | Production marketplace with 42 skills; `skill-creator` meta-skill is directly applicable here. |
| [`Piebald-AI/tweakcc`](https://github.com/Piebald-AI/tweakcc) | MIT | 2026-03-19 | `claude/skills` | reference | CLI tool to customize Claude Code prompts and themes; fragile regex patching against Claude Code internals — valuable patterns but brittle. |
| [`DanielNappa/tweakgc-cli`](https://github.com/DanielNappa/tweakgc-cli) | MIT | 2025-10-11 | `claude/skills` | defer | Fork of tweakcc targeting GitHub Copilot CLI; not relevant to Claude Code surface. |
| [`mangiucugna/json_repair`](https://github.com/mangiucugna/json_repair) | MIT | 2026-01 (active) | `claude/skills` | reference | Repair broken JSON from LLM output; useful utility to cite in docs for token-conservation patterns. |
| [`ziad-hsn/code-mode-toon`](https://github.com/ziad-hsn/code-mode-toon) | MIT | 2026-01-22 | `claude/skills` | reference | MCP orchestrator with TOON compression (30–90% token savings); interesting compression format for context management docs. |
| [`Sharper-Flow/lgrep`](https://github.com/Sharper-Flow/lgrep) | MIT | unknown | `opencode` | defer | MCP semantic code search server for OpenCode; outside Claude Code scope. |

---

## Hooks, Environment Management, and Session Bootstrap

| Candidate | License | Last Commit | Surface | Bucket | Notes |
|-----------|---------|------------|---------|--------|-------|
| [`vtemian/claude-env`](https://github.com/vtemian/claude-env) | unknown | unknown | `claude/hooks` | defer | Could not verify repo; no clear license or activity found. Needs more research. |
| [`add-mcp`](https://www.npmjs.com/package/add-mcp) | MIT | 2026 (active) | `claude/hooks` | reference | Installs MCP servers across Claude Code, Copilot, Cursor, OpenCode with one command; useful reference for multi-agent config patterns. |
| [`@mathew-cf/opencode-mcp-auto-reauth`](https://www.npmjs.com/package/@mathew-cf/opencode-mcp-auto-reauth) | Apache-2.0 | 2026-02-23 | `opencode` | defer | OpenCode-specific OAuth re-auth plugin; not relevant to Claude Code hooks. |
| [`opencode-plugin-preload-skills`](https://www.npmjs.com/package/opencode-plugin-preload-skills) | MIT | 2026 (active) | `opencode` | defer | OpenCode-specific skill preloader; outside Claude Code scope. |
| [`johnzfitch/claude-warden`](https://github.com/johnzfitch/claude-warden) | MIT | 2026-03-19 | `claude/hooks` | integrate | Token-saving hooks that inject quiet flags, truncate output, enforce subagent budgets; actively maintained (v0.5.0), pure bash with `jq` dependency. |
| [`johnzfitch/llmx`](https://github.com/johnzfitch/llmx) | MIT | 2024-08-08 | `claude/hooks` | defer | Unmaintained since 2024; no active development or clear Claude Code integration path. |
| [`1rgs/nanocode`](https://github.com/1rgs/nanocode) | MIT | 2026-01-14 | `docs` | reference | 250-line Python Claude Code alternative; pedagogical value for understanding agentic loop design. |

---

## Plugins and Ecosystem Integrations

| Candidate | License | Last Commit | Surface | Bucket | Notes |
|-----------|---------|------------|---------|--------|-------|
| [`mattzcarey/zagi`](https://github.com/mattzcarey/zagi) | MIT | 2026-02-18 | `plugins` | reference | Git wrapper with 121 agent-optimized commands; solid reference for git integration patterns. |
| [`siteboon/claudecodeui`](https://github.com/siteboon/claudecodeui) | unknown | 2026-03 (active) | `plugins` | defer | Web UI for Claude Code; large (8.5k stars) but GUI wrapper rather than extension; may overlap with future desktop plans. |
| [`zeroclaw-labs/zeroclaw`](https://github.com/zeroclaw-labs/zeroclaw) | unknown | 2026-03-19 | `plugins` | defer | Rust agentic workflow OS (28k stars); full platform rather than plugin; enterprise product direction. |
| [`proliferate-ai/proliferate`](https://github.com/proliferate-ai/proliferate) | MIT | 2026-02-24 | `plugins` | defer | Background agent platform with sandbox infrastructure; enterprise/self-hosted focus. |
| [`pchalasani/claude-code-tools`](https://github.com/pchalasani/claude-code-tools) | MIT | 2026-03-20 | `plugins` | integrate | Rich toolset (tmux bridge, session search, Google Docs/Sheets, hooks); actively maintained with 1.6k stars, MIT licensed. |
| [`tiann/hapi`](https://github.com/tiann/hapi) | unknown | 2026-03-20 | `plugins` | reference | Remote control hub for Claude Code/Codex/Gemini/OpenCode via Web/PWA; interesting multi-agent proxy patterns. |
| [`glommer/cachebro`](https://github.com/glommer/cachebro) | MIT | 2026-02-26 | `plugins` | reference | File cache with diff tracking; Turso-backed; saves ~26% tokens on re-reads; unique approach to context optimization. |
| [`glommer/codemogger`](https://github.com/glommer/codemogger) | MIT | 2026-03-09 | `plugins` | reference | Tree-sitter code indexer with local embeddings; useful for semantic code search reference. |

---

## OpenCode-Specific Ecosystem Packages

| Candidate | License | Last Commit | Surface | Bucket | Notes |
|-----------|---------|------------|---------|--------|-------|
| [`context-mode`](https://www.npmjs.com/package/context-mode) | NOASSERTION | 2026-02 (new) | `opencode` | defer | MCP server for context management; unclear license; needs more research. |
| [`@azumag/opencode-rate-limit-fallback`](https://www.npmjs.com/package/@azumag/opencode-rate-limit-fallback) | MIT | 2026 (active) | `opencode` | defer | OpenCode-specific rate limit fallback plugin; outside Claude Code scope. |
| [`opencode-kilo-auth`](https://www.npmjs.com/package/opencode-kilo-auth) | MIT | 2026-02 (active) | `opencode` | defer | Kilo Gateway auth for OpenCode; outside Claude Code scope. |
| [`@dallay/agentsync`](https://www.npmjs.com/package/@dallay/agentsync) | MIT | 2026 (active) | `opencode` | reference | Config syncer across Claude/Copilot/Cursor/OpenCode; useful reference for cross-agent tooling. |
| [`@tuanhung303/opencode-acp`](https://www.npmjs.com/package/@tuanhung303/opencode-acp) | MIT | 2026 (active) | `opencode` | reference | Context pruning plugin for OpenCode; addresses real token waste problem; could inspire Claude Code context management. |
| [`opencode-dir`](https://www.npmjs.com/package/opencode-dir) | unknown | unknown | `opencode` | defer | Could not verify; unclear what this package does. |
| [`opencode-websearch`](https://www.npmjs.com/package/opencode-websearch) | MIT | 2026-02 (active) | `opencode` | reference | Web search plugin for OpenCode; reference for search integration patterns. |
| [`@bastiangx/opencode-unmoji`](https://www.npmjs.com/package/@bastiangx/opencode-unmoji) | unknown | 2025-12 (active) | `opencode` | defer | Emoji handling for OpenCode; niche utility with unclear maintenance status. |
| [`@kitlangton/tailcode`](https://www.npmjs.com/package/@kitlangton/tailcode) | MIT | 2026-02 (active) | `opencode` | reference | Publishes OpenCode to Tailscale tailnet; creative networking pattern for remote access. |
| [`opencode-fastedit`](https://www.npmjs.com/package/opencode-fastedit) | MIT | unknown | `opencode` | defer | Fast editing plugin for OpenCode; could overlap with existing patterns. |
| [`opencode-plugin-auto-update`](https://www.npmjs.com/package/opencode-plugin-auto-update) | MIT | 2026 (active) | `opencode` | defer | Plugin auto-update for OpenCode; addresses internal OpenCode update mechanism. |
| [`opencode-codebase-index`](https://www.npmjs.com/package/opencode-codebase-index) | MIT | unknown | `opencode` | reference | Codebase indexer for OpenCode; reference for indexing patterns. |
| [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply) | MIT | unknown | `opencode` | reference | Fast apply editing via LM Studio/Ollama; interesting editing optimization pattern. |
| [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro) | MIT | unknown | `opencode` | reference | Wrapper of `glommer/cachebro` for OpenCode; cache optimization for OpenCode. |
| [`@old-mikser/occontext-thinking-trim`](https://www.npmjs.com/package/@old-mikser/occontext-thinking-trim) | unknown | unknown | `opencode` | defer | Context thinking trim for OpenCode; unclear what this does or maintenance status. |
| [`opencode-image-compress`](https://www.npmjs.com/package/opencode-image-compress) | MIT | unknown | `opencode` | reference | Image compression for OpenCode; useful reference for media handling. |

---

## Summary

| Bucket | Count | Candidates |
|--------|-------|------------|
| **integrate** | 3 | `daymade/claude-code-skills`, `johnzfitch/claude-warden`, `pchalasani/claude-code-tools` |
| **reference** | 15 | `modu-ai/moai-adk`, `Piebald-AI/tweakcc`, `mangiucugna/json_repair`, `ziad-hsn/code-mode-toon`, `add-mcp`, `1rgs/nanocode`, `mattzcarey/zagi`, `tiann/hapi`, `glommer/cachebro`, `glommer/codemogger`, `@dallay/agentsync`, `@tuanhung303/opencode-acp`, `opencode-websearch`, `@kitlangton/tailcode`, `opencode-image-compress` |
| **defer** | 20 | All others — out of scope, unmaintained, license unclear, or OpenCode-specific |

---

## Next Steps

- **Phase 2a/b (T006)**: Implement `daymade/claude-code-skills` marketplace integration, `johnzfitch/claude-warden` hooks, and `pchalasani/claude-code-tools` plugin review.
- **Phase 2c (T007)**: Evaluate remaining plugin candidates for `plugins/` stubs.
- **Phase 3 (T008)**: Ship vetted items and update `marketplace.json`.
- **Phase 3 (T009)**: Mirror opencode-specific results to `opencode/TODO.md`.

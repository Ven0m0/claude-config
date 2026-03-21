# OpenCode Ecosystem Packages

Sourced from [external-integration-triage.md](../docs/external-integration-triage.md).

## Resources

- https://opencode.ai/docs/ecosystem
- https://github.com/awesome-opencode/awesome-opencode
- https://opencode.cafe

---

## Defer

| Candidate | Notes |
|-----------|-------|
| [`context-mode`](https://www.npmjs.com/package/context-mode) | MCP server for context management; unclear license; needs more research. |
| [`@azumag/opencode-rate-limit-fallback`](https://www.npmjs.com/package/@azumag/opencode-rate-limit-fallback) | OpenCode-specific rate limit fallback plugin; outside Claude Code scope. |
| [`opencode-kilo-auth`](https://www.npmjs.com/package/opencode-kilo-auth) | Kilo Gateway auth for OpenCode; outside Claude Code scope. |
| [`opencode-dir`](https://www.npmjs.com/package/opencode-dir) | Could not verify; unclear what this package does. |
| [`@bastiangx/opencode-unmoji`](https://www.npmjs.com/package/@bastiangx/opencode-unmoji) | Emoji handling for OpenCode; niche utility with unclear maintenance status. |
| [`opencode-fastedit`](https://www.npmjs.com/package/opencode-fastedit) | Fast editing plugin for OpenCode; could overlap with existing patterns. |
| [`opencode-plugin-auto-update`](https://www.npmjs.com/package/opencode-plugin-auto-update) | Plugin auto-update for OpenCode; addresses internal OpenCode update mechanism. |
| [`@old-mikser/occontext-thinking-trim`](https://www.npmjs.com/package/@old-mikser/occontext-thinking-trim) | Context thinking trim for OpenCode; unclear what this does or maintenance status. |

---

## Reference

| Candidate | Notes |
|-----------|-------|
| [`@dallay/agentsync`](https://www.npmjs.com/package/@dallay/agentsync) | Config syncer across Claude/Copilot/Cursor/OpenCode; useful reference for cross-agent tooling. |
| [`@tuanhung303/opencode-acp`](https://www.npmjs.com/package/@tuanhung303/opencode-acp) | Context pruning plugin for OpenCode; addresses real token waste problem; could inspire Claude Code context management. |
| [`opencode-websearch`](https://www.npmjs.com/package/opencode-websearch) | Web search plugin for OpenCode; reference for search integration patterns. |
| [`@kitlangton/tailcode`](https://www.npmjs.com/package/@kitlangton/tailcode) | Publishes OpenCode to Tailscale tailnet; creative networking pattern for remote access. |
| [`opencode-image-compress`](https://www.npmjs.com/package/opencode-image-compress) | Image compression for OpenCode; useful reference for media handling. |
| [`opencode-codebase-index`](https://www.npmjs.com/package/opencode-codebase-index) | Codebase indexer for OpenCode; reference for indexing patterns. |
| [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply) | Fast apply editing via LM Studio/Ollama; interesting editing optimization pattern. |
| [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro) | Wrapper of `glommer/cachebro` for OpenCode; cache optimization for OpenCode. |

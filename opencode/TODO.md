# OpenCode Ecosystem Packages

Sourced from [external-integration-triage.md](../docs/external-integration-triage.md).

## Status

| Category | Count | Status |
|----------|-------|--------|
| Defer | 9 | Deferred |
| Reference | 8 | Implemented |

---

## Resources

- https://opencode.ai/docs/ecosystem
- https://github.com/awesome-opencode/awesome-opencode
- https://opencode.cafe

---

## Defer

| Candidate | Notes |
|-----------|-------|
| [`aggreggator/opencode`](https://github.com/aggreggator/opencode) | MIT personal fork of OpenCode with double-buffer compaction and local MLX fixes; relevant to upstream runtime internals, not this config repo, so keep following upstream docs and local repo config. |
| [`context-mode`](https://www.npmjs.com/package/context-mode) | MCP server for context management; unclear license; needs more research. |
| [`@azumag/opencode-rate-limit-fallback`](https://www.npmjs.com/package/@azumag/opencode-rate-limit-fallback) | OpenCode-specific rate limit fallback plugin; outside Claude Code scope. |
| [`opencode-kilo-auth`](https://www.npmjs.com/package/opencode-kilo-auth) | Kilo Gateway auth for OpenCode; outside Claude Code scope. |
| [`opencode-dir`](https://www.npmjs.com/package/opencode-dir) | Could not verify; unclear what this package does. |
| [`@bastiangx/opencode-unmoji`](https://www.npmjs.com/package/@bastiangx/opencode-unmoji) | Emoji handling for OpenCode; niche utility with unclear maintenance status. |
| [`opencode-fastedit`](https://www.npmjs.com/package/opencode-fastedit) | Fast editing plugin for OpenCode; could overlap with existing patterns. |
| [`opencode-plugin-auto-update`](https://www.npmjs.com/package/opencode-plugin-auto-update) | Plugin auto-update for OpenCode; addresses internal OpenCode update mechanism. |
| [`@old-mikser/occontext-thinking-trim`](https://www.npmjs.com/package/@old-mikser/occontext-thinking-trim) | Context thinking trim for OpenCode; unclear what this does or maintenance status. |

---

## Reference (Implemented)

| Candidate | Implementation | Notes |
|-----------|----------------|-------|
| [`@dallay/agentsync`](https://www.npmjs.com/package/@dallay/agentsync) | [`command/agentsync.md`](command/agentsync.md) | Config syncer across Claude/Copilot/Cursor/OpenCode. |
| [`@tuanhung303/opencode-acp`](https://www.npmjs.com/package/@tuanhung303/opencode-acp) | [`skill/context-prune/SKILL.md`](skill/context-prune/SKILL.md) | Context pruning skill for token reduction. |
| [`opencode-websearch`](https://www.npmjs.com/package/opencode-websearch) | [`skill/websearch/SKILL.md`](skill/websearch/SKILL.md) | Web search using existing MCP/exa tools. |
| [`@kitlangton/tailcode`](https://www.npmjs.com/package/@kitlangton/tailcode) | [`skill/tailnet-publish/SKILL.md`](skill/tailnet-publish/SKILL.md) | Tailscale tailnet publishing pattern. |
| [`opencode-image-compress`](https://www.npmjs.com/package/opencode-image-compress) | [`skill/image-compress/SKILL.md`](skill/image-compress/SKILL.md) | Image compression using existing tools. |
| [`opencode-codebase-index`](https://www.npmjs.com/package/opencode-codebase-index) | [`skill/codebase-index/SKILL.md`](skill/codebase-index/SKILL.md) | Codebase indexing using rg/ast-grep. |
| [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply) | [`skill/fast-apply/SKILL.md`](skill/fast-apply/SKILL.md) | Fast apply editing patterns. |
| [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro) | [`skill/cachebro/SKILL.md`](skill/cachebro/SKILL.md) | Cache optimization reference. |

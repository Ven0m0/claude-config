# TODO

- Add Copilot CLI config when local settings format is stable.
- Add OpenCode config templates when the schema is finalized.
- Add Qwen model presets after CLI schema is stable.
- Add MCP servers:
  - `bunx @modelcontextprotocol/server-github`
  - `bunx @modelcontextprotocol/server-memory`
  - `bunx @modelcontextprotocol/server-sequential-thinking`
  - `bunx @context7/mcp-server`
  - `bunx @modelcontextprotocol/server-filesystem`

claude plugins:

```bash
claude plugin marketplace add https://github.com/secondsky/claude-skills
claude plugin install bun@claude-skills
```

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

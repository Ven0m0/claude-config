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



<details><summary><b>Resources</b></summary>

TODO: linkify
- smithery.ai
- claude-plugins.dev
- buildwithclaude.com/plugins
- happy.engineering/tools
- codeagent.directory
- skillsdirectory.com
- mcpdirectory.ai
- skills.sh
- skillsmp.com
- aiagentslist.com
- pulsemcp.com
- desktopcommander.app
- clawhub.ai
- skills.cokac.com
- prompts.chat
- mcp.so
- creati.ai
- mcpservers.org
- mseep.ai
- playbooks.com
- lxgicstudios.com
- cursorlist.com
- cursor.directory
- opencode.cafe
- skills.rest
</details>

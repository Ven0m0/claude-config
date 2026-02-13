# claude/mcp/

## Responsibility
MCP (Model Context Protocol) server configuration templates. JSON files defining external service integrations for web reading, web search, and repository documentation access.

## Design
Each JSON file declares an MCP server with `type: "http"`, URL endpoint, and authorization headers. All three use Z.AI's hosted MCP infrastructure. Configurations are templates requiring API key substitution.

## Contents

| Config | Service | Endpoint |
|--------|---------|----------|
| `web-reader.json` | Web content extraction (full-page retrieval, structured data) | `api.z.ai/api/mcp/web_reader/mcp` |
| `web-search-prime.json` | Web search with real-time information retrieval | `api.z.ai/api/mcp/web_search_prime/mcp` |
| `zread.json` | Open source repository documentation and code access | `api.z.ai/api/mcp/zread/mcp` |

## Integration
- Consumed by: Claude Code MCP system, `settings.json` `enableAllProjectMcpServers`
- Requires: Z.AI API key in `Authorization: Bearer` header
- Protocol: HTTP-based MCP transport

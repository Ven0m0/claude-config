---
name: web-filter
triggers: ["optimize web", "filter search"]
allowed-tools: [bash, str_replace]
---

# Web Response Filter
Save large MCP responses to /tmp/, filter with jq, load subset.

## Usage
```bash
# Save response
echo "$MCP_OUTPUT" > /tmp/web.json

# Filter (keep title, url, first 500 chars)
jq '[.results[]? | {title, url, text: (.text // .content)[:500]}]' /tmp/web.json

# Cleanup
rm /tmp/web.json
```

Token savings: 92-98%

Install: `uvx mcp-server-exa`
Get key: exa.ai/api

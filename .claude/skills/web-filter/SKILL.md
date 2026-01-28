---
name: web-filter
description: Filters large MCP web responses to reduce token usage by saving to /tmp/, filtering with jq, and loading subsets. Use when web search results are too large or need optimization. Triggers include "optimize web", "filter search".
tools: Bash, Read, Edit
---

# Web Response Filter
Save large MCP responses to /tmp/, filter with jq, load subset.

## Usage
```bash
# Filter response (keep title, url, first 500 chars)
echo "$MCP_OUTPUT" | jq '[.results[]? | {title, url, text: (.text // .content)[:500]}]'
```

Token savings: 92-98%

Install: `uvx mcp-server-exa`
Get key: exa.ai/api

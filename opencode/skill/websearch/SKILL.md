---
name: websearch
description: Search the web for current information, documentation, or answers. Use when needing up-to-date info beyond the codebase or when researching external libraries.
---

# Web Search

Search the web for current information, documentation, examples, or answers.

## When to Use

- Looking up library documentation
- Finding recent information (post-knowledge-cutoff)
- Researching npm packages or tools
- Getting code examples for unfamiliar APIs
- Verifying current best practices

## Available Tools

### ctx_fetch_and_index
Fetch and index a URL for later searching:
```
ctx_fetch_and_index(url: "https://example.com/docs", source: "example-docs")
```

### ctx_search
Query indexed content:
```
ctx_search(queries: ["how to configure X", "example usage"])
```

### ctx_batch_execute
Run search commands and grep in parallel:
```
ctx_batch_execute(commands: ["grep -r 'pattern' .", "find . -name '*.md'"], queries: ["context about X"])
```

### websearch (Exa AI)
Real-time web search with configurable depth:
```
websearch(query: "best practices React 2026", numResults: 8, type: "auto")
```

### codesearch (Exa Code)
Programming-focused search for APIs, libraries, patterns:
```
codesearch(query: "React useState hook examples", tokensNum: 5000)
```

## Search Strategy

1. **Specific APIs**: Use `codesearch` for precise code examples
2. **General questions**: Use `websearch` for broad results
3. **Documentation**: Use `ctx_fetch_and_index` then `ctx_search`
4. **Repo-specific**: Use `grep` and `rg` first

## Examples

```
/websearch --fast "how to configure Prettier"
```

```
codesearch(query: "Express.js middleware authentication", tokensNum: 10000)
```

## Notes

- Use `codesearch` for programming tasks (higher quality results)
- Use `websearch` for general web content
- Always cite sources when providing information from searches
- Prefer official documentation over third-party summaries

## Notes/Inspiration

Inspired by [`opencode-websearch`](https://www.npmjs.com/package/opencode-websearch) - Web search plugin for OpenCode.

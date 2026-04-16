---
name: websearch
description: Search the web for current information, documentation, or answers. Use when needing up-to-date info beyond the codebase or when researching external libraries.
---

# Web Search

## When to Use

- Library documentation and API references
- Information post-knowledge-cutoff
- npm packages or tools research
- Current best practices verification

## Tools

### websearch (Exa AI)

Real-time web search:

```
websearch(query: "best practices React 2026", numResults: 8, type: "auto")
```

### codesearch (Exa Code)

Programming-focused search — higher quality for code/API questions:

```
codesearch(query: "Express.js middleware authentication", tokensNum: 5000)
```

## Strategy

- **Code/API questions** → `codesearch` (better signal-to-noise)
- **General/news** → `websearch`
- **Docs pages** → fetch URL directly with `fetch` tool

## Rules

- Cite sources when using search results
- Prefer official docs over third-party summaries
- `codesearch` default `tokensNum: 5000`; increase to 10000 for complex patterns

---
name: fast-apply
description: Fast apply edits using local LLM servers like LM Studio or Ollama. Use when you need quick, local AI assistance without cloud API overhead.
---

# Fast Apply

Apply edits quickly using local LLM inference via LM Studio or Ollama.

## Prerequisites

- LM Studio or Ollama running locally
- API endpoint available (default: `http://localhost:11434` for Ollama, `http://localhost:1234/v1` for LM Studio)

## Configuration

### Ollama
```bash
export OLLAMA_HOST=http://localhost:11434
# Test connection
curl http://localhost:11434/api/tags
```

### LM Studio
```bash
export LM_STUDIO_HOST=http://localhost:1234/v1
# Test connection
curl http://localhost:1234/v1/models
```

## Usage

### Edit Detection
```bash
# Show current diff
git diff --cached

# Or uncommitted changes
git diff
```

### Apply via API
```bash
# Using ctx_execute for direct API calls
ctx_execute(language: "javascript", code: "
const diff = require('child_process').execSync('git diff').toString();
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    model: 'codellama',
    prompt: 'Review this diff and suggest edits: ' + diff,
    stream: false
  })
});
console.log(await response.json());
")
```

### Common Patterns

#### Quick Fix Suggestions
```bash
# Get fix suggestion for error
git diff HEAD~1 | grep -A5 "^[+-]" | head -20
```

#### Apply Suggested Edits
```bash
# Extract edit from LLM response, apply with sed or patch
```

## Tool Selection

| Tool | Latency | Quality | Best For |
|------|---------|---------|----------|
| Ollama | ~500ms | Good | Quick fixes |
| LM Studio | ~200ms | Excellent | Complex edits |
| Cloud APIs | ~2s | Best | Difficult problems |

## Safety

- Review LLM suggestions before applying
- Use `--dry-run` when available
- Keep backups of original files
- Test after applying

## Limitations

- Local models may lack latest knowledge
- Context window limited by local RAM
- Quality varies by model size

## Notes/Inspiration

Inspired by [`opencode-fast-apply`](https://www.npmjs.com/package/opencode-fast-apply) - Fast apply editing via LM Studio/Ollama.

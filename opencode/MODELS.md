```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openrouter": {
      "models": {
        "moonshotai/kimi-k2": {
          "options": {
            "provider": {
              "order": ["baseten"],
              "allow_fallbacks": false
            }
          }
        }
      }
    }
  }
}
```
```json
  "sort": {
    "by": "exacto",
    "partition": "none"
  },
  "ignore": [
    "openai"
  ],
  "allow_fallbacks": true
```

openrouter: 
- https://openrouter.ai/docs/guides/routing/provider-selection

```text
relace/relace-search
minimax/minimax-m2.7
openrouter/minimax/minimax-m2.7:nitro
z-ai/glm-5
openrouter/openrouter/free
openrouter/openrouter/free:nitro
```

kilo:
```text
kilo/kilo-auto/free
kilo/kilo-auto/frontier
kilo/openrouter/free
kilo/moonshotai/kimi-k2.5
kilo/minimax/minimax-m2.5:free
kilo/z-ai/glm-5
kilo/x-ai/grok-code-fast-1:optimized:free
kilo/morph/morph-v3-fast
kilo/morph-warp-grep-v2
```

opencode:
```text
opencode/minimax-m2.5-free
opencode/glm-5
```

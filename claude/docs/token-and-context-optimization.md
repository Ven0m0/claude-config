# Token and context optimization

Consolidated reference for token reduction, context engineering, and TOON/ZON usage in this config pack.

## Token reduction helpers

| Resource | When to use |
| -------- | ----------- |
| **strategic-compact** skill | Compact output; brevity in responses |
| **llm-docs-optimizer** skill | Doc restructuring, token analysis, llmstxt |
| **moai-foundation-context** skill | Token budget, /clear strategies |
| **data-formats** skill | toon-encoding, json-optimization modules |
| **context-manager** agent | Context engineering, multi-agent orchestration |
| **context-architect** agent | Context design and structure |

See [../AGENTS.md](../AGENTS.md) Agent orchestration and Workflow and doc optimization.

## TOON/ZON formatting

| Resource | When to use |
| -------- | ----------- |
| **smart-format** skill | `decide-format [directory]` to choose ZON/TOON/PLOON for data dirs |
| **toon-formatter** skill | Encoding/validation, token-savings estimates |
| **ref-toon-format**, **use-toon** skills | TOON spec, agent handoffs, memory persistence |
| **validate-toon.py** | [../scripts/validate-toon.py](../scripts/validate-toon.py) — validate .toon files |
| **data-formats** skill | Implementation reference for toon-encoding |

See [toon.md](toon.md) and [../README.md](../README.md) Token reduction and TOON/ZON.

## Model parameters

Evidence-based tuning by task type: [llm-tuning.md](llm-tuning.md) and **llm-tuning-patterns** skill.

## Related agents and skills

- **improve-agent**: Agent performance and prompt engineering
- **markdown-optimizer**: Token-heavy markdown
- **skill-optimizer**: Skill token efficiency (progressive disclosure, 500-line rule)
- **manage-markdown-docs**: Markdown consistency (headers, metadata)
- **mcp-mode** skill: Many-tool MCP servers without context bloat; see [../rules/mcp.md](../rules/mcp.md)

# claude/docs/

## Responsibility
Reference documentation for the Claude Code configuration ecosystem. Topic-based markdown files covering architecture, optimization, tooling, and best practices. Serves as the progressive disclosure layer -- CLAUDE.md points here for details.

## Design
Each doc is a standalone markdown reference on a specific topic. Documents follow progressive disclosure: CLAUDE.md has pointers, docs have full explanations. No YAML frontmatter -- pure reference content.

## Contents

| Document | Topic |
|----------|-------|
| `best-practices-claude.md` | Claude Code usage best practices |
| `claude-code-settings.md` | Settings.json configuration reference |
| `claude-md-guide.md` | CLAUDE.md authoring guide with scoring rubric |
| `hooks.md` | Hook system documentation (events, configuration, lifecycle) |
| `llm-tuning.md` | Evidence-based model parameter tuning by task type |
| `lsp-tools-integration.md` | LSP tool integration for semantic code navigation |
| `mcp.md` | MCP server configuration and integration patterns |
| `memory-architecture.md` | Beads knowledge capture system (JSONL, recall, rotation) |
| `optimization-patterns.md` | Token and context optimization patterns |
| `output-styles.md` | Output style configuration reference |
| `progressive-disclosure.md` | Content architecture for context efficiency |
| `prompt-best-practices.md` | Prompt engineering patterns |
| `prompt-caching.md` | Caching strategies for repeated prompts |
| `python-non-obvious-patterns.md` | Non-obvious Python patterns and gotchas |
| `ralph.md` | Ralph Planner workflow documentation |
| `skills-ref.md` | Complete skills index and reference |
| `subagents.md` | Subagent delegation patterns and rules |
| `toon.md` | TOON format specification (31% token reduction) |
| `troubleshooting.md` | Common issues and solutions |
| `use-xml-tags.md` | XML tag usage for prompt engineering |

## Integration
- Referenced by: CLAUDE.md, AGENTS.md, agent prompts, skill instructions
- Consumed by: Developers and AI agents for detailed guidance
- Pattern: CLAUDE.md -> brief pointer -> docs/ for full reference

# claude/output-styles/

## Responsibility
Output style definitions that control how Claude Code formats its responses. Styles define communication patterns, delegation behavior, and response structure.

## Design
Markdown files with YAML frontmatter (`name`, `description`, `keep-coding-instructions`). The style body provides behavioral instructions for response formatting.

## Contents

| Style | Purpose |
|-------|---------|
| `main.md` | Template/placeholder for custom style instructions |
| `moai.md` | Orchestrator style: strategic delegation, minimal communication, precise status updates, no XML in user output |

## Integration
- Consumed by: Claude Code output rendering system
- Selected via: Settings or session configuration

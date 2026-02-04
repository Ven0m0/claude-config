# Legacy Claude API Configuration Reference

This document describes the legacy Claude API configuration format that was stored in the `.claude/` directory. This has been integrated into the Claude Code plugin structure.

## Original Structure

The legacy configuration used the following structure:

```
.claude/
├── config.json                 # API configuration settings
├── settings/
│   ├── api_settings.json       # API keys and endpoints
│   └── conversation_settings.json  # Conversation preferences
├── prompts/                    # System prompts for different use cases
├── templates/                  # Document templates for common tasks
└── context/                    # Project context documentation
```

## Migration to Claude Code Plugin Structure

### Prompts → Plugin and config reference

The system prompts have been moved into plugins and the shared config:

- `prompts/coding_assistant.md` → `plugins/coding-assistant/reference/prompt.md`
- Other prompts and reference material → `claude/docs/`, `claude/skills/`, and `plugins/prompt-improver/` as applicable. See [claude/docs/skills-guide.md](docs/skills-guide.md) and [claude/AGENTS.md](AGENTS.md) for current layout.

### Configuration Settings

Legacy API configuration settings:

- Model selection, token limits, temperature → Now configured in `claude/settings.json`
- Conversation settings → Handled by Claude Code CLI automatically

## Legacy Config Values

For reference, the legacy config.json contained:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 8192,
  "temperature": 1.0,
  "system_prompts": [...],
  "tools_enabled": true,
  "streaming": true
}
```

### Conversation Settings

```json
{
  "conversation": {
    "max_history_length": 10,
    "context_window": 200000,
    "save_conversations": true,
    "conversation_directory": "./conversations"
  },
  "output": {
    "format": "markdown",
    "syntax_highlighting": true,
    "line_numbers": true,
    "word_wrap": true
  },
  "behavior": {
    "auto_suggest": true,
    "confirm_destructive_actions": true,
    "verbose_errors": true
  }
}
```

## Claude Code Equivalent

1. **Model Selection**: via `claude/settings.json` or environment variables:

1. **Model Selection**: `claude/settings.json` env variables:

   - `ANTHROPIC_DEFAULT_OPUS_MODEL`
   - `ANTHROPIC_DEFAULT_SONNET_MODEL`
   - `ANTHROPIC_MODEL`

1. **Prompts**: Built into plugin skill definitions (SKILL.md files)

1. **Templates**: Reference documentation in plugin directories

1. **Conversation Management**: Automatic via Claude Code CLI

## See Also

- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings.md)
- [Plugin Development Guide](https://code.claude.com/docs/en/plugins.md)
- [Skills Documentation](https://code.claude.com/docs/en/skills.md)

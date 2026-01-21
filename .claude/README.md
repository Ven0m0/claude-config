# Claude Configuration Directory

This directory contains configuration files, prompts, and templates for working with Claude AI.

## Directory Structure

```
.claude/
├── config.json                 # Main configuration file
├── README.md                   # This file
├── settings/                   # API and conversation settings
│   ├── api_settings.json      # API configuration
│   └── conversation_settings.json  # Conversation preferences
├── prompts/                    # System prompts for different use cases
│   ├── coding_assistant.md    # Software development prompt
│   ├── technical_writer.md    # Documentation writing prompt
│   └── data_analyst.md        # Data analysis prompt
├── templates/                  # Templates for common tasks
│   ├── api_documentation.md   # API docs template
│   └── code_review.md         # Code review template
└── context/                    # Project-specific context
    └── project_context.md     # Guide for adding context files
```

## Configuration Files

### config.json

Main configuration file containing:
- Model selection (Claude 3.5 Sonnet, etc.)
- Token limits
- Temperature settings
- System prompts
- Feature toggles

### settings/api_settings.json

API-related configuration:
- API keys (remember to keep these secure!)
- Base URLs
- Timeout and retry settings
- Rate limiting

### settings/conversation_settings.json

Conversation and output preferences:
- History management
- Output formatting
- Behavioral settings

## Prompts

System prompts for specialized use cases:

- **coding_assistant.md**: For software development tasks
- **technical_writer.md**: For documentation writing
- **data_analyst.md**: For data analysis and insights

## Templates

Reusable templates for common documentation needs:

- **api_documentation.md**: Standardized API endpoint documentation
- **code_review.md**: Comprehensive code review checklist

## Context

Project-specific context files that help Claude understand your project better. Add files here with:
- Project architecture
- Coding conventions
- Domain knowledge
- Team standards

## Usage

1. **Configure API Settings**: Update `settings/api_settings.json` with your API key
2. **Choose a Prompt**: Select from `prompts/` or create your own
3. **Add Context**: Place project-specific information in `context/`
4. **Use Templates**: Reference templates from `templates/` as needed

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Add `settings/api_settings.json` to `.gitignore` if it contains secrets

## Customization

Feel free to:
- Add new prompts for your specific use cases
- Create additional templates
- Modify existing configurations
- Add project-specific context files

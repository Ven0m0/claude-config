# claude/partnerships/

## Responsibility
Third-party model provider integration configurations. Defines alternative AI backends that can substitute for Anthropic's models via API-compatible endpoints.

## Design
JSON configuration files that override Anthropic environment variables to route requests through alternative providers. Uses the Anthropic API compatibility layer.

## Contents

| Config | Provider | Models |
|--------|----------|--------|
| `glm-coding-plan.json` | Z.AI / GLM-4 | Maps haiku->glm-4.5-air, sonnet/opus->glm-4.7. Includes native MCP support for image recognition and web search. |

## Integration
- Consumed by: Claude Code model routing via env var overrides (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`)
- Requires: Z.AI API key (`$ZAI_API_KEY`)

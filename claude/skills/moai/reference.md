# moai-foundation-claude Reference

Compact reference for extension authoring. Prefer links over local doc copies.

## Canonical docs

### Anthropic

- Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Skill best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Code skills: https://code.claude.com/docs/en/skills
- Chain-of-thought guidance: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought
- XML tags guidance: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags

### GitHub Copilot

- Best practices: https://docs.github.com/en/copilot/get-started/best-practices
- Custom agents config: https://docs.github.com/en/copilot/reference/custom-agents-configuration
- Hooks config: https://docs.github.com/en/copilot/reference/hooks-configuration
- Custom instruction support: https://docs.github.com/en/copilot/reference/custom-instructions-support

## Local standards

- `../AGENT_SKILL_SPEC.md` - consolidated spec requirements
- `../../AGENTS.md` - repo-wide execution rules
- `../../CLAUDE.md` - imported core guidance

## Short checklists

### Skill checklist

1. Valid frontmatter with `name` and `description`
2. Concise trigger-oriented description
3. Clear workflow and validation steps
4. One-hop references only
5. Least-privilege tool scope

### Agent checklist

1. Mission in one sentence
2. Constraints and tool boundaries
3. Deterministic workflow
4. Output format requirements
5. No duplicated policy boilerplate

### Hooks checklist

1. Purpose is policy or safety, not verbosity
2. Synchronous failure messages are actionable
3. No secret capture in logs
4. Narrow matchers to reduce accidental blocking

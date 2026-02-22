# Agent and Skill Spec Alignment (Anthropic + Copilot)

Use this file as the baseline when editing `claude/skills/*` and `claude/agents/*`.

## Primary goals

- Keep instructions concise, specific, and testable.
- Minimize always-loaded context.
- Prefer reusable workflows over long narrative prose.
- Keep tool permissions least-privilege.

## Anthropic skill requirements

Source docs:

- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://code.claude.com/docs/en/skills

Rules:

1. `SKILL.md` must have YAML frontmatter with `name` and `description`.
2. Descriptions should be short and explicit about:
   - what the skill does
   - when to use it
   - trigger words likely to appear in user requests
3. Progressive disclosure:
   - Level 1: metadata (always loaded)
   - Level 2: SKILL instructions (load when relevant)
   - Level 3: supporting files/scripts (load only when needed)
4. Prefer one deterministic workflow per task type.
5. Avoid deep reference nesting and avoid copying full external docs into local files.
6. For fragile tasks, reduce degrees of freedom (concrete steps/scripts).
7. Use utility scripts for repeatable operations when prose is too ambiguous.

## Prompt-structure requirements

Source docs:

- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags

Rules:

1. Use semantic XML tags for clear sections (`<role>`, `<instructions>`, `<constraints>`).
2. Keep tag names consistent in a file.
3. Only request step-by-step reasoning for tasks that need it.
4. Keep final outputs clearly separated from reasoning when structure matters.

## GitHub Copilot alignment

Source docs:

- https://docs.github.com/en/copilot/get-started/best-practices
- https://docs.github.com/en/copilot/reference/custom-agents-configuration
- https://docs.github.com/en/copilot/reference/hooks-configuration
- https://docs.github.com/en/copilot/reference/custom-instructions-support

Rules:

1. Keep custom agent prompts focused and scoped; avoid broad multi-purpose prompts.
2. Custom agent prompt body must stay within the documented size limits (30,000 chars).
3. Prefer explicit `tools` scoping where supported.
4. Treat unrecognized tools/properties as compatibility risks; avoid platform-specific clutter.
5. Keep custom instructions concise and operational, not descriptive essays.
6. Hooks should enforce policy and logging without capturing secrets.
7. Always validate generated code/config with tests and linters.

## Token-efficiency checklist

Before merging changes to skills/agents, verify:

- No duplicated policy blocks across multiple files.
- No large copied vendor docs where links or short summaries are enough.
- No oversized examples that do not add new behavior.
- References are one hop away from `SKILL.md` or agent file.
- Instructions emphasize action steps, validation, and failure handling.

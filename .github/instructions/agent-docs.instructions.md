---
applyTo: 'claude/agents/**, claude/skills/**, .github/skills/**'
---

Agent and skill docs in this repository follow these conventions.

## Agents (`claude/agents/*.md`)

YAML frontmatter is required:

```yaml
---
name: agent-name
description: One-line description for agent selection
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

- Use `hyphenated-name.md` for filenames.
- Keep descriptions concrete and selection-oriented.
- List only tools the agent actually needs.

## Skills (`claude/skills/<name>/SKILL.md`, `.github/skills/<name>/SKILL.md`)

Frontmatter fields: `name`, `description`, `allowed-tools`.

Layout:

```text
skill-name/
├── SKILL.md
├── examples.md    # optional
└── references/    # optional
```

- Each skill needs a clear trigger, narrow scope, and concrete steps.
- Call out unsafe areas, generated files, and validation requirements.

## Validation

Run `bun run lint:claude` after any change to agent or skill files. This invokes `claudelint check-all` against the repository's `.claudelintrc.json` rules.

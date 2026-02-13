# claude/scripts/

## Responsibility
Utility scripts for the Claude Code ecosystem. Standalone executables for analysis, formatting, validation, initialization, and maintenance tasks.

## Design
Mixed-language scripts (TypeScript, Python, Shell) each solving a specific automation need. Scripts are invoked by hooks, commands, or directly by users. No shared framework -- each script is self-contained.

## Contents

| Script | Language | Purpose |
|--------|----------|---------|
| `analyze-claude-md.ts` | TypeScript | Deterministic CLAUDE.md analysis outputting JSON metrics for scoring |
| `check-performance.mjs` | JavaScript | Performance checking utility |
| `check-release.sh` | Shell | Release validation checks |
| `fix-all-skills.py` | Python | Batch fix/normalize all skill files |
| `format-code.sh` | Shell | Multi-language code formatting dispatcher |
| `format-python.sh` | Shell | Python-specific formatting (ruff) |
| `init-project.sh` | Shell | Project initialization scaffolding |
| `normalize_skills_metadata.py` | Python | Normalize YAML frontmatter across all skills |
| `validate-toon.py` | Python | TOON file structure and syntax validation |

## Integration
- Invoked by: Hooks (format scripts), commands (`/format`, `/validate-skills`), users directly
- Depends on: External tools (ruff, biome, prettier, npx ts-node)
- Outputs: JSON metrics, formatted files, validation reports

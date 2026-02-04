# LLM tuning by task type

Evidence-based parameter settings for different agent tasks. See `claude/skills/llm-tuning-patterns/SKILL.md` for full patterns and sources (APOLLO, Godel-Prover).

## Quick reference

| Task type | max_tokens | temperature | top_p | Notes |
|-----------|------------|-------------|-------|--------|
| Theorem proving / formal reasoning | 4096 | 0.6 | 0.95 | Request proof plan before tactics; parallel sampling for hard proofs |
| Code generation | 2048 | 0.2–0.4 | — | Prefer deterministic output |
| Creative / exploration | 4096 | 0.8–1.0 | — | Space for exploration |

## Anti-patterns

- **Proofs**: Too low tokens (e.g. 512) truncates chain-of-thought; temperature 0.2 misses creative tactic paths.
- **Code gen**: High temperature increases variability and rework.
- **General**: Use one global setting for all tasks instead of task-appropriate values.

## Where to set

- Claude Code: `~/.claude/settings.json` or `.claude/settings.json` (project).
- Agent frontmatter: some runtimes support `model` or per-agent overrides; document in agent description when used.

# MoAI builder agents (stripped for this repo)

These agent files described MoAI-ADK builders (builder-agent, builder-command, builder-skill, builder-plugin, manager-quality). They are tightly coupled to MoAI-ADK workflows and commands.

For this repo:

- Use **general-purpose** and specialist agents listed in `claude/AGENTS.md` for delegation.
- Use **improve-agent**, **skill-auditor**, and **config-wizard** (if present) for creating or tuning skills and configs.
- For the original MoAI builder behavior, see https://github.com/modu-ai/moai-adk

The individual agent `.md` files in this folder are left for reference but are not customized for this repo; prefer the agents in `claude/agents/` (sibling directory).

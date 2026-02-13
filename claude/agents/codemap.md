# claude/agents/

## Responsibility
Defines specialized agent personalities for Claude Code's multi-agent orchestration system. Each agent is a system prompt with expertise boundaries, tool permissions, model routing, and behavioral rules.

## Design
Each `.md` file uses YAML frontmatter to declare agent metadata (`name`, `description`, `allowed-tools`, `model`, `skills`) followed by a markdown system prompt. Agents are invoked via `Task(subagent_type="agent-name")` delegation from the orchestrator. Model routing ranges from `haiku` (fast/cheap) to `opus` (deep reasoning) to `inherit` (caller's model).

## Contents

| Agent | Model | Role |
|-------|-------|------|
| `general-purpose` | sonnet | Default delegator with parallel-execution, mgrep, codeagent, gemini-cli skills |
| `bash-pro` | sonnet | Defensive Bash scripting for production automation and CI/CD |
| `python-pro` | opus | Python 3.12+ with uv, ruff, pydantic, FastAPI expertise |
| `typescript-pro` | sonnet | Advanced TypeScript type system, generics, conditional types |
| `javascript-pro` | sonnet | Modern JS, ES6+, async patterns, Node.js APIs |
| `rust-pro` | opus | Rust 1.75+, Tokio, axum, systems programming |
| `code-explorer` | haiku | Traces execution paths, maps architecture, finds patterns (read-only) |
| `code-simplifier` | opus | Refactors code for clarity without changing behavior |
| `janitor` | sonnet | Cleanup, dead code removal, tech debt remediation |
| `merge-supervisor` | opus | Git merge conflict resolution preserving both sides' intent |
| `context-manager` | inherit | Context engineering, token optimization, multi-agent workflows |
| `dx-optimizer` | sonnet | Developer experience, tooling, workflow setup |
| `llm-boost` | varies | CLAUDE.md audit, skill optimization, markdown compression, XML tags |
| `mcp-expert` | sonnet | MCP server configuration and protocol integration |
| `prd` | opus | Product requirements documents with user stories and acceptance criteria |
| `reverse-engineer` | opus | Binary analysis, disassembly, decompilation, malware defense |
| `turbo` | varies | Maximum speed execution, aggressive parallelization |

### Subdirectory: moai/
MoAI-ADK builder agents (reference only, not customized for this repo). Contains `builder-agent`, `builder-command`, `builder-plugin`, `builder-skill`, and `manager-quality` -- multilingual agent creation specialists from the MoAI framework.

## Integration
- Consumed by: Orchestrator via `Task()` delegation, referenced in `claude/AGENTS.md` routing table
- Depends on: Skills referenced in frontmatter `skills:` field, `settings.json` for permissions
- Model routing: `haiku` for exploration, `sonnet` for implementation, `opus` for complex reasoning

# claude/commands/

## Responsibility
Slash commands for Claude Code CLI -- user-invokable macros that automate common development workflows. Each command is a markdown file with optional YAML frontmatter defining tool permissions and category.

## Design
Commands use YAML frontmatter (`description`, `category`, `allowed-tools`) followed by markdown instructions that Claude executes when the user types `/command-name`. Categories: workflow, code-analysis-testing, context-loading-priming, documentation, maintenance, automation, performance, scaffolding.

## Contents

| Command | Purpose |
|---------|---------|
| `catchup` | Reload uncommitted changes after `/clear` |
| `check-fact` | Verify statements against code and docs |
| `ci-gen` | Generate/update GitHub Actions CI workflows |
| `clarify` | Ask 3-4 clarifying questions about a feature proposal |
| `claude-md` | Audit, refresh, or improve CLAUDE.md/AGENTS.md files |
| `clean-branches` | Clean up merged and stale git branches |
| `clean` | Clean up code, artifacts, and tech debt |
| `cleanup-context` | Reduce context window usage |
| `create-claude-md` | Create new CLAUDE.md via interactive questionnaire |
| `docs` | Documentation manager |
| `explore-local` | Pack/explore local codebase with Repomix |
| `explore-remote` | Pack/explore remote GitHub repo with Repomix |
| `fix-error` | Analyze errors with resolution time estimates |
| `fix-todos` | Find and fix TODO comments |
| `format` | Run all linters/formatters (ruff, biome, cargo fmt, etc.) |
| `heal-skill` | Fix incorrect SKILL.md files |
| `learn` | Extract reusable knowledge into skills |
| `lsp-setup` | Set up LSP hooks for current project |
| `md-optimizer` | Optimize markdown for LLM context efficiency |
| `optimize-database-performance` | Optimize database queries |
| `optimize` | Optimize code, bundles, and builds |
| `predict-issues` | Predictive code analysis |
| `prime` | Load project context (README, CLAUDE.md, structure) |
| `ralph-start` | Start Ralph Planner unified loop |
| `remove-comments` | Remove unnecessary comments |
| `rust-project` | Create new Rust project with best practices |
| `search-gemini` | Web search via Gemini |
| `self-healing` | Self-healing diagnostics |
| `serena-mcp` | Serena MCP integration guide |
| `update-deps` | Update dependencies with security scanning |
| `validate-skills` | Validate skills for Claude/Codex/Copilot compatibility |

## Integration
- Invoked by: Users via `/command-name` in Claude Code CLI
- Depends on: Tools specified in `allowed-tools` frontmatter
- References: Skills, agents, and scripts from sibling directories

# Claude Code Plugin Marketplace

A curated collection of Claude Code plugins, agents, skills, and tools for enhanced productivity.
This marketplace provides professional-grade components for coding, documentation, and data analysis workflows.

## Quick Start

### Install the Marketplace

```bash
/plugin marketplace add Ven0m0/claude-config
```

### Install Individual Plugins

```bash
# Core plugins
/plugin install coding-assistant@claude-config-marketplace
/plugin install conserve@claude-config-marketplace
/plugin install prompt-improver@claude-config-marketplace
/plugin install config-wizard@claude-config-marketplace
/plugin install dependency-blocker@claude-config-marketplace
/plugin install skill-authoring@claude-config-marketplace

# Security and tooling
/plugin install claude-praetorian@claude-config-marketplace
/plugin install moderntools@claude-config-marketplace
/plugin install dynamic-mcp-router@claude-config-marketplace
```

### Use the Claude Config Pack Directly

Copy the `claude/` directory to your Claude Code configuration:

```bash
cp -r claude/ ~/.claude/
```

This gives you 12 agents and 32 skills immediately.

---

## Available Plugins (13 Total)

### coding-assistant

Advanced coding assistant with code review, debugging, and refactoring capabilities.

- `/code-review` - Comprehensive code reviews with security and performance checks
- `/debug` - Systematic debugging and root cause analysis
- `/refactor` - Code refactoring for better structure and maintainability
- Automatic code formatting after edits (Biome, ruff, gofmt, rustfmt)

[View Documentation](./plugins/coding-assistant/README.md)

### conserve

Resource optimization and performance monitoring toolkit for efficient Claude Code workflows.

- `/bloat-scan` - Identify dead code, duplication, and documentation bloat
- `/optimize-context` - Optimize context usage and token efficiency
- `/analyze-growth` - Analyze codebase growth patterns
- `/ai-hygiene-audit` - Audit AI-generated code quality
- `/unbloat` - Remove unnecessary code and improve efficiency
- Maximum Effective Context Window (MECW) principle

[View Documentation](./plugins/conserve/README.md)

### prompt-improver

Intelligent prompt optimization. Enriches vague prompts with research-based clarifying questions.

- Automatic prompt clarity evaluation
- Research-based clarifying questions (1-6 questions)
- Zero overhead for clear prompts
- 31% token reduction through skill-based architecture

[View Documentation](./plugins/prompt-improver/README.md)

### config-wizard

Interactive wizard to create new Claude Code plugins and skills.

- `/config-wizard:cmd-init` - Initialize a new slash command
- `/config-wizard:cmd-review` - Review an existing slash command

[View Documentation](./plugins/config-wizard/README.md)

### dependency-blocker

Blocks Claude from accessing dependency directories to reduce token usage.

- Blocks `node_modules`, `.git`, `dist`, `build`, `vendor`, `target`, `.venv`, `venv`
- Blocks Bash, Read, Glob, and Grep operations targeting excluded directories

[View Documentation](./plugins/dependency-blocker/README.md)

### skill-authoring

Framework and templates for creating new Claude Code skills.

[View Documentation](./plugins/skill-authoring/README.md)

### claude-praetorian

Security guardrails and policy enforcement for Claude Code sessions.

### moderntools

Enforces modern tool substitutions: `fd` over `find`, `rg` over `grep`, `bun` over `npm`, etc.

### dynamic-mcp-router

Dynamic MCP server routing for flexible tool integration.

### plugin-validator

Validates plugin structure and compliance against marketplace standards.

### skills-eval

Skill evaluation and benchmarking framework.

### skills_performance-optimization

Performance tuning for Claude Code skills.

### claude-code-lsps

LSP integrations for Claude Code (go-to-definition, find-references, etc.).

---

## Claude Config Pack

The `claude/` directory is a standalone config pack with:

**12 Sub-Agents** (`claude/agents/`):

| Agent | Purpose |
|---|---|
| `ci-cd-expert` | CI/CD pipeline design and troubleshooting |
| `code-explorer` | Codebase analysis and architecture mapping |
| `code-simplifier` | Refactoring for clarity and maintainability |
| `docker-specialist` | Dockerfile optimization and security hardening |
| `general-purpose` | Default multi-step task agent |
| `language-expert` | Multi-language: Bash, Python, JS, TS, Rust |
| `maintenance` | Cleanup, tech debt, DX improvements |
| `merge-supervisor` | Git merge conflict resolution |
| `optimizer` | Context and LLM optimization |
| `prd` | Product Requirements Documents |
| `reverse-engineer` | Binary analysis (authorized use only) |
| `skill-auditor` | SKILL.md compliance audits |

**32 Skills** (`claude/skills/`):

`ast-grep-search`, `bash-optimizer`, `code-antipatterns-analysis`, `code-execution`,
`data-formats`, `git-cli-agentic`, `github`, `hooks-configuration`, `javascript`,
`json-repair`, `linter-autofix`, `llm-boost`, `lsp-enable`, `mcp-builder`, `moai`,
`modern-tool-substitution`, `prd`, `python-project-development`, `ralph-planner`,
`render-output`, `repomix`, `ruff`, `rust`, `self-reflection`, `sequential-thinking`,
`strategic-compact`, `svg`, `toon-formatter`, `typescript`, `using-tmux-for-interactive-commands`,
`uv`, `vulture-dead-code`

---

## Repository Structure

```
claude-config/
├── AGENTS.md           # Primary AI config (symlinked as CLAUDE.md, GEMINI.md)
├── README.md           # This file
├── SETUP.md            # Installation guide
├── CHANGELOG.md        # Version history
│
├── claude/             # Claude Code config pack
│   ├── agents/         # 12 sub-agent definitions
│   ├── skills/         # 32 reusable skills
│   ├── hooks/          # Auto-running hooks (format, lint, MCP)
│   ├── docs/           # Reference documentation
│   └── settings.json   # Permissions and model config
│
├── plugins/            # 13 installable plugins
├── gemini/             # Gemini CLI config
├── cursor/             # Cursor editor rules
├── copilot-cli/        # GitHub Copilot CLI config
├── opencode/           # OpenCode references
└── .github/
    ├── copilot-instructions.md  # Copilot guardrails
    └── workflows/               # CI/CD automation
```

---

## Requirements

- Claude Code CLI (latest version)
- Git
- `rg` (ripgrep) - required by hooks
- `gh` - GitHub CLI (for PR/issue workflows)
- Optional: `fd`, `eza`, `ast-grep`, `jq`, `bun`, `uv`

---

## Documentation

- [AGENTS.md](./AGENTS.md) - Complete agent, skill, and configuration reference
- [SETUP.md](./SETUP.md) - Detailed installation and configuration
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [claude/docs/](./claude/docs/) - Prompt patterns, hooks, LSP integration, TOON format

---

## Contributing

Contributions welcome:

- Add new plugins or skills
- Improve existing agents
- Report issues or suggest features: [GitHub Issues](https://github.com/Ven0m0/claude-config/issues)

---

## License

MIT - see [LICENSE](./LICENSE)

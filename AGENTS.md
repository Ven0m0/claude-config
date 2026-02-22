# AI Agent Configuration and Repository Guide

> **Symlinked as:** `CLAUDE.md` (Claude Code) | `GEMINI.md` (Gemini CLI)
> **Applies to:** All AI assistants working in this repository.

This repository is the **Claude Code Plugin Marketplace and Configuration Repository** - a comprehensive ecosystem of plugins, agents, skills, hooks, and configurations for Claude Code, GitHub Copilot CLI, Cursor, Gemini, and Qwen.

---

## Project Overview

| Field | Value |
|---|---|
| Type | Configuration ecosystem and plugin marketplace |
| Primary Framework | Claude Code (CLI for Claude AI assistant) |
| Version | v1.1.0 |
| License | MIT |
| Python | 3.13+ |
| Node Runtime | Bun |

### Technology Stack

**Languages:**
- TypeScript/JavaScript - Skills, MCP servers, hooks
- Python 3.13+ - Scripting, hooks, automation
- Shell/Bash - CLI tooling, automation
- YAML - Configuration, CI/CD
- JSON - Configuration, metadata
- Markdown - Documentation (400+ files)

**Frameworks & Tools:**
- Claude Code - Main framework
- MCP (Model Context Protocol) - Extensible tool integration
- Biome - JS/TS formatter and linter
- Ruff - Python formatter and linter
- Git/GitHub - Version control, CI/CD
- Bun - JavaScript runtime and package manager
- uv - Python package manager

---

## Repository Structure

```
claude-config/
├── AGENTS.md                   # @primary - This file (symlinked as CLAUDE.md, GEMINI.md)
├── README.md                   # @marketplace - Plugin marketplace guide
├── SETUP.md                    # @setup - Installation instructions
├── CHANGELOG.md                # @history - Version history
├── pyproject.toml              # @python-deps - Python dependencies
├── tsconfig.json               # @ts-config - TypeScript configuration
├── .editorconfig               # @style - Code style rules
│
├── claude/                     # @core - Main Claude Code config pack
│   ├── agents/                # @agents - 12 specialized sub-agents
│   │   ├── ci-cd-expert.md        # CI/CD pipeline specialist
│   │   ├── code-explorer.md       # Codebase analysis and navigation
│   │   ├── code-simplifier.md     # Refactoring and simplification
│   │   ├── docker-specialist.md   # Docker and containerization
│   │   ├── general-purpose.md     # Default multi-step agent
│   │   ├── language-expert.md     # Multi-language development
│   │   ├── maintenance.md         # Cleanup and tech debt
│   │   ├── merge-supervisor.md    # Merge conflict resolution
│   │   ├── optimizer.md           # Context and LLM optimization
│   │   ├── prd.md                 # Product requirements docs
│   │   ├── reverse-engineer.md    # Binary analysis (authorized use)
│   │   └── skill-auditor.md       # SKILL.md compliance audits
│   │
│   ├── skills/                # @skills - 32 reusable skills
│   │   ├── ast-grep-search/       # AST-based structural code search
│   │   ├── bash-optimizer/        # Optimize bash scripts
│   │   ├── code-antipatterns-analysis/ # Detect code antipatterns
│   │   ├── code-execution/        # Safe code execution patterns
│   │   ├── data-formats/          # Format conversion (JSON, TOON, etc.)
│   │   ├── git-cli-agentic/       # Advanced git operations
│   │   ├── github/                # GitHub CLI operations
│   │   ├── hooks-configuration/   # Configure Claude Code hooks
│   │   ├── javascript/            # JavaScript best practices
│   │   ├── json-repair/           # JSON validation and repair
│   │   ├── linter-autofix/        # Auto-fix linting errors
│   │   ├── llm-boost/             # LLM performance tuning
│   │   ├── lsp-enable/            # LSP-first code intelligence
│   │   ├── mcp-builder/           # Build MCP servers
│   │   ├── moai/                  # Claude Code authoring kit
│   │   ├── modern-tool-substitution/ # Substitute legacy tools
│   │   ├── prd/                   # PRD generation
│   │   ├── python-project-development/ # Python dev patterns
│   │   ├── ralph-planner/         # Structured planning
│   │   ├── render-output/         # Output formatting
│   │   ├── repomix/               # Repository mixing/bundling
│   │   ├── ruff/                  # Python linting with ruff
│   │   ├── rust/                  # Rust development
│   │   ├── self-reflection/       # Agent self-evaluation
│   │   ├── sequential-thinking/   # Step-by-step reasoning
│   │   ├── strategic-compact/     # Context compaction
│   │   ├── svg/                   # SVG creation and optimization
│   │   ├── toon-formatter/        # TOON format conversion
│   │   ├── typescript/            # TypeScript best practices
│   │   ├── using-tmux-for-interactive-commands/ # Tmux workflows
│   │   ├── uv/                    # Python uv package manager
│   │   └── vulture-dead-code/     # Dead code detection
│   │
│   ├── hooks/                 # @hooks - Auto-running hooks
│   │   ├── post-edit-format.py         # Auto-format on file edits
│   │   ├── enforce_rg_over_grep.py     # Policy: block grep, use rg
│   │   ├── context_protector.py        # Context management
│   │   ├── precompact_context.py       # Pre-compaction processing
│   │   ├── load-mcp-skills.sh          # MCP initialization (SessionStart)
│   │   ├── json-to-toon.mjs            # JSON to TOON conversion
│   │   ├── hooks.json                  # Hook configuration
│   │   └── auto-git-add.json           # Auto git staging config
│   │
│   ├── docs/                  # @docs - Reference documentation
│   │   ├── claude-md-guide.md         # CLAUDE.md authoring guide
│   │   ├── hooks.md                   # Hooks reference
│   │   ├── llm-tuning.md              # LLM parameter tuning
│   │   ├── lsp-tools-integration.md   # LSP integration
│   │   ├── memory-architecture.md     # Memory system design
│   │   ├── optimization-patterns.md   # Performance patterns
│   │   ├── output-styles.md           # Output formatting guide
│   │   ├── progressive-disclosure.md  # Content architecture
│   │   ├── prompt-best-practices.md   # Prompt patterns
│   │   ├── python-non-obvious-patterns.md # Python tips
│   │   ├── skills-index.md            # All skills index
│   │   ├── toon.md                    # TOON format spec
│   │   └── use-xml-tags.md            # XML tag structuring
│   │
│   └── settings.json          # @settings - Permissions, env config
│
├── plugins/                    # @plugins - Plugin marketplace (13 plugins)
│   ├── coding-assistant/      # Code review, debug, refactor
│   ├── conserve/              # Context/token optimization
│   ├── prompt-improver/       # Prompt clarity enhancement
│   ├── config-wizard/         # Plugin creation wizard
│   ├── dependency-blocker/    # Block dependency directories
│   ├── dynamic-mcp-router/    # Dynamic MCP routing
│   ├── moderntools/           # Modern tool substitutions
│   ├── plugin-validator/      # Plugin validation
│   ├── skill-authoring/       # Skill creation framework
│   ├── skills-eval/           # Skill evaluation framework
│   ├── skills_performance-optimization/ # Skill perf tuning
│   ├── claude-code-lsps/      # LSP integrations for Claude Code
│   └── claude-praetorian/     # Security guardrails
│
├── gemini/                     # Gemini AI config
│   ├── skills/                # Code reviewer, PR creator
│   └── settings.json          # Gemini-specific settings
│
├── cursor/                     # Cursor editor config
│   ├── rules/base.md          # Cursor rules
│   └── mcp.json               # MCP settings
│
├── copilot-cli/               # GitHub Copilot CLI config
├── opencode/                  # OpenCode references
├── prompts/                   # Reusable prompts
│
├── .claude-plugin/            # @marketplace - Marketplace definition
│   └── marketplace.json       # Plugin registry
│
└── .github/
    ├── copilot-instructions.md # @copilot - Copilot guardrails
    └── workflows/             # @ci - CI/CD automation
        ├── claudelint.yml         # CLAUDE.md validation
        ├── ruff.yml               # Python linting
        ├── claude.yml             # Claude Code analysis
        ├── claude-code-review.yml # Automated code reviews
        ├── claude-pr-review.yml   # PR review automation
        ├── droid.yml              # Droid automation
        └── jules-*.yml            # Jules automated improvements
```

---

## Development Workflows

### Setup and Installation

```bash
# Clone repository
git clone https://github.com/Ven0m0/claude-config.git

# Install as marketplace
/plugin marketplace add Ven0m0/claude-config

# Install specific plugins
/plugin install coding-assistant@claude-config-marketplace

# Copy claude/ config pack to ~/.claude/
cp -r claude/ ~/.claude/
```

### Build and Test

**Python:**
```bash
# Lint with ruff
ruff check .

# Format with ruff
ruff format .

# Run plugin tests
cd plugins/conserve && make test

# Run with uv
uv run pytest tests/
```

**JavaScript/TypeScript:**
```bash
# Format with Biome
biome format --write .

# Check with Biome
biome check .

# Type-check
bun run tsc --noEmit
```

**Validation:**
```bash
# Validate AGENTS.md
claudelint --check AGENTS.md

# Validate shell scripts
shellcheck claude/hooks/*.sh

# Validate YAML
yamllint .github/workflows/*.yml
```

### Common Development Tasks

**Create a New Skill:**
```bash
# Use config wizard
/skill config-wizard

# Manual: create SKILL.md in claude/skills/skill-name/
mkdir claude/skills/my-skill
# Add SKILL.md following existing skill template format
```

**Add a New Agent:**
1. Create `claude/agents/agent-name.md`
2. Add YAML frontmatter: `name`, `description`, `allowed-tools`, `model`
3. Document usage and examples in the body
4. Test with `/agent agent-name`

**Add a New Hook:**
1. Create hook script in `claude/hooks/`
2. Register in `claude/hooks/hooks.json`
3. Test hook behavior in a session
4. Document in `claude/docs/hooks.md`

**Fix Linting Issues:**
```bash
# Python
ruff check --fix .

# JS/TS
biome check --apply .

# Or use skill
/skill linter-autofix
```

---

## Conventions

### Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Skills | `hyphenated-names/` | `linter-autofix/` |
| Agents | `hyphenated-names.md` | `code-explorer.md` |
| Plugins | `hyphenated-names/` | `coding-assistant/` |
| Python files | `snake_case.py` | `post_edit_format.py` |
| Config/Docs | `kebab-case.md` | `claude-md-guide.md` |
| JS/TS functions | `camelCase` | `formatOutput()` |
| Python functions | `snake_case` | `format_output()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_TOKENS` |
| Classes | `PascalCase` | `ContextManager` |

### Code Style

From `.editorconfig`:
- Indentation: 2 spaces (JS/TS/YAML/JSON), 4 spaces (Python)
- Line length: 120 characters max
- Encoding: UTF-8
- Line endings: LF (Unix)
- Trailing whitespace: Remove

**Engineering Principles:**
- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Ain't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **Fail Fast** - Validate inputs early
- **No Emojis** - Never in code, comments, commits, docs
- **Error Handling** - Meaningful, actionable messages
- **Max File Size** - 200-400 lines typical, 800 max

### Tool Preferences

| Category | Preferred | Fallback |
|---|---|---|
| File Search | `fd` | `find` |
| Text Search | `rg` (ripgrep) | *(grep blocked by hook)* |
| Code Structure | `ast-grep`, LSP tools | - |
| File Listing | `eza` | `ls` |
| JSON Processing | `jq` | - |
| YAML Processing | `yq` | - |
| HTTP | `aria2` | `curl` |
| Sed replacement | `sd` | `sed` |

> **Policy:** `grep` is blocked by the `enforce_rg_over_grep.py` hook. Always use `rg`.

<lsp_enforcement>
Use LSP for code navigation before edits: go-to-definition, find-references, find-implementations. Validate with LSP before making changes. Use text search (rg) only for literal strings, TODOs, and config values.
</lsp_enforcement>

### Git Conventions

**Commit Messages:**
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Max subject length: 72 characters
- Body: Explain WHY, not WHAT
- No emojis

**Branch Names:**
- Feature: `feature/description`
- Bug fix: `fix/description`
- Docs: `docs/description`
- Claude sessions: `claude/*` (auto-generated)

**Pull Requests:**
- Use descriptive titles
- Include test plan
- Link related issues

---

## Agents Reference (12 Total)

All agents live in `claude/agents/`. Invoke with `/agent <name>`.

| Agent | Model | Description |
|---|---|---|
| `ci-cd-expert` | sonnet | CI/CD pipeline design, GitHub Actions, GitLab CI, troubleshooting |
| `code-explorer` | haiku | Codebase analysis: execution paths, architecture mapping, patterns |
| `code-simplifier` | opus | Refactoring for clarity and maintainability |
| `docker-specialist` | sonnet | Dockerfile optimization, multi-stage builds, security hardening |
| `general-purpose` | sonnet | Default agent for complex multi-step tasks |
| `language-expert` | sonnet | Multi-language: Bash, Python, JS, TS, Rust |
| `maintenance` | sonnet | Cleanup, tech debt, DX improvements |
| `merge-supervisor` | opus | Git merge conflict resolution |
| `optimizer` | opus | Context engineering, token optimization, multi-agent workflows |
| `prd` | opus | Product Requirements Documents with GitHub issue creation |
| `reverse-engineer` | opus | Binary analysis (authorized use, CTF, malware defense only) |
| `skill-auditor` | sonnet | SKILL.md compliance audits and fixes |

---

## Skills Reference (32 Total)

All skills live in `claude/skills/`. Invoke with `/skill <name>`.

| Skill | Purpose |
|---|---|
| `ast-grep-search` | AST-based structural code search and refactoring |
| `bash-optimizer` | Optimize bash scripts for performance and correctness |
| `code-antipatterns-analysis` | Detect and report code antipatterns |
| `code-execution` | Safe code execution patterns |
| `data-formats` | Format conversion: JSON, TOON, YAML, CSV |
| `git-cli-agentic` | Advanced git operations and workflows |
| `github` | GitHub CLI operations (issues, PRs, releases) |
| `hooks-configuration` | Configure and manage Claude Code hooks |
| `javascript` | JavaScript idiomatic patterns and best practices |
| `json-repair` | JSON validation, repair, and normalization |
| `linter-autofix` | Auto-fix linting errors across languages |
| `llm-boost` | LLM performance tuning and prompt optimization |
| `lsp-enable` | LSP-first code intelligence setup |
| `mcp-builder` | Build Model Context Protocol servers |
| `moai` | Claude Code authoring kit for SKILL.md files |
| `modern-tool-substitution` | Replace legacy tools with modern equivalents |
| `prd` | Product Requirements Document generation |
| `python-project-development` | Python project patterns and structure |
| `ralph-planner` | Structured planning and task breakdown |
| `render-output` | Output formatting and rendering |
| `repomix` | Repository bundling for LLM context |
| `ruff` | Python linting and formatting with ruff |
| `rust` | Rust development patterns |
| `self-reflection` | Agent self-evaluation and improvement |
| `sequential-thinking` | Step-by-step structured reasoning |
| `strategic-compact` | Context compaction strategies |
| `svg` | SVG creation and optimization |
| `toon-formatter` | TOON v2 format conversion (31% token savings vs JSON) |
| `typescript` | TypeScript best practices and patterns |
| `using-tmux-for-interactive-commands` | Tmux for interactive CLI workflows |
| `uv` | Python uv package manager workflows |
| `vulture-dead-code` | Dead code detection with vulture |

---

## Plugins Reference (13 Total)

All plugins live in `plugins/`. Install via `/plugin install <name>@claude-config-marketplace`.

| Plugin | Purpose |
|---|---|
| `coding-assistant` | Code review, debugging, refactoring with auto-format hooks |
| `conserve` | Context/token optimization, bloat scanning |
| `config-wizard` | Plugin creation wizard |
| `dependency-blocker` | Block `node_modules`, `dist`, `build`, `.venv` from context |
| `dynamic-mcp-router` | Dynamic MCP server routing |
| `moderntools` | Modern tool substitution enforcement |
| `plugin-validator` | Plugin structure and compliance validation |
| `prompt-improver` | Prompt clarity and effectiveness enhancement |
| `skill-authoring` | Skill creation framework and templates |
| `skills-eval` | Skill evaluation and benchmarking |
| `skills_performance-optimization` | Skill performance tuning |
| `claude-code-lsps` | LSP integrations for Claude Code |
| `claude-praetorian` | Security guardrails and policy enforcement |

---

## Hooks System

Hooks auto-run at key events. Configuration in `claude/hooks/hooks.json`.

| Event | Hook | Behavior |
|---|---|---|
| `SessionStart` | `load-mcp-skills.sh` | Load MCP skills at session start |
| `PreToolUse[Bash]` | `quality_gate.py` | Validate bash commands before execution |
| `PostToolUse[Edit/Write]` | `post-edit-format.py` | Auto-format edited files |
| `PostToolUse[Edit/Write]` | *(inline)* | Strip trailing whitespace |

**Hook Scripts:**
- `context_protector.py` - Guard sensitive context from leaking
- `enforce_rg_over_grep.py` - Block `grep`, enforce `rg`
- `precompact_context.py` - Pre-process before context compaction
- `json-to-toon.mjs` - Convert JSON to TOON format

---

## Dependencies

### Python (`pyproject.toml`)

```toml
requires-python = ">=3.13"
dependencies = ["claudelint"]

[dependency-groups]
dev = ["ruff"]
```

### System Tools Required

| Tool | Purpose |
|---|---|
| `git` | Version control |
| `gh` | GitHub CLI |
| `rg` (ripgrep) | Text search (mandatory) |
| `fd` | File search |
| `jq` | JSON processing |
| `bun` | JavaScript runtime |
| `uv` | Python package manager |

**Optional:**
- `eza` - Better ls
- `ast-grep` - AST-based search
- `shellcheck` - Bash linting
- `yamllint` - YAML validation
- `sd` - Fast sed replacement
- `aria2` - Fast downloads

---

## Security

**Policy Enforcement:**
- `grep` blocked; must use `rg` (enforced by PreToolUse hook)
- No emojis in code, comments, commits, or docs
- Dotfiles (`.ssh`, `.aws`, `.env`) protected by `claude-praetorian` plugin
- Dependency directories (`node_modules`, `dist`, etc.) blocked from context by `dependency-blocker`

**Bash Standards:**
- `set -euo pipefail` in all shell scripts
- Quote all variables: `"${var}"`
- Use `[[ ]]` not `[ ]`
- No `eval`, no backticks

---

## Token Optimization

### TOON Format (Token-Optimized Object Notation)

31% token reduction vs JSON for tabular data:

```toon
user:1|John Doe|john@example.com|active
user:2|Jane Smith|jane@example.com|active
```

Use `/skill toon-formatter` to convert data.

### Maximum Effective Context Window (MECW)

**Principles:**
- Progressive disclosure - Load only what's needed
- Skill-based architecture - Reference, don't duplicate
- Context protection - Guard against bloat
- Strategic caching - Reuse expensive computations

**Model Configuration:**
- Main Model: `opusplan` (Claude Opus with extended thinking)
- Thinking Tokens: 16,000 max
- Output Tokens: 63,999 max
- Subagent Model: `haiku`
- MCP Output: 25,000 tokens max

---

## Testing and Quality Assurance

```bash
# Python tests
uv run pytest plugins/conserve/tests/ --cov=.

# All-in-one quality check
ruff check . && biome check . && claudelint --check AGENTS.md

# Shell scripts
shellcheck claude/hooks/*.sh

# YAML
yamllint .github/workflows/*.yml
```

### CI/CD Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `claudelint.yml` | push/PR | Validate AGENTS.md |
| `ruff.yml` | push/PR | Python code quality |
| `claude.yml` | push/PR | Claude Code analysis |
| `claude-code-review.yml` | PR | Automated code review |
| `claude-pr-review.yml` | PR | PR review automation |
| `droid.yml` | schedule | Automated improvements |
| `jules-*.yml` | schedule | Cleanup, performance, bug fixes |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `CLAUDE_ENV_FILE` | Persistent environment variables |
| `CLAUDE_PLUGIN_ROOT` | Hook script resolution path |
| `CONSERVATION_MODE` | Resource optimization (`normal`/`quick`/`deep`) |
| `CLAUDE_DEBUG` | Enable debug logging |
| `CLAUDE_LOG_LEVEL` | Logging verbosity |

---

## Additional Resources

| Resource | Path |
|---|---|
| Prompt best practices | `claude/docs/prompt-best-practices.md` |
| LSP integration | `claude/docs/lsp-tools-integration.md` |
| CLAUDE.md authoring | `claude/docs/claude-md-guide.md` |
| Skills index | `claude/docs/skills-index.md` |
| TOON format spec | `claude/docs/toon.md` |
| Hooks reference | `claude/docs/hooks.md` |
| Progressive disclosure | `claude/docs/progressive-disclosure.md` |
| Repository | https://github.com/Ven0m0/claude-config |
| Issues | https://github.com/Ven0m0/claude-config/issues |

---

## Session Completion

<session_completion>
When ending a work session, complete all steps below. Work is not complete until `git push` succeeds.

1. File issues for remaining work
2. Run quality gates (if code changed): tests, linters, builds
3. Update issue status
4. Push to remote:
   ```bash
   git pull --rebase
   git push
   git status
   ```
5. Clean up: clear stashes, prune remote branches
6. Verify all changes committed and pushed
7. Hand off: provide context for next session

If push fails, resolve and retry until it succeeds. Do not stop before pushing - that leaves work stranded locally.
</session_completion>

---

**Last Updated:** 2026-02-22
**Repository:** https://github.com/Ven0m0/claude-config
**Active Development:** Yes

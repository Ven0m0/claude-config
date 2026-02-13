# AI Agent Configuration and Repository Guide

This repository is the **Claude Code Plugin Marketplace and Configuration Repository** - a comprehensive ecosystem of plugins, agents, skills, hooks, and configurations for Claude Code, GitHub Copilot CLI, Cursor, Gemini, and Qwen.

## Project Overview

**Type:** Configuration ecosystem and plugin marketplace
**Primary Framework:** Claude Code (CLI for Claude AI assistant)
**Version:** v1.1.0
**License:** MIT
**Size:** ~5.3MB (433 markdown files, 110+ code files)

### Technology Stack

**Languages:**
- TypeScript/JavaScript (110 code files)
- Python 3.13+ (scripting, hooks, automation)
- Shell/Bash (CLI tooling, automation)
- YAML (configuration, CI/CD)
- JSON (configuration, metadata)
- Markdown (433 documentation files)

**Frameworks & Tools:**
- Claude Code - Main framework
- MCP (Model Context Protocol) - Extensible tool integration
- Biome, Ruff, Prettier - Code formatters
- Git/GitHub - Version control, CI/CD
- Bun/uv - Package managers

## Repository Structure

```
claude-config/
├── claude/                     # Main config pack (3.3MB)
│   ├── agents/                # 18 specialized agents
│   │   ├── bash-pro.md        # Advanced bash scripting agent
│   │   ├── python-pro.md      # Python development expert
│   │   ├── rust-pro.md        # Rust development specialist
│   │   ├── code-simplifier.md # Code refactoring agent
│   │   └── context-manager.md # Context optimization agent
│   ├── skills/                # 59 reusable skills
│   │   ├── linter-autofix/    # Auto-fix linting errors
│   │   ├── code-search/       # Advanced code search
│   │   ├── json-repair/       # JSON validation and repair
│   │   └── ast-grep-search/   # AST-based code search
│   ├── hooks/                 # Auto-running hooks
│   │   ├── post-edit-format.py         # Auto-format on edits
│   │   ├── enforce_rg_over_grep.py     # Policy enforcement
│   │   ├── context_protector.py        # Context management
│   │   └── load-mcp-skills.sh          # MCP initialization
│   ├── rules/                 # Development standards
│   │   ├── security-rules.md  # Security best practices
│   │   ├── git-rules.md       # Git workflow standards
│   │   └── testing-rules.md   # Testing guidelines
│   ├── docs/                  # 20+ reference docs
│   │   ├── AGENTS.md          # Agent orchestration
│   │   ├── toon.md            # Token-optimized format
│   │   ├── lsp-tools-integration.md # LSP integration
│   │   └── prompt-caching.md  # Caching strategies
│   ├── commands/              # Command macros
│   ├── mcp/                   # MCP server configs
│   ├── scripts/               # Utility scripts
│   └── settings.json          # Permissions, env config
│
├── plugins/                    # Plugin marketplace (1.9MB)
│   ├── coding-assistant/      # Code review, debug, refactor
│   ├── conserve/              # Context/token optimization
│   ├── prompt-improver/       # Prompt clarity enhancement
│   ├── config-wizard/         # Plugin creation wizard
│   ├── dependency-blocker/    # Block dependency directories
│   ├── block-dotfiles/        # Security: block dotfiles
│   ├── gemini-delegation/     # Delegate to Gemini
│   └── skill-authoring/       # Skill creation framework
│
├── gemini/                     # Gemini AI config (59KB)
│   ├── skills/                # Code reviewer, PR creator
│   └── settings.json          # Gemini-specific settings
│
├── cursor/                     # Cursor editor config (31KB)
│   ├── rules/base.md          # Cursor rules
│   └── mcp.json               # MCP settings
│
├── copilot-cli/               # GitHub Copilot CLI config
├── qwen/                      # Qwen prompt templates
├── opencode/                  # OpenCode references
├── examples/                  # Usage examples
├── prompts/                   # Reusable prompts
│
├── .claude-plugin/            # Marketplace definition
│   └── marketplace.json       # Plugin registry
│
├── .github/workflows/         # CI/CD automation
│   ├── claudelint.yml         # CLAUDE.md validation
│   ├── ruff.yml               # Python linting
│   ├── claude-code-review.yml # Automated reviews
│   └── jules-*.yml            # Automated improvements
│
├── README.md                  # Marketplace guide
├── SETUP.md                   # Installation instructions
├── CHANGELOG.md               # Version history
├── pyproject.toml             # Python dependencies
├── tsconfig.json              # TypeScript config
└── .editorconfig              # Code style rules
```

## Development Workflows

### Setup and Installation

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/Ven0m0/claude-config.git

# Install as marketplace
/plugin marketplace add Ven0m0/claude-config

# Or install specific plugins
/plugin install coding-assistant@claude-config-marketplace
```

**Configuration:**
- Copy/symlink `claude/` to `~/.claude/` or project `.claude/`
- Set environment variables in CLAUDE_ENV_FILE
- Configure settings.json for permissions and model preferences

### Build and Test

**Python:**
```bash
# Lint with ruff
ruff check .

# Format with ruff
ruff format .

# Run tests (in plugin directories)
make test
```

**JavaScript/TypeScript:**
```bash
# Format with Biome
biome format --write .

# Check with Biome
biome check .
```

**Validation:**
```bash
# Validate CLAUDE.md files
claudelint --check CLAUDE.md

# Validate shell scripts
shellcheck scripts/*.sh

# Validate YAML
yamllint .github/workflows/*.yml
```

### Deployment and CI/CD

**GitHub Workflows (Automated):**
- `claudelint.yml` - Validates CLAUDE.md files
- `ruff.yml` - Python linting
- `claude.yml` - Claude Code analysis
- `claude-code-review.yml` - Automated code reviews
- `jules-weekly-cleanup.yml` - Automated cleanup
- `jules-bug-fixer.yml` - Auto-fix bugs
- `jules-ci-failure-fix.yml` - Fix CI failures
- `jules-performance-improver.yml` - Performance optimization

**Manual Deployment:**
```bash
# Run setup script
./setup.sh

# Run cleanup
./cleanup.sh

# Test parsing
./test_parsing.sh
```

### Common Development Tasks

**Create a New Skill:**
```bash
# Use config wizard
/skill config-wizard

# Or use skill authoring plugin
/plugin install skill-authoring@claude-config-marketplace
/skill create-skill
```

**Add a New Agent:**
1. Create `claude/agents/agent-name.md`
2. Follow agent template format
3. Add to AGENTS.md orchestration
4. Test with `/agent agent-name`

**Add a New Hook:**
1. Create hook script in `claude/hooks/`
2. Add hook configuration to `settings.json`
3. Test hook behavior
4. Document in `claude/docs/hooks.md`

**Update Documentation:**
1. Edit relevant `.md` file
2. Follow progressive disclosure pattern
3. Validate with markdownlint
4. Check CLAUDE.md with claudelint

## Conventions

### Naming Conventions

**Files and Directories:**
- Skills: `hyphenated-names` (e.g., `code-review`, `linter-autofix`)
- Agents: `hyphenated-names` (e.g., `bash-pro`, `context-manager`)
- Plugins: `hyphenated-names` (e.g., `coding-assistant`)
- Python: `snake_case.py`
- Config/Docs: `kebab-case.md`

**Code:**
- JavaScript/TypeScript functions: `camelCase`
- Python functions: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`

### Code Style

**From .editorconfig:**
- Indentation: 2 spaces (JS/TS/YAML), 4 spaces (Python)
- Line length: 120 characters max
- Encoding: UTF-8
- Line endings: LF (Unix)
- Trailing whitespace: Remove

**Code Standards (claude/docs/AGENTS.md):**
- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Ain't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **Fail Fast** - Validate inputs early
- **No Emojis** - Never in code, comments, commits, docs
- **Error Handling** - Meaningful, actionable messages
- **Max File Size** - 200-400 lines typical, 800 max

### Tool Preferences

**CRITICAL - Always use these tools in order of preference:**

**File Search:**
1. `fd` (fast find alternative)
2. `find` (fallback)

**Text Search:**
1. `rg` (ripgrep - MANDATORY for code search)
2. Never use `grep` - enforced by hook

**Code Structure:**
1. `ast-grep` - Pattern-based AST search
2. LSP tools - For symbol navigation (MANDATORY)

**File Listing:**
1. `eza` - Modern ls alternative
2. `ls` (fallback)

**Data Manipulation:**
1. `jq` - JSON processing
2. `yq` - YAML processing

**LSP Enforcement (CRITICAL):**
- MUST use LSP for code navigation before edits
- NEVER use text search for finding symbols
- Use `go-to-definition`, `find-references`, `find-implementations`
- Validate with LSP before making changes

### Git Conventions

**Commit Messages:**
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Max length: 72 characters for subject
- Body: Explain WHY, not WHAT

**Branch Names:**
- Feature: `feature/description`
- Bug fix: `fix/description`
- Docs: `docs/description`
- Claude sessions: `claude/*` (auto-generated)

**Pull Requests:**
- Use descriptive titles
- Include test plan
- Link related issues
- Use `gh pr create` for automation

## Dependencies

### Python (pyproject.toml)

**Core:**
- Python 3.13+
- claudelint - CLAUDE.md validation
- ruff - Fast linting and formatting
- uv - Fast package manager

**Development:**
- pytest - Testing framework
- pytest-cov - Coverage reporting

### JavaScript/TypeScript

**Core:**
- TypeScript 5.0+ - Type checking
- Biome - Fast formatter and linter
- Bun - JavaScript runtime

**Configuration:**
- tsconfig.json - Strict mode, React JSX, ES2020+

### System Tools

**Required:**
- git - Version control
- gh - GitHub CLI
- rg (ripgrep) - Text search
- fd - File search
- jq - JSON processing

**Optional:**
- eza - Better ls
- ast-grep - AST-based search
- shellcheck - Bash linting
- yamllint - YAML validation

## Key Features

### Plugin System

**Architecture:**
- Installable plugins with skills and hooks
- Skill-based architecture for reusability
- MCP integration for extensible tools
- Automated code formatting
- Version management and dependency tracking

**Installation Methods:**
1. Marketplace: `/plugin marketplace add Ven0m0/claude-config`
2. Individual: `/plugin install plugin-name@marketplace-name`
3. Local: Clone and configure as local marketplace

### Specialized Agents (18 Total)

**Code Experts:**
- `bash-pro` - Advanced bash scripting
- `python-pro` - Python development
- `typescript-pro` - TypeScript development
- `rust-pro` - Rust development
- `javascript-pro` - JavaScript development

**Task Automation:**
- `code-simplifier` - Refactoring and simplification
- `janitor` - Cleanup and maintenance
- `merge-supervisor` - Merge conflict resolution

**Optimization:**
- `llm-boost` - LLM performance optimization
- `dx-optimizer` - Developer experience improvement
- `turbo` - Maximum speed execution

**Analysis:**
- `reverse-engineer` - Code analysis and understanding
- `code-explorer` - Codebase navigation

**Management:**
- `context-manager` - Context optimization
- `mcp-expert` - MCP integration specialist

**Documentation:**
- `prd` - Product requirements documentation

### Specialized Skills (59 Total)

**Code Quality:**
- `linter-autofix` - Auto-fix linting errors
- `json-repair` - JSON validation and repair
- `code-antipatterns-analysis` - Detect antipatterns

**Search:**
- `ast-grep-search` - AST-based code search
- `git-cli-agentic` - Advanced git operations
- `mgrep-code-search` - Multi-pattern search

**Optimization:**
- `bash-optimizer` - Optimize bash scripts
- `llm-boost` - LLM performance tuning
- `token-conservation` - Reduce token usage

**Data:**
- `data-formats` - Format conversion
- `image-optimization` - Image compression
- `toon-formatter` - TOON format conversion

**Tools:**
- `mcp-builder` - Build MCP servers
- `mcp-to-skill-converter` - Convert MCP to skills
- `mcp-tools-as-code` - MCP as code

**Workflows:**
- Git operations, markdown management, test execution

### Security Features

**Block Dotfiles Plugin:**
- Prevents access to `.ssh`, `.aws`, `.env`, credentials
- Protects sensitive configuration files

**Dependency Blocker:**
- Blocks `node_modules`, `dist`, `build`, `vendor`, `.venv`
- Reduces context pollution
- Speeds up operations

**Context Protection:**
- Safeguards sensitive information
- Prevents accidental exposure
- Enforces security policies

**LSP Enforcement:**
- Mandatory code inspection before edits
- Prevents blind text-based modifications
- Ensures type safety

## Token Optimization

### TOON Format

**Token-Optimized Object Notation:**
- 31% token reduction vs JSON
- Compact representation for data
- Supported by `toon-formatter` skill
- Used for large datasets in prompts

**Example:**
```toon
user:1|John Doe|john@example.com|active
user:2|Jane Smith|jane@example.com|active
```

### Maximum Effective Context Window (MECW)

**Principles:**
- Progressive disclosure - Load only what's needed
- Skill-based architecture - Reference, don't duplicate
- Context protection - Guard against bloat
- Strategic caching - Reuse expensive computations

**Configuration:**
- Main Model: `opusplan` (Claude Opus for extended thinking)
- Thinking Tokens: 16,000 max
- Output Tokens: 63,999 max
- MCP Output: 25,000 tokens max

## Testing and Quality Assurance

### Test Framework

**Python Tests:**
- pytest framework
- 10+ test files in `plugins/conserve/tests/`
- Unit tests: `test_safe_replacer.py`, `test_context_optimizer.py`

**Test Execution:**
```bash
# Run all tests
make test

# Run specific test
pytest tests/test_file.py

# Run with coverage
pytest --cov=. tests/
```

### Code Quality Tools

**Linting:**
- `claudelint` - CLAUDE.md validation
- `ruff` - Python linting (fast)
- `biome` - JS/TS linting
- `shellcheck` - Bash validation
- `yamllint` - YAML validation
- `markdownlint` - Markdown style

**Formatting:**
- `ruff format` - Python auto-formatting
- `biome format` - JS/TS auto-formatting
- `prettier` - Fallback formatter
- Auto-format hooks on file edits

### CI/CD Integration

**Automated Checks:**
- Lint all CLAUDE.md files
- Python code quality (ruff)
- Code review automation
- Bug detection and fixing
- Performance analysis
- Dependency updates (Dependabot)

**Quality Gates:**
- All tests must pass
- Linting must succeed
- No security vulnerabilities
- Documentation must be current

## Common Tasks Reference

### Daily Development

**Start a Session:**
```bash
# Load MCP skills automatically (via session-start hook)
# Context protection enabled
# Auto-format on file edits enabled
```

**Search Code:**
```bash
# Use rg, not grep (enforced by hook)
rg "pattern" --type python

# Use ast-grep for structural search
ast-grep --pattern 'function $NAME() { $$$ }'

# Use LSP for symbol navigation
# (via editor integration)
```

**Fix Linting Issues:**
```bash
# Python - auto-fix with ruff
ruff check --fix .

# JS/TS - auto-fix with biome
biome check --apply .

# Or use linter-autofix skill
/skill linter-autofix
```

### Plugin Development

**Create Plugin:**
```bash
# Use config wizard
/skill config-wizard

# Follow prompts to create:
# - plugin.json (metadata)
# - README.md (documentation)
# - SKILL.md (skill docs)
# - Hook scripts (if needed)
```

**Test Plugin:**
```bash
# Install locally
/plugin install /path/to/plugin

# Test skill execution
/skill your-skill-name

# Uninstall
/plugin uninstall plugin-name
```

**Publish Plugin:**
1. Add to `.claude-plugin/marketplace.json`
2. Create PR to marketplace repository
3. Update version in `plugin.json`
4. Document in CHANGELOG.md

### Documentation Maintenance

**Update CLAUDE.md:**
```bash
# Edit file
vim CLAUDE.md

# Validate
claudelint --check CLAUDE.md

# Commit
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md"
```

**Update AGENTS.md:**
```bash
# Edit this file
vim AGENTS.md

# Check markdown style
markdownlint AGENTS.md

# Commit
git add AGENTS.md
git commit -m "docs: update agent configuration"
```

**Progressive Disclosure Pattern:**
1. Quick reference (1 page)
2. Implementation guide (2-5 pages)
3. Advanced topics (detailed)
4. Reference documentation (comprehensive)

## Environment Configuration

### Environment Variables

**Core:**
- `CLAUDE_ENV_FILE` - Persistent environment variables
- `CLAUDE_PLUGIN_ROOT` - Hook script resolution
- `CONSERVATION_MODE` - Resource optimization (normal/quick/deep)

**Development:**
- `CLAUDE_DEBUG` - Enable debug logging
- `CLAUDE_LOG_LEVEL` - Logging verbosity

### Model Configuration (settings.json)

**Main Model:**
```json
{
  "model": "opusplan",
  "maxThinkingTokens": 16000,
  "maxOutputTokens": 63999
}
```

**Subagent Model:**
```json
{
  "subagentModel": "haiku",
  "mcpMaxOutputTokens": 25000
}
```

**Permissions (20 allow rules):**
- Git operations
- File system access
- Network requests (specific domains)
- MCP server spawning
- Hook execution

## Additional Resources

### Documentation

**Core Guides:**
- `claude/docs/AGENTS.md` - Agent orchestration
- `claude/docs/prompt-best-practices.md` - Prompt patterns
- `claude/docs/lsp-tools-integration.md` - LSP integration
- `claude/docs/claude-md-guide.md` - CLAUDE.md authoring

**References:**
- `claude/docs/skills-ref.md` - All skills index
- `claude/docs/toon.md` - TOON format spec
- `claude/docs/prompt-caching.md` - Caching strategies
- `claude/docs/progressive-disclosure.md` - Content architecture

### Community

**Repository:** https://github.com/Ven0m0/claude-config
**Issues:** https://github.com/Ven0m0/claude-config/issues
**Discussions:** https://github.com/Ven0m0/claude-config/discussions

### Version History

**Current:** v1.1.0
**See:** CHANGELOG.md for full history

---

**Last Updated:** 2026-02-13
**Repository Size:** ~5.3MB
**Total Commits:** 82+
**Active Development:** Yes

This configuration ecosystem is production-ready and actively maintained with emphasis on token efficiency, code quality, security, and automation.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

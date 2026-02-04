# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-04

### Added (claude/ config pack release readiness)

- **Documentation:** [claude/README.md](claude/README.md) now includes how to use the config pack, key docs (progressive-disclosure, prompt-caching, prompt-best-practices, skills-guide, skills-ref, tools-reference, toon), agent/skill optimization table, and token reduction/TOON-ZON section. [SETUP.md](SETUP.md) updated with "Using the claude/ config pack" and correct plugin list (technical-writer/data-analyst removed from install examples).
- **Workflows:** Added [claude/workflows/migrate-opus.md](claude/workflows/migrate-opus.md) and [claude/workflows/setup-enforcement.md](claude/workflows/setup-enforcement.md) stubs for claudemd agent.
- **Validation:** Added [claude/scripts/check-release.sh](claude/scripts/check-release.sh) to verify required files, in-scope docs, and in-scope skills before release.
- **Wiring:** AGENTS.md "Workflow and doc optimization" expanded with skill-optimizer, llm-docs-optimizer, manage-markdown-docs, modern-tool-substitution, hooks-configuration, ref-toon-format/use-toon, validate-toon, token-and-context-optimization. skills-guide.md, skills-ref.md, tools-reference.md, toon.md, and hooks.md updated with in-repo pointers and CLAUDE_PLUGIN_ROOT notes.
- **Token and context:** Added [claude/docs/token-and-context-optimization.md](claude/docs/token-and-context-optimization.md); linked from README key docs and AGENTS.md.

### Changed

- **Marketplace:** Removed technical-writer and data-analyst from [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) (plugins not present in repo). SETUP.md and README install examples use only existing plugins; SETUP.md Technical Writer and Data Analyst plugin requirements sections removed.
- **Legacy:** [claude/reference_legacy_config.md](claude/reference_legacy_config.md) prompts/templates section now points to claude/docs and AGENTS.md instead of technical-writer/data-analyst.
- **Claudemd:** [claude/agents/claudemd.md](claude/agents/claudemd.md) references `scripts/analyze-claude-md.ts` and documents CLAUDE_PLUGIN_ROOT resolution for config-pack usage.
- **Hooks:** [claude/docs/hooks.md](claude/docs/hooks.md) documents CLAUDE_PLUGIN_ROOT/PLUGIN_DIR for config pack usage.

## [1.0.0] - 2026-01-21

### Added

#### Marketplace

- Created `.claude-plugin/marketplace.json` with proper marketplace structure
- Added three professional plugins: coding-assistant, technical-writer, and data-analyst
- Marketplace now installable via `/plugin marketplace add Ven0m0/claude-config`

#### Coding Assistant Plugin (v1.0.0)

- **Skills:**
  - `/code-review` - Comprehensive code reviews with security, performance, and quality checks
  - `/debug` - Systematic debugging and root cause analysis
  - `/refactor` - Code refactoring for better structure and maintainability
- **Features:**
  - Automatic code formatting hook (Prettier, Black, gofmt, rustfmt)
  - Security vulnerability detection
  - Performance optimization suggestions
  - Code review template

#### Technical Writer Plugin (v1.0.0)

- **Skills:**
  - `/api-docs` - Generate comprehensive API documentation with multi-language examples
  - `/user-guide` - Create detailed user guides and tutorials
- **Features:**
  - API documentation template with cURL, Python, and JavaScript examples
  - Step-by-step tutorial generation
  - Standardized documentation structure

#### Data Analyst Plugin (v1.0.0)

- **Skills:**
  - `/analyze-data` - Exploratory data analysis with statistical insights
  - `/visualize-data` - Create effective data visualizations
- **Features:**
  - Optional SQLite MCP server for database analysis
  - Support for matplotlib, seaborn, and Plotly
  - Descriptive statistics and correlation analysis
  - Data quality assessment

#### Documentation

- Updated README.md for Claude Code marketplace structure
- Added plugin-specific README files for each plugin
- Added comprehensive SETUP.md guide
- Documented all skills with detailed instructions and examples

### Changed

- Repository restructured from generic Claude config to Claude Code marketplace
- Converted prompts to Claude Code skills
- Updated documentation to focus on Claude Code plugins

### Maintained

- Legacy `.claude/` directory kept for backward compatibility
- Original templates preserved in plugins as supporting files

## [0.1.0] - 2026-01-20

### Added

- Initial repository structure with `.claude/` directory
- Basic prompts for coding assistant, technical writer, and data analyst
- Configuration templates
- API documentation template
- Code review template

______________________________________________________________________

## Version History

- **1.1.0** - Claude config pack (claude/) release readiness: docs, workflows, check-release script, skill/agent wiring
- **1.0.0** - Full Claude Code marketplace with plugins and skills
- **0.1.0** - Initial configuration-based repository

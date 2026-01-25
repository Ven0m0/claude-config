# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **1.0.0** - Full Claude Code marketplace with plugins and skills
- **0.1.0** - Initial configuration-based repository

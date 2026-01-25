# Claude Code Plugin Marketplace

A curated collection of Claude Code plugins, skills, and tools for enhanced productivity. This marketplace provides professional-grade plugins for coding, documentation, and data analysis workflows.

## 🚀 Quick Start

### Installing the Marketplace

Add this marketplace to your Claude Code installation:

```bash
/plugin marketplace add Ven0m0/claude-config
```

### Installing Plugins

Install individual plugins from the marketplace:

```bash
# Install coding assistant
/plugin install coding-assistant@claude-config-marketplace

# Install prompt improver
/plugin install prompt-improver@claude-config-marketplace

# Install conserve
/plugin install conserve@claude-config-marketplace

# Install config wizard
/plugin install config-wizard@claude-config-marketplace

# Install dependency blocker
/plugin install dependency-blocker@claude-config-marketplace

# Install block dotfiles
/plugin install block-dotfiles@claude-config-marketplace

# Install gemini delegation
/plugin install gemini-delegation@claude-config-marketplace
```

Or install all plugins at once:

```bash
/plugin install coding-assistant prompt-improver conserve config-wizard dependency-blocker block-dotfiles gemini-delegation @claude-config-marketplace
```

## 📦 Available Plugins

### 🔧 Coding Assistant

Advanced coding assistant with code review, debugging, and refactoring capabilities.

**Skills:**
- `/code-review` - Comprehensive code reviews with security and performance checks
- `/debug` - Systematic debugging and root cause analysis
- `/refactor` - Code refactoring for better structure and maintainability

**Features:**
- Automatic code formatting after edits (Biome, ruff, gofmt, rustfmt)
- Security vulnerability detection
- Performance optimization suggestions
- Best practices guidance

[View Plugin Documentation](./plugins/coding-assistant/README.md)

### ⚡ Conserve

Resource optimization and performance monitoring toolkit for efficient Claude Code workflows.

**Commands:**
- `/bloat-scan` - Identify dead code, duplication, and documentation bloat
- `/optimize-context` - Optimize context usage and token efficiency
- `/analyze-growth` - Analyze codebase growth patterns
- `/ai-hygiene-audit` - Audit AI-generated code quality
- `/unbloat` - Remove unnecessary code and improve efficiency

**Features:**
- Maximum Effective Context Window (MECW) principle
- MCP patterns for efficient data processing
- Progressive loading for reduced session footprint
- Token usage optimization
- Dead code detection and remediation

**Author:** Alex Thola ([athola](https://github.com/athola))

[View Plugin Documentation](./plugins/conserve/README.md)

### 💡 Prompt Improver

Intelligent prompt optimization using skill-based architecture. Enriches vague prompts with research-based clarifying questions before Claude Code executes them.

**Features:**
- Automatic prompt clarity evaluation
- Research-based clarifying questions (1-6 questions)
- Zero overhead for clear prompts
- 31% token reduction through skill-based architecture
- Uses AskUserQuestion tool for targeted clarification

**Author:** [severity1](https://github.com/severity1)

[View Plugin Documentation](./plugins/prompt-improver/README.md)

### 🔒 Block Dotfiles

Security plugin that blocks access to sensitive dotfiles and configuration files containing credentials.

**Features:**
- Blocks access to shell configuration files (.bashrc, .zshrc, etc.)
- Blocks access to environment variable files (.env, .env.local, etc.)
- Blocks access to credential directories (.ssh, .aws, .docker, .kube, etc.)
- Blocks access to credential files (.npmrc, .pypirc, .gitconfig, .netrc)
- Comprehensive test suite with 104 tests

**Author:** wombat9000

[View Plugin Documentation](./plugins/block-dotfiles/README.md)

### 🧙 Config Wizard

Interactive wizard to help create new Claude Code plugins.

**Commands:**
- `/config-wizard:cmd-init` - Initialize a new slash command
- `/config-wizard:cmd-review` - Review an existing slash command

**Skills:**
- `designing-claude-skills` - Guide for creating, reviewing, and improving skills
- `managing-permissions` - Guide for configuring Claude Code permissions

**Author:** wombat9000

[View Plugin Documentation](./plugins/config-wizard/README.md)

### 🚫 Dependency Blocker

Performance plugin that prevents Claude from accessing dependency directories to save tokens.

**Features:**
- Blocks access to `node_modules`, `.git`, `dist`, `build`, `vendor`, `target`, `.venv`, and `venv`
- Blocks Bash commands targeting excluded directories
- Blocks Read operations from excluded directories
- Blocks Glob patterns targeting excluded directories
- Blocks Grep searches in excluded directories

**Author:** wombat9000

[View Plugin Documentation](./plugins/dependency-blocker/README.md)

### 🤖 Gemini Delegation

Delegate research and web search tasks to Gemini AI via CLI.

**Features:**
- Delegate web research to Gemini AI
- Session context integration
- CLI-based task delegation

**Author:** wombat9000

[View Plugin Documentation](./plugins/gemini-delegation/README.md)

## 📁 Repository Structure

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace catalog
├── .gemini/                    # Gemini Code Assist config
├── claude/                     # Claude Code config and tools
├── gemini/                     # Gemini CLI config
├── copilot-cli/                # Copilot CLI templates
├── cursor/                     # Cursor rules and templates
├── opencode/                   # OpenCode references
├── qwen/                       # Qwen prompt templates
├── plugins/
│   ├── block-dotfiles/         # Block dotfile access
│   ├── coding-assistant/       # Code review, debug, refactor
│   ├── config-wizard/          # Plugin configuration wizard
│   ├── conserve/               # Context and token optimization
│   ├── dependency-blocker/     # Block dependency directories
│   ├── gemini-delegation/      # Gemini CLI delegation
│   └── prompt-improver/        # Prompt clarity improvements
├── examples/                   # Usage examples
├── LLM_CONFIG_STANDARDS.md     # Shared config defaults
├── README.md                   # This file
├── SETUP.md                    # Setup guide
├── CHANGELOG.md                # Version history
└── LICENSE
```

## 🎯 Usage Examples

### Code Review Workflow

```bash
# Review a file or directory
/code-review src/components/UserProfile.tsx

# Review with specific focus
/code-review --focus security src/api/
```

### Context Optimization

```bash
# Scan for bloat signals
/bloat-scan

# Reduce context usage
/optimize-context
```

## 🔧 Requirements

### Global Requirements
- Claude Code CLI (latest version)
- Git

### Plugin-Specific Requirements

**Coding Assistant:**
- Optional formatters: Biome, ruff, gofmt, rustfmt

**Prompt Improver:**
- Claude Code 2.0.22+ (AskUserQuestion tool)

## 🎨 Features

### Plugin System
- Modular plugin architecture
- Easy installation and updates
- Version management

### Skills
- User-invocable commands via `/skill-name`
- Context-aware assistance
- Specialized tools for each domain

### Hooks
- Automatic code formatting
- Post-edit validations
- Custom workflows

### MCP Servers
- SQLite database integration
- Extensible server architecture

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [Plugin Documentation](./plugins/) - Individual plugin documentation
- [Examples](./examples/) - Usage examples and tutorials
- [Changelog](./CHANGELOG.md) - Version history and updates

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new plugins
- Improve existing skills
- Create additional templates
- Report issues or suggest features

## 🔒 Security

- Never commit API keys or sensitive data
- Use environment variables for credentials
- Review the code before installing plugins
- Report security issues privately

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## 🔗 Links

- [Claude Code Documentation](https://code.claude.com/docs)
- [Plugin Development Guide](https://code.claude.com/docs/en/plugins.md)
- [MCP Documentation](https://code.claude.com/docs/en/mcp.md)
- [Skills Guide](https://code.claude.com/docs/en/skills.md)

## 🙋 Support

For issues or questions:
- Open an issue on GitHub
- Check the [Setup Guide](./SETUP.md)
- Review individual plugin documentation

---

**Happy coding with Claude! 🚀**

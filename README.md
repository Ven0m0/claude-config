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

# Install technical writer
/plugin install technical-writer@claude-config-marketplace

# Install data analyst
/plugin install data-analyst@claude-config-marketplace
```

Or install all plugins at once:

```bash
/plugin install coding-assistant technical-writer data-analyst @claude-config-marketplace
```

## 📦 Available Plugins

### 🔧 Coding Assistant

Advanced coding assistant with code review, debugging, and refactoring capabilities.

**Skills:**
- `/code-review` - Comprehensive code reviews with security and performance checks
- `/debug` - Systematic debugging and root cause analysis
- `/refactor` - Code refactoring for better structure and maintainability

**Features:**
- Automatic code formatting after edits (Prettier, Black, gofmt, rustfmt)
- Security vulnerability detection
- Performance optimization suggestions
- Best practices guidance

[View Plugin Documentation](./plugins/coding-assistant/README.md)

### 📝 Technical Writer

Professional technical documentation and API documentation writer.

**Skills:**
- `/api-docs` - Generate comprehensive API documentation with multi-language examples
- `/user-guide` - Create detailed user guides and tutorials

**Features:**
- Standardized API documentation templates
- Multi-language code examples (cURL, Python, JavaScript)
- Step-by-step tutorial generation
- Industry-standard documentation practices

[View Plugin Documentation](./plugins/technical-writer/README.md)

### 📊 Data Analyst

Comprehensive data analysis and visualization assistant.

**Skills:**
- `/analyze-data` - Exploratory data analysis with statistical insights
- `/visualize-data` - Create effective data visualizations

**Features:**
- Descriptive statistics and pattern identification
- Data quality assessment
- Correlation analysis
- matplotlib, seaborn, and Plotly visualizations
- Optional SQLite MCP server for database analysis

[View Plugin Documentation](./plugins/data-analyst/README.md)

## 📁 Repository Structure

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace catalog
├── plugins/
│   ├── coding-assistant/       # Code review, debug, refactor
│   ├── technical-writer/       # API docs, user guides
│   └── data-analyst/           # Data analysis and visualization
├── .claude/                    # Legacy configuration files
├── examples/                   # Usage examples
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

### API Documentation

```bash
# Document an endpoint
/api-docs POST /api/v1/users

# Generate docs from OpenAPI spec
/api-docs openapi.yaml
```

### Data Analysis

```bash
# Analyze a dataset
/analyze-data sales_data.csv

# Create visualizations
/visualize-data data.csv --type scatter
```

## 🔧 Requirements

### Global Requirements
- Claude Code CLI (latest version)
- Git

### Plugin-Specific Requirements

**Coding Assistant:**
- Optional formatters: Prettier, Black, autopep8, gofmt, rustfmt

**Technical Writer:**
- No additional requirements

**Data Analyst:**
- Python 3.8+
- pandas, numpy, matplotlib, seaborn
- Optional: SQLite MCP server (`uvx mcp-server-sqlite`)

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
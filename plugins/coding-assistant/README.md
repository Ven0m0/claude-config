# Coding Assistant Plugin

Advanced coding assistant with code review, refactoring, debugging, and best practices guidance.

## Features

### Skills

- **`/code-review`**: Perform comprehensive code reviews with security, performance, and quality checks
- **`/debug`**: Debug code issues, trace errors, and identify root causes systematically
- **`/refactor`**: Refactor code to improve structure, readability, and maintainability

### Hooks

This plugin includes automatic code formatting after edits:

- **PostToolUse**: Automatically formats code files after Write/Edit operations
- Supports: JavaScript/TypeScript (Biome), Python (ruff), Go (gofmt), Rust (rustfmt)

## Usage Examples

### Code Review

```bash
/code-review src/components/UserProfile.tsx
```

### Debug Issues

```json
/debug "TypeError: Cannot read property 'map' of undefined in UserList component"
```

### Refactor Code

```bash
/refactor src/utils/dataProcessing.js
```

## Hook Configuration

The auto-format hook runs after every Write or Edit operation. To use it:

1. Install the appropriate formatter for your language:

   - JavaScript/TypeScript: `npm install -g @biomejs/biome`
   - Python: `pip install uv` (ruff auto-installs via uvx) or `pip install ruff`
   - Go: Included with Go installation
   - Rust: `rustup component add rustfmt`

1. The hook will automatically format files when you edit them

1. To disable the hook, remove or comment out the `hooks` field in `.claude-plugin/plugin.json`

## Requirements

### For Code Review and Refactoring

- No special requirements - uses Claude's built-in tools

### For Auto-formatting (optional)

- **JavaScript/TypeScript**: Biome (`npm install -g @biomejs/biome`)
- **Python**: ruff (`pip install uv` or `pip install ruff`)
- **Go**: gofmt (comes with Go)
- **Rust**: rustfmt (`rustup component add rustfmt`)

## Tips

- Use `/code-review` before merging pull requests
- Use `/debug` when you encounter errors or unexpected behavior
- Use `/refactor` to clean up code without changing functionality
- The auto-format hook ensures consistent code style across your project

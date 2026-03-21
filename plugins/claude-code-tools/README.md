# Claude Code Tools

Rich toolset plugin for Claude Code featuring tmux bridge, session search, Google Docs/Sheets integration, and hook utilities.

## Overview

This plugin provides a collection of practical tools that extend Claude Code's capabilities:

- **Tmux Bridge**: Seamless tmux session integration
- **Session Search**: Search and recall previous Claude Code sessions
- **Google Docs/Sheets**: Read and write Google Documents and Spreadsheets
- **Hook Utilities**: Reusable hook patterns for common workflows

## Features

### Tmux Integration

Manage Claude Code sessions within tmux for better session persistence and multiplexing.

### Session Management

Search through session history and resume previous conversations.

### Google Workspace Integration

Read from and write to Google Docs and Sheets directly from Claude Code.

### Reusable Hooks

Collection of hook utilities for common development workflows.

## Installation

```shell
claude plugin marketplace add pchalasani/claude-code-tools
claude plugin install claude-code-tools
```

## Configuration

Create `~/.claude/config/claude-code-tools.json`:

```json
{
  "tmux": {
    "enabled": true,
    "session_prefix": "claude-"
  },
  "session_search": {
    "enabled": true,
    "max_results": 10
  },
  "google": {
    "enabled": false,
    "credentials_path": "~/.claude/credentials/google.json"
  }
}
```

## Usage

### Tmux Commands

```
/tmux new-session
/tmux list-sessions
/tmux attach <session-name>
```

### Session Search

```
/search-sessions <query>
/session-history
```

## License

MIT

## Links

- Repository: https://github.com/pchalasani/claude-code-tools
- Marketplace: https://claude-plugins.dev

# Claude Code Permissions Guide

Configure what Claude can and cannot do through the permission system.

## Permission Scopes

Permissions are evaluated in order of precedence:

1. **Managed** (highest) - Enterprise-deployed, cannot be overridden
2. **Local** - `.claude/settings.local.json` (personal, not committed)
3. **Project** - `.claude/settings.json` (shared with team)
4. **User** (lowest) - `~/.claude/settings.json`

## Permission Structure

```json
{
  "permissions": {
    "deny": ["Tool(pattern)", ...],
    "ask": ["Tool(pattern)", ...],
    "allow": ["Tool(pattern)", ...],
    "defaultMode": "acceptEdits"
  }
}
```

## Evaluation Order

1. **Deny** rules checked first - blocks matching tools
2. **Ask** rules checked second - prompts for confirmation
3. **Allow** rules checked last - auto-approves matching tools

## Pattern Syntax

### Match All Uses

```json
"Bash"       // All bash commands
"Read"       // All file reads
"WebFetch"   // All web fetches
```

### Specific Commands

```json
"Bash(git commit *)"     // git commit with any args
"Bash(npm run build)"    // exact command
"Read(./.env)"           // specific file
```

### Wildcard Patterns

```json
"Bash(git *)"            // Any git command
"Bash(npm run *)"        // Any npm script
"Read(./src/**)"         // Any file in src/
"WebFetch(domain:*.com)" // Any .com domain
```

### Important Notes

- Space before `*` matters: `ls *` matches `ls -la` but not `lsof`
- Glob patterns: `**` matches any directory depth
- Domain patterns: Use `domain:` prefix for WebFetch

## Tool-Specific Patterns

### Bash

```json
{
  "allow": [
    "Bash(git:*)",       // All git commands
    "Bash(npm run *)",   // npm scripts
    "Bash(uv *)",        // uv package manager
    "Bash(rg *)"         // ripgrep searches
  ],
  "deny": [
    "Bash(rm -rf /)",    // Dangerous deletes
    "Bash(curl * | sh)"  // Piped scripts
  ]
}
```

### Read / Edit

```json
{
  "allow": [
    "Read(./src/**)",
    "Edit(./src/**)"
  ],
  "deny": [
    "Read(.env)",
    "Read(.env.*)",
    "Read(./secrets/**)",
    "Edit(./node_modules/**)"
  ]
}
```

### WebFetch

```json
{
  "allow": [
    "WebFetch(domain:github.com)",
    "WebFetch(domain:docs.anthropic.com)",
    "WebFetch(domain:*.readthedocs.io)"
  ],
  "deny": [
    "WebFetch"  // Block all other domains
  ]
}
```

### NotebookEdit

Completely disable notebook editing:

```json
{
  "deny": ["NotebookEdit"]
}
```

### MCP Tools

```json
{
  "allow": [
    "mcp__github__*",        // All GitHub MCP tools
    "mcp__memory__search"    // Specific memory tool
  ],
  "deny": [
    "mcp__filesystem__*"     // Block filesystem MCP
  ]
}
```

## Permission Modes

Set via `defaultMode`:

| Mode | Behavior |
|------|----------|
| `"acceptEdits"` | Auto-accept file edits, prompt for others |
| `"plan"` | Read-only mode, no modifications |
| `"bypassPermissions"` | Skip all prompts (dangerous) |

## Recommended Configurations

### Development (Balanced)

```json
{
  "permissions": {
    "deny": [
      "NotebookEdit",
      "Read(.env)",
      "Read(.env.*)",
      "Bash(rm -rf *)"
    ],
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(uv *)",
      "Read",
      "Edit",
      "Grep",
      "Glob"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

### Strict Security

```json
{
  "permissions": {
    "deny": [
      "NotebookEdit",
      "WebFetch",
      "Read(.env*)",
      "Read(./secrets/**)",
      "Bash(curl *)",
      "Bash(wget *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(gh pr create *)"
    ],
    "allow": [
      "Read(./src/**)",
      "Edit(./src/**)",
      "Grep",
      "Glob"
    ],
    "defaultMode": "plan"
  }
}
```

### CI/Automation

```json
{
  "permissions": {
    "deny": [
      "NotebookEdit",
      "WebFetch",
      "Read(.env*)"
    ],
    "allow": [
      "Bash(git *)",
      "Bash(npm run lint)",
      "Bash(npm run test)",
      "Read",
      "Edit"
    ]
  }
}
```

## Troubleshooting

### Permission Denied

1. Check deny rules - they take precedence
2. Verify pattern syntax (spaces, wildcards)
3. Check scope precedence (managed > local > project > user)

### Too Many Prompts

1. Add safe commands to `allow` list
2. Use `"defaultMode": "acceptEdits"` for file operations
3. Consider sandbox mode for isolated environments

### Security Audit

Review permissions with:

```bash
claude /permissions
```

Lists all active allow/deny rules with their sources.

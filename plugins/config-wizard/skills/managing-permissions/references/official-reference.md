# Official Claude Code Permissions Reference

Complete technical reference for Claude Code permissions system, consolidated from official documentation.

## Table of Contents

- [Configuration File Hierarchy](#configuration-file-hierarchy)
- [Permission Rule Syntax](#permission-rule-syntax)
- [Available Tools](#available-tools)
- [Pattern Matching Details](#pattern-matching-details)
- [Precedence Rules](#precedence-rules)
- [Complete Configuration Options](#complete-configuration-options)
- [Enterprise Features](#enterprise-features)
- [Known Limitations](#known-limitations)
- [Official Resources](#official-resources)

## Configuration File Hierarchy

Settings are applied in order of precedence (highest to lowest):

1. **Managed settings** (`managed-settings.json`) - Enterprise policies
   - **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
   - **Linux/WSL**: `/etc/claude-code/managed-settings.json`
   - **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

2. **CLI arguments** - Session-specific overrides
   - `--permissions-allow`, `--permissions-deny`, etc.

3. **Local project settings** (`.claude/settings.local.json`)
   - Not committed to version control
   - User-specific project overrides

4. **Shared project settings** (`.claude/settings.json`)
   - Committed to git
   - Shared across team

5. **User global settings** (`~/.claude/settings.json`)
   - Applies to all projects for this user

**Configuration merging:**
- `deny` rules are merged from all levels (union)
- `allow` rules are merged from all levels (union)
- `ask` rules are merged from all levels (union)
- Higher precedence settings override in case of conflicts
- Deny always takes precedence over allow/ask regardless of level

## Permission Rule Syntax

### Basic Format

```
ToolName(pattern)
```

**Components:**
- `ToolName` - The tool to control (Bash, Read, Edit, Write, WebFetch, NotebookEdit)
- `pattern` - The pattern to match (optional for tool-wide rules)

### Tool-Only Rules

Block entire tool without pattern:

```json
{
  "deny": [
    "WebFetch"     // Blocks ALL WebFetch operations
  ]
}
```

Omitting the pattern blocks the entire tool.

### Pattern Rules

Specific patterns for fine-grained control:

```json
{
  "allow": [
    "Bash(git status)",          // Exact command
    "Bash(npm run:*)",           // Prefix with wildcard
    "Read(src/**)",              // Glob pattern
    "Edit(*.txt)"                // File extension glob
  ]
}
```

## Available Tools

### Bash

**Purpose:** Shell command execution

**Pattern type:** Prefix matching

**Examples:**
```json
"Bash(git diff:*)"              // Allows: git diff, git diff file.txt
"Bash(npm run:*)"               // Allows: npm run test, npm run build
"Bash(ls)"                      // Allows: ls, ls -la, ls /tmp
```

**Security note:** Bash patterns can be bypassed with command chaining (`cd /secret && cat file`). Combine with file-level denies for sensitive data.

### Read

**Purpose:** File reading operations

**Pattern type:** Glob matching

**Examples:**
```json
"Read(src/**)"                  // All files in src/ and subdirectories
"Read(*.json)"                  // All JSON files in current directory
"Read(**/.env)"                 // .env in any subdirectory
"Read(~/.aws/**)"               // All files in ~/.aws/
```

### Edit

**Purpose:** File modification operations (edit existing files)

**Pattern type:** Glob matching

**Examples:**
```json
"Edit(src/**/*.js)"             // JavaScript files in src/
"Edit(docs/**/*.md)"            // Markdown files in docs/
"Edit(package.json)"            // Specific file
```

### Write

**Purpose:** File creation and overwriting operations

**Pattern type:** Glob matching

**Examples:**
```json
"Write(dist/**)"                // Allow writing to dist/
"Write(output/*.txt)"           // Allow writing .txt to output/
"Write(build/**)"               // Allow writing to build/
```

**Distinction:**
- **Edit**: Modifying existing files
- **Write**: Creating new files or overwriting

### WebFetch

**Purpose:** HTTP/HTTPS requests to external URLs

**Pattern type:** Currently does not support URL-specific patterns (all or nothing)

**Examples:**
```json
"WebFetch"                      // Allow all HTTP requests
```

To deny:
```json
{
  "deny": ["WebFetch"]          // Block all HTTP requests
}
```

**Limitation:** Cannot currently restrict to specific domains. It's either all or nothing.

### NotebookEdit

**Purpose:** Editing Jupyter notebook (.ipynb) files

**Pattern type:** Glob matching

**Examples:**
```json
"NotebookEdit(notebooks/**)"    // Notebooks in notebooks/ directory
"NotebookEdit(*.ipynb)"         // Any notebook in current directory
"NotebookEdit(data/analysis.ipynb)"  // Specific notebook
```

## Pattern Matching Details

### Bash: Prefix Matching

The pattern must match the **beginning** of the command string.

**Matching behavior:**
```json
Pattern: "Bash(git diff:*)"

Matches:
  ✓ git diff
  ✓ git diff HEAD
  ✓ git diff main..feature
  ✓ git diff --staged file.txt

Does NOT match:
  ✗ cd repo && git diff           # Doesn't start with "git diff"
  ✗ git status                    # Different command
```

**Wildcard:**
- `:*` is optional but recommended for clarity
- `Bash(git diff)` and `Bash(git diff:*)` behave identically
- Both allow `git diff` with any arguments

**Exact match:**
```json
"Bash(git status)"              // Matches "git status" with any arguments
```

**Important:** Prefix matching has security limitations. See [Known Limitations](#known-limitations).

### Files: Glob Pattern Matching

Standard glob syntax used for file paths.

**Glob operators:**

| Operator | Meaning | Example |
|----------|---------|---------|
| `*` | Matches any characters within a single path segment | `*.json` → `package.json`, `tsconfig.json` |
| `**` | Matches zero or more path segments (recursive) | `src/**` → everything under src/ |
| `?` | Matches exactly one character | `file?.txt` → `file1.txt`, `fileA.txt` |
| `[abc]` | Matches one character from the set | `file[123].txt` → `file1.txt`, `file2.txt` |
| `[a-z]` | Matches one character from the range | `data/[0-9]*.csv` → CSV starting with digit |

**Examples:**

```json
"Read(*.json)"                  // package.json, tsconfig.json (current dir only)
"Read(**/*.json)"               // All .json files recursively
"Read(src/**)"                  // Everything under src/
"Read(src/**/test/**)"          // test directories anywhere under src/
"Read(file?.txt)"               // file1.txt, fileA.txt (one char wildcard)
"Read(data/[0-9]*.csv)"         // CSV files starting with digit in data/
```

**Path formats:**
- **Relative**: `./src/file.txt`, `src/file.txt`
- **Absolute**: `/home/user/project/file.txt`
- **Home directory**: `~/.aws/credentials`, `~/Documents/file.txt`

## Precedence Rules

### Rule Priority

When multiple rules could apply:

1. **Deny rules take precedence** over allow and ask
2. **Ask rules take precedence** over allow
3. **Allow rules have lowest precedence**

**Example:**
```json
{
  "permissions": {
    "allow": [
      "Read(src/**)"              // Allow reading all of src/
    ],
    "deny": [
      "Read(src/**/.env)"         // Deny wins: blocks .env even in src/
    ]
  }
}
```

**Result:** All files in `src/` can be read EXCEPT `.env` files.

### Conflict Resolution

```json
{
  "allow": ["Bash(git:*)"],
  "deny": ["Bash(git push:*)"],
  "ask": ["Bash(git commit:*)"]
}
```

**Behavior:**
- `git status` → **Allowed** (matches allow, no deny/ask)
- `git push` → **Denied** (matches both, deny wins)
- `git commit` → **Ask** (matches allow and ask, ask wins over allow)
- `git pull` → **Allowed** (matches allow, no deny/ask)

### Cross-Level Precedence

Deny from ANY level blocks allow from ALL levels:

```json
// User settings (~/.claude/settings.json)
{
  "allow": ["Read(src/**)"]
}

// Project settings (.claude/settings.json)
{
  "deny": ["Read(src/**/.env)"]
}
```

**Result:** Project deny blocks `.env` even though user settings allow `src/**`.

## Complete Configuration Options

### Full settings.json Structure

```json
{
  "permissions": {
    "allow": [
      // List of allowed operations
    ],
    "ask": [
      // List of operations requiring confirmation
    ],
    "deny": [
      // List of blocked operations
    ],
    "disableBypassPermissionsMode": "disable",
    "additionalDirectories": [
      // Additional directories Claude can access
    ]
  },
  "defaultMode": "acceptEdits",
  "enablePluginsByDefault": true,
  "plugins": {
    // Plugin configurations
  }
}
```

### Additional Directories

Allows Claude to access directories outside the project root:

```json
{
  "permissions": {
    "additionalDirectories": [
      "../shared-lib/",           // Sibling directory
      "/opt/company/data/",       // Absolute path
      "~/Documents/specs/"        // Home directory relative
    ]
  }
}
```

**Use case:** Monorepos, shared libraries, centralized documentation.

**Security note:** Be cautious with paths containing sensitive files. Deny rules still apply to these directories.

### Default Mode

Controls how edits are applied:

**Accept edits automatically:**
```json
{
  "defaultMode": "acceptEdits"    // Auto-apply Claude's edits
}
```

**Review edits before applying:**
```json
{
  "defaultMode": "reviewEdits"    // Review edits before applying
}
```

**Note:** This setting controls edit application workflow, not permissions. Permissions are enforced separately.

## Enterprise Features

### Disable Bypass Mode

Prevents users from using `--dangerously-skip-permissions` flag:

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable"
  }
}
```

**Use case:** Enterprise environments where security policies must be enforced.

**Effect:** Users cannot bypass permissions even if they try to use the CLI flag. Commands that would violate permissions are blocked.

### Managed Settings

Enterprise administrators can deploy `managed-settings.json` that takes highest precedence:

**File locations:**
- **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
- **Linux/WSL**: `/etc/claude-code/managed-settings.json`
- **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

**Example managed-settings.json:**
```json
{
  "permissions": {
    "deny": [
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(~/.aws/**)",
      "Read(~/.ssh/**)",
      "Bash(sudo:*)",
      "Bash(rm:*)",
      "WebFetch"
    ],
    "disableBypassPermissionsMode": "disable"
  }
}
```

**Behavior:**
- Users cannot override managed settings with their local configurations
- Managed deny rules block operations regardless of user allow rules
- Provides centralized security policy enforcement

## Known Limitations

### 1. Bash Prefix Matching Can Be Bypassed

**Problem:** Command chaining circumvents prefix matching.

**Example:**
```bash
# Deny rule: "Bash(cat .env:*)"
cd /project && cat .env          # ✓ Bypasses (doesn't start with "cat .env")
find . -name .env -exec cat {} ; # ✓ Bypasses (starts with "find")
python -c "print(open('.env').read())"  # ✓ Bypasses (starts with "python")
```

**Solution:** Use file-level Read denies instead:
```json
{
  "deny": ["Read(./.env)"]       // Blocks ALL reads, regardless of tool
}
```

File-level denies are enforced by Claude Code regardless of which tool or command is used to access the file.

### 2. WebFetch Domain Filtering Not Supported

**Problem:** Cannot restrict WebFetch to specific domains.

**Desired but NOT possible:**
```json
// NOT SUPPORTED:
{
  "allow": ["WebFetch(https://api.github.com/**)"]
}
```

**Current options:**
```json
// Option 1: Block entirely
{
  "deny": ["WebFetch"]           // Block all external requests
}

// Option 2: Allow entirely
{
  "allow": ["WebFetch"]          // Allow all external requests
}

// Option 3: Ask for each request
{
  "ask": ["WebFetch"]            // Prompt user to review each URL
}
```

**Workaround:** Use `ask` to review each request. User can inspect the URL before approving.

### 3. Pattern Matching Is Not Regex

**Problem:** Patterns are not regular expressions.

**Does NOT work:**
```json
// This does NOT work as regex:
{
  "deny": ["Bash(rm .*:*)"]      // Intended to block "rm <anything>"
}
```

**Correct approach:**
```json
{
  "deny": ["Bash(rm:*)"]         // Prefix match: blocks "rm ..." and "rmdir..."
}
```

**Note:** Bash patterns use simple prefix matching, file patterns use glob syntax. Neither supports full regex.

### 4. Glob Patterns Are Static

**Problem:** Cannot use dynamic patterns based on environment or runtime.

**Not possible:**
```json
{
  "deny": ["Read(./${SECRETS_DIR}/**)"]  // Variables not expanded
}
```

**Workaround:** Configure explicitly or use multiple pattern rules:
```json
{
  "deny": [
    "Read(./secrets/**)",
    "Read(./config/secrets/**)",
    "Read(./private/**)"
  ]
}
```

### 5. No Negative Lookahead

**Problem:** Cannot express "allow X except Y" in a single pattern.

**Not possible:**
```json
// "Read src/ except .env" in a single pattern - NOT SUPPORTED
```

**Correct approach - use both allow and deny:**
```json
{
  "allow": ["Read(src/**)"],
  "deny": ["Read(src/**/.env)"]  // Deny wins over allow
}
```

## Official Resources

- **Claude Code Documentation**: https://code.claude.com/docs/en/settings
- **Permissions Settings**: https://code.claude.com/docs/en/settings#permission-settings
- **Security Best Practices**: https://code.claude.com/docs/en/security
- **Claude Code CLI Reference**: https://code.claude.com/docs/en/cli

## Version Information

This reference is based on Claude Code documentation as of December 2025.

**Check for updates:** Settings and permissions system may evolve. Refer to official documentation for latest features and changes.

## Summary

**Core concepts:**
- **Three permission groups**: allow (auto-approve), ask (prompt), deny (block)
- **Precedence**: Deny > Ask > Allow
- **Two pattern types**: Bash (prefix matching), Files (glob matching)
- **Six tools**: Bash, Read, Edit, Write, WebFetch, NotebookEdit

**Key limitations:**
- Bash patterns can be bypassed (use file-level denies)
- WebFetch cannot filter by domain (all or nothing)
- Patterns are not regex (prefix or glob only)

**Best practices:**
- Start with deny rules for sensitive files
- Use file-level denies for security-critical files
- Combine Bash restrictions with file-level denies
- Test configurations with typical workflows
- Review and update permissions as project evolves

# Claude Code Tools Reference

Comprehensive reference for all available Claude Code tools and their proper usage.

## File Operations

### Read

Read file contents with optional line ranges.

```
Read(path)           # Read entire file
Read(path, 1, 100)   # Read lines 1-100
```

**Best Practices:**
- Read before editing to understand context
- Use line ranges for large files (>500 lines)
- Prefer Read over `cat` for file contents

### Edit / MultiEdit

Make precise, targeted edits to files.

```
Edit(path, old_string, new_string)  # Single replacement
MultiEdit(path, edits)               # Multiple edits in one call
```

**Best Practices:**
- Include enough context in `old_string` to be unique
- Prefer MultiEdit for multiple changes in same file
- Never use for creating new files (use Write instead)

### Write

Create new files or completely overwrite existing files.

```
Write(path, contents)
```

**Best Practices:**
- Use sparingly - prefer Edit for modifications
- Always verify parent directory exists
- Include proper file headers/comments

### Glob

Find files matching patterns.

```
Glob("*.py")           # All Python files
Glob("**/test_*.py")   # Test files in any directory
Glob("src/**/*.ts")    # TypeScript files in src/
```

### Grep

Search file contents with regex.

```
Grep(pattern)                    # Search all files
Grep(pattern, glob="*.py")       # Search Python files only
Grep(pattern, "-C", 3)           # With 3 lines context
```

**Best Practices:**
- Use `rg` (ripgrep) for complex searches
- Prefer Grep over shell `grep` command
- Use file type filters to narrow results

## Shell Operations

### Bash

Execute shell commands.

```
Bash(command)
Bash(command, timeout=60000)
Bash(command, working_directory="/path")
```

**Allowed Commands (pre-approved):**
- Version control: `git`, `gh`
- File operations: `ls`, `cp`, `mv`, `rm`, `touch`
- Search: `rg`, `fd`
- Package managers: `bun`, `bunx`, `uv`, `uvx`
- Formatters: `prettier`, `biome`, `ruff`, `rustfmt`
- Build tools: `cargo`

**Best Practices:**
- Use dedicated tools (Read, Grep) instead of shell equivalents
- Avoid long-running processes (use tmux for those)
- Quote paths with spaces

## Task Management

### Task

Spawn parallel subagents for independent work.

```
Task(prompt, tools=["Read", "Grep", "Glob"])
```

**When to Use:**
- Independent research tasks
- Parallel file analysis
- Code review in isolation
- Keeping main context clean

### TodoWrite

Track multi-step task progress.

```
TodoWrite(todos, merge=true)
```

**Best Practices:**
- Use for tasks with 3+ steps
- Update status in real-time
- Only one task `in_progress` at a time

## Web Operations

### WebSearch

Search the web for information.

```
WebSearch(query)
WebSearch(query, num_results=5)
```

### WebFetch

Fetch content from URLs.

```
WebFetch(url)
WebFetch(url, selector="main")  # Extract specific content
```

**Best Practices:**
- Use for documentation, API references
- Prefer official docs over random sources
- Cache results in context for reuse

## MCP Tools

Access tools from connected MCP servers.

```
mcp__servername__toolname(params)
```

**Common Patterns:**
- `mcp__memory__search` - Search persistent memory
- `mcp__github__create_pull_request` - Create PRs
- `mcp__context7__resolve_library_id` - Get library docs

## Tool Selection Guide

| Task | Recommended Tool | Avoid |
|------|-----------------|-------|
| Read file | `Read` | `cat`, `head` |
| Search content | `Grep` | `grep`, shell pipes |
| Find files | `Glob` | `find` |
| Edit file | `Edit` / `MultiEdit` | `sed`, `awk` |
| Create file | `Write` | `echo >`, heredoc |
| Run command | `Bash` | - |
| Parallel work | `Task` | Sequential calls |

## Permission Patterns

### Allow Patterns

```json
{
  "allow": [
    "Bash(git *)",           // All git commands
    "Bash(npm run *)",       // npm scripts
    "Read(./src/**)",        // Read src directory
    "WebFetch(domain:*.com)" // Fetch from .com domains
  ]
}
```

### Deny Patterns

```json
{
  "deny": [
    "NotebookEdit",          // Block notebook editing
    "Read(.env)",            // Block env file reads
    "Bash(rm -rf *)",        // Block dangerous deletes
    "WebFetch"               // Block all web fetching
  ]
}
```

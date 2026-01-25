# Allow Permissions

Allow rules grant automatic permission for tool operations without user confirmation. Use them for safe, routine operations that are:

- **Non-destructive** - Don't delete, publish, or irreversibly modify
- **Reversible** - Can be undone (git protects source code edits)
- **Non-sensitive** - Don't access credentials, secrets, or private data

## What to Allow

### Reading and Editing Source Code

The agent's primary job is to work with your code:

```json
{
  "allow": [
    "Read(src/**)",
    "Edit(src/**)",
    "Read(tests/**)",
    "Edit(tests/**)",
    "Read(*.md)"
  ]
}
```

Git protects you - you can review and revert any changes.

### Read-Only Commands

Safe commands that just view information:

```json
{
  "allow": [
    "Bash(/usr/bin/git status)",
    "Bash(ls:*)"
  ]
}
```

### Non-Destructive Development Commands

Operations that don't modify source or publish anything:

```json
{
  "allow": [
    "Bash(npm run test)",
    "Bash(npm run build)",
    "Bash(cargo test)",
    "Bash(make test)"
  ]
}
```

## What NOT to Allow

### Never Allow Sensitive Data Access

```json
{
  "deny": [
    "Read(.env)",
    "Read(**/.env)",
    "Read(~/.ssh/**)",
    "Read(~/.aws/**)"
  ]
}
```

### Never Allow Destructive Operations

```json
{
  "deny": [
    "Bash(rm:*)",
    "Bash(mv:*)",
    "Bash(git push --force:*)"
  ]
}
```

### Require Review for Important Operations

Use `ask` instead of `allow`:

```json
{
  "ask": [
    "Bash(/usr/bin/git push:*)",
    "Bash(/usr/bin/git commit:*)",
    "Bash(npm install:*)",
    "Bash(npm publish:*)"
  ]
}
```

## Complete Example

```json
{


  "deny": [
    // Sensitive files
    "Read(.env)",
    "Read(**/.env)",
    "Read(~/.ssh/**)",

    // Destructive operations
    "Bash(rm:*)",
    "Bash(mv:*)",

    // Token-wasting generated files
    "Read(node_modules/**)",
    "Read(dist/**)"
  ]
}
```

## Key Principles

1. **Be specific** - Avoid broad wildcards like `Bash(*)` or `Read(**)`
1. **Layer protections** - Use `allow`, `ask`, and `deny` together
1. **Trust git** - It's your safety net for source code changes
1. **When uncertain** - Use `ask` instead of `allow`

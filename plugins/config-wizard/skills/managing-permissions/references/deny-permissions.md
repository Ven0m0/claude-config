# Deny Permissions

Deny rules block specific tool operations. They are designed for **workflow control and resource management**, not security.

**Important:** Deny rules are workflow controls with significant limitations. For protecting secrets, use hooks instead.

## Key Limitation: Tool-Specific

Each tool has a separate permission namespace. Denying one tool doesn't block others:

```json
{
  "deny": ["Read(.env)"]
}
```

**This ONLY blocks:**
- ✅ The Read tool: `Read(.env)`

**This does NOT block:**
- ❌ `Bash(cat .env)`
- ❌ `Bash(grep SECRET .env)`
- ❌ `Grep(SECRET, .env)`
- ❌ `Edit(.env)`

**Why this matters:** Comprehensive protection requires deny rules for every tool and every command variant - hundreds of rules that are still easily bypassed. This is why deny rules aren't suitable for security.

## What Deny Rules ARE Good For

### 1. Resource Management
Save tokens by blocking large, irrelevant files:

```json
{
  "deny": [
    // Dependencies
    "Read(node_modules/**)",
    "Read(vendor/**)",
    "Grep(node_modules/**)",

    // Build artifacts
    "Read(dist/**)",
    "Read(build/**)",
    "Read(target/**)",

    // Lockfiles
    "Read(package-lock.json)",
    "Read(yarn.lock)"
  ]
}
```

**Benefits:** Saves tokens, faster performance, focuses Claude on source code.

### 2. Workflow Guardrails
Prevent accidental mistakes:

```json
{
  "deny": [
    // Destructive operations
    "Bash(rm:*)",
    "Bash(mv:*)",

    // Protected branches
    "Bash(/usr/bin/git push origin main:*)",

    // Accidental publishing
    "Bash(npm publish:*)"
  ]
}
```

**Note:** These are guardrails, not security. They can be bypassed.

### 3. Focus Management
Guide Claude to relevant code:

```json
{
  "deny": [
    "Read(deprecated/**)",
    "Read(legacy/**)",
    "Read(experiments/**)"
  ]
}
```

## Common Patterns

### Dependencies and Build Artifacts
```json
{
  "deny": [
    "Read(node_modules/**)",
    "Read(vendor/**)",
    "Read(dist/**)",
    "Read(build/**)",
    "Read(.next/**)",
    "Read(target/**)"
  ]
}
```

## For Security: Use Hooks

**Don't use deny rules for protecting secrets.** They are:
- Tool-specific (file deny ≠ bash deny)
- Easily bypassed
- Not designed for security

**For actual secret protection:**
1. Use hooks (tool-agnostic protection)
2. Use environment isolation (containers, VMs)
3. Use secret management tools (Vault, 1Password)
4. Never commit secrets to version control

## Key Principles

1. **Use for resource management** - Block large files to save tokens
2. **Use for workflow guardrails** - Prevent accidental mistakes
3. **Don't use for security** - Deny rules are easily bypassed
4. **Precedence: Deny > Ask > Allow** - Within same config source

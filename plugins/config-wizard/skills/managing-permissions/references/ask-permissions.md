# Ask Permissions

Ask rules prompt for confirmation before allowing tool operations. Use them for important operations that benefit from review.

**Important:** Ask rules are workflow controls, not security mechanisms. For security, use hooks instead.

## When to Use Ask

Use ask for operations that:

- **Modify external state** - Publishing, deploying, pushing to remote
- **Change dependencies** - Installing/updating packages
- **Modify critical files** - package.json, tsconfig.json, CI configs
- **Are infrequent but important** - Worth reviewing each time

## What to Ask For

### Git Operations

Operations that publish or modify history:

```json
{
  "ask": [
    "Bash(/usr/bin/git push:*)",
    "Bash(/usr/bin/git commit:*)",
    "Bash(/usr/bin/git rebase:*)",
    "Bash(/usr/bin/git merge:*)"
  ]
}
```

**Why:** These affect your team or create permanent history worth reviewing.

### Package Management

Installing or removing dependencies:

```json
{
  "ask": [
    "Bash(npm install:*)",
    "Bash(npm uninstall:*)",
    "Bash(pip install:*)",
    "Bash(cargo add:*)"
  ]
}
```

**Why:** Dependencies affect security, build size, and compatibility. Post-install scripts can execute arbitrary code.

### Critical Configuration Files

Files that control builds, dependencies, or deployment:

```json
{
  "ask": [
    "Edit(package.json)",
    "Edit(Cargo.toml)",
    "Edit(tsconfig.json)",
    "Edit(Dockerfile)",
    "Edit(.github/workflows/**)"
  ]
}
```

**Why:** Errors in these files can break builds or deployments for your entire team.

### Database Operations

Schema changes and migrations:

```json
{
  "ask": [
    "Bash(prisma migrate:*)",
    "Bash(alembic:*)",
    "Bash(rake db:*)"
  ]
}
```

**Why:** Database migrations are hard to reverse and can cause data loss.

## Avoid Permission Fatigue

Don't ask for operations that happen frequently:

```json
// ❌ Too many asks - creates fatigue
{
  "ask": [
    "Read(src/**)",        // Asked constantly
    "Edit(src/**)",        // Asked for every change
  ]
}

// ✅ Reserve ask for important operations
{
  "allow": [
    "Read(src/**)",
    "Edit(src/**)",
    "Bash(npm run:*)"
  ],
  "ask": [
    "Bash(/usr/bin/git commit:*)",    // Once per commit
    "Bash(npm install:*)"  // Occasional
  ]
}
```

## Key Principles

1. **Ask for external changes** - Operations that publish or affect others
1. **Don't ask for reading** - Read-only operations should be allowed
1. **Balance convenience and control** - Too many asks create fatigue
1. **Use hooks for security** - Ask rules are workflow controls, not security

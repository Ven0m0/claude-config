# Git Permissions Reference

Quick reference for git command permissions.

## ⚠️ CRITICAL Security Warning

**Git commands can read sensitive files even with `"deny": ["Read(.env)"]`**

```bash
git diff /dev/null .env    # Bypasses Read(.env) deny rule
git show HEAD:.env          # Bypasses Read(.env) deny rule
git log -p .env            # Bypasses Read(.env) deny rule
git grep "SECRET" .env     # Bypasses Read(.env) deny rule
```

**Why:** File deny rules are tool-specific. Git uses Bash tool, not Read tool.

**Solution:** Use PreToolUse hooks for secret protection (tool-agnostic).

## Always Safe Commands

These commands only read metadata and never: read file contents, modify state, or affect remote repos.

```json
"allow": [
  "Bash(git status)",
  "Bash(git status:*)",
  "Bash(git branch)",
  "Bash(git branch:*)",
  "Bash(git remote)",
  "Bash(git remote:*)",
  "Bash(git fetch:*)",
  "Bash(git stash list)",
  "Bash(git reflog:*)"
]
```

**Note:** `git tag` without arguments lists tags (safe), but `git tag <name>` creates tags (should use "ask" - see table below).

**Why safe:**

- No file content access (can't read secrets)
- No destructive operations (can't lose data)
- No remote modifications (can't affect others)

## Potentially Unsafe Commands

These commands have specific risks but can be used safely with proper safeguards.

### Can Read Secrets

```json
"ask": [
  "Bash(git diff:*)",
  "Bash(git log:*)",
  "Bash(git show:*)",
  "Bash(git grep:*)"
]
```

**Risk:** Can be used to read ANY file content, bypassing `Read` tool denies

**Mitigation:** Use PreToolUse hooks to block access to sensitive files

### Modify Local State (Reversible)

```json
"ask": [
  "Bash(git add:*)",
  "Bash(git commit:*)",
  "Bash(git checkout:*)",
  "Bash(git switch:*)",
  "Bash(git stash:*)",
  "Bash(git reset --soft:*)",
  "Bash(git reset --mixed:*)",
  "Bash(git reset HEAD:*)"
]
```

**Risk:** Changes working directory, staging area, or creates commits

**Mitigation:** Reversible via `git reflog` (already in "Always Safe")

**Note:** `git reset --hard` is destructive and belongs in "Never Allow" below

### Require Approval (Remote/History Changes)

```json
"ask": [
  "Bash(git push:*)",
  "Bash(git pull:*)",
  "Bash(git merge:*)",
  "Bash(git rebase:*)",
  "Bash(git tag:*)"
]
```

**Risk:** Affects remote repos or modifies history

**Mitigation:** User approval before execution

### Never Allow (Destructive/Irreversible)

```json
"deny": [
  "Bash(git reset --hard:*)",
  "Bash(git push --force:*)",
  "Bash(git push origin main:*)",
  "Bash(git push origin trunk:*)",
  "Bash(git push origin master:*)"
]
```

**Risk:** Permanent data loss or affects protected branches

**Mitigation:** Block entirely

## Git Commands Reference

| Command                | Reads Secrets? | Destructive?     | Reversible?  | Affects Remote? | Suggested           |
| ---------------------- | -------------- | ---------------- | ------------ | --------------- | ------------------- |
| `git status`           | No             | No               | N/A          | No              | Allow               |
| `git branch`           | No             | No               | N/A          | No              | Allow               |
| `git remote`           | No             | No               | N/A          | No              | Allow               |
| `git diff`             | **Yes**        | No               | N/A          | No              | Allow + Hook OR Ask |
| `git log`              | **Yes**        | No               | N/A          | No              | Allow + Hook OR Ask |
| `git show`             | **Yes**        | No               | N/A          | No              | Allow + Hook OR Ask |
| `git grep`             | **Yes**        | No               | N/A          | No              | Allow + Hook OR Ask |
| `git add`              | No             | No               | Yes          | No              | Allow               |
| `git commit`           | No             | No               | Yes (amend)  | No              | Allow/Ask           |
| `git checkout`         | No             | No               | Yes          | No              | Allow               |
| `git switch`           | No             | No               | Yes          | No              | Allow               |
| `git merge`            | No             | No               | Yes (reset)  | No              | Ask                 |
| `git rebase`           | No             | Modifies history | Partially    | No              | Ask                 |
| `git stash`            | No             | No               | Yes (pop)    | No              | Allow               |
| `git fetch`            | No             | No               | N/A          | No              | Allow               |
| `git pull`             | No             | No               | Yes (reflog) | No              | Ask                 |
| `git push`             | No             | No               | Partially    | **Yes**         | Ask                 |
| `git push origin main` | No             | No               | No           | **Yes**         | Deny                |
| `git push --force`     | No             | **Yes**          | No           | **Yes**         | Deny                |
| `git tag`              | No             | No               | Yes (delete) | Depends         | Ask                 |
| `git reset --hard`     | No             | **Yes**          | Partially    | No              | Deny                |

## Key Points

1. **Secret protection requires hooks** - `git diff`, `git show`, `git log`, `git grep` can read ANY file, bypassing `Read` denies
1. **Destructive operations** - `git reset --hard` and `git push --force` can cause irreversible data loss
1. **Reversibility matters** - Local operations (commit, merge, checkout) are generally recoverable via `git reflog`
1. **Remote operations affect others** - Anything touching `origin` should require approval
1. **Pattern matching** - Use `:*` suffix to match arguments: `"Bash(git push origin main:*)"`
1. **Precedence** - Deny > Ask > Allow when rules overlap

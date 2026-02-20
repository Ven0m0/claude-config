# Git Rules

## Read-Only by Default

<permissions>
You may read git state freely but never execute git write commands without explicit user permission. This rule is about git commands, not file operations - creating, editing, deleting files in the working tree is always allowed.
</permissions>

### Always Allowed

```bash
git status / git diff / git diff --staged
git log --oneline / git show / git branch -a
```

### Requires Explicit Permission

These need the user to say "commit", "push", etc:

```bash
git add / commit / push / pull / fetch / merge / rebase
git reset / revert / stash / cherry-pick / tag
```

"Fix this bug" does not mean "commit it". Wait for explicit git instructions.

Exception: `git switch <branch>` is allowed when user explicitly requests branch switching.

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request Workflow

<steps>
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan
5. Push with `-u` flag if new branch
</steps>

## Checking Work

Always verify before marking work complete:

```bash
git status    # Verify expected files changed
git diff      # Review actual changes
```

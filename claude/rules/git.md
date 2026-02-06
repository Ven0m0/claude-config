# Git Rules

## Read-Only by Default

**Rule:** You may READ git state freely, but NEVER execute git WRITE COMMANDS without EXPLICIT user permission.

**This rule is about git commands, NOT file operations.** Creating, editing, deleting files in the working tree is always allowed.

### Allowed (always)

```bash
git status              # Check working tree
git diff                # Unstaged changes
git diff --staged       # Staged changes
git log --oneline -10   # Recent commits
git show <commit>       # Commit details
git branch -a           # All branches
```

### Requires Explicit Permission

These need the user to explicitly say "commit", "push", etc.:

```bash
git add / git commit / git commit --amend
git push / git push --force
git pull / git fetch / git merge / git rebase
git reset / git revert / git stash
git checkout / git switch / git restore
git cherry-pick / git tag
```

**"Fix this bug" does NOT mean "commit it". Wait for explicit git instructions.**

**Exception:** `git checkout <branch>` / `git switch <branch>` allowed when user explicitly requests branch switching.

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request Workflow

1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Plan** - Use planner agent, identify dependencies and risks
2. **TDD** - Write tests first (RED), implement (GREEN), refactor (IMPROVE), verify 80%+ coverage
3. **Review** - Use code-reviewer agent, address CRITICAL and HIGH issues
4. **Commit** - Follow conventional commits format

## Checking Work

Always verify before marking work complete:

```bash
git status              # Verify expected files changed
git diff                # Review actual changes
```

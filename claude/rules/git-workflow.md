# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.

## Pull Request Workflow

When creating PRs:

1. Analyze full commit history (not just latest commit)
1. Use `git diff [base-branch]...HEAD` to see all changes
1. Draft comprehensive PR summary
1. Include test plan with TODOs
1. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Plan First**

   - Use **planner** agent to create implementation plan
   - Identify dependencies and risks
   - Break down into phases

1. **TDD Approach**

   - Use **tdd-guide** agent
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

1. **Code Review**

   - Use **code-reviewer** agent immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

1. **Commit & Push**

   - Detailed commit messages
   - Follow conventional commits format

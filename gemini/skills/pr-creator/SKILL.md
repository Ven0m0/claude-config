---
name: pr-creator
description: |
  Create a pull request following the repository's established templates and standards.
  Use when asked to create a PR, submit changes, or open a pull request.
---

<role>
You create high-quality Pull Requests that adhere to repository standards.
</role>

<instructions>

## Workflow

<steps>
1. Branch management: verify you are not on `main`. If on main, create and switch to a descriptive branch.

2. Commit changes: verify all intended changes are committed. Stage and commit with a descriptive message following conventional commits format.

3. Locate template: check `.github/pull_request_template.md` and `.github/PULL_REQUEST_TEMPLATE.md`. If multiple templates exist, select the most appropriate one.

4. Read template and draft description:
   - Keep all headings from the template
   - Mark checklists with `[x]` if completed, `[ ]` if not
   - Fill sections with clear, concise summaries
   - Link related issues (e.g., "Fixes #123")

5. Preflight check: run `npm run preflight` to ensure build, lint, and test checks pass. Address failures before proceeding.

6. Push branch: verify current branch is not main, then `git push -u origin HEAD`

7. Create PR: write description to temp file, use `gh pr create --title "type(scope): description" --body-file <temp_file>`, remove temp file
</steps>

</instructions>

<constraints>
- Never push to main
- Never ignore the PR template
- Fill out all relevant sections
- Do not check boxes for tasks not completed
</constraints>

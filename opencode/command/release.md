---
description: Prepare a changelog entry and version bump for a release
---

Prepare a release for version $ARGUMENTS (semver, e.g. "1.2.0").

Steps:
1. Read CHANGELOG.md to understand the existing format.
2. Collect all commits since the last tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
3. Group commits by type: feat, fix, docs, refactor, chore.
4. Draft a new CHANGELOG.md entry under `## [$ARGUMENTS] - $(date +%Y-%m-%d)`.
5. Update `pyproject.toml` version field to $ARGUMENTS.
6. Show the diff for review — do NOT commit until confirmed.

Only include user-visible changes in the changelog. Skip chore/style/ci commits unless they affect installation or tooling usage.

## Recent commits

!`git log --oneline -20 2>/dev/null`

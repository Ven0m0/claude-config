---
description: Generate daily standup from recent git activity
agent: scribe
---

Generate a daily standup summary from recent git activity.

## Git Activity

!`git log --since=yesterday --oneline --author="$(git config user.email)" 2>/dev/null || git log -10 --oneline`

## Recent Changes

!`git diff --stat HEAD~5..HEAD 2>/dev/null | tail -20`

## Open TODOs

!`rg -n "TODO|FIXME|HACK" --type-add "code:*.{ts,js,py,go,rs,md}" -t code -l 2>/dev/null | head -10`

## Uncommitted Work

!`git status --short`

---

Summarize in standup format. Be specific — name files, features, and issues. No filler.

**Yesterday**: what was completed (from git log)
**Today**: what is planned (from open TODOs and uncommitted changes)
**Blockers**: any failing tests, merge conflicts, or unresolved issues

Keep to 5-7 bullet points total. Do not modify any files.

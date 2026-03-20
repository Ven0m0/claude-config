---
description: Triage open GitHub issues by priority
agent: researcher
---

Triage open GitHub issues and prioritize for the next sprint.

## Open Issues

!`gh issue list --limit 30 --json number,title,labels,createdAt,comments,body 2>/dev/null`

## Recent Closed Issues (context)

!`gh issue list --state closed --limit 10 --json number,title,labels,closedAt 2>/dev/null`

---

Categorize each open issue into one of these buckets:

- **critical**: security vulnerabilities, data loss, crashes
- **high**: blocks users from core workflows
- **medium**: UX degradation, performance issues, non-blocking bugs
- **low**: nice-to-have improvements, minor polish

Then recommend the top 3 issues to tackle next, with a one-line rationale for each.

Do not modify any files. Output only the prioritized list.

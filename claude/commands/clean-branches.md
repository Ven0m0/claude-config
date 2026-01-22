---
description: Clean up merged and stale git branches
category: utilities-debugging
allowed-tools: Bash(git *)
---

Clean merged and stale branches:
1. `git fetch --prune`
2. Delete local merged branches: `git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d`
3. List remote branches merged into main: `git branch -r --merged origin/main`
4. Delete stale remote branches (confirm first): `git push origin --delete <branch-name>`

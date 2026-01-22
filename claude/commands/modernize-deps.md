---
description: Update and modernize project dependencies
category: project-setup
allowed-tools: Bash(bun *), Read
---

Modernize dependencies:
1. Check outdated: `bun outdated` or `npm outdated`
2. Review breaking changes in changelogs
3. Update incrementally: `bun update <package>`
4. Test after each update
5. Update lock files and verify builds pass

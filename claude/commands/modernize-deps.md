---
description: Update and modernize project dependencies
category: project-setup
allowed-tools: Bash(bun *), Read
---

Modernize dependencies:

1. Check outdated: `bun outdated` or `npm outdated`
1. Review breaking changes in changelogs
1. Update incrementally: `bun update <package>`
1. Test after each update
1. Update lock files and verify builds pass

---
description: Intelligently refactor and improve code quality
category: utilities-debugging
---

Refactor code systematically:

1. Analyze current code, tests, dependencies
1. Ensure test coverage exists (write tests if missing)
1. Create refactor branch: `git checkout -b refactor/$ARGUMENTS`
1. Make small incremental changes, testing after each
1. Improve naming, reduce duplication, simplify logic
1. Update docs and commit with clear messages
1. Run full test suite to verify no regressions

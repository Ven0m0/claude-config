---
description: Intelligently refactor and improve code quality
category: utilities-debugging
---

Refactor code systematically:
1. Analyze current code, tests, dependencies
2. Ensure test coverage exists (write tests if missing)
3. Create refactor branch: `git checkout -b refactor/$ARGUMENTS`
4. Make small incremental changes, testing after each
5. Improve naming, reduce duplication, simplify logic
6. Update docs and commit with clear messages
7. Run full test suite to verify no regressions

---
applyTo: '**/*.sh'
---

All shell scripts in this repository use Bash.

- Start every script with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Quote all variable expansions: `"${var}"` not `$var`.
- Use `[[ ... ]]` for conditionals, never `[ ... ]`.
- Validate changed scripts with `shellcheck <path>`. The repo `.shellcheckrc` configures allowed exceptions.
- Avoid `eval` and dynamically constructed commands.
- Prefer `command -v` over `which` to check for executables.

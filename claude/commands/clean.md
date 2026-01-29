# Clean Project

Clean up code and project artifacts in `$ARGUMENTS`.

**Modes:**
- `code` or no args: Clean technical debt
- `artifacts`: Clean development artifacts (logs, temp files)
- `all`: Both code and artifacts

## Technical Debt Cleanup

1. **Identify cleanup targets:**
   - TODO, FIXME, HACK, XXX comments
   - Commented-out code blocks
   - Unused imports/variables
   - Dead/unreachable code
   - Deprecated API usage
   - Debug statements (console.log, print)

2. **Code quality:**
   - Fix linting errors and warnings
   - Apply consistent formatting
   - Standardize naming conventions
   - Modernize syntax (let/const, arrow functions)

3. **Remove dead code:**
   - Commented-out code older than 3 months
   - Unused functions and methods
   - Unreferenced files
   - Obsolete configuration
   - Shipped feature flags

4. **Consolidate duplication:**
   - Extract common functionality to utilities
   - Merge similar functions
   - Unify error handling patterns

5. **File organization:**
   - Remove empty files and directories
   - Organize imports (grouped and sorted)
   - Fix circular dependencies

## Development Artifacts

1. **Temporary files:**
   - `*.log`, `*.tmp`, `*~` files
   - `.cache` directories (if safe)
   - Debug/session files

2. **Build artifacts:**
   - `dist/`, `build/` (if rebuilding)
   - `node_modules/.cache`
   - Compiled output not in .gitignore

3. **Safety checks:**
   - Verify with `git status` what's tracked vs untracked
   - Check file age - older files are safer to remove
   - Confirm no active processes using these files

**Protected directories:** `.claude`, `.git`, `node_modules`, `vendor`

## Safety Measures

- Create git checkpoint before cleanup
- Run tests after each change type
- Keep refactoring commits separate
- Document why code was removed

**Output:**
- Summary by category
- Lines/files removed
- Risk assessment
- Follow-up tasks

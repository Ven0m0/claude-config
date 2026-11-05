---
name: kilo-tools-verify
description: Verify changes to kilo-tools (tests, formatting, host parity) and report what was and was not checked. Use after editing anything under kilo-tools/.
disable-model-invocation: true
allowed-tools: Read Grep Glob Edit Bash
---

# Verify kilo-tools

## Usage

Run from the repo root. Report each step as passed, failed or not run; do not claim success for a step you skipped.

1. **Tests**: `bun test kilo-tools`. All tests must pass. The ast-grep tests skip themselves without `sg`; say so if they were skipped.
2. **Format** only the files you touched, with the double-quote config. The committed `kilo-tools` files use double quotes, but `.oxfmtrc.jsonc` and `biome.json` say single quotes, so formatting with the repo config rewrites every quote.
   ```bash
   sed 's/"singleQuote": true/"singleQuote": false/' .oxfmtrc.jsonc > "$TMPDIR/oxfmt-dq.jsonc"
   bunx oxfmt -c "$TMPDIR/oxfmt-dq.jsonc" <touched files>
   git diff --stat -- kilo-tools   # churn beyond your change means the wrong config ran
   ```
3. **Typecheck**: `bunx tsc --noEmit -p kilo-tools`. `tsc` is not installed in this environment and fails with "Module not found"; report it as not run rather than skipping silently.
4. **Host parity**: if `v1.ts`, `v2.ts`, `result-text.ts`, `tool-names.ts` or the plugin order in `index.ts` changed, check that v1 and v2 behave the same (see the parity tests in `v2.test.ts`) or delegate to the `host-parity-reviewer` agent.

## Gotchas

- Do not edit files with a Python heredoc in Bash: `\\n` in replacement strings turns into real newlines and breaks string literals. Use the Edit tool.
- `bun.lock` and `package.json` may carry unrelated local changes. Leave them alone.
- Prefer a failing test first when fixing a bug; compare against the old code with `git stash push -- <file>`.

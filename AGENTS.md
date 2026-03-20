# Agent Guide

> Symlinked as `CLAUDE.md` and `GEMINI.md`.
> Applies to coding agents working in this repository.

## Repository Snapshot

- This repo is a configuration and plugin marketplace for Claude Code, Copilot CLI, Cursor, Gemini, and related agent tooling.
- Main areas:
  - `claude/agents/` - agent definitions
  - `claude/skills/` - reusable skills
  - `claude/hooks/` - Python, shell, and JS hook scripts
  - `plugins/` - installable plugins with their own test setups
  - `cursor/rules/` - Cursor rules to preserve
  - `.github/copilot-instructions.md` - Copilot guidance to preserve

## Working Rules

- Follow user instructions first.
- Prefer minimal diffs and editing existing files over creating new ones.
- Preserve unrelated user changes; never revert work you did not make.
- Favor subtraction over addition; avoid shims and extra abstractions unless needed.
- Read relevant files before editing, then run the narrowest useful validation.
- No emojis in code, comments, commits, or docs.

## Preferred Tools

- Search text with `rg`; discover files with `fd`.
- Use `uv` for Python environments and execution.
- Use `bun` / `bunx` for JS/TS tasks.
- Use `ruff` for Python lint/format, `biome` for JS/TS lint/format.
- Use `jq` for JSON and `shellcheck` for shell validation.
- Prefer modern tools over legacy equivalents: `rg` over `grep`, `fd` over `find`, `uv` over `pip`, `bun` over `npm`.

## Setup

Run from repo root unless a plugin says otherwise.

```bash
uv sync --dev
bun install
```

## Build, Lint, And Test Commands

### Whole-repo checks

```bash
uv run ruff check .
uv run ruff format --check .
bunx @biomejs/biome check .
bun run tsc --noEmit
uv tool run "claudelint@0.3.3" --strict .
shellcheck claude/hooks/*.sh
```

### Targeted checks

```bash
uv run ruff check claude/hooks plugins
bunx @biomejs/biome check claude plugins
uv tool run "claudelint@0.3.3" --strict AGENTS.md
```

### Python tests

Primary Python-heavy surface is `plugins/conserve/`.

```bash
uv run pytest plugins/conserve/tests/
uv run pytest plugins/conserve/tests/unit/ -v
uv run pytest plugins/conserve/tests/integration/ -v
uv run pytest plugins/conserve/tests/unit/scripts/test_cli_smoke.py -v
uv run pytest plugins/conserve/tests/unit/scripts/test_cli_smoke.py::test_name -v
uv run pytest plugins/conserve/tests/ -k "token_conservation" -v
```

`plugins/prompt-improver/` also uses pytest:

```bash
uv run pytest plugins/prompt-improver/tests/
uv run pytest plugins/prompt-improver/tests/test_hook.py -v
uv run pytest plugins/prompt-improver/tests/test_integration.py -v
```

### Make-based helpers

```bash
make -C plugins/conserve test
make -C plugins/conserve lint
make -C plugins/conserve validate-all

make -C plugins/conserve/tests test
make -C plugins/conserve/tests test-unit
make -C plugins/conserve/tests test-integration
make -C plugins/conserve/tests test-pattern PATTERN=context
make -C plugins/conserve/tests test-marker MARKER=unit

make -C plugins/dependency-blocker test
make -C plugins/dependency-blocker lint
```

### Other test commands

```bash
bats plugins/dependency-blocker/tests/test-bash-validate.bats
bats plugins/dependency-blocker/tests/test-bash-validate.bats --filter "node_modules"
node plugins/plugin-validator/test.js
```

## Single-Test Guidance

- Pytest single file: `uv run pytest path/to/test_file.py -v`
- Pytest single test: `uv run pytest path/to/test_file.py::test_name -v`
- Pytest pattern: `uv run pytest plugins/conserve/tests/ -k "pattern" -v`
- Bats single file: `bats plugins/dependency-blocker/tests/test-read-validate.bats`
- Bats filtered case: `bats path/to/file.bats --filter "case name"`
- Node suite: `node plugins/plugin-validator/test.js`

## Style And Formatting

Rules come from `.editorconfig`, root `pyproject.toml`, `tsconfig.json`, Cursor rules, and Copilot instructions.

- Encoding: UTF-8, LF, final newline.
- Indentation: 2 spaces for JS/TS/JSON/YAML/Markdown, 4 spaces for Python, tabs for `Makefile` and `*.mk`.
- Whitespace: trim trailing whitespace unless the file type intentionally preserves it.
- Quotes: prefer double quotes where the formatter or local style allows choice.
- Keep files focused; prefer roughly 200-400 lines and avoid pushing past 800 without a strong reason.

## Imports

- Keep imports minimal and used.
- Prefer absolute imports in Python when structure supports them.
- Group imports as standard library, third-party, then local modules.
- Let Ruff or Biome handle normalization when configured.
- Avoid wildcard imports.

## Types

- Python: add type hints for new or changed public functions and non-trivial helpers.
- TypeScript: keep code compatible with `strict`, `noUncheckedIndexedAccess`, and `noFallthroughCasesInSwitch`.
- Prefer precise types over `Any` or `unknown` escape hatches.
- Model nullability explicitly instead of relying on truthiness.

## Naming

- Python: `snake_case` functions and variables, `PascalCase` classes, `UPPER_SNAKE_CASE` constants.
- JS/TS: `camelCase` functions and variables, `PascalCase` classes and components.
- Files:
  - agents: `hyphenated-name.md`
  - skills: `hyphenated-dir/SKILL.md`
  - Python modules: `snake_case.py`
  - docs/config: `kebab-case.md`
- Prefer descriptive names over abbreviations and magic numbers.

## Error Handling And Security

- Fail fast at boundaries; validate external input and configuration early.
- Keep errors actionable and specific.
- Do not add defensive code for impossible states without evidence.
- Never hardcode credentials or secrets.
- Avoid `eval` in any language.
- Sanitize external input and avoid string-built commands when structured alternatives exist.
- Shell scripts should use `#!/usr/bin/env bash`, `set -euo pipefail`, quoted variables, and `[[ ... ]]`.

## Language-Specific Notes

- Python: root tooling targets Python 3.14; Ruff uses line length 88 and aggressive linting.
- JS/TS: use Bun-oriented commands and preserve strict TypeScript behavior.
- Shell: validate changed scripts with `shellcheck`.
- Markdown/docs: keep prose direct and use real file paths.

## Cursor And Copilot Rules To Preserve

- Verify facts before presenting them; do not invent behavior or changes.
- Preserve existing structures and unrelated code.
- Avoid whitespace-only churn.
- Use meaningful names, named constants, and comments that explain why rather than what.
- Keep functions focused; refactor when a block needs excessive explanation.
- Keep responses and docs concise, blunt, and result-first.
- Run tests after changes and use parallel operations for independent work.
- XML-style structure is acceptable for complex prompts when it improves clarity.
- Do not commit directly to protected branches like `main` or `develop`.

## Validation Expectations Before Finishing

- Run the narrowest relevant tests for touched code.
- If you changed Python, run Ruff and the relevant pytest target.
- If you changed JS/TS, run Biome and `bun run tsc --noEmit` when types may be affected.
- If you changed shell hooks, run `shellcheck`.
- If you changed agent or plugin docs, run `uv tool run "claudelint@0.3.3" --strict .` or at least the touched file.

## Commit Style

- Commit format: `type(scope): description`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep subject lines under 72 characters.
- Explain why in the body when a body is needed.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |

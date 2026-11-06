# Global instructions (opencode)

Ported from `~/.claude/CLAUDE.md` (via `~/.pi/agent/AGENTS.md`). OMC and Claude-only sections are intentionally left out.

## Operating Principles
- Prefer evidence over assumptions: verify outcomes before final claims.
- Choose the lightest-weight path that preserves quality.
- Consult official docs before implementing with SDKs/frameworks/APIs (see Docs Lookup).
- Broad requests: explore first, then plan. Run independent tasks in parallel; run builds/tests in the background.

## Verification
- Verify before claiming completion; if verification fails, keep iterating.
- No fake completion: TODO-style placeholders, `test.skip`/`.only`, stub tests, and unimplemented branches are blockers, not evidence. Inspect changed files for them before finishing and implement them or report the blocker.
- Keep authoring and review as separate passes; never self-approve in the same context.
- Before concluding: no pending tasks, tests passing, evidence collected.
- Before editing after a resume or inside a linked worktree, re-check `git status --short --branch` and the current directory.
- Track multi-step work with the `todowrite` tool.

## Tool Preferences
Prefer `fd`, `rg`, `jq`/`yq`, `uv` (python), `bun` (js/ts), `7z`, `markitdown` (doc conversion). Shell commands go through `rtk` (see RTK Usage); `eza`/`bat` only when rtk has no rule.
Use the fff MCP tools for all file search operations instead of default tools. For structural (AST) code search/rewrite, use `@ast-grep/cli` (`ast-grep` / `sg`) instead of regex `rg`.
Browser automation: always Patchright (stealth Playwright fork), never Playwright. MCP server: `patchright`. Python: `from patchright.sync_api import ...` via `uv run --with patchright`. Node: `patchright` package. Never install `playwright` or `@playwright/mcp` standalone.

## Docs Lookup (context7)
Before using or changing any library, framework, SDK, API, CLI tool, or dependency, and before assuming how a tool or project works, check docs through MCP instead of answering from memory. Training data goes stale.
- **context7** (`resolve-library-id`, then `query-docs`); fall back to `webfetch` on the official docs page when the library is missing there.
- Use for: API syntax, config options, version migrations, library-specific errors, setup steps, and understanding an unfamiliar dependency or project before editing it.
- Skip for: refactoring, scripts from scratch, business-logic debugging, code review, general programming concepts.
- Read the project's own manifest and README first so lookups target the pinned version.

## Code Standards
- Immutability: new objects, never mutate existing ones.
- Files 200-400 lines typical, 800 max; extract utilities from large files.
- Imports: stdlib, third-party, local; alphabetical within groups.
- Never log or commit secrets; redact sensitive data in logs.
- Comments explain "why", not "what".
- Follow existing project test patterns before marking work complete.
- Minimal, focused changes; one problem at a time.

## Communication Style
- No emojis in code, comments, commits, or docs.
- No em dashes; use hyphens or restructure.
- Clear, direct language, no unnecessary embellishment.
- Review first: when asked to review/analyze, do that and report findings before changing anything.
- Humble language: don't claim "success" without verification. "Successfully" only when tests prove it.

## Memory (Mandatory)
Obsidian vault at `$env:USERPROFILE\Nextcloud\obsidian-vault` is the **canonical durable brain** - it outranks project-scoped memory and harness auto-memory for anything that should survive this session. Those are scratch; the vault is where it actually lives. This applies in every project, not only when the vault itself is the working directory.
**Write the moment one of these happens, don't wait to be asked:** a preference stated, a decision made (+ why), a bug root-caused, a correction/feedback given, a workflow worked out, or a tool/credential/external-resource fact learned.
1. Check first: does `index.md` -> the relevant `_about.md` already cover this? Update, don't duplicate. Search the vault with the `obsidian-hybrid-search` MCP `search` tool (hybrid mode) when connected, else `rtk rg`.
2. Write an atomic note in `Memory/` (fact/decision/preference), `Knowledge/` (synthesized topic), or `Projects/` (active work) via the vault's `new-note` skill. Full protocol: `$env:USERPROFILE\Nextcloud\obsidian-vault\CLAUDE.md`.
3. Wikilink it and add a pointer under the folder's `_about.md`.
**Before ending any task, check whether it produced a durable learning - if so, write it to `C:\Users\Ven0m0\Nextcloud\obsidian-vault` before you report completion.** (Claude has a hook for this reminder; opencode does not, so this line is the reminder.)

## Persistent memory (ICM)
ICM stores memory across sessions through the `icm` MCP server (`icm_memory_recall`, `icm_memory_store`, ...); the local `icm.ts` plugin injects recall context and captures tool results. Use it actively.
- Recall before starting work: `icm_memory_recall` with a short query, or the `icm-recall` skill.
- Store immediately (before replying) when: an error is resolved (topic `errors-resolved`, importance high), an architecture or design decision is made (`decisions-{project}`, high), a user preference is discovered (`preferences`, critical), a significant task completes (`context-{project}`, high), or ~20 tool calls pass without a store. The `icm-remember` / `icm-remember-session` skills wrap this.
- Do not store trivial details, anything already in this file, or ephemeral state.
- Memoirs (`icm_memoir_*`) hold durable structured knowledge that must not decay.

## Context Tools (context-mode)
Use the context-mode tools (ctx_execute, ctx_execute_file, ctx_batch_execute, ctx_index, ctx_search, ctx_fetch_and_index) to keep raw bytes out of context; derive answers in-sandbox. If they are missing, pipe large output through `rtk` filters or read only the needed range.
**Exception**: use the native `websearch`/`webfetch` tools directly, not `ctx_fetch_and_index`, when the task is a lookup/research question, not raw-byte processing.

## RTK Usage (Max)
- Prefix every shell command with `rtk` when a rule exists (`rtk git`, `rtk gh`, `rtk ls`, `rtk read`, `rtk diff`, `rtk json`, `rtk curl`, `rtk bun`, `rtk uv`, `rtk wc`, `rtk find`). The local `rtk.ts` plugin rewrites safe shapes via `rtk rewrite`; write `rtk ...` explicitly when unsure.
- Search: use `rtk rg` over `rtk grep`. `grep` only when `rg` cannot do it.
- Pipes disable rtk for the whole command (top leak in `rtk discover`). No `$(...)`/backticks, no `timeout` prefix: use native flags (`rtk read f --max-lines N`) and the tool's timeout param.
- PowerShell: use `rtk ls`/`rtk read`/`rtk rg`/`rtk wc -l`, never `Get-ChildItem`/`Get-Content`/`Select-String`.
- Never add `2>&1 | tail`; rtk already truncates and filters output.
- Use `rtk proxy <cmd>` only when raw unfiltered output is needed for debugging.
- Periodically run `rtk discover` and `rtk gain` to find missed rewrites; fix habits it reports.
- Always write `rtk` explicitly for: `git commit`, `cargo build`, `uv run`, `ls -1`, `cat` (use `rtk read`), `du`, `shellcheck`, `bunx`.
- User TOML filters (`~/AppData/Roaming/rtk/filters.toml`: ssh, adb, tasklist, wsl, unzip, sqlite3, yt-dlp, javap, tombi, uv lock, fd, dust) are auto-rewritten, but only while trusted: trust is a SHA-256 of the file, so after ANY edit run `rtk trust -y` from that directory or every filter silently turns off. Use `"\\b"` escapes (TOML basic strings). Filters under a builtin prefix (`git ls-files`, `cargo tree`) are shadowed and never apply.
- Commit messages: `git commit -m "one line"` or `-F file`. Never `$(cat <<EOF ...)`; the whole command loses rtk.

<!-- CODEGRAPH_START -->
## CodeGraph

Query codegraph before grep/read in repos with `.codegraph/`. In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

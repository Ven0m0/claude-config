# Global instructions (pi)

Ported from `~/.claude/CLAUDE.md`. OMC (oh-my-claudecode) sections are intentionally left out.

## Tool Preferences
Prefer `fd`, `rg`, `jq`/`yq`, `uv` (python), `bun` (js/ts), `7z`, `markitdown` (doc conversion). Shell commands go through `rtk`; the Claude hook bridge rewrites safe shapes, so write `rtk ...` explicitly when unsure.
Search: use the pi-fff tools (`fffind`, `ffgrep`, `fff-multi-grep`) for file search. For structural (AST) code search or rewrite, use pi-lens `ast_grep_*` or `@ast-grep/cli` (`ast-grep` / `sg`) instead of regex.
Shell: both `bash` (Git Bash) and `powershell` tools exist. Use `powershell` for Windows-native work, `bash` for POSIX scripts.
Browser automation: always Patchright (stealth Playwright fork), never Playwright. MCP server: `patchright`. Python: `from patchright.sync_api import ...` via `uv run --with patchright`. Node: `patchright` package. Never install `playwright` or `@playwright/mcp` standalone.

## Docs Lookup
Before using or changing any library, framework, SDK, API, CLI tool, or dependency, and before assuming how a tool or project works, check current docs instead of answering from memory. Read its manifest first so lookups target the pinned version.
- Use `web_search` / `fetch_content` (pi-web-access) for docs pages.
- Skip for: refactoring, scripts from scratch, business-logic debugging, code review, general programming concepts.

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
- Review first: when asked to review or analyze, do that and report findings before changing anything.
- Humble language: do not claim "success" without verification. "Successfully" only when tests prove it.

## Memory (Mandatory)
Obsidian vault at `$env:USERPROFILE\Nextcloud\obsidian-vault` is the canonical durable brain. It outranks project-scoped memory and harness auto-memory for anything that should survive this session. This applies in every project.
Write the moment one of these happens, without waiting to be asked: a preference stated, a decision made (+ why), a bug root-caused, a correction or feedback given, a workflow worked out, or a tool/credential/external-resource fact learned.
1. Check first: does `index.md` then the relevant `_about.md` already cover this? Update, do not duplicate. Search the vault with the `obsidian-hybrid-search` MCP `search` tool (hybrid mode) before `rg`.
2. Write an atomic note in `Memory/` (fact, decision, preference), `Knowledge/` (synthesized topic), or `Projects/` (active work) via the vault's `new-note` skill. Full protocol: `$env:USERPROFILE\Nextcloud\obsidian-vault\CLAUDE.md`.
3. Wikilink it and add a pointer under the folder's `_about.md`.
Before ending any task, check whether it produced a durable learning. If so, write it before reporting completion.

## Persistent memory (ICM)
ICM stores memory across sessions and is exposed through the `icm` MCP server (`icm_memory_recall`, `icm_memory_store`, ...) plus bridged hooks. Use it actively.
- Recall before starting work: `icm_memory_recall` with a short query, or `icm.exe recall "query"`.
- Store immediately (before replying) when: an error is resolved (topic `errors-resolved`, importance high), an architecture or design decision is made (`decisions-{project}`, high), a user preference is discovered (`preferences`, critical), a significant task completes (`context-{project}`, high), or ~20 tool calls pass without a store.
- Do not store trivial details, anything already in this file, or ephemeral state.
- Memoirs (`icm_memoir_*`) hold durable structured knowledge that must not decay.

## CodeGraph
In repositories with a `.codegraph/` directory at the root, use `codegraph_explore` (MCP server `codegraph`) BEFORE grep, find, or reading files when you need to understand or locate code. It returns the relevant symbols' verbatim source plus call paths in one call. If there is no `.codegraph/` directory, skip it; indexing is the user's decision.

## RTK
RTK is a token-optimized CLI proxy. Rewriting happens automatically through the bridged `rtk hook claude`; never add a second rewriter. Pipes disable rtk for the whole command, so prefer native flags (`rtk read f --max-lines N`) over `| head`. Commit messages: `git commit -m "one line"` or `-F file`, never a heredoc through `$(cat ...)`.

## Pi specifics
- Claude plugins are managed with `/claude:plugin`; on Windows, plugin commands appear as `/plugin.cmd`.
- Subagents come from pi-subagents; ported agents live in `~/.pi/agent/agents/`.
- Skills load from `~/.agents/skills`, `~/.claude/skills` and installed plugins.

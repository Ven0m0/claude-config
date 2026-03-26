<!-- title: implement-plan -->
<!-- target: claude-code -->
<!-- config:
  LANG     = typescript   # LSP + ToolSearch hint
  PARALLEL = true         # false = sequential
-->

<investigate_before_answering>
1. `rg -l '' -g 'AGENTS.md' -g 'CLAUDE.md'` — read every result
2. `rg -l '' -g '*plan*.md' -g '*PLAN*.md'` — read plan in full
3. `ToolSearch` — discover MCP servers (LSP, git, browser)
4. LSP `workspace/symbol ""` — index workspace symbols
</investigate_before_answering>

<use_parallel_tool_calls>
- `rg -l "TODO|FIXME|HACK"`
- `ToolSearch "lsp {LANG}"`
- LSP `documentSymbol` on all relevant files
</use_parallel_tool_calls>

<instructions>
1. Parse plan: extract T-ID, title, acceptance criteria, dependencies. Produce dependency-ordered list.

2. If PARALLEL=true, tmux session per independent task group:
```
   tmux new-session -d -s plan-impl
   tmux new-window -t plan-impl -n group-{N}
```
   If PARALLEL=false, single window, sequential.

3. Spawn sub-agent per window:
```
   tmux send-keys -t plan-impl:group-{N} "claude --dangerously-skip-permissions -p '{TASK_SLICE}'" Enter
```
   Each sub-agent gets: task slice + AGENTS.md/CLAUDE.md + LSP symbol map.

4. Per task:
   a. Resolve symbols via LSP `definition` + `references` before any edit.
   b. `ast-grep -p '{PATTERN}'` for structural search/rewrite.
   c. `rg -n '{SYMBOL}'` to confirm call sites.
   d. Edits via `str_replace` only.
   e. Assert 0 new LSP diagnostics after each edit.
   f. Use MCP servers (ToolSearch) for external I/O.

5. Poll: `tmux list-windows -t plan-impl`. On failure: pause window, surface diagnostic output, halt dependents.
</instructions>

<rules>
- `rg` not `grep`. `bun` not `npm`. `uv` not `pip`.
- `ast-grep` for structural matching — not regex over code.
- Never guess symbol locations — LSP or `rg` first.
- Re-read AGENTS.md / PLAN.md from disk even if in context.
- Never start a task with unresolved dependencies.
- Exclude: `.git/ node_modules/ vendor/ dist/ .venv/ generated/ *.min.* *.lock`
</rules>

<formatting>
```
[T-NNN] {title}
  status : RUNNING | DONE | FAILED
  window : plan-impl:group-{N}
  diff   : {N} files, {A}+ {D}-
  lsp    : 0 errors
  notes  : {blocking issues}
```
Final: summary table + per-task unified diffs.
</formatting>

<answer>
Success: all tasks DONE, 0 LSP errors, lint/tests pass per AGENTS.md.
Failure: FAILED task emits root cause with exact LSP / `rg` / `ast-grep` output.
</answer>

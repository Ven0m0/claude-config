# Claude Backlog

## Status

| Category    | Count | Status   |
| ----------- | ----- | -------- |
| Implemented | 1     | Shipped  |
| Reference   | 1     | Tracked  |
| Deferred    | 1     | Deferred |
| Completed   | 1     | Done     |

---

## Implemented

| Candidate        | Implementation                                                         | Notes                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Codebase indexer | [`skills/codebase-indexer/SKILL.md`](skills/codebase-indexer/SKILL.md) | Uses Serena or `ast-grep` plus `tree-sitter`-style indexing, then `repomix`, TOON shaping, and optional SQLite or Turso persistence. |

---

## Reference

| Candidate                                                  | Implementation                                                         | Notes                                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`token-pilot`](https://www.npmjs.com/package/token-pilot) | [`skills/codebase-indexer/SKILL.md`](skills/codebase-indexer/SKILL.md) | MIT MCP server for AST-aware lazy reads and token reduction; useful as design input, but not added to tracked `settings.json`. |

---

## Deferred

| Candidate                                                                         | Notes                                                                                                                                                           |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`jhlee0409/all-for-claudecode`](https://github.com/jhlee0409/all-for-claudecode) | MIT workflow plugin, but it overlaps with the enabled `everything-claude-code` bundle in `settings.json` plus local `prd`, `maintenance`, and review workflows. |

---

## Completed

| Candidate                | Implementation           | Notes                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.lsp.json` enhancements | [`.lsp.json`](.lsp.json) | `tombi`, `vtsls`, `basedpyright`, `yaml-language-server`, `vscode-json-language-server`, `vscode-html-language-server`, `vscode-css-language-server`, `rust-analyzer`, `dockerfile-language-server-nodejs`, `bash-language-server`, and `fish-lsp` are already configured. |

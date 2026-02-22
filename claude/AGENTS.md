## Tool Preferences

*Preferred CLI tools with specific use cases*

- **File Search**: Use `fd` over `find` - faster, respects .gitignore, better defaults
- **Text Search**: Use `rg` over `grep` - faster, respects .gitignore, better output formatting
- **Code Structure Search**: Use `ast-grep` for finding specific code patterns (classes, functions, interfaces)
- **Semantic Code Navigation**: Use LSP operations (goToDefinition, findReferences) for symbol navigation and refactoring - see LSP Enforcement below
- **Data Processing**: Use `jq -c` for JSON parsing/manipulation, `yq` for YAML/XML
- **File Listing**: Use `eza` over `ls` - better formatting, git integration, tree views
- **File Viewing**: Use `bat` over `cat` - syntax highlighting, line numbers, git integration
- **Text Processing**: Use `sed` for stream editing, `awk` for pattern scanning and processing

## LSP Enforcement

*Language Server Protocol for safe code operations*

**The Three Iron Laws:**
```
1. NO MODIFYING UNFAMILIAR CODE WITHOUT goToDefinition FIRST
2. NO REFACTORING WITHOUT findReferences IMPACT ANALYSIS FIRST
3. NO CLAIMING CODE WORKS WITHOUT LSP DIAGNOSTICS VERIFICATION
```

**When to Use LSP vs Grep/Glob:**
- **Symbol navigation**: LSP goToDefinition (not grep)
- **Find all usages**: LSP findReferences (not grep)
- **Type info/docs**: LSP hover (not reading multiple files)
- **File structure**: LSP documentSymbol (not grep)
- **Call graphs**: LSP incomingCalls/outgoingCalls (not grep)
- **Literal text search**: Grep (TODOs, strings, config)
- **File patterns**: Glob (discovering files by name)

**Pre-Edit Protocol (Mandatory):**
1. LSP goToDefinition → understand implementation
2. LSP findReferences → assess change impact
3. LSP hover → verify type signatures
4. THEN make changes

**Post-Edit Verification (Mandatory):**
1. LSP diagnostics → check for errors
2. Verify no new type errors
3. Confirm imports resolve
4. Validate interface contracts

**Usage:**
- Skill: `/lsp-enable` for enforcement and guidance
- Setup: `/lsp-setup` for project configuration
- Docs: `claude/docs/lsp-tools-integration.md`
- Reference: `claude/skills/lsp-enable/references/`

**Why LSP:** ~50ms vs 45s grep, exact semantic matches, no false positives, saves tokens on large codebases

## Code Standards

*Universal principles for writing quality code*

- **KISS**: Keep It Simple. Favor simple, maintainable solutions over clever code
- **YAGNI**: You Ain't Gonna Need It. Don't implement features or abstractions until actually needed
- **DRY**: Don't Repeat Yourself. Extract repeated logic into utility functions
- **Naming**: Use descriptive, self-documenting names. Prefer clarity over brevity (getUserById vs getUsr)
- **Function Size**: Keep functions small and focused on a single task. Split if doing multiple things
- **Fail Fast**: Validate inputs early and fail immediately with clear errors. Don't let invalid data propagate
- **Security**: Never log/commit secrets, validate all inputs, redact sensitive data in logs
- **Imports**: Group (stdlib -> third-party -> local), sort alphabetically within groups
- **Error Handling**: Handle errors gracefully with meaningful, actionable messages
- **Comments**: Explain "why" decisions were made, not "what" the code does
- **Testing**: Add tests following existing project patterns before marking work complete
- **Changes**: Make minimal, focused changes that solve one problem at a time
- **Immutability**: Create new objects, never mutate existing ones
- **File Size**: 200-400 lines typical, 800 max; extract utilities from large files

## Communication Style

*Preferences for code, comments, and documentation*

- **No Emojis**: Never use emojis in code, comments, commit messages, or documentation
- **No Em Dashes**: Avoid em dashes in writing; use hyphens (-) or restructure sentences
- **Clarity**: Write in clear, direct language without unnecessary embellishment
- **Review First**: When asked to review or analyze something, do that first and report findings before making any changes
- **Humble Language**: Avoid claiming "success" without verification. Only use "successfully" when tests prove it
  - Bad: "Successfully implemented feature X, ready for testing"
  - Good: "Implemented feature X, ready for testing"
  - Good: "Ran tests for feature X, they all completed successfully"

## Agent Orchestration

Agents live in `claude/agents/`. Delegate via `Task(subagent_type="agent-name", prompt="...")`.

| Agent | When to use |
| ----- | ----------- |
| general-purpose | Default; complex multi-step tasks, delegation |
| code-simplifier | Simplify/refine code without changing behavior |
| janitor | Cleanup, tech debt, dead code removal (includes safety rules for framework preservation) |
| merge-supervisor | Git merge conflict resolution |
| code-explorer | Trace execution, find patterns, map architecture (has feature-tracing and pattern-discovery modes) |
| context-manager | Context engineering, token optimization, multi-agent orchestration |
| bash-pro, python-pro, javascript-pro, typescript-pro, rust-pro | Language-specific implementation |
| mcp-expert | MCP server config and integration |
| dx-optimizer | Dev experience, tooling, workflow setup |
| llm-boost | LLM optimization: CLAUDE.md audit, skill/agent improvement, markdown compression |
| prd | Product requirements document |
| reverse-engineer | Binary analysis, RE toolchains, security research |
| turbo | Maximum speed, parallelize everything |

**Parallel execution**: Use parallel Task() for independent work (e.g. security analysis + performance review + type check in one turn).

**Multi-perspective**: For hard problems, use split roles: factual reviewer, senior engineer, security expert, consistency reviewer.

## Workflow and doc optimization

- **Large markdown**: Use **markdown-optimizer** agent for token-heavy docs (e.g. long reference files).
- **Data format (ZON/TOON/PLOON)**: Use **toon-formatter** skill for token-saving formats; see `claude/docs/toon.md`.
- **Model parameters**: Evidence-based tuning by task type in `claude/docs/llm-tuning.md`.
- **MCP without context bloat**: Use **mcp-mode** skill for many-tool servers; see `claude/rules/mcp.md`.
- **Skill token efficiency**: **skill-optimizer** skill (progressive disclosure, 500-line rule).
- **Markdown consistency**: **manage-markdown-docs** skill for non-SKILL/agent markdown (headers, footers, metadata).
- **Tool substitution**: **modern-tool-substitution** skill (fd, rg, bun, uv in generated code); aligns with Tool Preferences above.
- **Hooks**: **hooks-configuration** skill for hook lifecycle and config; see `claude/docs/hooks.md`.
- **TOON reference**: **ref-toon-format**, **use-toon** skills; `claude/docs/toon.md`; `claude/scripts/validate-toon.py`.
- **CLAUDE.md guide**: `claude/docs/claude-md-guide.md` for authoring best practices and scoring rubric.

## Progressive Disclosure

*Keep context lean and focused*

- Keep this file short and focused on high-frequency rules
- Move detailed workflows to SKILL.md files or references
- Prefer pointers to supporting docs over long code blocks

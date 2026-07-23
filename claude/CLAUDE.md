## Tool Preferences

_Preferred CLI tools with specific use cases_

- **File Search**: Use `fd` over `find` - faster, respects .gitignore, better defaults
- **Text Search**: Use `rg` over `grep` - faster, respects .gitignore, better output formatting
- **Code Structure Search**: Use `ast-grep` for finding specific code patterns (classes, functions, interfaces)
- **Semantic Code Navigation**: Use LSP operations (goToDefinition, findReferences) for symbol navigation and refactoring - see LSP Enforcement below
- **Data Processing**: Use `jq -c` for JSON parsing and manipulation, `yq` for YAML/XML
- **File Listing**: Use `eza` over `ls` - better formatting, git integration, tree views
- **File Viewing**: Use `bat` over `cat` - syntax highlighting, line numbers, git integration
- **Text Processing**: Use `sed` for stream editing, `awk` for pattern scanning and processing

## LSP Enforcement

_Language Server Protocol for safe code operations_

**The Three Iron Laws:**

```
1. NO MODIFYING UNFAMILIAR CODE WITHOUT goToDefinition FIRST
2. NO REFACTORING WITHOUT findReferences IMPACT ANALYSIS FIRST
3. NO CLAIMING CODE WORKS WITHOUT LSP DIAGNOSTICS VERIFICATION
```

**When to Use LSP vs Grep/Glob:**

- **Symbol navigation**: LSP goToDefinition (not grep)
- **Find all usages**: LSP findReferences (not grep)
- **Type info and docs**: LSP hover (not reading multiple files)
- **File structure**: LSP documentSymbol (not grep)
- **Call graphs**: LSP incomingCalls and outgoingCalls (not grep)
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

**Usage:** the `LSP` tool exposes goToDefinition/findReferences/hover/documentSymbol/diagnostics directly - no separate skill needed.

**Why LSP:** ~50ms vs 45s grep, exact semantic matches, no false positives, saves tokens on large codebases

## Code Standards

_Universal principles for writing quality code_

- **KISS**: Keep It Simple. Favor simple, maintainable solutions over clever code
- **YAGNI**: You Ain't Gonna Need It. Don't implement features or abstractions until actually needed
- **DRY**: Don't Repeat Yourself. Extract repeated logic into utility functions
- **Naming**: Use descriptive, self-documenting names. Prefer clarity over brevity (getUserById vs getUsr)
- **Function Size**: Keep functions small and focused on a single task. Split if doing multiple things
- **Fail Fast**: Validate inputs early and fail immediately with clear errors. Don't let invalid data propagate
- **Security**: Never log or commit secrets, validate all inputs, redact sensitive data in logs
- **Imports**: Group (stdlib -> third-party -> local), sort alphabetically within groups
- **Error Handling**: Handle errors gracefully with meaningful, actionable messages
- **Comments**: Explain "why" decisions were made, not "what" the code does
- **Testing**: Add tests following existing project patterns before marking work complete
- **Changes**: Make minimal, focused changes that solve one problem at a time
- **Immutability**: Create new objects, never mutate existing ones
- **File Size**: 200-400 lines typical, 800 max; extract utilities from large files

## Communication Style

_Preferences for code, comments, and documentation_

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

| Agent            | When to use                                                                      |
| ---------------- | --------------------------------------------------------------------------------- |
| general-purpose  | Default agent for multi-step engineering work; plans, executes, delegates        |
| language-expert  | Multi-language implementation (Bash, Python, JavaScript, TypeScript, Rust)       |
| maintenance      | Removes safe tech debt / dead code while preserving required framework behavior  |
| reverse-engineer | Authorized binary analysis, decompilation, defensive security research           |

**Parallel execution**: Use parallel Task() for independent work (e.g. security analysis + performance review + type check in one turn).

**Multi-perspective**: For hard problems, use split roles: factual reviewer, senior engineer, security expert, consistency reviewer.

## Doc optimization

- **Model parameters**: Evidence-based tuning by task type in `claude/docs/llm-tuning.md`.
- **Tool substitution**: fd/rg/bun/uv in generated code - see Tool Preferences above and the vault's Modern Tool Substitution note.
- **Hooks**: hook lifecycle and config - see `claude/docs/hooks.md` and `claude/settings.json`.
- **CLAUDE.md guide**: `claude/docs/claude-md-guide.md` for authoring best practices and scoring rubric.

## Session Management

_Keep sessions focused and context clean_

- For ~ and GitHub work, break sessions into focused tasks of 15-20 turns. Use /clear between subtasks. Start a fresh session for each new feature or bug fix.

## Prompt Best Practices

_How to request changes effectively_

When requesting changes, specify: (1) the action verb, (2) the target file or component, (3) the expected behavior.

Example: instead of "fix the bug", say "fix the null pointer in the auth handler when user.email is missing".

## Progressive Disclosure

_Keep context lean and focused_

- Keep this file short and focused on high-frequency rules
- Move detailed workflows to SKILL.md files or references
- Prefer pointers to supporting docs over long code blocks

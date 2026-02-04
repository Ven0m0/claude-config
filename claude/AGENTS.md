## Tool Preferences

*Preferred CLI tools with specific use cases*

- **File Search**: Use `fd` over `find` - faster, respects .gitignore, better defaults
- **Text Search**: Use `rg` over `grep` - faster, respects .gitignore, better output formatting
- **Code Structure Search**: Use `ast-grep` for finding specific code patterns (classes, functions, interfaces)
- **Interactive Selection**: Use `fzf` for fuzzy finding and selecting from lists/results
- **Data Processing**: Use `jq` for JSON parsing/manipulation, `yq` for YAML/XML
- **File Listing**: Use `eza` over `ls` - better formatting, git integration, tree views
- **File Viewing**: Use `bat` over `cat` - syntax highlighting, line numbers, git integration
- **Text Processing**: Use `sed` for stream editing, `awk` for pattern scanning and processing
- **Cloud Platforms**: Use `aws` CLI for AWS, `az` CLI for Azure
- **Infrastructure**: Use `terraform` for IaC provisioning, `terraform-docs` for generating documentation

## Code Standards

*Universal principles for writing quality code*

- **KISS**: Keep It Simple. Favor simple, maintainable solutions over clever code
- **YAGNI**: You Ain't Gonna Need It. Don't implement features or abstractions until actually needed
- **DRY**: Don't Repeat Yourself. Extract repeated logic into utility functions
- **Naming**: Use descriptive, self-documenting names. Prefer clarity over brevity (getUserById vs getUsr)
- **Function Size**: Keep functions small and focused on a single task. Split if doing multiple things
- **Fail Fast**: Validate inputs early and fail immediately with clear errors. Don't let invalid data propagate
- **Security**: Never log/commit secrets, validate all inputs, redact sensitive data in logs
- **Imports**: Group (stdlib → third-party → local), sort alphabetically within groups
- **Error Handling**: Handle errors gracefully with meaningful, actionable messages
- **Comments**: Explain "why" decisions were made, not "what" the code does
- **Testing**: Add tests following existing project patterns before marking work complete
- **Changes**: Make minimal, focused changes that solve one problem at a time

## Communication Style

*Preferences for code, comments, and documentation*

- **No Emojis**: Never use emojis in code, comments, commit messages, or documentation
- **No Em Dashes**: Avoid em dashes (—) in writing; use hyphens (-) or restructure sentences
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
| code-simplifier, simplifier | Simplify/refine code without changing behavior |
| markdown-optimizer | Optimize markdown for LLM context efficiency |
| janitor, unused-code-cleaner | Cleanup, tech debt, dead code removal |
| merge-supervisor | Git merge conflict resolution |
| code-explorer, codebase-pattern-finder | Trace execution, find patterns, map architecture |
| context-manager, context-architect | Context engineering, multi-agent orchestration |
| bash-pro, python-pro, javascript-pro, typescript-pro, rust-pro | Language-specific implementation |
| mcp-expert | MCP server config and integration |
| dx-optimizer | Dev experience, tooling, workflow setup |
| improve-agent | Agent performance optimization, prompt engineering, run optimizations on agents |
| claudemd, claude-md-auditor | CLAUDE.md optimize/audit/migrate |
| skill-auditor | Skill definitions and validation |
| prd | Product requirements document |
| repomix-explorer | Analyze codebase via Repomix |
| reverse-engineer | Binary analysis, RE toolchains, security research |
| turbo | Maximum speed, parallelize everything |

**Parallel execution**: Use parallel Task() for independent work (e.g. security analysis + performance review + type check in one turn).

**Multi-perspective**: For hard problems, use split roles: factual reviewer, senior engineer, security expert, consistency reviewer.

## Workflow and doc optimization

- **Large markdown**: Use **markdown-optimizer** agent for token-heavy docs (e.g. long reference files).
- **Data format (ZON/TOON/PLOON)**: Use **smart-format** skill (`decide-format [directory]`) to choose token-saving format for data files.
- **Model parameters**: Evidence-based tuning by task type in `claude/docs/llm-tuning.md`; see **llm-tuning-patterns** skill.
- **MCP without context bloat**: Use **mcp-mode** skill for many-tool servers; see `claude/rules/mcp.md` (Token-efficient MCP).
- **Skill token efficiency**: **skill-optimizer** skill (progressive disclosure, 500-line rule); **llm-docs-optimizer** for doc restructuring.
- **Markdown consistency**: **manage-markdown-docs** skill for non-SKILL/agent markdown (headers, footers, metadata).
- **Tool substitution**: **modern-tool-substitution** skill (fd, rg, bun, uv in generated code); aligns with Tool Preferences above.
- **Hooks**: **hooks-configuration** skill for hook lifecycle and config; see `claude/docs/hooks.md`.
- **TOON reference**: **ref-toon-format**, **use-toon** skills; `claude/docs/toon.md`; `claude/scripts/validate-toon.py`.
- **Token and context**: Consolidated list in `claude/docs/token-and-context-optimization.md`.

## Progressive Disclosure

*Keep context lean and focused*

- Keep this file short and focused on high-frequency rules
- Move detailed workflows to SKILL.md files or references
- Prefer pointers to supporting docs over long code blocks

# claude/rules/

## Responsibility
Development standards and behavioral constraints loaded by Claude Code. Rules define hard constraints (constitution), coding standards, tool preferences, workflow enforcement, and language-specific conventions.

## Design
Hierarchical rule organization: root-level rules for cross-cutting concerns, subdirectories for categorized rules. Some language rules use `paths:` frontmatter for conditional loading (only active when matching files exist). Rules are loaded into agent context as behavioral constraints.

## Contents

### Root-level Rules
| Rule | Purpose |
|------|---------|
| `context-continuation.md` | Endless mode: save state and continue in new session at critical context levels |
| `context-management.md` | Context window management constraints |
| `context7-docs.md` | Mandatory Context7 usage for unfamiliar library documentation |
| `debugging.md` | Debugging workflow rules |
| `gh-cli.md` | Use `gh` for all GitHub operations |
| `git.md` | Git rules: read-only by default, safe operations |
| `hooks.md` | Hook system rules and types |
| `learn.md` | Online learning system: evaluate sessions for extractable knowledge |
| `mcp.md` | MCP server rules and token-efficient MCP mode |
| `memory.md` | Persistent memory via Claude-Mem MCP (3-layer workflow) |
| `patterns.md` | Common API response format patterns |
| `security.md` | Mandatory security checks before commits |
| `skills.md` | Skill structure and authoring rules |
| `subagents.md` | When and how to use subagents |
| `testing.md` | TDD mandatory workflow: no production code without failing test |
| `tool-usage.md` | Mandatory tool preferences (rg over grep, fd over find) |
| `verification-before-completion.md` | Evidence before claims: never claim success without verification |
| `vexor-search.md` | Semantic code search via Vexor CLI |
| `web-search.md` | Web search via MCP tools (built-in blocked by hook) |
| `workflow-enforcement.md` | Task management for non-spec work |

### Subdirectory: core/
- `constitution.md` -- Hard rules: orchestrator delegation, response language, core principles

### Subdirectory: development/
- `coding-standards.md` -- Optimized coding conventions (beyond Claude's defaults)
- `skill-authoring.md` -- Skill creation guidelines (agentskills.io standard)

### Subdirectory: languages/
Conditional rules (loaded only when matching file types exist):
- `go.md`, `java.md`, `javascript.md`, `kotlin.md`, `python.md`, `rust.md`, `typescript.md`

### Subdirectory: workflow/
- `file-reading-optimization.md` -- Efficient file reading to minimize token consumption
- `workflow-modes.md` -- Three-phase SPEC-First DDD workflow

## Integration
- Loaded by: Claude Code as behavioral constraints in agent context
- Referenced by: AGENTS.md, agent prompts, CLAUDE.md
- Conditional loading: Language rules via `paths:` frontmatter

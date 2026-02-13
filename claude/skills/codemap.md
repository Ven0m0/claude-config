# claude/skills/

## Responsibility
Reusable skill definitions for Claude Code. Each skill is a self-contained workflow template with instructions, references, and optional scripts. Skills are the primary mechanism for extending Claude Code's capabilities without consuming permanent context.

## Design
Each skill lives in its own subdirectory containing a `SKILL.md` (main instructions) and optional `modules/`, `references/`, `scripts/`, `templates/` subdirectories. Skills use YAML frontmatter for metadata (`description`, triggers, dependencies). Progressive disclosure: SKILL.md is loaded on-demand, not permanently in context.

## Skills by Category

### Code Quality & Analysis (7)
| Skill | Purpose |
|-------|---------|
| `code-antipatterns-analysis` | Detect anti-patterns via ast-grep structural matching |
| `linter-autofix` | Cross-language linter autofix (biome, ruff, clippy, shellcheck) |
| `vulture-dead-code` | Dead code detection |
| `json-repair` | JSON validation and repair |
| `optimizing-performance` | Frontend/backend/database performance optimization |
| `python-optimization` | Python async, profiling, memory optimization |
| `bash-optimizer` | Bash script performance and standards |

### Search & Navigation (5)
| Skill | Purpose |
|-------|---------|
| `ast-grep-search` | AST-based structural code search and replace |
| `mgrep-code-search` | Semantic code search via mgrep (natural language queries) |
| `morph-search` | Fast codebase search via WarpGrep (20x faster than grep) |
| `lsp-enable` | LSP-first semantic code navigation enforcement |
| `never-guess` | Behavioral principle: never guess when uncertain |

### Agent Orchestration (4)
| Skill | Purpose |
|-------|---------|
| `agent-orchestration-rules` | Rules for background agent execution |
| `parallel-execution` | Parallel subagent spawning via Task tool |
| `ultrapilot` | Parallel autopilot with file ownership partitioning |
| `ecomode` | Token-efficient parallel execution using Haiku/Sonnet |

### MCP & Tool Integration (4)
| Skill | Purpose |
|-------|---------|
| `mcp-builder` | Create MCP servers (FastMCP Python, MCP SDK TypeScript) |
| `mcp-to-skill-converter` | Convert MCP servers to skills (90%+ context savings) |
| `mcp-tools-as-code` | Convert MCP to typed TypeScript APIs (98%+ token reduction) |
| `modern-tool-substitution` | Substitute modern tools (npm->bun, grep->rg, pip->uv) |

### Language-Specific (7)
| Skill | Purpose |
|-------|---------|
| `javascript` | JavaScript patterns and references |
| `typescript` | TypeScript advanced types and patterns |
| `rust` | Rust development patterns |
| `ruff` | Ruff linter/formatter for Python |
| `uv` | uv package manager for Python |
| `cargo-tools` | Cargo tooling for Rust |
| `python-project-development` | Production Python projects (CLI, PyPI, pyproject.toml) |

### Data & Formatting (5)
| Skill | Purpose |
|-------|---------|
| `data-formats` | Format conversion utilities |
| `toon-formatter` | TOON v2.0 format for token-minimized structured data |
| `ref-toon-format` | TOON format knowledge and patterns |
| `use-toon` | TOON for agent prompts and subagent communication |
| `render-output` | Structured data to terminal rendering |

### Git & GitHub (3)
| Skill | Purpose |
|-------|---------|
| `git-cli-agentic` | Git commands optimized for AI agent workflows |
| `github` | GitHub integration patterns |
| `zagi-git` | Zagi agent-optimized Git interface |

### Documentation & Knowledge (4)
| Skill | Purpose |
|-------|---------|
| `manage-markdown-docs` | Standardize markdown with headers/footers |
| `learner` | Extract reusable skills from debugging sessions |
| `self-reflection` | Continuous self-improvement through structured reflection |
| `prd` | Product requirements document generation |

### Workflow & Context (5)
| Skill | Purpose |
|-------|---------|
| `sequential-thinking` | Step-by-step reasoning with revision and branching |
| `strategic-compact` | Suggest `/compact` at strategic workflow points |
| `ralph-planner` | Unified planner+executor for continuous workflow |
| `code-execution` | Execute Python locally with marketplace API access |
| `hooks-configuration` | Hook lifecycle and configuration |

### External Tools (5)
| Skill | Purpose |
|-------|---------|
| `gemini-cli` | Gemini CLI for alternative AI perspectives |
| `repomix` | Package repos into AI-friendly single files |
| `image-optimization` | Image compression and modern formats (WebP, AVIF) |
| `file-organizer` | File/folder organization and deduplication |
| `using-tmux-for-interactive-commands` | Control interactive CLIs via tmux |

### Specialized (5)
| Skill | Purpose |
|-------|---------|
| `codeagent` | Multi-backend AI code tasks (Codex, Claude, Gemini) |
| `morph-apply` | Fast file editing via Morph Apply API |
| `protocol-reverse-engineering` | Network protocol reverse engineering |
| `llm-boost` | LLM optimization toolkit |
| `svg` | SVG creation and optimization |

### MoAI Framework (3)
| Skill | Purpose |
|-------|---------|
| `moai` | MoAI orchestration workflows and parallel development |
| `moai-foundation-claude` | MoAI foundation for Claude Code integration |
| `moai-foundation-context` | Enterprise context and session management |

## Integration
- Loaded by: Claude Code on-demand via `/skill skill-name` or agent `skills:` frontmatter
- Depends on: External tools referenced in scripts (rg, fd, ast-grep, ruff, etc.)
- Pattern: Skill loaded -> instructions in context -> executed -> unloaded

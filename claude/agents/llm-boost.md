---
name: llm-boost
description: |
  Unified LLM optimization toolkit. Audit, optimize, create, or migrate CLAUDE.md files.
  Audit and optimize Claude Code skills for compliance and token efficiency.
  Improve agent prompts. Compress markdown for LLM context. Create and optimize
  XML tag structures for prompt engineering. Generate llms.txt and optimize c7score.
  Use when asked to: audit/score/review CLAUDE.md, optimize/improve/refactor skills or agents,
  compress/dedupe markdown, create XML tags for prompts, generate llms.txt, optimize c7score,
  tune LLM parameters, or migrate to Opus 4.5+.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
model: opus
argument-hint: "[audit|optimize|create|migrate|skill|agent|xml|llmstxt|c7score|tune]"
---

# LLM Boost

Unified toolkit for optimizing LLM-facing content: CLAUDE.md files, skills, agents, markdown,
XML tag structures, llms.txt, c7score, and LLM parameters.

## Routing

| Intent | Mode | Section |
|--------|------|---------|
| audit, score, review, assess CLAUDE.md | **CLAUDE.md Audit** | §1 |
| optimize, improve, refactor CLAUDE.md | **CLAUDE.md Optimize** | §1 |
| create, new, build CLAUDE.md | **CLAUDE.md Create** | §1 |
| migrate, opus, upgrade CLAUDE.md | **CLAUDE.md Migrate** | §1 |
| audit skill, fix skill, compliance | **Skill Audit** | §2 |
| optimize skill, compress skill, token | **Skill Optimize** | §2 |
| improve agent, optimize agent | **Agent Improve** | §3 |
| compress markdown, dedupe, restructure | **Markdown Optimize** | §4 |
| xml tags, prompt structure, tag design | **XML Tags** | §5 |
| llms.txt, c7score, docs optimization | **Docs Optimize** | §6 |
| tune, temperature, tokens, parameters | **LLM Tuning** | §7 |

If intent unclear from $ARGUMENTS, ask which mode.

## Core Principles

| Principle | Guideline |
|-----------|-----------|
| LLMs are stateless | CLAUDE.md is the only persistent context |
| Instruction budget | ~100-150 instructions for CLAUDE.md |
| Conciseness | CLAUDE.md <300 lines, skills <500 lines |
| Ground truth | Every claim must be verifiable in codebase |
| Progressive disclosure | Reference detailed docs, don't duplicate |
| Token efficiency | Tables 5x prose, code examples 10x prose |

**4-Tier CLAUDE.md Hierarchy** (specific → general):
1. `./CLAUDE.local.md` (gitignored)
2. `./CLAUDE.md` (<300 lines)
3. `~/.claude/CLAUDE.md` (<60 lines)
4. Enterprise system-wide policies

---

## §1 CLAUDE.md Operations

### Audit

1. Read `.claude.md` or `CLAUDE.md`
2. Discover project: `Glob("package.json|Cargo.toml|pyproject.toml")`
3. Verify EVERY claim against codebase:

| Claim Type | Verification |
|------------|--------------|
| Tech stack | `Read("package.json")` - actual versions |
| File paths | `Glob("path/to/claimed/file")` |
| Commands | `Grep("script-name", glob="package.json")` |
| Testing | `Glob("**/*.test.*")` - framework used |
| Linting | `Glob("**/biome.json\|**/.eslintrc*")` |

4. Flag: outdated refs, invented features, code duplication, style policing, >300 lines
5. Output audit report with verified/incorrect counts and priority fixes

### Optimize

1. Audit first (above)
2. Apply format efficiency: tables > bullets > prose, code pointers over snippets
3. Cut to instruction budget, use `@import` for detail
4. Ensure WHAT/WHY/HOW structure

### Create

1. Discover project structure, stack, tooling
2. Build from template: project overview → dev workflow → conventions → boundaries
3. Always/Ask/Never boundary section
4. Stay under 300 lines, reference external docs

### Migrate (Opus 4.5+)

1. Soften absolute language ("MUST" → "prefer", "NEVER" → "avoid unless")
2. Remove over-specification Opus handles natively
3. Add reasoning cues: "First verify...", "Before proceeding..."

---

## §2 Skill Operations

### Skill Audit

Check against compliance standards:

| Check | Requirement |
|-------|-------------|
| Frontmatter | `name` (kebab-case, ≤64 chars), `description` (≤1024 chars) |
| Description | Includes "what" + "when to use" + trigger phrases |
| Line count | SKILL.md ≤500 lines |
| Structure | Overview, Instructions, Examples minimum |
| Tools | `allowed-tools` uses least privilege |
| Hierarchy | References ≤1 level deep from SKILL.md |

Auto-fix: missing license → MIT, unscoped Bash → scoped, missing triggers → infer.
Manual review: missing sections, major rewrites.

### Skill Optimize

**Modes by size:**

| Mode | Token Range | Action |
|------|-------------|--------|
| Light | <3K | Tighten wording, add YAML if missing |
| Standard | 3K-6K | Consolidate, prefer tables, one example |
| Aggressive | 6K-10K | Table everything, strip filler |
| Split | ≥10K | Propose 3-4 files + index |

**500-line rule** — keep in SKILL.md: purpose, quick start, critical practices, brief examples, cross-refs. Move out: API docs, extensive examples, troubleshooting, pattern libraries, schemas.

**Progressive disclosure**: Level 1 (metadata ~100 tokens) → Level 2 (instructions <5K) → Level 3 (resources on-demand).

---

## §3 Agent Improvement

1. Resolve target: agent name → `claude/agents/{name}.md`
2. Read and analyze: frontmatter, role, sections, constraints, examples
3. Apply techniques:

| Technique | Implementation |
|-----------|----------------|
| Role definition | One-sentence mission + explicit constraints |
| Chain-of-thought | Reasoning cues: "First...", "Before proceeding, verify..." |
| Constitutional checks | 2-5 self-check principles |
| Output format | Template or required elements list |
| Few-shot | One good + one bad example with rationale |
| XML structuring | Wrap distinct sections in semantic tags |

4. Write edits, summarize: what changed, which techniques, expected impact
5. Never remove safety/constraint language or add unavailable tools

---

## §4 Markdown Optimization

**Modes** (same as skill optimize):
- Light (<3K): trim, tighten, add YAML
- Standard (3K-6K): consolidate, tables over prose
- Aggressive (6K-10K): table everything, strip filler
- Split (≥10K): propose logical split + index

**Guardrails**: preserve technical accuracy, never drop References/Works Cited, dedupe only exact duplicates. If `optimization_version: "1.1"` present, report already optimized.

---

## §5 XML Tag Operations

### When to Use XML Tags

- Multiple components in prompt (context, instructions, examples, data)
- Need parseable output for post-processing
- Complex prompts mixing CoT, multishot, and structured data
- Separating user input from system instructions

### Tag Design Principles

| Principle | Guideline |
|-----------|-----------|
| Semantic naming | Tag names describe content: `<contract>`, `<instructions>` |
| Consistency | Same tag names throughout prompt, reference by name |
| Nesting | `<outer><inner></inner></outer>` for hierarchy |
| No canonical tags | No "best" tags — name them for your use case |
| Combine techniques | Pair with CoT (`<thinking>`/`<answer>`) and multishot (`<examples>`) |
| Parseability | Use tags in output for easy extraction |

### Core Patterns

**Multi-document**: `<document index="1">...</document>` with `<source>` and `<content>` children.

**Structured evaluation**: `<rubric>` + `<submission>` → `<evaluation><score>` + `<feedback>`.

**CoT separation**: `<thinking>` for reasoning, `<answer>` for final output.

**Multishot examples**: `<examples><example><input>...</input><output>...</output></example></examples>`.

**Guard rails**: `<instructions>` with `<formatting>` sub-tags to prevent mixing.

**Conditional workflow**: `<context>` + `<rules>` + `<task>` with branching logic.

### XML Tag Creation Workflow

1. Identify distinct prompt components (context, instructions, data, examples, output format)
2. Assign semantic tag names matching content
3. Design nesting hierarchy for related components
4. Add index/id attributes for multi-item collections
5. Define output tags for parseable responses
6. Reference tags explicitly in instructions: "Using the data in `<dataset>` tags..."
7. Test with sample inputs, verify tag boundaries don't leak

### Post-Processing Output Tags

```python
import re
def extract_tag(text, tag):
    match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)
    return match.group(1).strip() if match else None
```

---

## §6 Documentation Optimization

### c7score

| Metric | Weight | Focus |
|--------|--------|-------|
| Question-Snippet Match | 80% | Do snippets answer "How do I..." questions? |
| LLM Evaluation | 5% | Relevancy, clarity, correctness |
| Formatting | 5% | Structure, language tags |
| Project Metadata | 5% | No licensing/directory trees |
| Initialization | 5% | More than just imports |

**Workflow**: analyze docs → generate 15-20 dev questions → map to snippets → fill gaps → validate.

Load skill `llm-boost` for detailed patterns and reference files.

### llms.txt Generation

**Structure**: H1 title (required) → blockquote summary → key features → H2 sections with `- [Title](full-url): description`.

**Rules**: H1 and H2 only, full URLs, "Optional" section for secondary resources, link to .md files, no code blocks.

Load skill `llm-boost` for templates and examples.

---

## §7 LLM Tuning

| Task | max_tokens | temperature | top_p |
|------|------------|-------------|-------|
| Theorem proving | 4096 | 0.6 | 0.95 |
| Code generation | 2048 | 0.2-0.4 | — |
| Creative/exploration | 4096 | 0.8-1.0 | — |

**Anti-patterns**: too low tokens for proofs (truncates CoT), too low temp for proofs (misses creative paths), no proof plan before tactics.

---

## Self-Check Before Output

1. Target file path is correct
2. Edits preserve existing frontmatter and safety language
3. All claims verified against codebase (for audits)
4. Line counts within limits (CLAUDE.md <300, skills <500)
5. Summary lists concrete changes and techniques used
6. XML tags use semantic names consistent with content

---
name: llm-boost
description: |
  Optimize LLM-facing content: documentation c7score, llms.txt generation, Claude Code skill
  optimization, XML tag structuring for prompts, CLAUDE.md auditing, and LLM parameter tuning.
  Use when optimizing docs for AI assistants, creating llms.txt, improving c7score, optimizing
  skills for token efficiency, applying 500-line rule, implementing progressive disclosure,
  designing XML tag structures for prompts, auditing CLAUDE.md files, tuning LLM temperature
  and token settings, or compressing markdown for context efficiency.
user-invocable: true
disable-model-invocation: false
---

# LLM Boost Skill

Optimize all LLM-facing content: documentation, skills, prompts, and parameters.

## Quick Reference

### c7score Metrics
| Metric | Weight | Focus |
|--------|--------|-------|
| Question-Snippet Match | 80% | Snippets answer developer questions |
| LLM Evaluation | 5% | Relevancy, clarity, correctness |
| Formatting | 5% | Structure, language tags |
| Project Metadata | 5% | No irrelevant content |
| Initialization | 5% | More than just imports |

### Skill Optimization Targets
| Level | Content | Token Cost |
|-------|---------|------------|
| L1: Metadata | YAML frontmatter | ~100 tokens/skill |
| L2: Instructions | SKILL.md body | <5K tokens |
| L3: Resources | Reference files | On-demand only |

### LLM Tuning Quick Ref
| Task | max_tokens | temperature |
|------|------------|-------------|
| Theorem proving | 4096 | 0.6 |
| Code generation | 2048 | 0.2-0.4 |
| Creative tasks | 4096 | 0.8-1.0 |

---

## Documentation Optimization

### c7score Workflow

1. **Analyze**: Read README.md, docs/*.md. Optionally run `python scripts/analyze_docs.py <path>`
2. **Generate questions**: Create 15-20 "How do I..." questions covering setup, auth, basic usage, errors, advanced features, integrations
3. **Map questions to snippets**: ✅ complete answers, ⚠️ partial, ❌ missing (prioritize these)
4. **Optimize** by priority:

| Priority | Weight | Action |
|----------|--------|--------|
| P1: Question coverage | 80% | Add complete code for unanswered questions |
| P2: Remove duplicates | 5% | Consolidate similar snippets |
| P3: Fix formatting | 5% | Proper language tags, TITLE/DESCRIPTION/CODE |
| P4: Remove metadata | 5% | Strip licensing, directory trees, citations |
| P5: Enhance init | 5% | Combine import-only with usage examples |

5. **Validate** each snippet: runs standalone, answers specific question, proper format, includes imports
6. **Score** before vs after across all 5 metrics

### Snippet Transformation Patterns

**API ref → usage example**: Replace method signatures with complete working code including imports, setup, and expected output.

**Import-only → complete setup**: Combine `from lib import X` with actual usage showing real output.

**Multiple fragments → one comprehensive**: Merge related 1-2 line snippets into one complete workflow.

**Remove metadata**: Strip directory trees, license text, BibTeX citations entirely.

For detailed patterns: [references/optimization_patterns.md](references/optimization_patterns.md)
For scoring rubrics: [references/c7score_metrics.md](references/c7score_metrics.md)

---

## llms.txt Generation

### Structure
```markdown
# Project Name
> Brief description (1-3 sentences)

Key features:
- Feature 1
- Feature 2

## Documentation
- [Guide](https://full-url/guide.md): Getting started

## Examples
- [Basic](https://full-url/basic.md): Simple usage

## Optional
- [Blog](https://full-url/blog/): News and updates
```

### Rules
- H1 title required, H2 sections only (no H3+)
- Full URLs with protocol, prefer .md files
- `- [Title](url): description` link format
- "Optional" section = skippable for shorter context
- No code blocks, images, or complex formatting
- Place at repo root as `/llms.txt`

### Section Templates by Project Type

| Type | Must Have | Should Have |
|------|----------|-------------|
| Library | Documentation, API Reference, Examples | Getting Started, Development |
| CLI Tool | Getting Started, Commands, Examples | Configuration, Development |
| Framework | Documentation, Guides, API Reference, Examples | Integrations |
| Skill | Documentation, Reference Materials | Examples, Development |

For templates and examples: [examples/sample_llmstxt.md](examples/sample_llmstxt.md)
For format specification: [references/llmstxt_format.md](references/llmstxt_format.md)

---

## Skill Optimization

### 500-Line Rule

**Keep in SKILL.md**: purpose, quick start, critical practices, brief examples (5-10 lines), cross-references to detail files.

**Move to reference files**: API docs, extensive examples (>20 lines), troubleshooting, pattern libraries, schemas, long tables.

### Optimization Modes

| Mode | Size | Action |
|------|------|--------|
| Light | <3K tokens | Tighten wording, add YAML if missing |
| Standard | 3K-6K | Consolidate, tables over prose, one example |
| Aggressive | 6K-10K | Table everything, strip filler |
| Split | ≥10K | Propose 3-4 files + index |

### YAML Frontmatter Optimization

Description field (max 1024 chars) must include: what the skill does, when to use it (trigger scenarios), key technologies/file types, action verbs. Write in third person.

```yaml
# Good: specific, trigger-rich
description: Extract text and tables from PDF files. Use when working with PDFs, forms, or document extraction.

# Bad: vague
description: Helps with documents.
```

### File Structure Pattern
```
skill-name/
├── SKILL.md              # ≤500 lines, workflows & quick ref
├── REFERENCE.md          # Comprehensive documentation
├── EXAMPLES.md           # Detailed code examples
└── scripts/              # Executable utilities
```

### Progressive Disclosure Pattern
```markdown
## Topic Overview
Brief explanation (2-3 sentences).

**Quick Example:**
(5-10 line code block)

**For detailed docs**: [REFERENCE.md](REFERENCE.md#topic)
**For more examples**: [EXAMPLES.md](EXAMPLES.md#topic)
```

### Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Monolithic 1000+ line SKILL.md | Split into main + reference files |
| References not linked from SKILL.md | Add cross-references |
| Nested references (>1 level) | Flatten to max 1 level |
| Sparse YAML description | Enrich with trigger keywords |
| 100+ line scripts in markdown | Move to scripts/ directory |

For detailed optimization patterns: [references/skill_optimization.md](references/skill_optimization.md)

---

## XML Tag Structuring

### Why XML Tags
- **Clarity**: Separate prompt components (context, instructions, examples, data)
- **Accuracy**: Prevent Claude from mixing instructions with examples
- **Parseability**: Extract specific parts from output via post-processing
- **Flexibility**: Add/remove/modify prompt sections independently

### Design Principles

| Principle | Guideline |
|-----------|-----------|
| Semantic naming | Tag names describe content: `<contract>`, `<rubric>` |
| Consistency | Same tag names throughout; reference by name in instructions |
| Nesting | `<outer><inner></inner></outer>` for hierarchy |
| No canonical tags | No "best" tags — name for your use case |
| Combine techniques | Pair with CoT (`<thinking>`/`<answer>`) and multishot (`<examples>`) |

### Core Tag Patterns

**Multi-document input**:
```xml
<documents>
  <document index="1">
    <source>filename.md</source>
    <content>...</content>
  </document>
</documents>
```

**Structured evaluation**:
```xml
<rubric>Criteria here</rubric>
<submission>Content to evaluate</submission>
<!-- Output: -->
<evaluation>
  <score>85</score>
  <feedback>Specific feedback</feedback>
</evaluation>
```

**CoT separation**:
```xml
<thinking>Step-by-step reasoning here</thinking>
<answer>Final concise answer</answer>
```

**Multishot examples**:
```xml
<examples>
  <example>
    <input>User request</input>
    <output>Expected response</output>
  </example>
</examples>
```

**Guard rails**:
```xml
<instructions>
  <task>What to do</task>
  <formatting>How to format output</formatting>
  <constraints>What to avoid</constraints>
</instructions>
```

**Conditional workflow**:
```xml
<context>Background information</context>
<rules>
  <rule>If condition A, do X</rule>
  <rule>If condition B, do Y</rule>
</rules>
<task>Process using rules above</task>
```

### XML Tag Creation Workflow

1. Identify distinct prompt components (context, instructions, data, examples, output format)
2. Assign semantic tag names matching content purpose
3. Design nesting for related components
4. Add `index`/`id` attributes for collections
5. Define output tags for parseable responses
6. Reference tags in instructions: "Using the data in `<dataset>` tags..."
7. Test tag boundaries don't leak between sections

### Output Extraction

```python
import re

def extract_tag(text, tag):
    match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)
    return match.group(1).strip() if match else None

def extract_all_tags(text, tag):
    return [m.strip() for m in re.findall(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)]

def extract_indexed(text, tag):
    pattern = f'<{tag} index="(\\d+)">(.*?)</{tag}>'
    return {int(i): c.strip() for i, c in re.findall(pattern, text, re.DOTALL)}
```

For comprehensive tag catalog and advanced patterns: [references/xml_tags.md](references/xml_tags.md)

---

## LLM Parameter Tuning

### Evidence-Based Settings

| Task | max_tokens | temperature | top_p | Rationale |
|------|------------|-------------|-------|-----------|
| Theorem proving | 4096 | 0.6 | 0.95 | CoT needs space; higher temp explores tactics |
| Code generation | 2048 | 0.2-0.4 | — | Deterministic preferred |
| Creative/exploration | 4096 | 0.8-1.0 | — | Maximum diversity |
| Classification | 256 | 0.0-0.1 | — | Consistency over creativity |
| Summarization | 1024 | 0.3 | — | Faithful to source |

### Proof Plan Prompt Pattern
```
Given the theorem: [statement]
First, write a high-level proof plan explaining your approach.
Then, suggest Lean 4 tactics to implement each step.
```

### Anti-Patterns
- Too low tokens for proofs (512 truncates CoT)
- Too low temperature for proofs (0.2 misses creative paths)
- Jumping to tactics without proof plan
- Same settings for all task types

---

## CLAUDE.md Audit Checklist

| Check | How |
|-------|-----|
| Tech stack claims | `Read("package.json\|Cargo.toml")` |
| File path references | `Glob("claimed/path")` |
| Command references | `Grep("script", glob="package.json")` |
| Testing framework | `Glob("**/*.test.*")` |
| Linting config | `Glob("**/biome.json\|**/.eslintrc*")` |
| Line count | `wc -l CLAUDE.md` — target <300 |
| No code duplication | Uses file:line pointers |
| WHAT/WHY/HOW structure | Manual review |
| No style policing | Defer to linters |
| No invented features | Only document what exists |

---

## Output Format

When optimizing documentation:
1. Analysis summary with key findings
2. Optimized files (complete)
3. Change summary with rationale
4. Score impact estimate (before/after)
5. Further recommendations

When optimizing skills:
1. Current state (line count, token estimate)
2. Optimization mode applied
3. File structure (before/after)
4. Token savings estimate
5. Validation checklist

---

## Reference Materials

- [c7score Metrics](references/c7score_metrics.md) — scoring rubrics and weights
- [Optimization Patterns](references/optimization_patterns.md) — snippet transformation patterns
- [llms.txt Format](references/llmstxt_format.md) — complete format specification
- [XML Tag Patterns](references/xml_tags.md) — comprehensive tag catalog and advanced patterns
- [Skill Optimization](references/skill_optimization.md) — 3-level loading, migration workflow
- [Sample README](examples/sample_readme.md) — before/after c7score transformation
- [Sample llms.txt](examples/sample_llmstxt.md) — generated examples by project type
- [Analysis Script](scripts/analyze_docs.py) — automated documentation scanner

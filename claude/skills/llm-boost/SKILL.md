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

| Area | Key Metric | Target |
|------|-----------|--------|
| c7score | Question-Snippet Match | 80% weight |
| Skills | SKILL.md size | <=500 lines |
| LLM Tuning | Task-appropriate settings | See tuning table |

---

## Documentation Optimization (c7score)

<workflow>

1. **Analyze**: Read README.md, docs/*.md
2. **Generate questions**: Create 15-20 "How do I..." questions covering setup, auth, basic usage, errors, advanced features, integrations
3. **Map questions to snippets**: Mark complete, partial, or missing (prioritize missing)
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

</workflow>

### Snippet Transformation Patterns

- **API ref to usage example**: Replace method signatures with complete working code including imports, setup, and expected output
- **Import-only to complete setup**: Combine `from lib import X` with actual usage showing real output
- **Multiple fragments to one comprehensive**: Merge related 1-2 line snippets into one complete workflow
- **Remove metadata**: Strip directory trees, license text, BibTeX citations entirely

For detailed patterns: [references/optimization_patterns.md](references/optimization_patterns.md)

---

## llms.txt Generation

<format_rules>
- H1 title required, H2 sections only (no H3+)
- Full URLs with protocol, prefer .md files
- `- [Title](url): description` link format
- "Optional" section = skippable for shorter context
- No code blocks, images, or complex formatting
- Place at repo root as `/llms.txt`
</format_rules>

| Project Type | Must Have | Should Have |
|-------------|----------|-------------|
| Library | Documentation, API Reference, Examples | Getting Started, Development |
| CLI Tool | Getting Started, Commands, Examples | Configuration, Development |
| Framework | Documentation, Guides, API Reference, Examples | Integrations |

For templates: [examples/sample_llmstxt.md](examples/sample_llmstxt.md)

---

## Skill Optimization

### 500-Line Rule

**Keep in SKILL.md**: purpose, quick start, critical practices, brief examples (5-10 lines), cross-references.
**Move to reference files**: API docs, extensive examples (>20 lines), troubleshooting, pattern libraries, schemas.

### Optimization Modes

| Mode | Size | Action |
|------|------|--------|
| Light | <3K tokens | Tighten wording, add YAML if missing |
| Standard | 3K-6K | Consolidate, tables over prose, one example |
| Aggressive | 6K-10K | Table everything, strip filler |
| Split | >=10K | Propose 3-4 files + index |

### YAML Frontmatter

Description field (max 1024 chars) must include: what the skill does, when to use it, key technologies, action verbs. Write in third person.

### Progressive Disclosure Pattern

```markdown
## Topic Overview
Brief explanation (2-3 sentences).

**Quick Example:**
(5-10 line code block)

**For detailed docs**: [REFERENCE.md](REFERENCE.md#topic)
```

---

## XML Tag Structuring

<design_principles>

| Principle | Guideline |
|-----------|-----------|
| Semantic naming | Tag names describe content: `<contract>`, `<rubric>` |
| Consistency | Same tag names throughout; reference by name in instructions |
| Nesting | `<outer><inner></inner></outer>` for hierarchy |
| No canonical tags | No "best" tags - name for your use case |
| Combine techniques | Pair with CoT (`<thinking>`/`<answer>`) and multishot (`<examples>`) |

</design_principles>

### Core Patterns

**Multi-document**: `<documents><document index="1"><source>...</source><content>...</content></document></documents>`

**Structured evaluation**: `<rubric>` + `<submission>` -> `<evaluation><score>` + `<feedback>`

**CoT separation**: `<thinking>` for reasoning, `<answer>` for final output

**Multishot examples**: `<examples><example><input>...</input><output>...</output></example></examples>`

**Guard rails**: `<instructions><task>...</task><formatting>...</formatting><constraints>...</constraints></instructions>`

### Output Extraction

```python
import re

def extract_tag(text, tag):
    match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL)
    return match.group(1).strip() if match else None
```

For comprehensive tag catalog: [references/xml_tags.md](references/xml_tags.md)

---

## LLM Parameter Tuning

| Task | max_tokens | temperature | top_p | Rationale |
|------|------------|-------------|-------|-----------|
| Theorem proving | 4096 | 0.6 | 0.95 | CoT needs space; higher temp explores tactics |
| Code generation | 2048 | 0.2-0.4 | - | Deterministic preferred |
| Creative/exploration | 4096 | 0.8-1.0 | - | Maximum diversity |
| Classification | 256 | 0.0-0.1 | - | Consistency over creativity |
| Summarization | 1024 | 0.3 | - | Faithful to source |

---

## CLAUDE.md Audit Checklist

| Check | How |
|-------|-----|
| Tech stack claims | `Read("package.json\|Cargo.toml")` |
| File path references | `Glob("claimed/path")` |
| Command references | `Grep("script", glob="package.json")` |
| Testing framework | `Glob("**/*.test.*")` |
| Linting config | `Glob("**/biome.json\|**/.eslintrc*")` |
| Line count | `wc -l CLAUDE.md` - target <300 |
| No code duplication | Uses file:line pointers |
| WHAT/WHY/HOW structure | Manual review |

---

## Reference Materials

- [c7score Metrics](references/c7score_metrics.md) - scoring rubrics and weights
- [Optimization Patterns](references/optimization_patterns.md) - snippet transformation patterns
- [llms.txt Format](references/llmstxt_format.md) - complete format specification
- [XML Tag Patterns](references/xml_tags.md) - comprehensive tag catalog
- [Skill Optimization](references/skill_optimization.md) - 3-level loading, migration workflow

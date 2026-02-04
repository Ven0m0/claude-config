---
name: llm-docs-optimizer
description: Optimize documentation for AI coding assistants and LLMs. Improves docs for Claude, Copilot, and other AI tools through c7score optimization, llms.txt generation, question-driven restructuring, and automated quality scoring. Use when asked to improve, optimize, or enhance documentation for AI assistants, LLMs, c7score, Context7, or when creating llms.txt files.
---

# LLM Docs Optimizer

Optimize project documentation for AI coding assistants through c7score optimization and llms.txt generation.

## Quick Reference (30 seconds)

### C7Score Metrics
| Metric | Weight | Focus |
|--------|--------|-------|
| Question-Snippet Match | 80% | Do snippets answer developer questions? |
| LLM Evaluation | 5% | Relevancy, clarity, correctness |
| Formatting | 5% | Structure, language tags |
| Project Metadata | 5% | No irrelevant content |
| Initialization | 5% | More than just imports |

### Core Commands
```bash
python scripts/analyze_docs.py README.md  # Analyze current state
```

### Key Principles
1. **Think usage, not theory** - Lead with "How do I..."
2. **Copy-paste ready** - Include all imports/setup
3. **One snippet, one lesson** - No duplicates
4. **Remove noise** - No licensing, directory trees

---

## Implementation Guide (5 minutes)

### Step 0: Ask About llms.txt
When optimizing c7score, ask user if they also want llms.txt generated.

### Step 1: Analyze Documentation
1. Read README.md, docs/*.md
2. Run analysis script (optional): `python scripts/analyze_docs.py <path>`
3. Review: snippet issues, duplicates, language distribution

### Step 2: Generate Developer Questions
Create 15-20 "How do I..." questions covering:
- Setup, configuration, basic usage
- Authentication, error handling
- Advanced features, integrations

### Step 3: Map Questions to Snippets
| Status | Meaning |
|--------|---------|
| ✅ | Complete working code examples |
| ⚠️ | Partial or theoretical answers |
| ❌ | No answers - prioritize these |

### Step 4: Optimize Documentation

**Priority 1 (80% impact): Question Coverage**
- Add complete code for unanswered questions
- Transform API refs into usage examples
- Make examples self-contained and runnable

**Priority 2: Remove Duplicates**
- Consolidate similar snippets
- Ensure unique value per snippet

**Priority 3: Fix Formatting**
- Proper language tags (python, javascript, bash)
- TITLE / DESCRIPTION / CODE structure
- 3-100 lines per snippet

**Priority 4: Remove Metadata**
- Remove licensing, directory trees, citations

**Priority 5: Enhance Initialization**
- Combine import-only with usage examples
- Add context to installation commands

### Step 5: Validate
Each snippet must:
✅ Run standalone (copy-paste works)
✅ Answer a specific question
✅ Use proper format/language tag
✅ Include necessary imports

### Step 6: C7Score Evaluation
Compare original vs optimized across all 5 metrics. Provide impact estimate.

---

## llms.txt Generation

### What is llms.txt?
Standardized markdown file for LLM-friendly content summaries. Official spec: https://llmstxt.org/

### Structure
```markdown
# Project Name

> Brief description (1-3 sentences)

Key features:
- Feature 1
- Feature 2

## Documentation
- [README](README.md): Getting started
- [API Reference](docs/api.md): Method signatures

## Examples
- [Basic Usage](examples/basic.md)

## Optional
- [CONTRIBUTING](CONTRIBUTING.md)
```

### Project Templates
| Type | Sections |
|------|----------|
| Python Library | Documentation, API Reference, Examples, Development |
| CLI Tool | Getting Started, Commands, Configuration, Examples |
| Web Framework | Documentation, Guides, API Reference, Integrations |
| Claude Skill | Documentation, Reference Materials, Examples |

See `references/llmstxt_format.md` for complete format details.
See `examples/sample_llmstxt.md` for template examples.

---

## Tips for High Scores

1. **Lead with usage** - Show solutions, not signatures
2. **Copy-paste ready** - Include all setup
3. **Answer questions** - "How do I X?" not "API for X"
4. **One snippet, one lesson** - No duplicates
5. **Format consistently** - Proper language tags
6. **Remove noise** - No licensing/directory trees
7. **Test examples** - Ensure code works
8. **Focus on 80%** - Question-answering dominates

---

## Output Format

When optimizing:
1. **Analysis summary** - Key findings
2. **Optimized documentation** - Complete files
3. **Change summary** - What improved and why
4. **Score impact estimate** - Expected improvement
5. **Recommendations** - Further suggestions

---

## Works Well With

**Skills**: skill-optimizer, manage-markdown-docs, strategic-compact
**Agents**: markdown-optimizer, docs-manager
**Tools**: Context7 MCP

---

## Reference Materials

- [C7Score Metrics Details](references/c7score_metrics.md)
- [Optimization Patterns](references/optimization_patterns.md)
- [llms.txt Format Spec](references/llmstxt_format.md)
- [Sample Transformations](examples/sample_readme.md)
- [llms.txt Examples](examples/sample_llmstxt.md)

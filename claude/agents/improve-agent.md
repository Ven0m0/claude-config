---
name: improve-agent
description: |
  Systematic improvement of existing agents through performance analysis, prompt engineering, and continuous iteration. Use when asked to improve an agent, run optimizations on an agent, or apply the improve-agent workflow.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

# Agent Improvement

Optimize agent prompts for task success, clarity, and constraint adherence.

## Immediate Optimization Path

When asked to "improve" or "optimize" an agent:

### 1. Resolve Target

- "this agent" or "improve-agent" = this file (self-improvement)
- Otherwise resolve to `claude/agents/{name}.md`

### 2. Read and Analyze

Read target file. Note: frontmatter, role statement, sections, examples, constraints.

### 3. Apply Techniques

| Technique | Implementation |
|-----------|----------------|
| Role definition | Clear one-sentence mission + explicit constraints |
| Chain-of-thought | Add reasoning cues: "First...", "Before proceeding, verify..." |
| Constitutional checks | 2-5 self-check principles |
| Output format | Template or bullet list of required elements |
| Few-shot | One good + one bad example with "Why this works/fails" |

### 4. Write and Report

Apply edits. Summarize: what changed, which techniques, expected impact.

## Example

**Good**: User says "optimize general-purpose agent"
1. Read `claude/agents/general-purpose.md`
2. Add self-check principles and constraints
3. Add one good/bad example
4. Write changes, summarize

**Bad**: Only describe what could be done without editing the file.

## Constraints

- Never remove or weaken existing safety/constraint language
- Never add features or tools the target agent cannot use
- Preserve existing frontmatter unless intentionally changing it

## Phase Reference (Full Cycle)

When metrics are available via context-manager:

| Phase | Purpose |
|-------|---------|
| 1. Analysis | Gather performance data, failure patterns, baseline metrics |
| 2. Engineering | Apply techniques above based on data |
| 3. Testing | A/B testing, test suite, evaluation metrics |
| 4. Deployment | Version control, staged rollout, monitoring |

### Success Criteria

- Task success rate ≥15% improvement
- User corrections ≥25% decrease
- No increase in safety violations
- Response time within 10% of baseline

## Self-Check Before Output

1. Target agent file path is correct
2. Edits preserve existing frontmatter
3. Summary lists concrete changes and techniques used

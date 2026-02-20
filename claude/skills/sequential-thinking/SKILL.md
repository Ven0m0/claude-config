---
name: sequential-thinking
description: |
  Enables systematic step-by-step reasoning with revision and branching capabilities.
  Use when complex problems require multi-stage analysis, design planning, problem
  decomposition, or when scope is initially unclear. Trigger with "think through
  step by step", "break this down", "complex problem", or "sequential reasoning".
allowed-tools: mcp__reasoning__sequentialthinking
---

# Sequential Thinking

Structured problem-solving through iterative reasoning with revision and branching.

## When to Use

Use `mcp__reasoning__sequentialthinking` when:
- Problem requires multiple interconnected reasoning steps
- Initial scope or approach is uncertain
- Need to filter through complexity to find core issues
- May need to backtrack or revise earlier conclusions
- Want to explore alternative solution paths

Do not use for simple queries, direct facts, or single-step tasks.

## Core Capabilities

- **Iterative reasoning**: break complex problems into sequential thought steps
- **Dynamic scope**: adjust total thought count as understanding evolves
- **Revision tracking**: reconsider and modify previous conclusions
- **Branch exploration**: explore alternative reasoning paths from any point

## Parameters

<required_parameters>
- `thought` (string): current reasoning step
- `nextThoughtNeeded` (boolean): whether more reasoning is needed
- `thoughtNumber` (integer): current step number (starts at 1)
- `totalThoughts` (integer): estimated total steps needed
</required_parameters>

<optional_parameters>
- `isRevision` (boolean): indicates this revises previous thinking
- `revisesThought` (integer): which thought number is being reconsidered
- `branchFromThought` (integer): thought number to branch from
- `branchId` (string): identifier for this reasoning branch
</optional_parameters>

## Workflow

<steps>
1. Start with initial thought (thoughtNumber: 1)
2. For each step:
   - Express current reasoning in `thought`
   - Estimate remaining work via `totalThoughts` (adjust dynamically)
   - Set `nextThoughtNeeded: true` to continue
3. When reaching conclusion, set `nextThoughtNeeded: false`
</steps>

## Tips

- Start with rough estimate for `totalThoughts`, refine as you progress
- Use revision when assumptions prove incorrect
- Branch when multiple approaches seem viable
- Express uncertainty explicitly in thoughts
- Accuracy of scope estimate matters less than progress visibility

For revision patterns and branching strategies: [references/advanced.md](references/advanced.md)

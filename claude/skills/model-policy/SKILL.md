---
name: model-policy
description: Tier-based AI model assignment and context management strategies. Use to select optimal models for different tasks (Plan, Expert, Quality). Triggers: model-policy, opusplan, haiku-expert.
allowed-tools: Bash, Read
---

# Model Policy and Context Management

Optimized AI model assignment based on task complexity and subscription limits.

## Model Aliases

| Alias | Description | Pattern |
|-------|-------------|---------|
| `opusplan` | Uses Opus for planning/strategy and Sonnet for implementation. | High reasoning |
| `opusplan[1m]` | Uses Opus for planning and Sonnet 1M context for execution. | Large context |
| `haiku-expert` | Uses Haiku for routine, high-volume tasks like scanning or linting. | Cost efficient |

## Tier-based Assignment

| Policy Tier | Manager Agent | Expert Agent | Quality Agent |
|-------------|---------------|--------------|---------------|
| **High** | Opus | Opus | Sonnet |
| **Medium** | Opus | Sonnet | Haiku |
| **Low** | Sonnet | Haiku | Haiku |

## Context Optimization

1. **Progressive Disclosure**: Load only high-signal files first.
2. **Context Compaction**: Use the `conserve` plugin to identify and remove bloat.
3. **MECW Principle**: Maximize Effective Context Window by prioritizing relevant snippets over full files.

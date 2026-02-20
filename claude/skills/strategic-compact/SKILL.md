---
name: compacting-context-strategically
description: |
  Suggests manual /compact at strategic workflow points to preserve context through
  task phases. Use when approaching context limits, completing major milestones,
  or before context shifts. Triggers include high tool call counts, after planning
  phases, or before major implementation work.
allowed-tools: Read
user-invocable: true
---

# Strategic Compact Skill

Suggests manual `/compact` at strategic workflow points rather than relying on arbitrary auto-compaction.

## Why Strategic Compaction?

Auto-compaction triggers at arbitrary points, often mid-task, losing important context. Strategic compaction at logical boundaries preserves what matters:

| Timing | Benefit |
|--------|---------|
| After exploration, before execution | Compact research context, keep implementation plan |
| After completing a milestone | Fresh start for next phase |
| Before major context shifts | Clear exploration context before different task |

## How It Works

The `suggest-compact.sh` script runs on PreToolUse (Edit/Write) and:
1. Tracks tool call invocations in session
2. Suggests at configurable threshold (default: 50 calls)
3. Reminds every 25 calls after threshold

## Hook Setup

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == \"Edit\" || tool == \"Write\"",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/strategic-compact/suggest-compact.sh"
      }]
    }]
  }
}
```

## Configuration

Environment variables:
- `COMPACT_THRESHOLD` - Tool calls before first suggestion (default: 50)

## Best Practices

<guidelines>
- Compact after planning: once plan is finalized, compact to start fresh
- Compact after debugging: clear error-resolution context before continuing
- Do not compact mid-implementation: preserve context for related changes
- Read the suggestion: the hook tells you when, you decide if
</guidelines>

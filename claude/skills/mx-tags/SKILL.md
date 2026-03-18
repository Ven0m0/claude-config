---
name: mx-tags
description: Metadata-driven code annotation system for cross-agent communication. Use to mark anchors, warnings, context, and tasks in code. Triggers: @MX, anchor, warning, code-context.
allowed-tools: Bash, Read, Grep
---

# @MX Tagging System

The `@MX` tag system provides inline code annotations that help AI agents understand the codebase faster and more accurately.

## Tag Types

| Tag Type | Priority | Purpose | Description |
|----------|----------|---------|-------------|
| `@MX:ANCHOR` | P1 | Important contracts | Functions with high fan-in (>=3) or wide impact. |
| `@MX:WARN` | P2 | Danger zones | Complexity, goroutines, global state mutation, or non-obvious side effects. |
| `@MX:NOTE` | P3 | Context | Magic constants, business rules, or architectural decisions. |
| `@MX:TODO` | P4 | Incomplete work | Missing tests or unimplemented features. |

## Usage Examples

```go
// @MX:ANCHOR: [AUTO] Central entry point for hook events.
// @MX:REASON: Changes here have wide impact across all plugins.
func DispatchHook(event string, data []byte) error { ... }

// @MX:WARN: Potential race condition if called concurrently.
// @MX:REASON: Updates global state without explicit locking.
func updateState() { ... }
```

## Scanning

Use the `mx_scanner.py` tool to find and report on tags in the codebase.

```bash
python3 claude/skills/mx-tags/mx_scanner.py .
```

## Principles

1. **Signal-to-Noise**: Tag only the most important/dangerous code.
2. **Actionable**: Tags should explain *why* the code is marked.
3. **Machine Readable**: Follow the `@MX:TYPE: [TAG] Reason` format for automated extraction.

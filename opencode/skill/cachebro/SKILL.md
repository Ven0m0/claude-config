---
name: cachebro
description: Reuse cached file reads and diffs to avoid resending unchanged content. Use when repeated reads of the same files are inflating token cost.
---

# Cachebro

Prefer cached reads when you are revisiting the same file set during one session.

## Workflow

1. Read the file once and cache it.
2. Re-read through the cache path instead of sending the full file again.
3. Accept `[unchanged]` or diff-style responses when only a few lines moved.
4. Clear the cache only when context is stale or the file set changed substantially.

## Local repo reference

The local OpenCode-side implementation lives at:

- `../../plugins/cachebro.ts`

It exposes:

- `cachebro_read_file`
- `cachebro_read_files`
- `cachebro_cache_status`
- `cachebro_cache_clear`

## Notes/Inspiration

Inspired by [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro) and tied to the local plugin implementation instead of an extra package install.

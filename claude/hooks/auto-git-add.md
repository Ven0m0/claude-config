---
name: auto-git-add
description: Auto-stage files after Edit/MultiEdit/Write
category: git
event: PostToolUse
matcher: Edit|MultiEdit|Write
language: bash
---

```bash
jq -r '.tool_input.file_path // empty' | while read -r file_path; do
  if [[ -n "$file_path" ]] && git rev-parse --git-dir >/dev/null 2>&1; then
    git add "$file_path" 2>/dev/null || true
  fi
done
```

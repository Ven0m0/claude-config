---
name: running-interactive-commands-with-tmux
description: Controls interactive CLI tools (vim, git rebase -i, REPLs) through tmux detached sessions and send-keys. Use when running tools requiring terminal interaction, programmatic editor control, or orchestrating Claude Code sessions. Triggers include "interactive command", "vim", "REPL", "tmux", or "git rebase -i".
---

# Using tmux for Interactive Commands

## Quick Reference (30 seconds)

Interactive CLI tools (vim, REPLs, git rebase -i) require real terminals. Use tmux detached sessions with `send-keys` and `capture-pane`.

### Essential Commands
| Task | Command |
|------|---------|
| Start session | `tmux new-session -d -s <name> <command>` |
| Send input | `tmux send-keys -t <name> 'text' Enter` |
| Capture output | `tmux capture-pane -t <name> -p` |
| Stop session | `tmux kill-session -t <name>` |
| List sessions | `tmux list-sessions` |

### Core Pattern
```bash
tmux new-session -d -s edit vim file.txt  # Start detached
sleep 0.3                                   # Wait for init
tmux send-keys -t edit 'i' 'Hello' Escape ':wq' Enter  # Interact
tmux kill-session -t edit                   # Cleanup
```

### When to Use
| Use tmux | Don't use |
|----------|-----------|
| vim, nano, editors | Simple non-interactive commands |
| Python/Node REPLs | Commands that accept stdin redirection |
| git rebase -i, git add -p | One-shot commands |
| Full-screen apps (htop) | |

---

## Implementation Guide (5 minutes)

### Workflow
1. **Create detached session** with interactive command
2. **Wait briefly** (100-500ms) for initialization
3. **Send input** via `send-keys`
4. **Capture output** via `capture-pane -p`
5. **Repeat** steps 3-4 as needed
6. **Terminate** session when done

### Special Keys
| Key | tmux name |
|-----|-----------|
| Return | `Enter` |
| ESC | `Escape` |
| Ctrl+C | `C-c` |
| Ctrl+X | `C-x` |
| Arrows | `Up`, `Down`, `Left`, `Right` |
| Space | `Space` |
| Backspace | `BSpace` |

### Working Directory
```bash
tmux new-session -d -s git -c /path/to/repo git rebase -i HEAD~3
```

---

## Common Patterns

### Python REPL
```bash
tmux new-session -d -s py python3 -i
tmux send-keys -t py 'import math' Enter
tmux send-keys -t py 'print(math.pi)' Enter
tmux capture-pane -t py -p
tmux kill-session -t py
```

### Vim Editing
```bash
tmux new-session -d -s vim vim /tmp/file.txt
sleep 0.3
tmux send-keys -t vim 'i' 'New content' Escape ':wq' Enter
```

### Interactive Git Rebase
```bash
tmux new-session -d -s rebase -c /repo git rebase -i HEAD~3
sleep 0.5
tmux capture-pane -t rebase -p
tmux send-keys -t rebase 'Down' 'Home' 'squash' Escape ':wq' Enter
```

### Node REPL
```bash
tmux new-session -d -s node node
tmux send-keys -t node 'const x = 42' Enter
tmux send-keys -t node 'console.log(x * 2)' Enter
tmux capture-pane -t node -p
tmux kill-session -t node
```

---

## Common Mistakes

### Not Waiting After Start
**Problem:** Blank screen on immediate capture
**Fix:**
```bash
tmux new-session -d -s sess command
sleep 0.3  # Let command initialize
tmux capture-pane -t sess -p
```

### Forgetting Enter Key
**Problem:** Commands typed but not executed
**Fix:** Always explicitly send `Enter`

### Wrong Session Name
**Problem:** Session not found
**Fix:** Use `tmux list-sessions` to verify names

### Not Escaping Special Characters
**Problem:** Shell interprets characters
**Fix:** Use single quotes: `tmux send-keys -t s 'echo "hello"' Enter`

---

## Advanced: Claude Code Orchestration

### Start Claude Code in tmux
```bash
tmux new-session -d -s claude -c /project/path claude
sleep 2  # Claude Code takes longer to start
tmux capture-pane -t claude -p  # See initial state
```

### Send Prompts
```bash
tmux send-keys -t claude "Fix all TypeScript errors" Enter
sleep 30  # Wait for processing
tmux capture-pane -t claude -p  # Check progress
```

### Graceful Exit
```bash
tmux send-keys -t claude '/exit' Enter
sleep 1
tmux kill-session -t claude
```

---

## Works Well With

**Skills**: bash-optimizer, git-cli-agentic
**Tools**: tmux, vim, git

---

## Reference

- [tmux man page](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [Full examples](reference.md)

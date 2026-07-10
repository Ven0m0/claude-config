# Shell: Non-Interactive Mode

Shell environment has no TTY/PTY. Treat every command as running in headless CI.

## Mandates

1. `CI=true` assumed — never wait for user input.
2. BANNED: `vim`, `nano`, `less`, `more`, `man`, `git add -p`, `git rebase -i`, `python`/`node` (bare REPL), `bash -i`.
3. Always supply `-y`/`-f`/`--force`/`--non-interactive` flags preemptively.
4. Prefer `read`/`write`/`edit` tools over shell file manipulation (`sed`, `echo`, `cat`).
5. Never use `-i` or `-p` flags that prompt for input.

## Key Non-Interactive Flags

| Tool | Use |
|------|-----|
| apt-get | `-y` |
| npm/bun init | `-y` |
| pip install | `--no-input` |
| git commit | `-m "msg"` |
| git merge/pull | `--no-edit` |
| git log/diff | `--no-pager` or `git -P` |
| rm/cp/mv | `-f` (not `-i`) |
| curl | `-fsSL` |
| docker run | no `-it` |
| unzip | `-o` |

## Env Vars (set for CI)

`DEBIAN_FRONTEND=noninteractive` `GIT_TERMINAL_PROMPT=0` `GIT_PAGER=cat` `PAGER=cat` `PIP_NO_INPUT=1`

## Prompt Workarounds

```bash
yes | ./script.sh          # yes pipe
timeout 30 ./script.sh    # timeout guard (last resort)
```

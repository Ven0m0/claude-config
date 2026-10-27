# Non-interactive shell

The shell has no TTY: anything that prompts, pages, or opens an editor hangs until timeout.

- No editors, pagers, or interactive modes (`vim`, `less`, `man`, `git add -p`, `git rebase -i`, `bash -i`).
- Use the command's own non-interactive flag (`-y`, `--no-input`, `--no-edit`, `--no-pager`); never blanket-approve with `yes |` or heredocs.
- Missing credentials or a user choice: use a fail-fast form (`sudo -n`, `ssh -o BatchMode=yes -o ConnectTimeout=10`) or stop and report. Never pipe passwords to `sudo -S`.
- First contact with a trusted host: `StrictHostKeyChecking=accept-new`; `no` is prohibited.
- Prefer the file tools over shell text manipulation.
- Git: `git commit -m`, `git merge --no-edit`, `git pull --no-edit`, `git --no-pager log|diff`, `git add <file>`.
- Installs: `npm init -y`, `apt-get install -y`, `pip install --no-input`. `npm install` needs no flag.
- `cp`/`mv`/`rm` do not prompt without `-i`; check the target before destructive commands. `unzip -o` overwrites.
- REPLs: `python -c`, `node -e`.
- Per command only: `GIT_TERMINAL_PROMPT=0`, `DEBIAN_FRONTEND=noninteractive`, `PIP_NO_INPUT=1`.

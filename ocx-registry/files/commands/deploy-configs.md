---
description: Deploy dotfiles using dotbot or Scripts/Setup-Dotfiles.ps1 — full deployment or targeted config groups
---

Deploy tracked dotfile configuration. $ARGUMENTS

**Full deployment** (all config groups):

```powershell
mise run deploy
# or directly:
dotbot -c install.conf.yaml
```

**Deploy a specific config group:**

```powershell
pwsh -File Scripts/Setup-Dotfiles.ps1 -Target 'PowerShell profile'
pwsh -File Scripts/Setup-Dotfiles.ps1 -Target 'Windows Terminal'
pwsh -File Scripts/Setup-Dotfiles.ps1 -Target 'Firefox'
```

**Dry-run (preview without changing files):**

```powershell
dotbot -c install.conf.yaml -p
# or:
pwsh -File Scripts/Setup-Dotfiles.ps1 -WhatIf
```

**How it works:**

- Deployment uses SHA256 hash comparison — files copy only when source differs from destination
- Source: `user/.dotfiles/config/<category>/<file>`
- Destination: resolved from `install.conf.yaml` using `$env:USERPROFILE`, `$env:LOCALAPPDATA`, etc.

**After deployment, verify:**

```powershell
pwsh -NoProfile -Command ". $PROFILE"  # profile loads without errors
```

If the target config group name is unknown, read `Scripts/Setup-Dotfiles.ps1` for the defined targets.

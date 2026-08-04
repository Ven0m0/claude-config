---
description: Check that the local environment meets all prerequisites for running the Win dotfiles scripts
---

Verify the local environment meets all prerequisites for the Win dotfiles repository. $ARGUMENTS

Run these checks and report PASS/FAIL for each, with install commands for anything missing:

**1. Core tools:**

```powershell
# PowerShell version (5.1+ required, 7+ recommended)
$PSVersionTable.PSVersion

# winget
winget --version

# Git
git --version

# Python (needed for dotbot)
python --version

# dotbot
dotbot --version
```

**2. Execution policy:**

```powershell
Get-ExecutionPolicy -Scope CurrentUser
# Expected: RemoteSigned or Unrestricted
```

**3. Repository structure:**

```powershell
Test-Path install.conf.yaml
Test-Path Scripts/Setup-Dotfiles.ps1
Test-Path Scripts/Common.ps1
Test-Path "user/.dotfiles/config"
```

**4. OS version (Windows 10 1909+ or Windows 11):**

```powershell
[Environment]::OSVersion.Version
(Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion").CurrentBuild
```

**5. Network connectivity (optional):**

```powershell
Test-NetConnection github.com -Port 443 -InformationLevel Quiet
```

**Install hints for common failures:**

- winget missing: install from Microsoft Store or `winget-cli` GitHub releases
- Git missing: `winget install Git.Git`
- PowerShell 7 missing: `winget install Microsoft.PowerShell`
- dotbot missing: `pip install dotbot`
- Execution policy blocked: run `/set-execution-policy`

Report results as a checklist with actionable next steps for any failures.

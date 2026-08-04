---
description: Structured code review of PowerShell scripts — PSScriptAnalyzer compliance, Common.ps1 usage, ShouldProcess, error handling, and style
---

Perform a structured code review of PowerShell script changes. $ARGUMENTS

If $ARGUMENTS names a file or directory, review that. Otherwise review files modified in the git working tree:

```bash
git diff --name-only --diff-filter=ACM | grep "\.ps1$"
```

For each file under review, check:

**1. PSScriptAnalyzer:**

```powershell
Invoke-ScriptAnalyzer -Path <file> -Settings PSScriptAnalyzerSettings.psd1
```

Zero violations is the target. Report any findings.

**2. Common.ps1 helper usage:**
Check whether the script imports Common.ps1 and uses available helpers instead of reimplementing them:

```
rg "Common\.ps1" <file>
rg "Set-ItemProperty|Remove-ItemProperty|Invoke-WebRequest|New-Item.*-Force" <file>
```

Flag direct API calls where a Common.ps1 helper exists.

**3. SupportsShouldProcess:**

```
rg "SupportsShouldProcess" <file>
rg "ShouldProcess" <file>
```

Every function that modifies system state needs `[CmdletBinding(SupportsShouldProcess)]`.

**4. Error handling:**

```
rg "Set-StrictMode" <file>
rg "ErrorActionPreference" <file>
```

Must have `Set-StrictMode -Version Latest` and `$ErrorActionPreference = 'Stop'`. No global `SilentlyContinue`.

**5. Prohibited patterns:**

```
rg "Invoke-Expression|curl\b|ConvertTo-SecureString.*PlainText" <file>
```

**6. Path safety:**

```
rg "C:\\Users\\" <file>
```

All user paths must use `$HOME`, `$env:USERPROFILE`, or `$PSScriptRoot`.

**7. Comment-based help** — every exported function must have `.SYNOPSIS`, `.PARAMETER`, and `.EXAMPLE`.

Output structured feedback per `.claude/agents/code-reviewer.md` format (Severity / Category / Issue / Remediation). Summarize with counts at the end.

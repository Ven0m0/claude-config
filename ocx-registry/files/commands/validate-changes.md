---
description: Run pre-commit validation — PSScriptAnalyzer on changed .ps1 files, XML validation on autounattend.xml, and guidance lint on .kilo/
---

Run validation checks on local changes before committing. $ARGUMENTS

**1. PowerShell linting** — run on all modified `.ps1` files:

```powershell
# Get changed PS files
$changed = git diff --name-only --diff-filter=ACM | Where-Object { $_ -match '\.ps1$' }

# Lint each one
$changed | ForEach-Object {
  Write-Host "=== $_ ===" -ForegroundColor Cyan
  Invoke-ScriptAnalyzer -Path $_ -Settings PSScriptAnalyzerSettings.psd1
}
```

If no files are specified in $ARGUMENTS and no staged changes exist, lint all files in `Scripts/`:

```powershell
Invoke-ScriptAnalyzer -Path Scripts/ -Settings PSScriptAnalyzerSettings.psd1 -Recurse
```

**2. autounattend.xml validation** (if modified):

```powershell
if (Test-Path Scripts/auto/autounattend.xml) {
  $xml = [xml]::new()
  $xml.Load((Resolve-Path Scripts/auto/autounattend.xml))
  Write-Host "autounattend.xml: valid XML"
}
```

**3. Pester tests** — if a test file exists for a changed script, run it:

```powershell
$changed | ForEach-Object {
  $testFile = "tests/$([System.IO.Path]::GetFileNameWithoutExtension($_)).Tests.ps1"
  if (Test-Path $testFile) {
    Invoke-Pester -Path $testFile -Output Minimal
  }
}
```

**4. Guidance lint** (if `.kilo/` or `.claude/` files changed):

```bash
npx -y @yawlabs/ctxlint --depth 5 --mcp --strict --fix --yes
```

Report: pass/fail per check, with violation details. Done = zero PSScriptAnalyzer violations and no new Pester failures.

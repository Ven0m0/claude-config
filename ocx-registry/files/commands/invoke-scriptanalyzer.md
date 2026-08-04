---
description: Run PSScriptAnalyzer on PowerShell scripts using the repository settings file
---

Run PSScriptAnalyzer on PowerShell scripts in this repository. $ARGUMENTS

Use the project settings file for all analysis runs:

```powershell
# Single file
Invoke-ScriptAnalyzer -Path Scripts/<file>.ps1 -Settings PSScriptAnalyzerSettings.psd1

# Entire Scripts/ directory
Invoke-ScriptAnalyzer -Path Scripts/ -Settings PSScriptAnalyzerSettings.psd1 -Recurse

# Only changed files (git working tree)
git diff --name-only --diff-filter=ACM | Where-Object { $_ -match '\.ps1$' } | ForEach-Object {
  Invoke-ScriptAnalyzer -Path $_ -Settings PSScriptAnalyzerSettings.psd1
}

# Attempt auto-fix on fixable rules
Invoke-ScriptAnalyzer -Path Scripts/<file>.ps1 -Settings PSScriptAnalyzerSettings.psd1 -Fix
```

**CI-enforced rules** (pipeline fails if violated):

- `PSAvoidGlobalAliases` — no aliases in script scope
- `PSAvoidUsingConvertToSecureStringWithPlainText` — no plaintext secure strings

**CI-warned rules** (surfaced but do not fail pipeline):

- `AvoidUsingCmdletAliases`, `AvoidUsingWriteHost`, `ProvideCommentHelp`
- `UseShouldProcessForStateChangingFunctions`, `AvoidUsingPositionalParameters`

If $ARGUMENTS specifies a file or directory, run the analyzer on that target and report findings grouped by severity (Error / Warning / Information).

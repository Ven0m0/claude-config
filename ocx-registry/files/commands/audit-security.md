---
description: Run security checks across the repository for credentials, hardcoded paths, unsafe elevation patterns, and improper registry access
---

Perform a structured security audit of the Win dotfiles repository. $ARGUMENTS

Run these checks and report findings by severity (Critical / High / Medium / Low):

**1. Credential scan** — search `Scripts/` and `user/` for potential secrets:

```
rg -i "(password|api_key|token|secret|credential)\s*=" Scripts/ user/ --glob "*.ps1"
```

**2. Hardcoded user paths** — flag `C:\Users\<name>` that should use `$HOME` or `$env:USERPROFILE`:

```
rg "C:\\Users\\[^$]" Scripts/ --glob "*.ps1"
```

**3. Elevation pattern validation** — verify `Request-AdminElevation` is used before HKLM changes:

```
rg "IsInRole.*Administrator" Scripts/ --glob "*.ps1"
rg -L "Request-AdminElevation" Scripts/*.ps1
```

**4. Raw registry access** — flag direct `Set-ItemProperty`/`Remove-ItemProperty` bypassing the `Set-RegistryValue`/`Remove-RegistryValue` helpers in `Common.ps1`:

```
rg "Set-ItemProperty|Remove-ItemProperty" Scripts/ --glob "*.ps1"
```

**5. Sensitive registry keys** — flag references to restricted hives:

```
rg "HKLM.\\(SECURITY|SAM)" Scripts/ --glob "*.ps1"
rg "HKLM.*\\Lsa" Scripts/ --glob "*.ps1"
```

**6. Prohibited patterns** — `Invoke-Expression` with variable input, global `SilentlyContinue`, bare `curl`:

```
rg "Invoke-Expression" Scripts/ --glob "*.ps1"
rg "ErrorActionPreference.*SilentlyContinue" Scripts/ --glob "*.ps1"
rg "\bcurl\b" Scripts/ --glob "*.ps1"
```

Output a markdown report grouped by severity. Reference `.claude/rules/registry-security.md` and `.claude/rules/powershell.md` for the governing rules.

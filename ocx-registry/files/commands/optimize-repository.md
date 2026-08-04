---
description: Analyze the repository for dead code, duplicate logic, unused dependencies, and structural inefficiencies
---

Analyze the repository for dead code, duplicate logic, and structural inefficiencies. Produce actionable recommendations without modifying files. $ARGUMENTS

**1. Dead code — scripts with no references:**

```
# Find all .ps1 files, then check if any other file references them
rg -l "" Scripts/ --glob "*.ps1"
# For each script, check reference count:
rg "<scriptname>" Scripts/ install.conf.yaml README.md AGENTS.md --glob "*.{ps1,yaml,md}"
```

**2. Duplicate function definitions across scripts:**

```
rg "^function " Scripts/ --glob "*.ps1" -n
```

Cross-reference against `Scripts/Common.ps1` exports to find functions that could be consolidated.

**3. Scripts not importing Common.ps1:**

```
rg -L "Common\.ps1" Scripts/*.ps1
```

Any script that duplicates Common.ps1 logic but doesn't import it is a consolidation candidate.

**4. Oversized scripts** (flag scripts over ~400 lines):

```powershell
Get-ChildItem Scripts/*.ps1 | ForEach-Object {
  $lines = (Get-Content $_.FullName).Count
  if ($lines -gt 400) { "$lines`t$($_.Name)" }
} | Sort-Object
```

**5. Unused config files** — files under `user/.dotfiles/config/` not referenced in `install.conf.yaml` or `Scripts/Setup-Dotfiles.ps1`.

**6. Stale CMD scripts** with PS equivalents:

```
rg "\.cmd" Scripts/ --glob "*.ps1" --glob "*.md" --glob "*.yaml"
Get-ChildItem Scripts/ -Filter "*.cmd"
```

Output a prioritized recommendation list with:

- Priority (High/Medium/Low)
- Finding description
- Specific files involved
- Suggested action

Never delete or modify files — recommendations only.

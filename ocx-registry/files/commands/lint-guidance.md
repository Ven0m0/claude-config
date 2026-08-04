---
description: Validate AI guidance files — AGENTS.md, .claude/ skills/agents/rules/commands, and .github/ workflows
---

Validate AI guidance files for syntax errors, broken references, and structural inconsistencies. $ARGUMENTS

Run these checks:

**1. ctxlint on .kilo/ configuration:**

```bash
npx -y @yawlabs/ctxlint --depth 5 --mcp --strict --fix --yes
```

**2. Verify CLAUDE.md symlink points to AGENTS.md:**

```bash
ls -la CLAUDE.md
```

**3. Validate workflow YAML syntax:**

```powershell
Get-ChildItem .github/workflows/*.yml | ForEach-Object {
  try {
    $null = ConvertFrom-Yaml (Get-Content $_ -Raw)
    Write-Host "OK: $($_.Name)"
  } catch {
    Write-Warning "INVALID: $($_.Name) — $($_.Exception.Message)"
  }
}
```

**4. Cross-reference check — verify all paths mentioned in AGENTS.md exist:**
Read `AGENTS.md` and check that every `Scripts/`, `tests/`, `user/.dotfiles/config/`, and `.claude/` path mentioned exists in the repository.

**5. Agent/skill consistency:**

- Every agent listed in the AGENTS.md delegation table must have a corresponding file in `.claude/agents/`
- Every skill listed in the AGENTS.md skills table must have a corresponding directory in `.claude/skills/`

Report: OK items, then broken references or syntax errors with remediation suggestions.

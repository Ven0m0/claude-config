---
description: Guide Windows debloating — remove built-in apps, disable unnecessary services and scheduled tasks
---

Guide the user through debloating Windows using `Scripts/debloat-windows.ps1`. $ARGUMENTS

First, read `Scripts/debloat-windows.ps1` to confirm it exists and see the current debloat targets.

Then provide the user with the appropriate commands based on their goal:

```powershell
# Moderate debloat (recommended default)
pwsh -File Scripts/debloat-windows.ps1

# Preview what would be removed without making changes
pwsh -File Scripts/debloat-windows.ps1 -WhatIf

# Remove only Appx packages, leave services/tasks alone
pwsh -File Scripts/debloat-windows.ps1 -AppsOnly

# Disable only unnecessary services
pwsh -File Scripts/debloat-windows.ps1 -ServicesOnly

# Undo a previous debloat run (best-effort)
pwsh -File Scripts/debloat-windows.ps1 -Undo
```

**Before running:**

1. A system restore point is created automatically (skip with `-NoRestorePoint`)
2. Requires an elevated PowerShell session (the script self-elevates if not already admin)
3. Run `-WhatIf` first on an unfamiliar machine to preview changes

If the user wants to change what gets removed, explain the structure of `debloat-windows.ps1` and how to add/remove apps from the target lists (`Remove-BloatwareApp` in `debloat-windows.ps1`, plus `Invoke-ServiceOperation` in `Scripts/Common.ps1`).

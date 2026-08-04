---
description: Guide creating a backup of current system state (registry, packages, services, PS profile) before making significant changes
---

Guide the user through backing up their current Windows system state before making changes. $ARGUMENTS

The backup captures:

- **Registry** — key HKCU/HKLM areas to `.reg` files
- **Packages** — `winget list`, installed Appx packages, provisioned Appx
- **Services** — name, display name, status, start type
- **PowerShell profile** — copy of `$PROFILE`

Show the user these commands to run in an elevated PowerShell session:

```powershell
$BackupDir = "$HOME\backups\$(Get-Date -Format 'yyyy-MM-dd_HHmm')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# Registry exports
reg export "HKCU\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager" "$BackupDir\CDM.reg" /y
reg export "HKCU\System\GameConfig" "$BackupDir\GameConfig.reg" /y

# Package lists
winget list --source winget | Out-File "$BackupDir\winget-list.txt"
Get-AppxPackage -AllUsers | Select-Object Name, Version | ConvertTo-Json | Out-File "$BackupDir\appx-packages.json"

# Services
Get-Service | Select-Object Name, DisplayName, Status, StartType |
  Export-Csv -Path "$BackupDir\services.csv" -NoTypeInformation

# PowerShell profile
if (Test-Path $PROFILE) { Copy-Item $PROFILE "$BackupDir\profile.ps1" }

Write-Host "Backup saved to: $BackupDir"
```

Remind the user to also run `New-RestorePointSafe` (`/new-restore-point`) for a full system restore point: this backup covers file/registry state, the restore point is the OS-level rollback.

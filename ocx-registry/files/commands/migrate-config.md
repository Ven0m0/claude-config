---
description: Migrate legacy config files into the current user/.dotfiles/config/ layout and update the dotbot manifest
---

Migrate configuration files from a legacy location or format into the current repository layout. $ARGUMENTS

**Migration steps:**

1. **Identify the source** — locate the old config file(s). Use $ARGUMENTS's path if given, otherwise ask the user.

2. **Determine the target path** — map to `user/.dotfiles/config/<category>/<filename>` following existing conventions:

   | Config type        | Target subdirectory  |
   | ------------------ | -------------------- |
   | PowerShell profile | `powershell/`        |
   | Windows Terminal   | `windows-terminal/`  |
   | Firefox            | `firefox/`           |
   | Game configs       | `games/<game-name>/` |
   | Registry tweaks    | under `Scripts/reg/` |
   | Cursor theme       | `cursors/`           |

3. **Copy the file** preserving its original format — never reformat JSON, YAML, REG, or INI files.

4. **Update `install.conf.yaml`** — add the deployment entry:

   ```yaml
   - link:
       - <destination-path>: user/.dotfiles/config/<category>/<filename>
   ```

5. **Verify the destination path** — confirm it exists or is created by the `create:` section.

6. **Test with dry-run:**

   ```powershell
   dotbot -c install.conf.yaml -p
   ```

7. **Update `Scripts/Setup-Dotfiles.ps1`** if the new config needs a custom deployment step (hash-based copy, template substitution, or directory creation).

Preserve native file formats; no BOM unless required by the target app. After migration, run `/deploy-configs` to apply.

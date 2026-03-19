---
name: repomix-unmixer
description: Extracts files from repomix-packed repositories and restores directory structures. Triggers: repomix-unmix, extract-bundle.
allowed-tools: Bash, Read, Write, Edit
---

# Repomix Unmixer

Utility for reversing Repomix bundles back into their original file structure.

## Usage

When presented with a Repomix bundle (XML, Markdown, or JSON format), use this skill to reconstruct the files.

1. **Identify format**: Detect if the bundle is XML, Markdown, or JSON.
2. **Scan structure**: Locate the file paths within the bundle.
3. **Extract and Write**: Use the `Write` tool to recreate each file in its respective directory.

## Features

- **Format Detection**: Automatically handles XML, Markdown, and JSON Repomix outputs.
- **Directory Preservation**: Restores full directory hierarchy.
- **Validation**: Verifies that extracted content matches the bundle's snippets.

---
name: organizing-files
description: Organizes files and folders by understanding context, finding duplicates, and suggesting better structures. Use when Downloads is chaotic, files are scattered, duplicates waste space, or starting new project structures. Triggers include "organize files", "find duplicates", "clean up folder", or "file structure".
---

# File Organizer

Your personal organization assistant for maintaining clean, logical file structures without mental overhead.

## When to Use

- Downloads folder is chaotic
- Can't find files (scattered everywhere)
- Duplicate files taking up space
- Folder structure doesn't make sense
- Need better organization habits
- Starting new project structure
- Cleaning up before archiving

## Core Capabilities

1. **Analyze Structure**: Review folders and understand content
1. **Find Duplicates**: Identify duplicate files across system
1. **Suggest Organization**: Propose logical folder structures
1. **Automate Cleanup**: Move, rename, organize with approval
1. **Context-Aware**: Smart decisions based on type, date, content
1. **Reduce Clutter**: Identify old unused files

## Quick Commands

### Downloads Cleanup

```
Organize Downloads folder - move documents to Documents, images to Pictures,
archive files older than 3 months
```

### Find Duplicates

```
Find duplicate files in Documents and help me decide which to keep
```

### Project Organization

```
Review Projects folder and separate active from archived projects
```

### Desktop Cleanup

```
Desktop is covered in files - organize into Documents properly
```

### Photo Organization

```
Organize photos by date (year/month) based on EXIF data
```

### Work/Personal Separation

```
Separate work files from personal files in Documents
```

## Organization Workflow

### 1. Understand Scope

Ask clarifying questions:

- Which directory? (Downloads, Documents, home?)
- Main problem? (Can't find, duplicates, messy, no structure?)
- Files to avoid? (Current projects, sensitive data?)
- How aggressive? (Conservative vs. comprehensive)

### 2. Analyze Current State

```bash
# Overview
eza -la [target]

# File types and sizes
find [target] -type f -exec file {} \; | head -20

# Largest files
du -sh [target]/* | sort -rh | head -20

# File type distribution
find [target] -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn
```

Summarize:

- Total files/folders
- File type breakdown
- Size distribution
- Date ranges
- Organization issues

### 3. Identify Patterns

**By Type:**

- Documents (PDF, DOCX, TXT)
- Images (JPG, PNG, SVG)
- Videos (MP4, MOV)
- Archives (ZIP, TAR)
- Code/Projects
- Spreadsheets (XLSX, CSV)

**By Purpose:**

- Work vs. Personal
- Active vs. Archive
- Project-specific
- Reference materials
- Temporary/scratch

**By Date:**

- Current year/month
- Previous years
- Old (archive candidates)

### 4. Find Duplicates

```bash
# Exact duplicates by hash
find [dir] -type f -exec md5sum {} \; | sort | uniq -d

# Same name
find [dir] -type f -printf '%f\n' | sort | uniq -d

# Similar size
find [dir] -type f -printf '%s %p\n' | sort -n
```

For each duplicate set:

- Show all paths
- Display sizes and dates
- Recommend which to keep (newest or best-named)
- **Always ask before deleting**

### 5. Propose Plan

```markdown
# Organization Plan for [Directory]

## Current State
- X files across Y folders
- [Size] total
- File types: [breakdown]
- Issues: [list]

## Proposed Structure
[Directory]/
├── Work/
│   ├── Projects/
│   └── Documents/
├── Personal/
│   ├── Photos/
│   └── Documents/
└── Archive/

## Changes
1. Create folders: [list]
2. Move files:
   - X PDFs → Work/Documents/
   - Y images → Personal/Photos/
3. Rename: [patterns]
4. Delete: [duplicates/trash]

## Need Your Decision
- [uncertain files]

Ready? (yes/no/modify)
```

### 6. Execute

```bash
# Create structure
mkdir -p "path/to/folders"

# Move with logging
mv "old/path/file" "new/path/file"

# Rename consistently
# Format: "YYYY-MM-DD - Description.ext"
```

**Rules:**

- Confirm before deleting
- Log all moves for undo
- Preserve modification dates
- Handle conflicts gracefully
- Stop and ask if unexpected

### 7. Provide Summary

```markdown
# Organization Complete! ✨

## What Changed
- Created [X] folders
- Organized [Y] files
- Freed [Z] GB (duplicates)
- Archived [W] old files

## New Structure
[show tree]

## Maintenance Tips
- Weekly: Sort downloads
- Monthly: Archive completed projects
- Quarterly: Check duplicates
- Yearly: Archive old files

## Your Commands
# Find recent files
find . -type f -mtime -7

# Find duplicates
[custom command]
```

## Best Practices

### Folder Naming

- Clear, descriptive names
- No spaces (use hyphens/underscores)
- Be specific: "client-proposals" not "docs"
- Use prefixes: "01-current", "02-archive"

### File Naming

- Include dates: "2024-10-17-meeting-notes.md"
- Be descriptive: "q3-financial-report.xlsx"
- Avoid versions (use version control)
- Clean downloads: "doc-final-v2(1).pdf" → "document.pdf"

### When to Archive

- Not touched in 6+ months
- Completed work for reference
- Old versions after migration
- Hesitant to delete (archive first)

## Pro Tips

1. Start small (one folder at a time)
1. Run weekly cleanup on Downloads
1. Use consistent naming: "YYYY-MM-DD - Description"
1. Archive aggressively (don't delete)
1. Keep active work separate from archives
1. Let Claude handle cognitive load

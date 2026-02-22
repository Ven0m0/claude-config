---
description: Intelligently manage project documentation by analyzing changes and updating all relevant docs
category: documentation
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

<task>
Analyze the project and manage documentation across all files.
</task>

<instructions>

## Modes

### Mode 1: Documentation Overview (default)

When run as `/docs` without arguments:
1. Glob all markdown files (README, CHANGELOG, docs/*)
2. Read each documentation file
3. Analyze documentation coverage
4. Present organized summary with status and findings

### Mode 2: Smart Update (`/docs update`)

1. Analyze current codebase
2. Compare code reality vs documentation
3. Identify gaps: new features not documented, changed APIs, removed features still in docs, new config options
4. Update systematically: README, CHANGELOG, API docs, config docs, migration guides

### Mode 3: Session Documentation

After a long coding session:
1. Analyze conversation history
2. List all changes made
3. Group by feature/fix/enhancement
4. Update appropriate docs

### Mode 4: Badge Enhancement (`/docs badges`)

Analyze project, detect version/license/CI/language, generate shields.io badges, insert at top of README.

## Documentation Rules

<guidelines>
- Read existing docs completely before any update
- Find the exact section that needs updating
- Update in-place, never duplicate
- Preserve custom content and formatting
- Only create new docs if absolutely essential
- Match existing documentation style
- Respect semver in CHANGELOG
- Fix broken internal links
</guidelines>

<constraints>
- Do not delete existing documentation
- Do not overwrite custom sections
- Do not change documentation style drastically
- Do not create unnecessary documentation
</constraints>

</instructions>

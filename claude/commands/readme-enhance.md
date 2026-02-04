---
name: github-social:readme-enhance
description: Enhance README.md with marketing badges and a NotebookLM-style infographic
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Skill"]
---

# README Enhancement Command

Enhance the current project's README.md with marketing badges (shields.io)

### Generate Badges

Based on project analysis, generate appropriate shields.io badges:

**Always include** (if detectable):
- Version badge (npm/crates/pypi/GitHub release)
- License badge
- Build/CI status badge
- Primary language badge

**Include for engagement**:
- GitHub stars
- Downloads (if published)
- Last commit
- PRs welcome

**Context-specific**:
- Claude Code Plugin badge (if plugin.json exists)
- Coverage badge (if codecov/coveralls configured)
- Documentation badge (if docs site exists)

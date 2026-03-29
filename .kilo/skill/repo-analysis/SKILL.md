---
name: repo-analysis
description: Analyze code repositories for structure, patterns, and issues. Use when exploring unfamiliar codebases, finding files, or understanding project architecture.
---

# Repository Analysis Guide

## Initial Exploration

1. **Directory Structure**
   - List top-level files and directories
   - Identify configuration files
   - Find entry points (main, index, app)

2. **Technology Detection**
   - Look for package.json, pyproject.toml, Cargo.toml, etc.
   - Check for framework-specific files
   - Identify build tools and linters

3. **Key Files to Read**
   - README.md - Project overview
   - package.json / pyproject.toml - Dependencies and scripts
   - Configuration files - Build, test, lint settings
   - Source directory structure

## Analysis Patterns

**Web Projects**:
- Check for src/, app/, pages/ directories
- Look for routing configuration
- Identify state management

**Python Projects**:
- Check for src/ or package directories
- Look for requirements.txt / pyproject.toml
- Find test directories

**Rust Projects**:
- Read Cargo.toml for dependencies
- Check src/ structure
- Look for examples/

## Tools to Use

- `glob` - Find files by pattern
- `grep` - Search for patterns
- `read` - Examine file contents
- Task tool with `explore` agent for deep analysis

## Output Format

Provide a concise summary including:
1. Project type and primary language
2. Key directories and their purposes
3. Main dependencies/frameworks
4. Entry points and key files
5. Any notable patterns or conventions

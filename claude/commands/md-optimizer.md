---
description: Optimize markdown files for LLM context efficiency
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
argument-hint: <file-path-or-folder>
---

# Markdown Optimizer Command

Orchestrate markdown optimization by spawning the markdown-optimizer agent as a
sub-agent to protect the context window from large files.

## Input Parameters

**Path**: $ARGUMENTS (can be a single markdown file OR a folder path)

## Workflow

### 1. Validate and Discover Files

Check if the input path exists and determine type:

**If path is a file**:

- File not found: Report error
- Not markdown: Report error (must end with .md)
- Is markdown: Proceed with single file workflow

**If path is a folder**:

- Folder not found: Report error
- Use Glob tool with pattern `path/**/*.md` to find all markdown files
  recursively
- If no markdown files found: Report error
- Display count: "Found [N] markdown files to optimize"
- Proceed with batch workflow

### 2. Single File Mode

Read the file using the Read tool, then calculate:

- Word count from file content
- Token estimate (word count x 1.33)
- Topic from filename or H1 heading

Display to user:

```
Analyzing [filename]...
Current size: [X] tokens (estimated from [Y] words)
```

### 3. Spawn Optimizer Agent

Use the Task tool to spawn the `markdown-optimizer` agent with this prompt:

**For files < 10,000 tokens**:

```
Optimize this markdown file for information density and multi-file context loading.

**File**: [path]
**Topic**: [extracted topic]
**Current tokens**: [X]
**Target tokens**: [based on size - see targets below]
**Optimization version**: 1.1

Token targets:
- < 3,000 tokens: Light optimization (already efficient)
- 3,000-6,000 tokens: Standard compression to 3-4K range
- 6,000-10,000 tokens: Aggressive compression to <6K

Apply compression techniques, add optimization_version to YAML frontmatter.
```

**For files >= 10,000 tokens**:

```
This file is too large for efficient multi-file context loading. Analyze and recommend a split strategy into 3-4 semantically cohesive files of 3-4K tokens each, plus a hub index file.

Use numbered prefix naming: 00-[topic]-index.md, 01-[topic]-[section].md, etc.
```

### 4. Batch Processing (Folders)

When processing a folder, spawn SEPARATE agents for each file in PARALLEL:

1. Analyze all files first (quick scan with token estimates)
2. Spawn one `markdown-optimizer` Task agent per file (all in one message)
3. Report results with before/after metrics for each file

**IMPORTANT**: Spawn agents in PARALLEL (single message with multiple Task tool
calls).

## Token Target Reference

| Current Size | Mode       | Target          | Rationale                  |
| ------------ | ---------- | --------------- | -------------------------- |
| < 3,000      | Light      | Minimal changes | Already efficient          |
| 3,000-6,000  | Standard   | 3-4K range      | Compress to optimal        |
| 6,000-10,000 | Aggressive | <6K             | Too large for multi-file   |
| >= 10,000    | Split      | 3-4K per file   | Cannot coexist efficiently |

## Architecture Note

This command spawns the `markdown-optimizer` agent (opus model) to do the heavy
file processing in an isolated context, protecting the main conversation from
large file contents.

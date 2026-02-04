---
name: smart-format
description: >
  Mathematically determines whether ZON, TOON, or PLOON is the optimal token-saving
  format for data files. Use when optimizing data formats, reducing token usage,
  choosing serialization formats, or working with structured data for LLM contexts.
  Triggers: decide-format, token optimization, data format, ZON, TOON, PLOON.
allowed-tools: Read Glob Bash
---

# Smart Format Decider

Analytic tool that mathematically determines whether ZON, TOON, or PLOON is the optimal token-saving format for specific data files.

## Commands

- `decide-format [directory]`: Scans directory, benchmarks formats, and outputs a migration plan.

## Usage

1. Run `python scripts/decide_format.py ./src/data` (or `decide-format ./src/data` if installed)
2. Review `format_optimization_plan.json`
3. Execute conversion as needed.

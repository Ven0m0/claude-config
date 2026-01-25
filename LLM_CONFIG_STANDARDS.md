# LLM Config Standards

This repo stores config templates for LLM tools. Goals are lower token usage,
better context understanding, and consistent tooling.

## Token efficiency defaults

- Keep outputs short by default. Prefer summaries and diffs.
- Narrow file selection before reading or linting.
- Cap tool output and process in small batches.

## Context understanding defaults

- Start with README, SETUP, and tool specific READMEs.
- Build a short context index for large repos.
- Keep tool instructions focused on concrete tasks.

## Tooling defaults

- Use rg for text search.
- Use fd for file discovery.
- Use bun and bunx for JavaScript tasks.
- Use uv and uvx for Python tasks.
- Avoid legacy tools when modern alternatives exist.

## Layout guidelines

- One directory per tool at repo root.
- Keep templates in repo and copy to local dotfolders.

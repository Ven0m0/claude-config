---
description: Fix all linting and formatting issues across the codebase
category: code-analysis-testing
allowed-tools: Bash, Edit, Read, Glob
---

Detect project languages and run appropriate formatters/linters:
- Python: `uvx ruff format . && uvx ruff check --fix .`
- JS/TS: `npx @biomejs/biome check --write .`
- Go: `go fmt ./...`
- Rust: `cargo fmt && cargo clippy --fix --allow-dirty`

Apply all auto-fixes, then verify clean state.

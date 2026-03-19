---
description: Audit dependencies for outdated packages and vulnerabilities
agent: researcher
---

Audit project dependencies for security vulnerabilities and outdated packages.

## Project Type Detection

!`ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null`

## Outdated Packages (Node)

!`[ -f package.json ] && npm outdated --json 2>/dev/null || echo "no package.json"`

## Security Audit (Node)

!`[ -f package.json ] && npm audit --json 2>/dev/null | head -100 || echo "no package.json"`

## Outdated Packages (Python)

!`[ -f pyproject.toml ] || [ -f requirements.txt ] && pip list --outdated --format=json 2>/dev/null || echo "no python project"`

## Security Audit (Python)

!`command -v pip-audit >/dev/null && pip-audit --format=json 2>/dev/null | head -100 || echo "pip-audit not installed"`

## Cargo Audit (Rust)

!`[ -f Cargo.toml ] && command -v cargo-audit >/dev/null && cargo audit --json 2>/dev/null | head -100 || echo "no Cargo.toml or cargo-audit"`

---

Produce a prioritized report:

1. **Security vulnerabilities** (CVEs) — include severity, package, and fix version
2. **Major version updates** — breaking changes, include migration notes if known
3. **Minor/patch updates** — routine maintenance

For each group, provide the exact update command to run. Do not modify any files.

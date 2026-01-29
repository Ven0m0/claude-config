# Update Dependencies

Update and audit project dependencies in `$ARGUMENTS`.

**Modes:**
- `audit`: Security vulnerability scan
- `update` or no args: Update dependencies safely
- `rust`: Rust-specific dependency update

## Security Audit

1. Identify dependency files (package.json, requirements.txt, Cargo.toml, etc.)
2. Run security audit:
   - JavaScript: `npm audit` or `bun audit`
   - Python: `uvx pip-audit`
   - Rust: `cargo audit`
3. Analyze severity levels and CVE references
4. Create prioritized remediation plan

## JavaScript/TypeScript Updates

1. Check outdated: `bun outdated` or `npm outdated`
2. Review breaking changes in changelogs
3. Update incrementally: `bun update <package>`
4. Test after each update
5. Update lock files and verify builds pass

## Rust Updates

1. Check current state: `cargo tree` and `cargo update --dry-run`
2. Evaluate risk levels:
   - **Safe**: Patch versions (0.1.2 → 0.1.3)
   - **Caution**: Minor versions (0.1.0 → 0.2.0)
   - **Dangerous**: Major versions (1.x → 2.x)
3. Create backups:
   ```bash
   cp Cargo.toml Cargo.toml.backup
   cp Cargo.lock Cargo.lock.backup
   ```
4. Execute update: `cargo update`
5. Verify: `cargo check && cargo test && cargo clippy`
6. Rollback if needed:
   ```bash
   cp Cargo.toml.backup Cargo.toml
   cp Cargo.lock.backup Cargo.lock
   ```

## Python Updates

1. Check outdated: `uv pip list --outdated`
2. Update: `uv pip install --upgrade <package>`
3. Run tests after updates
4. Update requirements.txt or pyproject.toml

## Best Practices

- Update one dependency at a time for major versions
- Run full test suite after updates
- Check changelogs for breaking changes
- Keep lock files in version control

**Output:**
- List of updated packages (old → new version)
- Security issues found/resolved
- Breaking changes requiring code updates
- Test results after updates

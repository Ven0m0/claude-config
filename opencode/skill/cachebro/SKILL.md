---
name: cachebro
description: Optimize cache usage and clear stale caches. Use when disk space is low, builds are slow, or dealing with corrupted cache artifacts.
---

# Cache Optimization

Manage and optimize various caches to improve performance and free disk space.

## When to Use

- Disk space running low
- Build times increasing unexpectedly
- Seeing stale or corrupted results
- After updating dependencies
- Switching branches frequently

## Cache Locations

### Node.js
```bash
# npm cache
npm cache verify
npm cache clean --force

# Yarn cache
yarn cache dir
yarn cache clean

# pnpm store
pnpm store prune
```

### Python
```bash
# pip cache
pip cache purge

# pip download cache
rm -rf ~/.cache/pip

# pyenv cache
rm -rf ~/.pyenv/cache/*
```

### Build Caches
```bash
# Next.js
rm -rf .next

# Turborepo
rm -rf .turbo

# Cargo
cargo clean

# Go modules
go clean -cache
```

### IDE Caches
```bash
# VS Code
rm -rf ~/.cache/VSCode

# IntelliJ
rm -rf ~/.IntelliJIdea*/system/caches
```

## Analysis Commands

### Find Large Cache Dirs
```bash
du -sh ~/.cache/* 2>/dev/null | sort -rh | head -10
find ~ -type d -name "node_modules" -o -name "__pycache__" -o -name ".cache" 2>/dev/null | xargs du -sh 2>/dev/null | sort -rh | head -10
```

### Find Stale Caches (30+ days)
```bash
find ~/.cache -type d -mtime +30 -ls 2>/dev/null
```

### Cache Size by Type
```bash
# Summary of common cache locations
for dir in npm yarn pip go cargo; do
  size=$(du -sh ~/${dir} 2>/dev/null | cut -f1 || echo "N/A")
  echo "$dir: $size"
done
```

## Selective Cleaning

### Safe Clean (keep recent)
```bash
# Only remove items older than 7 days
find ~/.cache -type f -mtime +7 -delete 2>/dev/null
```

### Pattern-based
```bash
# Remove only .next and .turbo
rm -rf .next .turbo

# Remove __pycache__ recursively
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
```

## Prevention

- Add to `.gitignore`: `.next/`, `.turbo/`, `node_modules/`, `__pycache__/`, `*.pyc`
- Use `direnv` or similar for environment-specific caching
- Regular maintenance schedule

## Notes/Inspiration

Inspired by [`opencode-cachebro`](https://www.npmjs.com/package/opencode-cachebro) - Wrapper of `glommer/cachebro` for OpenCode; cache optimization.

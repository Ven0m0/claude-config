---
description: Optimize code, bundles, and build performance
category: performance-optimization
allowed-tools: Read, Edit, Bash(bun *), Bash(npm *), Bash(pnpm *), Bash(cargo *)
---

# Performance Optimization

Analyze and optimize performance based on target: `$ARGUMENTS`

**Modes:**
- `code` or no args: Analyze code for performance bottlenecks
- `bundle`: Optimize JavaScript/TypeScript bundle size
- `build`: Optimize build process speed and efficiency

## Code Performance

1. Analyze code for performance bottlenecks
2. Assess performance impact of each issue
3. Propose concrete refactoring recommendations
4. Provide code examples showing optimizations

## Bundle Size Optimization

1. Analyze bundle with webpack-bundle-analyzer or vite-bundle-visualizer
2. Implement code splitting and lazy loading for routes/components
3. Enable tree shaking and dead code elimination
4. Replace large dependencies with lighter alternatives
5. Configure compression (gzip/brotli)
6. Measure savings and document improvements

## Build Performance

1. **Measure baseline** (clean build, incremental, dev vs prod)
2. **Enable caching** and parallel processing
3. **Optimize splitting** - bundle and code splitting
4. **Tool-specific optimizations:**
   - Webpack: splitChunks, thread-loader, usedExports
   - Vite: rollupOptions, esbuild, dependency pre-bundling
   - TypeScript: incremental compilation, project references, skipLibCheck
5. **Asset optimization** - images, minification, tree shaking
6. **CI/CD optimization** - caching strategies, parallel jobs

**Output:**
- Before/after metrics
- Specific changes made
- Remaining optimization opportunities

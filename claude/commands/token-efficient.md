---
description: Compress responses using symbols and abbreviations (30-50% token reduction)
category: utilities-debugging
---

Enable Token Efficiency Mode for compressed responses:
- Use visual symbols: →(leads to), ✅(success), ❌(error), ⚡(performance), 🔧(config)
- Use abbreviations: cfg(config), impl(implementation), perf(performance), deps(dependencies)
- Keep code quality unchanged, only compress explanations
- Example: `auth.js:45 → 🛡️ sec vuln` vs "Security vulnerability in auth"

---
description: Verify if statements are true by checking code and docs
category: utilities-debugging
---

Check fact accuracy by examining:

1. Actual code (most trustworthy)
1. README.md and docs/
1. Config files (package.json, etc.)

Report: ✅ Correct / ❌ Incorrect / ⚠️ Partially correct / ❓ Cannot determine
Provide evidence: file paths, code snippets, notes explaining verdict.

### Report Format

```text
## Fact Check Results

### What You Asked
"[Your statement]"

### Verdict
[✅/❌/⚠️/❓] [True/False/Partial/Unknown]

### Evidence
- **File**: `path/to/file.dart:123`
- **Code**: [The actual code]
- **Note**: [Why this proves it]

### Details
[If wrong, here's what's actually true]
[If partial, here's what's missing]
[If unknown, here's what I'd need to check]
```

### Basic Examples

```bash
# Check the tech stack
/check-fact "This app is built with Flutter + Riverpod + GraphQL"

# Check if a feature exists
/check-fact "Dark mode is implemented and can be switched from user settings"

# Check architecture choices
/check-fact "All state management is done with Riverpod, BLoC is not used"

# Check security setup
/check-fact "Authentication tokens are encrypted and stored in secure storage"
```

### Collaboration with Claude

```bash
# Check dependencies
ls -la && find . -name "pubspec.yaml" -exec cat {} \;
/check-fact "The main dependencies used in this project are..."

# Check how something is built
grep -r "authentication" . --include="*.dart"
/check-fact "Authentication is custom built, not using third-party auth"

# Check if docs match reality
cat README.md
/check-fact "Everything in the README is actually implemented"
```

### When to Use This

- Writing specs: Make sure your descriptions are accurate
- Taking over a project: Check if you understand it correctly
- Client updates: Verify what's actually built
- Blog posts: Fact-check your technical content
- Presentations: Confirm project details before presenting

### Important

- Code beats docs: If they disagree, the code is right
- Old docs happen: Implementation is what matters
- No guessing: If I can't verify it, I'll say so
- Security matters: Extra careful with security-related facts

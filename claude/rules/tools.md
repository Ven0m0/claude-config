---
description: Essential tooling guidelines for development including LSP, code navigation, project activation protocols, memory management, and precision editing.
category: tool-usage
---

# Tool Preferences

**Core CLI Tools**
- **File Search**: Use `fd` over `find`
- **Text Search**: Use `rg` over `grep`
- **LSP**: Use language server protocols for symbol navigation
- **Interactive Selection**: Use `fzf` for fuzzy finding

**Development Tools**
- **Package Managers**: 
  - JavaScript/TypeScript: `bun`, `npm`, `pnpm`, `yarn`
  - Python: `uv`, `pip`, `poetry`
  - Rust: `cargo`, `rustup`
  - Go: `go`

**File Operations**
- **Reading**: `cat`, `bat`, `head`, `tail`
- **Editing**: `Edit`, `MultiEdit`
- **Bulk Operations**: `xargs`, `parallel`

**Security Tools**
- **Analysis**: Static analysis, dynamic profiling
- **Scanning**: OWASP ZAP, Snyk, npm audit
- **Testing**: Unit tests, integration tests, E2E testing

## Tool-Specific Guidelines

### LSP Usage (CRITICAL)

**When to Use LSP**
- ALWAYS use LSP over text search for:
  - Finding symbol definitions
  - Finding all references
  - Understanding function implementations
  - Checking documentation

**For Code Navigation**
1. **Go to Definition First**: Use `lsp_goto_definition`
2. **Find All References**: Use `lsp_find_references`
3. **Document Understanding**: Use `lsp_hover` for symbol documentation

**For Code Analysis**
1. **Workspace Symbols**: Use `lsp_document_symbol`
2. **Project Structure**: Use `lsp_document_symbol` on key directories
3. **Hierarchy View**: Use LSP workspace features

### File Search Patterns
- **NEVER use `grep` to find symbol usages in code
- **PREFER file pattern matching**: Find files by exact name, not string search
- **ASK for context**: When unsure, ask LSP for symbol information

**Shell Integration**
- **NEVER pipe unstructured text**: Always use structured commands
- **PREFER LSP over shell scripts**: `ls | xargs code_lsp`
- **ABORT on incomplete commands**: Don't run without proper context

## Tool Selection Matrix

| Task Type | Preferred Tool | Fallback |
|-----------|-------------|------------|
| **Code Navigation** | LSP | ripgrep |
| **Structure Analysis** | LSP | ast-grep |
| **Large Codebases** | LSP | code-explorer |
| **Performance Analysis** | LSP | profiler, memory analyzer |
| **Security Review** | Security | security-reviewer |

## Code Quality Standards

| Pattern | When to Use |
|-----------|-------------|------------|
| **Type Safety** | LSP | TypeScript strict mode |
| **Documentation** | LSP | JSDoc |
| **Formatting** | LSP | Prettier, Biome |

## Workflow Integration

### Development Environment
- Local development: All tools available
- Remote development: LSP + Git workflows
- CI/CD: Automated testing and deployment
- Containerized: LSP in Docker/VS Code

## Verification Process

1. **Analyze**: Use LSP diagnostics
2. **Fix**: Address findings before continuing
3. **Validate**: Ensure no new issues introduced
4. **Retest**: Confirm fix doesn't break anything

### Anti-Patterns to Avoid

- **Text-based symbol finding**: Never use regex to parse code structure
- **Assumption-driven coding**: Don't assume structure without verification
- **Copy-paste development**: Never copy code without understanding imports
- **Fix without understanding**: Always verify the issue exists first

## Resources

### Documentation
- **LSP Specification**: Language Server Protocol specification
- **API Documentation**: REST API documentation with all endpoints and error codes
- **Security Guidelines**: OWASP Top 10, CWE list, SANS guidelines
- **Testing Standards**: W3C WCAG, OWASP testing guide
- **Code Examples**: Secure coding examples with proper validation

### Testing Tools
- **Static Analysis**: SonarQube (Java), CodeQL (multi-language), Snyk (multi-language)
- **Dynamic Analysis**: profilers, memory analyzers
- **Interactive Debuggers**: VS Code debugger, Chrome DevTools
- **Performance Testing**: Artillery, k6, JMeter

### Training Resources
- OWASP Top 10: Common vulnerability patterns
- SANS guidelines: Security coding principles
- CWE Database: Common weakness database
- Browser Security: XSS prevention, CSP headers
- NIST Cybersecurity Framework: Security controls

## Common Tool Patterns

### Searching
```bash
# Code structure search
rg "class MyClass" --type typescript

# Symbol navigation
code_lsp --goto-definition MyClass

# Find references
code_lsp --find-references MyClass

# Workspace analysis
code_lsp --document-symbol MyClass
```

## Quality Checklist

- [ ] All language servers configured
- [ ] All development tools use LSP
- [ ] Security scanning implemented
- [ ] Code quality standards documented
- [ ] Performance monitoring in place
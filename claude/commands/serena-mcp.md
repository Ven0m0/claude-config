# Serena MCP Integration Guide

## Essential for All Coding Work
**Semantic code analysis, symbol navigation, project activation protocols, memory management, and precision editing.**

## Mandatory First Steps (ALWAYS DO FIRST)

### 1. Project Activation
```python
# ALWAYS activate Serena project first
mcp__serena__activate_project("agencheck")
```

### 2. Configuration Check  
```python
# Check onboarding status
mcp__serena__check_onboarding_performed()

# Verify current configuration
mcp__serena__get_current_config()
```

### 3. Initial Instructions
```python
# Get project-specific instructions (CRITICAL)
mcp__serena__initial_instructions()
```

## Core Serena Integration Principles

### Symbol-Level Navigation (NEVER read entire files)
```python
# Get overview first
mcp__serena__get_symbols_overview("relative_path")

# Find specific symbols
mcp__serena__find_symbol("class_name", relative_path="src/")

# Find references
mcp__serena__find_referencing_symbols("symbol_name", "relative_path")
```

### Precision Editing (Prefer symbol operations)
```python
# Replace symbol body
mcp__serena__replace_symbol_body("symbol_name", "relative_path", "new_body")

# Insert after symbol
mcp__serena__insert_after_symbol("symbol_name", "relative_path", "content")

# Insert before symbol  
mcp__serena__insert_before_symbol("symbol_name", "relative_path", "content")
```

### Memory Management (Selective reading)
```python
# List available memories
mcp__serena__list_memories()

# Read only relevant memories
mcp__serena__read_memory("memory_name")

# Write insights for future reference
mcp__serena__write_memory("memory_name", "content")
```

### Progressive Search Strategy
1. **Overview**: `get_symbols_overview()` for high-level understanding
2. **Symbol Discovery**: `find_symbol()` for specific code entities  
3. **Targeted Reading**: `read_file()` only when symbol operations insufficient
4. **Context Gathering**: `find_referencing_symbols()` for usage patterns

## Mode Management

### Available Modes Reference

| Mode | Purpose | Use When |
|------|---------|----------|
| `planning` | Design/architecture work | Creating solution designs, PRDs, architectural decisions |
| `editing` | File modification enabled | Implementation, refactoring, bug fixes |
| `interactive` | Multi-turn conversation | Normal development sessions |
| `one-shot` | Single response tasks | Generating reports, analysis summaries |
| `no-onboarding` | Skip initial setup | Returning to familiar project |
| `no-memories` | Disable memory loading | Quick lookups without context overhead |

### Switch Modes Appropriately
```python
# Implementation mode (DEFAULT for most work)
mcp__serena__switch_modes(["editing", "interactive"])

# Architecture/design mode
mcp__serena__switch_modes(["planning", "one-shot"])

# Quick lookup mode (minimal overhead)
mcp__serena__switch_modes(["no-memories", "interactive"])

# Read-only exploration
mcp__serena__switch_modes(["planning", "interactive"])
```

### Mode Selection by Task Type

| Task | Recommended Modes |
|------|-------------------|
| Bug fix | `["editing", "interactive"]` |
| New feature | `["editing", "interactive"]` |
| Code review | `["planning", "interactive"]` |
| Solution design | `["planning", "one-shot"]` |
| Quick symbol lookup | `["no-memories", "interactive"]` |
| Refactoring | `["editing", "interactive"]` |

### Thinking Tools Integration (MANDATORY CHECKPOINTS)

**These are NOT optional - they are circuit breakers for quality control:**

| Checkpoint | When to Use | What It Does |
|------------|-------------|--------------|
| `think_about_collected_information` | After reading 3+ symbols/files | Validates you have sufficient context |
| `think_about_task_adherence` | Every 5 tool calls | Ensures you haven't drifted from objective |
| `think_about_whether_you_are_done` | Before declaring complete | Prevents premature task closure |

```python
# CHECKPOINT 1: After gathering context
mcp__serena__think_about_collected_information()
# Ask yourself: Do I have enough information? What am I missing?

# CHECKPOINT 2: Mid-task discipline check
mcp__serena__think_about_task_adherence()
# Ask yourself: Am I still solving the original problem?

# CHECKPOINT 3: Before completion (NEVER SKIP)
mcp__serena__think_about_whether_you_are_done()
# Ask yourself: Have I truly completed all requirements?
```

**⚠️ VIOLATION**: Declaring a task complete without `think_about_whether_you_are_done` is a protocol violation.

## Advanced Workflows

### Code Analysis Workflow
```bash
# 1. Activate and get overview
mcp__serena__activate_project("agencheck")
mcp__serena__get_symbols_overview(".")

# 2. Find specific functionality  
mcp__serena__find_symbol("target_function", include_body=true)

# 3. Understand dependencies
mcp__serena__find_referencing_symbols("target_function", "file.py")

# 4. Think about findings
mcp__serena__think_about_collected_information()
```

### Implementation Workflow
```bash
# 1. Semantic analysis before changes
mcp__serena__think_about_task_adherence()

# 2. Use symbol-level editing
mcp__serena__replace_symbol_body("function_name", "file.py", "new_implementation")

# 3. Verify changes  
mcp__serena__find_symbol("function_name", include_body=true)

# 4. Check completion
mcp__serena__think_about_whether_you_are_done()
```

## Command Line Usage

### File Operations  
```python
# Search for patterns (avoid when possible - use symbol operations instead)
mcp__serena__search_for_pattern("regex_pattern", paths_include_glob="*.py")

# Execute shell commands (read suggested commands memory first)
mcp__serena__execute_shell_command("command")
```

### Project Management
```python
# Remove project from configuration
mcp__serena__remove_project("project_name")

# Prepare for new conversation
mcp__serena__prepare_for_new_conversation()
```

## Anti-Patterns to Avoid

### ❌ Don't Read Entire Files Unnecessarily
```python
# BAD - reading entire file when you need specific symbol
mcp__serena__read_file("large_file.py")

# GOOD - target specific symbols
mcp__serena__find_symbol("specific_function", "large_file.py", include_body=true)
```

### ❌ Don't Skip Semantic Analysis
```python
# BAD - jumping straight to implementation
mcp__serena__replace_symbol_body(...)

# GOOD - think about task first
mcp__serena__think_about_task_adherence()
mcp__serena__replace_symbol_body(...)
```

### ❌ Don't Read All Memories  
```python
# BAD - reading all memories unnecessarily
for memory in mcp__serena__list_memories(): 
    mcp__serena__read_memory(memory)

# GOOD - read selectively based on relevance
mcp__serena__read_memory("task_completion_checklist")  # Only if relevant to task
```

## Troubleshooting

### Common Issues
1. **Language Server Errors**: Use `mcp__serena__restart_language_server()` 
2. **Symbol Not Found**: Check file path and symbol name spelling
3. **Memory Issues**: Use `mcp__serena__list_memories()` to verify available memories
4. **Mode Conflicts**: Switch to appropriate mode for task type

### Error Recovery
```python
# Restart language server if symbol operations fail
mcp__serena__restart_language_server()

# Verify project is still active  
mcp__serena__get_current_config()

# Re-activate if necessary
mcp__serena__activate_project("agencheck")
```

## Integration with Other Tools

### With Task Management
1. Use Serena for semantic analysis before task implementation
2. Document insights in task Description field
3. Use memory system for cross-task knowledge transfer

### With Testing
1. Use symbol navigation to understand test structure
2. Use precision editing for test modifications
3. Use thinking tools to verify test coverage

### With Documentation
1. Use symbol discovery for API documentation
2. Use memory system to document architectural decisions  
3. Use thinking tools to verify documentation completeness

**🧠 Master Serena MCP integration for 10x productivity through semantic code understanding and precision editing.**
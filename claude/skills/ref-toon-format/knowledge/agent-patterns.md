# TOON Agent Communication Patterns

Agent handoff and memory persistence patterns using TOON format for token-efficient communication in plan-marshall marketplace.

## Overview

TOON provides 30-60% token reduction for agent handoffs and memory persistence compared to JSON format.

**Scope**: Internal plan-marshall marketplace operations only:
- Agent-to-agent handoffs
- Memory persistence (memory layer)
- Inter-agent data exchange
- Test fixtures for agent workflows

## Handoff Templates

### Minimal Handoff

**Purpose**: Simple agent-to-agent communication with minimal context.

**Example** - handoff-minimal.toon:
```toon
from_agent: quality-agent
to_agent: fix-agent

items[3]{file,line}:
A.java,42
B.java,89
C.java,15
```

**Token Count**: ~40 tokens

**Use Cases**:
- Simple task delegation
- File lists with line numbers
- Quick status updates

### Standard Handoff

**Purpose**: Typical agent handoff with context and structured data.

**Example** - handoff-standard.toon:
```toon
from_agent: java-quality-agent
to_agent: java-implement-agent

context:
  task: Fix code quality issues
  files_analyzed: 15

issues[2]{file,line,severity,rule,message}:
Example.java,42,BLOCKER,S2095,Use try-with-resources
Service.java,89,MAJOR,S1192,Define constant

instructions[2]:
- Start with BLOCKER severity
- Run tests after fixes
```

**Token Count**: ~140 tokens (vs 280 JSON = 50% reduction)

**Use Cases**:
- Quality → Implementation workflows
- Sonar → Triage → Fix chains
- Coverage → Analysis → Report workflows

### Full Handoff

**Purpose**: Comprehensive handoff with multiple data structures and detailed context.

**Example** - handoff-full.toon:
```toon
from_agent: analysis-agent
to_agent: implementation-agent

session:
  id: 2025-11-26-001
  started: 2025-11-26T10:00:00Z
  branch: feature/toon-migration

context:
  task: Implement TOON format support
  priority: high
  estimated_effort: 2h

blockers[1]{type,description,severity}:
DEPENDENCY,Requires toon-usage skill,CRITICAL

findings[5]{file,line,severity,type,message,effort}:
HandoffTemplate.java,45,BLOCKER,BUG,Resource leak,10min
AgentBase.java,78,CRITICAL,VULNERABILITY,SQL injection risk,30min
MemoryStore.java,123,MAJOR,CODE_SMELL,Duplicate code,15min
Parser.java,56,MINOR,CODE_SMELL,Complex method,5min
Config.java,89,INFO,CODE_SMELL,TODO comment,2min

statistics:
  total_findings: 5
  by_severity{BLOCKER,CRITICAL,MAJOR,MINOR,INFO}: 1,1,1,1,1
  by_type{BUG,VULNERABILITY,CODE_SMELL}: 1,1,3
  estimated_total_effort: 62min

instructions[4]:
- Start with BLOCKER and CRITICAL issues
- Run tests after each fix
- Update documentation if API changes
- Verify no regression in existing tests

next_steps[3]:
- Fix resource leak in HandoffTemplate
- Address SQL injection in AgentBase
- Refactor duplicate code in MemoryStore
```

**Token Count**: ~380 tokens (vs 760 JSON = 50% reduction)

**Use Cases**:
- Complex multi-agent workflows
- Comprehensive analysis results
- Detailed implementation plans
- Session state with full context

## Memory Persistence Patterns

### Task History

**Purpose**: Track completed and in-progress tasks across sessions.

**Example** - task-history.toon:
```toon
session_id: 2025-11-26-001
agent: java-implement-agent

completed_tasks[3]{task_id,description,status,timestamp}:
TASK-001,Fix resource leak,completed,2025-11-26T10:00:00Z
TASK-002,Remove unused vars,completed,2025-11-26T10:15:00Z
TASK-003,Add null checks,completed,2025-11-26T10:30:00Z

current_task:
  task_id: TASK-004
  description: Implement TOON support
  status: in_progress
  started: 2025-11-26T10:45:00Z
```

**Storage**: `{memory-storage}/task-history.toon`

**Use Cases**:
- Multi-session workflows
- Incremental implementation
- Progress tracking

### Incremental State

**Purpose**: Preserve analysis state for large codebases.

**Example** - analysis-state.toon:
```toon
session_id: 2025-11-26-001
agent: quality-agent
analysis_phase: in_progress

completed_files[50]{file,issues,timestamp}:
A.java,3,2025-11-26T10:00:00Z
B.java,1,2025-11-26T10:01:00Z
...

pending_files[100]:
- src/main/java/de/cuioss/http/Client.java
- src/main/java/de/cuioss/http/Request.java
...

summary:
  total_files: 150
  completed: 50
  pending: 100
  total_issues_found: 45
```

**Storage**: `{memory-storage}/analysis-state.toon`

**Use Cases**:
- Large codebase analysis
- Resumable workflows
- Batch processing state

## Agent Prompt Patterns

### Receiving TOON Handoff

**Pattern**:
```
You are receiving a handoff from {previous_agent}.

The data uses TOON format:
- Arrays: arrayName[N]{field1,field2}:
- Rows: CSV-style values

---
{toon_data}
---

Process and {action}.
```

**Example**:
```
You are receiving a handoff from java-quality-agent.

The data uses TOON format:
- Arrays: issues[N]{file,line,severity,rule,message}:
- Rows: CSV-style values

---
from_agent: java-quality-agent
to_agent: java-implement-agent

issues[2]{file,line,severity,rule,message}:
Example.java,42,BLOCKER,S2095,Use try-with-resources
Service.java,89,MAJOR,S1192,Define constant
---

Fix the issues starting with BLOCKER severity.
```

### Generating TOON Handoff

**Pattern**:
```
Generate handoff in TOON format:

from_agent: {your_name}
to_agent: {next_agent}

context:
  task: {task_description}

findings[N]{field1,field2}:
value1,value2
...

instructions[N]:
- instruction1
- instruction2
```

**Example**:
```
Generate handoff in TOON format:

from_agent: java-quality-agent
to_agent: java-implement-agent

context:
  task: Fix code quality issues
  files_analyzed: 15

findings[2]{file,line,severity,rule}:
Example.java,42,BLOCKER,S2095
Service.java,89,MAJOR,S1192

instructions[2]:
- Start with BLOCKER severity
- Run tests after fixes
```

## Test Fixture Patterns

### Sonar Issues

**Purpose**: Test data for Sonar issue processing workflows.

**Example** - sonar-issues.toon:
```toon
project_key: cuioss_cui-http-client
pull_request_id: 123

issues[5]{key,type,severity,file,line,rule,message,effort}:
AX-001,BUG,BLOCKER,HttpClient.java,145,java:S2095,Use try-with-resources,10min
AX-002,CODE_SMELL,MAJOR,HttpClient.java,89,java:S1192,Define constant,5min
AX-003,VULNERABILITY,CRITICAL,UserService.java,67,java:S3649,String concatenation,30min
AX-004,CODE_SMELL,MINOR,Parser.java,23,java:S1068,Remove unused field,2min
AX-005,CODE_SMELL,INFO,ConfigLoader.java,45,java:S1135,Complete TODO,15min

statistics:
  total: 5
  by_severity{BLOCKER,CRITICAL,MAJOR,MINOR,INFO}: 1,1,1,1,1
  by_type{BUG,VULNERABILITY,CODE_SMELL}: 1,1,3
```

**Token Savings**: ~60% vs JSON

**Use Cases**:
- Testing Sonar workflow agents
- Validating triage logic
- Fix prioritization tests

### Coverage Analysis

**Purpose**: Test data for coverage analysis workflows.

**Example** - coverage-analysis.toon:
```toon
status: success

data:
  by_file[2]{file,lines,statements,functions,branches,status}:
  /src/utils/validator.js,87.5,88.89,100,80,good
  /src/utils/formatter.js,80,80,87.5,66.67,acceptable

summary:
  total_files: 2
  avg_coverage: 83.75
  threshold: 80
  result: pass
```

**Token Savings**: ~60% vs JSON

**Use Cases**:
- Testing coverage analysis agents
- Validating threshold logic
- Report generation tests

### Build Failures

**Purpose**: Test data for build failure categorization.

**Example** - build-failure.toon:
```toon
build_status: failed
project: cui-http-client

errors[3]{file,line,type,category,message}:
HttpClient.java,145,COMPILATION,RESOURCE_LEAK,"'InputStream' not closed"
ApiService.java,89,COMPILATION,TYPE_ERROR,"incompatible types: String cannot be converted to int"
ConfigLoader.java,23,TEST,ASSERTION,"expected:<200> but was:<404>"

categorization:
  compilation_errors: 2
  test_failures: 1
  total: 3
```

**Token Savings**: ~50% vs JSON

**Use Cases**:
- Testing build failure agents
- Validating error categorization
- Fix routing logic tests

## Token Impact Measurements

### Agent Chain Example

**Workflow**: Quality → Implement → Test → Verify

**JSON Format** (4 handoffs):
- Quality → Implement: ~200 tokens
- Implement → Test: ~180 tokens
- Test → Verify: ~220 tokens
- Verify → Report: ~200 tokens
- **Total**: ~800 tokens

**TOON Format** (4 handoffs):
- Quality → Implement: ~80 tokens
- Implement → Test: ~70 tokens
- Test → Verify: ~90 tokens
- Verify → Report: ~80 tokens
- **Total**: ~320 tokens

**Savings**: 480 tokens (60% reduction)

### Single Handoff Example

**Standard Handoff**:
- JSON: 280 tokens
- TOON: 140 tokens
- **Savings**: 140 tokens (50% reduction)

**Full Handoff**:
- JSON: 760 tokens
- TOON: 380 tokens
- **Savings**: 380 tokens (50% reduction)

## Migration Guidance

### Converting JSON to TOON

**Step 1**: Identify uniform arrays
```json
{
  "issues": [
    {"file": "A.java", "line": 42, "severity": "HIGH"},
    {"file": "B.java", "line": 89, "severity": "MEDIUM"}
  ]
}
```

**Step 2**: Extract field headers
- Fields: `file`, `line`, `severity`
- Count: 2 items

**Step 3**: Convert to TOON
```toon
issues[2]{file,line,severity}:
A.java,42,HIGH
B.java,89,MEDIUM
```

**Step 4**: Validate
- Length declaration `[2]` matches row count: ✓
- Field count matches header: ✓
- Token count reduced: ✓

### Handling Non-Uniform Data

**Option 1**: Keep as nested object
```toon
context:
  task: Fix issues
  priority: high
  files_analyzed: 15
```

**Option 2**: Use mixed format
```toon
metadata:
  - {created: 2025-11-26, author: agent-1}
  - {updated: 2025-11-26, author: agent-2}
```

### Escaping Special Characters

**Values with commas**:
```toon
messages[2]{id,text}:
1,"Error: Value must be between 0 and 100, inclusive"
2,"Warning: File not found, using default"
```

**Values with quotes**:
```toon
messages[1]{id,text}:
1,"She said ""hello"" to me"
```

## Best Practices

### DO

✅ Use TOON for uniform arrays (issues, files, metrics)
✅ Include `[N]` length declarations for validation
✅ Declare `{field1,field2}` headers explicitly
✅ Use CSV escaping for commas in values
✅ Keep nesting depth ≤ 3 levels
✅ Validate row count matches length declaration

### DON'T

❌ Use TOON for non-uniform data (use nested objects)
❌ Skip length declarations (reduces LLM accuracy)
❌ Mix field order across rows
❌ Exceed 3 levels of nesting
❌ Use TOON for API interchange (internal only)

## Quality Checklist

When creating TOON handoffs or memory files:

- [ ] Length declaration `[N]` matches actual row count
- [ ] Field headers `{field1,field2}` match all rows
- [ ] CSV escaping used for values with commas
- [ ] Consistent field order across rows
- [ ] Nesting depth ≤ 3 levels
- [ ] Token reduction ≥ 30% vs JSON (measure)
- [ ] Proper indentation (2 spaces or 1 tab)
- [ ] No trailing commas in rows

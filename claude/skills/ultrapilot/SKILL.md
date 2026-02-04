---
name: ultrapilot
description: Parallel autopilot with file ownership partitioning
---

# Ultrapilot Skill

Parallel autopilot that spawns multiple workers with file ownership partitioning for maximum speed.

## Quick Reference (30 seconds)

### Usage
```bash
/oh-my-claudecode:ultrapilot <your task>
/oh-my-claudecode:up "Build a full-stack todo app"
```

### Magic Keywords
`ultrapilot`, `parallel build`, `swarm build`, `fast parallel`, `ultra fast`

### Key Capabilities
1. **Decomposes** task into parallel-safe components
2. **Partitions** files with exclusive ownership (no conflicts)
3. **Spawns** up to 5 parallel workers (Claude Code limit)
4. **Coordinates** progress via TaskOutput
5. **Integrates** changes with sequential handling of shared files

**Speed Multiplier:** Up to 5x faster than sequential autopilot.

### When to Use
| Ultrapilot | Autopilot |
|------------|-----------|
| Multi-component systems | Single-threaded sequential tasks |
| Independent features across modules | Heavy interdependencies |
| Large refactorings with clear boundaries | Constant integration checks |
| Parallel test generation | Small focused single-module features |
| Multi-service architectures | |

---

## Implementation Guide (5 minutes)

### Architecture
```
User Input → [ULTRAPILOT COORDINATOR]
                    ↓
         Decomposition + File Partitioning
                    ↓
    +-------+-------+-------+-------+-------+
    [W-1]   [W-2]   [W-3]   [W-4]   [W-5]
   backend frontend database api-docs tests
                    ↓
         [INTEGRATION PHASE]
        (shared files: package.json, etc.)
                    ↓
         [VALIDATION PHASE]
```

### Phases

**Phase 0: Task Analysis**
- Can task split into 2+ independent subtasks?
- Are file boundaries clear?
- Falls back to autopilot if unsuitable

**Phase 1: Decomposition**
- AI-powered task breakdown via Architect agent
- Identify independent components with file boundaries
- Generate parallel execution groups
- Identify shared files (handled by coordinator)

**Phase 2: File Partitioning**
- Assign exclusive file ownership per worker
- NO worker writes to another worker's files
- Shared files (package.json, tsconfig.json) handled by coordinator

**Phase 3: Parallel Execution**
- Spawn workers as Task subagents
- Each worker: gets ONLY its files, follows OODA loop, reports via TaskOutput

**Phase 4: Integration**
- Merge shared file changes sequentially
- Handle any coordination conflicts

**Phase 5: Validation**
- Run full test suite
- Build verification
- System integrity check

### Decomposition Result Structure
```json
{"subtasks": [
  {"id": "backend", "name": "Backend API",
   "ownedFiles": ["src/api/**", "src/db/**"],
   "agent": "executor", "blockedBy": []},
  {"id": "frontend", "name": "Frontend UI",
   "ownedFiles": ["src/ui/**", "src/components/**"],
   "agent": "executor-low", "blockedBy": []}
], "sharedFiles": ["package.json", "tsconfig.json"]}
```

### Worker Agents
| Agent | Complexity | Use For |
|-------|------------|---------|
| `executor-low` | Simple | Add tests, fix lint, add types |
| `executor` | Medium | New features, refactors |
| `executor-high` | Complex | Architecture changes |

---

## Advanced Patterns

### Handling Shared Files
Shared files are collected and merged by coordinator after all workers complete:
1. Gather all shared file changes
2. Merge intelligently (dependencies, configs)
3. Handle conflicts via priority order

### Error Recovery
- Individual worker failures don't crash others
- Failed subtasks can be retried
- Partial results are preserved

### Validation Script
```bash
npm run build && npm test && npm run lint
```

---

## Works Well With

**Skills**: autopilot, architect, decomposer
**Agents**: executor, executor-low, executor-high
**Commands**: /up, /autopilot

---

## Reference

- [Full Decomposition API](reference.md)
- [Worker Protocol](modules/worker-protocol.md)
- [Integration Patterns](modules/integration.md)

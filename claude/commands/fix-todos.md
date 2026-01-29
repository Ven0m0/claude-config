# Find & Fix TODOs

Find and optionally resolve TODO comments in your codebase with intelligent understanding and continuity across sessions.

Arguments: `$ARGUMENTS` - files, directories, patterns, or commands:
- `find` or no args: Find and list all TODOs (discovery only)
- `fix`: Find and resolve TODOs systematically
- `resume`: Continue from existing session
- `status`: Check progress
- `new`: Start fresh session

## Session Intelligence

I'll maintain TODO resolution progress across sessions:

**Session Files (in current project directory):**
- `fix-todos/plan.md` - All TODOs found and resolution status
- `fix-todos/state.json` - Current progress and decisions

**IMPORTANT:** Session files are stored in a `fix-todos` folder in your current project directory

**Auto-Detection:**
- If session exists: Resume from last TODO
- If no session: Scan and create new plan
- Commands: `resume`, `status`, `new`

## Phase 1: Discovery & Analysis

**MANDATORY FIRST STEPS:**
1. Check if `fix-todos` directory exists in current working directory
2. If directory exists, check for session files:
   - Look for `fix-todos/state.json`
   - Look for `fix-todos/plan.md`
   - If found, resume from existing session
3. If no directory or session exists:
   - Scan entire codebase for TODOs
   - Create categorized plan
   - Initialize progress tracking
4. Show TODO summary before starting

I'll use the Grep tool to search for task markers with context:
- Pattern: `TODO|FIXME|HACK|XXX|NOTE`
- Case insensitive across all source files
- Show surrounding lines for understanding

**TODO Detection:**
- TODO, FIXME, HACK, XXX, NOTE markers
- Different priority levels
- Context and complexity assessment
- Related code understanding

**Smart Categorization:**
- **Critical** (FIXME, HACK, XXX): Issues that could cause problems
- **Important** (TODO): Features or improvements needed
- **Informational** (NOTE): Context that might need attention
- **Quick fixes**: Simple validations, null checks
- **Features**: Missing functionality
- **Refactoring**: Code improvements
- **Security**: Safety and validation needs
- **Performance**: Optimization opportunities

**Discovery Mode** (`find`): Shows file location, full comment with context, surrounding code, and priority assessment. After scanning, asks to convert to GitHub issues or switch to fix mode.

## Phase 2: Resolution Planning

Based on analysis, I'll create a resolution plan:

**Priority Order:**
1. Security-critical TODOs
2. Bug-related TODOs
3. Simple improvements
4. Feature additions
5. Performance optimizations

I'll write this plan to `fix-todos/plan.md` with:
- Each TODO location and content
- Proposed resolution approach
- Risk assessment
- Implementation order

## Phase 3: Intelligent Resolution

I'll fix TODOs matching your code patterns:

**Pattern Detection:**
- Find similar implementations in your code
- Match your error handling style
- Use your validation patterns
- Follow your naming conventions

**Resolution Strategies:**
- Error handling → Your try/catch patterns
- Validation → Your input checking style
- Performance → Your optimization approach
- Security → Your safety patterns

## Phase 4: Incremental Implementation

I'll resolve TODOs systematically:

**Execution Process:**
1. Create git checkpoint
2. Fix TODO with contextual understanding
3. Verify functionality preserved
4. Update plan with completion
5. Move to next TODO

**Progress Tracking:**
- Mark each TODO as resolved in plan
- Update state file with decisions
- Create meaningful commits

## Phase 5: Verification

After each resolution:
- Run relevant tests
- Check for regressions
- Validate integration points
- Ensure code quality

## Context Continuity

**Session Resume:**
When you return and run `/fix-todos` or `/fix-todos resume`:
- Load existing plan and progress
- Show completion statistics
- Continue from last TODO
- Maintain all resolution decisions

**Progress Example:**
```
RESUMING TODO FIXES
├── Total TODOs: 47
├── Resolved: 23 (49%)
├── Current: src/api/auth.js:42
└── Next: src/utils/validation.js:15

Continuing resolution...
```

## Practical Examples

**Discovery Only:**
```
/fix-todos                    # Find and list all TODOs
/fix-todos find               # Same as above
/fix-todos find src/          # Find TODOs in specific directory
```

**Start Fixing:**
```
/fix-todos fix                # Find and fix all TODOs
/fix-todos fix src/           # Focus on directory
/fix-todos fix "security"     # Fix security TODOs
```

**Session Control:**
```
/fix-todos resume    # Continue existing session
/fix-todos status    # Check progress
/fix-todos new       # Start fresh
```

## Safety Guarantees

**Protection Measures:**
- Git checkpoint before changes
- Incremental commits
- Functionality verification
- No TODO removal without implementation

**Important:** I will NEVER:
- Remove TODOs without fixing them
- Break existing functionality
- Add AI attribution
- Implement without understanding context

## Command Suggestions

After resolving critical TODOs:
- `/test` - To ensure fixes work correctly
- `/commit` - To save TODO resolutions

## What I'll Actually Do

1. **Scan comprehensively** - Find all TODOs with context
2. **Plan strategically** - Order by priority and risk
3. **Resolve intelligently** - Match your patterns
4. **Track meticulously** - Perfect session continuity
5. **Verify constantly** - Ensure quality maintained

I'll maintain complete continuity between sessions, always resuming exactly where we left off with full context of previous resolutions.
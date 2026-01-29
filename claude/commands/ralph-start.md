---
name: ralph-start
description: Start Ralph Planner - the unified loop that handles planning, execution, and validation. Based on Ralph Wiggum philosophy with persistent state.
argument-hint: "[--max-iterations N] [--planning-doc path] Your project description..."
allowed-tools: ["Bash", "Read", "Edit", "Write"]
---

# Ralph Planner - Unified Loop

Ralph Planner implements the Ralph Wiggum technique: a simple loop that keeps Claude working on your task until completion, with persistent state and dynamic planning.

## Quick Start

```
/ralph-start "Build a REST API for todos with authentication and tests"
```

## Parameters

- **`Your project description`** (required)
  - Describe what you want to build
  - Example: "Create a Python web scraper with logging"

- **`--max-iterations N`** (optional, default: 10)
  - Maximum loop iterations to prevent infinite loops
  - Recommended: Set to reasonable limit (20-50)
  - Example: `/ralph-start --max-iterations 20 "Build a web app"`

- **`--planning-doc path`** (optional)
  - Path to your planning document
  - Format: Markdown with tasks and acceptance criteria
  - Example: `/ralph-start --planning-doc ./my-plan.md "Build an app"`

## How It Works

Ralph Planner creates a **self-referential loop**:

1. **You run the command once**
2. **Claude works on the task**
3. **When Claude tries to exit, the Stop hook blocks it**
4. **The Stop hook returns the SAME prompt**
5. **Repeat until completion promise is detected**

### Dynamic Planning

If you provide `--planning-doc`, Ralph will:
- Convert it to structured goals on first iteration
- **Re-convert it every iteration** if the file changes
- This lets you edit planning between iterations!

### State Persistence

All state is saved to `.ralph/`:
- `state.md` - Current iteration, phase, goals
- `transcript.md` - All conversation history
- `goals.xml` - Structured goals with status

The loop survives session restarts.

## Writing Good Planning Docs

### Format

```markdown
# Project: My Web App

## Task: User Authentication

- [ ] Implement login endpoint
- [ ] Implement logout endpoint
- [ ] Add password hashing
- [ ] Write tests

Acceptance: All authentication tests pass

## Task: Database Setup

- [ ] Create user table
- [ ] Run migrations
- [ ] Seed test data

Acceptance: Database accessible and populated
```

### Key Elements

- **Tasks** - Use `## Task: <name>` format
- **Acceptance Criteria** - Use `- [ ]` checklist items
- **Verification** - Use `Acceptance:` section with test commands

## Completion Signal

When all goals are complete, output:

```
<promise>ALL GOALS COMPLETE</promise>
```

The Stop hook will detect this and allow exit.

## Examples

### Basic Usage

```
/ralph-start "Create a calculator app with basic arithmetic operations"
```

### With Planning Doc

```bash
# Create planning doc
cat > plan.md << 'EOF'
# Project: Todo API

## Task: Setup

- [ ] Initialize Node.js project
- [ ] Install Express
- [ ] Create package.json

Acceptance: npm start runs without errors

## Task: Endpoints

- [ ] GET /todos
- [ ] POST /todos
- [ ] PUT /todos/:id
- [ ] DELETE /todos/:id

Acceptance: All endpoints return expected JSON
EOF

# Start Ralph
/ralph-start --planning-doc ./plan.md --max-iterations 30
```

## What Happens Next

After running `/ralph-start`:

1. **State is initialized** in `.ralph/state.md`
2. **Loop starts** - Claude begins working
3. **Each iteration**:
   - Re-reads planning doc if changed
   - Converts to goals.xml
   - Works on current goal
   - Updates progress
4. **Loop continues** until promise detected or max iterations reached
5. **State persists** - can survive restarts

## Checking Progress

```bash
# View current state
cat .ralph/state.md

# View goals and status
cat .ralph/goals.xml

# View transcript
cat .ralph/transcript.md
```

## Philosophy

Ralph Planner embodies the **Ralph Wiggum** philosophy:

- **Iteration > Perfection** - Keep improving with each loop
- **Failures Are Data** - Use failures to guide next iteration
- **Operator Skill Matters** - Good prompts = better results
- **Persistence Wins** - Keep trying until success

## When to Use

**Good for:**
- Well-defined tasks with clear success criteria
- Tasks requiring iteration (tests, refactoring, etc.)
- Greenfield projects
- Tasks with automatic verification

**Not good for:**
- Tasks requiring human judgment
- One-shot operations
- Unclear success criteria
- Production debugging

## Need Help?

Run `/help` in Claude Code for command reference.

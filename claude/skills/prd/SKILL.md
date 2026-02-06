---
name: prd
description: >
  Generate an executable PRD (Product Requirements Document) for Ralph from an idea
  file or description. Creates .ralph/prd.json with stories for autonomous development.
  Use when creating PRDs, generating user stories, planning features for Ralph, or
  converting ideas to executable specifications. Triggers: PRD, product requirements,
  Ralph stories, idea to spec, feature planning.
allowed-tools: Read Bash Glob
---

# /prd - Generate PRD for Ralph

Generate executable stories for Ralph's autonomous development loop.

**CRITICAL: This command does NOT write code. It produces `.ralph/prd.json` only.**

## Quick Reference (30 seconds)

### User Input
```text
$ARGUMENTS
```

### Input Types
| Input | Action |
|-------|--------|
| Empty | Check `docs/ideas/*.md`, ask user to choose |
| File reference (no spaces) | Read idea file, proceed to PRD |
| Description (has spaces) | Quick PRD flow, no idea file needed |

### Core Workflow
1. **Determine input type** → file or description
2. **Confirm understanding** → summarize, wait for user
3. **Check existing PRD** → append/overwrite/cancel
4. **Split into stories** → max 10, ~10-15 min each
5. **Write draft PRD** → `.ralph/prd.json`
6. **Validate and fix** → testability, dependencies, security, scale
7. **Reorder if needed** → foundation stories first
8. **Present final PRD** → open in editor, wait for approval
9. **Give instructions** → `ralph run`

**Always STOP and wait for user confirmation at steps 2, 3, and 8.**

---

## Implementation Guide (5 minutes)

### Step 1: Determine Input Type

**If `$ARGUMENTS` is empty:**
```bash
ls docs/ideas/*.md 2>/dev/null || echo "No ideas found"
```
Ask: "Would you like to convert an idea file or describe a feature directly?"

**If file reference** (no spaces, matches `docs/ideas/*.md`): Read file, proceed.

**If description** (has spaces): Quick PRD flow—no idea file created.

### Step 2: Confirm Understanding

For file input, say: "I've read `{path}`. Feature: {name}, Problem: {one line}, Solution: {one line}, Scope: {items}. I'll split into {N} stories. Continue?"

For description, explore codebase first:
```bash
ls -la src/ app/ 2>/dev/null | head -20
cat package.json 2>/dev/null | jq '{name, dependencies}' || true
```
Then ask about type (frontend/backend), scale, and other context. **STOP and wait.**

### Step 3: Check for Existing PRD
```bash
cat .ralph/prd.json 2>/dev/null
```
If exists: "`.ralph/prd.json` exists with {N} stories. Options: 'append', 'overwrite', 'cancel'." **STOP and wait.**

If appending, use `TASK-` prefix for new stories starting from highest existing ID + 1.

### Step 4-5: Split into Stories and Write PRD
- Each story completable in one Claude session (~10-15 min)
- Max 3-4 acceptance criteria per story
- Max 10 stories (suggest phases if more needed)
```bash
mkdir -p .ralph && touch .ralph/.prd-edit-allowed
```
Write all stories to `.ralph/prd.json`.

### Step 6: Validate and Fix (MANDATORY)

Read back PRD and validate EVERY story for:

| Check | Bad | Good |
|-------|-----|------|
| **Testability** | `grep -q 'function' file.py` | `curl ... \| jq -e`, `npx playwright test` |
| **Dependencies** | Story needs data from uncreated source | Prior stories create required data |
| **Security** | Missing password hashing, rate limits | `bcrypt`, rate limiting in criteria |
| **Scale** | No pagination on list endpoints | `?page=N&limit=N` in criteria |
| **Context** | Missing idea file, styleguide | `contextFiles` includes references |

### Step 7-9: Reorder, Present, Complete

If dependency issues found, reorder stories (foundations first). Re-run validation.
```bash
open -a TextEdit .ralph/prd.json
```
Say: "PRD ready with {N} stories. Review and respond: 'approved', 'edit [changes]', or edit JSON directly."

Once approved: "To start: `ralph run`". **DO NOT start implementing code.**

---

## PRD JSON Schema (Summary)

Full schema and examples: See [reference.md](reference.md)

```json
{"feature": {"name": "...", "ideaFile": "docs/ideas/feature.md", "branch": "feature/name", "status": "pending"},
 "techStack": {"frontend": "...", "backend": "...", "database": "..."},
 "testing": {"approach": "TDD", "unit": {"frontend": "vitest", "backend": "pytest"}, "integration": "playwright"},
 "stories": [{"id": "TASK-001", "type": "frontend|backend", "title": "...", "passes": false,
   "files": {"create": [], "modify": [], "reuse": []}, "acceptanceCriteria": [], "testSteps": [],
   "testing": {"types": ["unit"], "files": {"unit": []}}, "dependsOn": []}]}
```

### Story Fields (Required)

| Field | Description |
|-------|-------------|
| `id` | `TASK-001`, `TASK-002`, etc. |
| `type` | `frontend` or `backend` |
| `title` | Short description |
| `passes` | Always starts `false` |
| `files` | `create`, `modify`, `reuse` arrays |
| `acceptanceCriteria` | What must be true when done |
| `testSteps` | Executable shell commands |
| `testing` | Test types and file paths |

See [reference.md](reference.md) for optional fields: `errorHandling`, `testUrl`, `mcp`, `contextFiles`, `skills`, `apiContract`, `prerequisites`, `notes`, `scale`, `architecture`, `dependsOn`.

---

## Test Steps - CRITICAL

**⚠️ #1 CAUSE OF FALSE PASSES: grep-only tests that verify code exists but not behavior.**

### Bad (will PASS but miss bugs)
```json
"testSteps": ["grep -q 'astream_events' graph.py", "test -f src/api/users.ts"]
```

### Good (actually tests behavior)
```json
"testSteps": [
  "curl -s {config.urls.backend}/users | jq -e '.data | length >= 0'",
  "npx playwright test tests/e2e/feature.spec.ts",
  "npx tsc --noEmit"
]
```

### Required by Story Type
| Type | Required testSteps |
|------|-------------------|
| `backend` | `curl {config.urls.backend}/...` commands |
| `frontend` | `tsc --noEmit` + `npm test` + playwright |
| `e2e` | `npx playwright test ...` |

**NEVER use grep/test alone to verify behavior.** These mark stories PASSED when features are broken.

---

## Advanced Patterns

### TDD Workflow
When `approach: "TDD"`: Write failing test → Implement minimum → Refactor → Repeat.

### Testing Anti-Patterns
```json
// ❌ BAD - verifies code exists, not behavior
{"acceptanceCriteria": ["Create stream_agent function"]}

// ✅ GOOD - verifies integration
{"acceptanceCriteria": ["service.py calls stream_agent()", "POST /chat returns SSE events"]}
```

### UI Removal Stories
Must update tests! Include grep check for stale references:
```json
"testSteps": ["grep -r 'Auto-select' tests/ && exit 1 || echo 'Clean'", "npx playwright test"]
```

### MCP Tools
| Tool | When |
|------|------|
| `playwright` | UI testing, screenshots, forms |
| `devtools` | Console errors, network, DOM |

Frontend stories default to `["playwright", "devtools"]`.

### Skills Reference
| Skill | When |
|-------|------|
| `styleguide` | Frontend - reference UI components |
| `vibe-check` | Any - check for AI anti-patterns |
| `review` | Security-sensitive stories |

---

## Works Well With

**Agents**: ralph, spec-builder, code-review
**Skills**: styleguide, vibe-check, review
**Commands**: /ralph, /spec

---

## Alternative Output: PRD.md (Markdown)

For projects not using Ralph, generate a markdown PRD instead:

1. Receive a feature description from the user
2. Ask 3-5 essential clarifying questions (with lettered options)
3. Generate a structured PRD with: overview, user stories, acceptance criteria, technical approach
4. Save to `PRD.md` with empty `progress.txt`

## Reference Materials

- [Full JSON Schema & Field Reference](reference.md)
- [Complete PRD Example](templates/prd-example.json)

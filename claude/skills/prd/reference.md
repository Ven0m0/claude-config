# PRD Reference - Complete Schema and Field Details

## Complete PRD JSON Schema

```json
{
  "feature": {
    "name": "Feature Name",
    "ideaFile": "docs/ideas/{feature-name}.md",
    "branch": "feature/{feature-name}",
    "status": "pending"
  },
  "originalContext": "docs/ideas/{feature-name}.md",
  "techStack": {
    "frontend": "{detected from package.json}",
    "backend": "{detected from pyproject.toml/go.mod}",
    "database": "{detected or asked}"
  },
  "testing": {
    "approach": "TDD",
    "unit": {"frontend": "{vitest|jest}", "backend": "{pytest|go test}"},
    "integration": "{playwright|cypress}",
    "e2e": "{playwright|cypress}",
    "coverage": {"minimum": 80, "enforced": false}
  },
  "architecture": {
    "frontend": "src/components",
    "backend": "src/api",
    "doNotCreate": ["new database tables without migration"]
  },
  "globalConstraints": [
    "All API calls must have error handling",
    "No console.log in production code",
    "Use existing UI components from src/components/ui"
  ],
  "testUsers": {
    "admin": {"email": "admin@test.com", "password": "test123"},
    "user": {"email": "user@test.com", "password": "test123"}
  },
  "metadata": {"createdAt": "ISO timestamp", "estimatedStories": 5, "complexity": "low|medium|high"},
  "stories": []
}
```

## Complete Story Schema

```json
{
  "id": "TASK-001",
  "type": "frontend|backend",
  "title": "Short description",
  "priority": 1,
  "passes": false,
  "files": {"create": [], "modify": [], "reuse": []},
  "acceptanceCriteria": ["What it should do"],
  "errorHandling": ["What happens when things fail"],
  "testing": {
    "types": ["unit", "integration"],
    "approach": "TDD",
    "files": {"unit": [], "integration": [], "e2e": []}
  },
  "testSteps": ["curl -s {config.urls.backend}/endpoint | jq -e '.expected == true'"],
  "testUrl": "{config.urls.frontend}/feature-page",
  "mcp": ["playwright", "devtools"],
  "contextFiles": ["docs/ideas/feature.md", "src/styles/styleguide.html"],
  "skills": [{"name": "styleguide", "usage": "Reference for UI components"}],
  "apiContract": {"endpoint": "GET /api/resource", "response": {"field": "type"}},
  "prerequisites": ["Backend server running", "Database seeded"],
  "notes": "Human guidance - preferences, warnings, tips",
  "scale": "small|medium|large",
  "architecture": {"pattern": "React Query for data fetching", "constraints": ["No Redux"]},
  "dependsOn": []
}
```

## PRD-Level Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `feature` | Yes | Feature name, branch, status |
| `originalContext` | Yes | Path to idea file (Claude reads this for full context) |
| `techStack` | No | Technologies in use (auto-detect from project) |
| `testing` | Yes | Testing strategy, tools, coverage requirements |
| `architecture` | No | Directory structure, patterns, constraints |
| `globalConstraints` | No | Rules that apply to ALL stories |
| `testUsers` | No | Test accounts for auth flows |
| `metadata` | Yes | Created date, complexity estimate |

**Note:** URLs come from `.ralph/config.json`, not the PRD. Use `{config.urls.backend}` in testSteps.

## Story-Level Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique ID (TASK-001, TASK-002, etc.) |
| `type` | Yes | frontend or backend (keep stories atomic) |
| `title` | Yes | Short description |
| `priority` | No | Order of importance (1 = highest) |
| `passes` | Yes | Always starts as `false` |
| `files` | Yes | create, modify, reuse arrays |
| `acceptanceCriteria` | Yes | What must be true when done |
| `errorHandling` | Yes | How to handle failures |
| `testing` | Yes | Test types, approach, and files for this story |
| `testSteps` | Yes | Executable shell commands |
| `testUrl` | Frontend | URL to verify the feature |
| `mcp` | Frontend | MCP tools for verification |
| `contextFiles` | No | Files Claude should read (idea files, styleguides) |
| `skills` | No | Relevant skills with usage hints |
| `apiContract` | Backend | Expected request/response format |
| `prerequisites` | No | What must be running/ready |
| `notes` | No | Human guidance for Claude |
| `scale` | No | small, medium, large |
| `architecture` | No | Story-specific patterns/constraints |
| `dependsOn` | No | Story IDs that must complete first |

## Testing Configuration Details

### PRD-Level Testing Config

```json
"testing": {
  "approach": "TDD",
  "unit": {"frontend": "vitest", "backend": "pytest"},
  "integration": "playwright",
  "e2e": "playwright",
  "coverage": {"minimum": 80, "enforced": false}
}
```

**Detection hints:**
- Check `package.json` for `vitest`, `jest`, `playwright`, `cypress`
- Check `pyproject.toml` for `pytest`
- Check `go.mod` for Go projects (use `go test`)

| Field | Values | Description |
|-------|--------|-------------|
| `approach` | `TDD`, `test-after` | Write tests first (TDD) or after implementation |
| `unit.frontend` | `vitest`, `jest` | Frontend unit test runner |
| `unit.backend` | `pytest`, `go test` | Backend unit test runner |
| `integration` | `playwright`, `cypress` | Integration test tool |
| `e2e` | `playwright`, `cypress` | End-to-end test tool |
| `coverage.minimum` | `0-100` | Minimum coverage percentage |
| `coverage.enforced` | `true/false` | Fail if coverage not met |

### Story-Level Testing Config

```json
"testing": {
  "types": ["unit", "integration"],
  "approach": "TDD",
  "files": {
    "unit": ["src/components/Dashboard.test.tsx"],
    "integration": ["tests/integration/dashboard.test.ts"],
    "e2e": ["tests/e2e/dashboard.spec.ts"]
  }
}
```

### Test Types

| Type | What it Tests | When to Use |
|------|---------------|-------------|
| **Unit** | Individual functions, components in isolation | Always - every new file needs unit tests |
| **Integration** | How pieces work together (API + DB, Component + Hook) | When story involves multiple modules |
| **E2E** | Full user flows in browser | User-facing features with interactions |

## Validation Checklist

### 6a. Testability
- ❌ `grep -q 'function' file.py` → Only checks code exists
- ❌ `test -f src/component.tsx` → Only checks file exists
- ❌ `npm test` alone for backend → Mocks can pass without real behavior
- ✅ `curl ... | jq -e` → Tests actual API response
- ✅ `npx playwright test` → Real browser tests
- ✅ `npx tsc --noEmit` → Real type checking

### 6b. Dependencies
- Can this story's tests pass given prior stories completed?
- If TASK-003 needs a user, does TASK-001/002 create one?

### 6c. Security (for auth/input stories)
- Password handling → "Passwords hashed with bcrypt (cost 10+)"
- Auth responses → "Password/tokens NEVER in response body"
- User input → "Input sanitized to prevent SQL injection/XSS"
- Login endpoints → "Rate limited to N attempts per minute"
- Token expiry → "JWT expires after N hours"

### 6d. Scale (for list/data stories)
- List endpoints → "Returns paginated results (max 100 per page)"
- Query params → "Accepts ?page=N&limit=N"
- Large datasets → "Database query uses index on [column]"

### 6e. Context (for frontend stories)
- Does `contextFiles` include the idea file (has ASCII mockups)?
- Does `contextFiles` include styleguide (if exists)?
- Is `testUrl` set?

## Example Stories

### Frontend Story
```json
{
  "id": "TASK-001",
  "type": "frontend",
  "title": "Dashboard component",
  "passes": false,
  "files": {"create": ["src/components/Dashboard.tsx"], "modify": [], "reuse": []},
  "acceptanceCriteria": ["Dashboard renders user data", "Mobile responsive"],
  "testing": {"types": ["unit", "e2e"], "files": {"unit": ["src/components/Dashboard.test.tsx"], "e2e": ["tests/e2e/dashboard.spec.ts"]}},
  "testSteps": ["npx tsc --noEmit", "npm test -- --testPathPattern=Dashboard", "npx playwright test tests/e2e/dashboard.spec.ts"],
  "testUrl": "{config.urls.frontend}/dashboard",
  "mcp": ["playwright", "devtools"],
  "contextFiles": ["docs/ideas/dashboard.md"]
}
```

### Backend API Story
```json
{
  "id": "TASK-002",
  "type": "backend",
  "title": "User API endpoints",
  "passes": false,
  "files": {"create": ["src/api/users.py"], "modify": [], "reuse": []},
  "acceptanceCriteria": ["GET /users returns paginated list", "POST /users creates user with validation"],
  "errorHandling": ["400 on invalid input", "409 on duplicate email"],
  "testing": {"types": ["unit", "integration"], "files": {"unit": ["tests/unit/test_users.py"], "integration": ["tests/integration/test_users_api.py"]}},
  "testSteps": ["curl -s {config.urls.backend}/users | jq -e '.data | length >= 0'", "pytest tests/integration/test_users_api.py -v"],
  "apiContract": {"endpoint": "GET /api/users", "response": {"data": [], "pagination": {}}}
}
```

## Guidelines Summary

- **Keep stories small** - Max 3-4 acceptance criteria (~1000 tokens)
- **Order by dependency** - Foundation stories first
- **Specify files explicitly** - Max 3-4 files per story
- **Define error handling** - Every story specifies failure behavior
- **Include contextFiles** - Point to idea files with full context
- **Add relevant skills** - Help Claude find the right patterns

### UI Stories Must Include
- `testUrl` - Where to verify
- `mcp: ["playwright", "devtools"]` - Browser tools
- Acceptance criteria for: page loads, elements render, mobile works

### API Stories Must Include
- `apiContract` - Expected request/response
- `errorHandling` - What happens on 400, 401, 500, etc.
- `testSteps` with curl commands to verify endpoints

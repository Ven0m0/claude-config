# Create New CLAUDE.md Workflow

## Objective

Build a new CLAUDE.md file (user-level or project-level) from scratch following
best practices.

## Process

### Step 1: Determine Level

Ask user which level:

- **USER-LEVEL** (`~/.claude/CLAUDE.md`): Cross-project universal preferences
- **PROJECT-LEVEL** (`./CLAUDE.md`): Project-specific configuration

### Step 2: Gather Information

**For USER-LEVEL:**

1. Communication preferences (style, length, tone)
2. Universal coding conventions
3. Tool preferences
4. Workflow preferences

**For PROJECT-LEVEL:**

1. Project path
2. Tech stack (languages, frameworks, tools, versions)
3. Project type (web app, API, CLI, library)
4. Project structure (monorepo, single app)
5. Build/test commands
6. Protected areas
7. Special conventions

### Step 3: Build Core Sections (Project-Level)

#### Section 1: System Context

```markdown
<system_context> | Component | Technology | |-----------|------------| |
Language | [e.g., TypeScript 5.3] | | Framework | [e.g., Next.js 14] | |
Database | [e.g., PostgreSQL 15] | | Package Manager | [e.g., pnpm 8] |
</system_context>
```

#### Section 2: Project Structure

```markdown
## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `lib/` - Utilities and helpers
  - `app/` - Next.js app router
- `tests/` - Test files
- `docs/` - Documentation
```

#### Section 3: Development Commands

```markdown
## Development Commands

| Task         | Command        | Notes                  |
| ------------ | -------------- | ---------------------- |
| Install deps | `pnpm install` | Run after pulling      |
| Dev server   | `pnpm dev`     | Starts on :3000        |
| Run tests    | `pnpm test`    | Required before commit |
| Build        | `pnpm build`   | Verify before PR       |
```

#### Section 4: Coding Guidelines

```markdown
<coding_guidelines>

- Read relevant files before proposing code edits
- Avoid over-engineering - minimum complexity for current task
- Don't add features beyond what was requested
- Don't create abstractions for one-time operations </coding_guidelines>
```

#### Section 5: Protected Areas

```markdown
## Protected Areas

| Area          | Rule            | Enforcement      |
| ------------- | --------------- | ---------------- |
| Test files    | Must not modify | CI rejection     |
| src/legacy/\* | Must not touch  | Managed settings |
| \*.env files  | Must not access | Blocked          |
```

#### Section 6: Code Exploration

```markdown
<code_exploration> Read and understand relevant files before proposing code
edits. Don't speculate about code you haven't inspected. If referencing a
specific file/path, inspect it before explaining or proposing fixes.
</code_exploration>
```

#### Section 7: Progressive Disclosure

```markdown
## Additional Context

Task-specific documentation in `agent_docs/`:

- `building_the_project.md` - Build system details
- `running_tests.md` - Test commands, coverage
- `database_schema.md` - Schema design

Read relevant files BEFORE starting related tasks.
```

### Step 4: Build User-Level File

For user-level, use minimal structure:

```markdown
# User Preferences

## Communication Style

- [Preferences for responses]

## Coding Conventions

- [Universal patterns you follow]

## Workflow Preferences

- [How you like to work]
```

Target: <60 lines, cross-project universal only.

### Step 5: Verify Constraints

**Project-Level:**

- [ ] Line count <300
- [ ] Instruction count <100-150
- [ ] 80%+ high-efficiency formats
- [ ] All instructions project-universal
- [ ] Critical context in first 30 lines

**User-Level:**

- [ ] Line count <60
- [ ] 100% cross-project universal
- [ ] No project-specific content
- [ ] No enforcement (project-level concern)

### Step 6: Write the File

Create file at appropriate location.

### Step 7: Recommend Next Steps

After creation:

1. "Would you like me to setup enforcement mechanisms?"
2. "Should I create the progressive disclosure file structure?"
3. "Want me to run an audit to verify the file scores well?"

## Templates

Use `templates/project-claudemd-starter.md` or
`templates/user-claudemd-starter.md` as base.

## Anti-Patterns to Avoid

- Auto-generating with `/init` command
- Copying another project's file without customization
- Including task-specific content in project file
- Adding style guide rules (use linters instead)
- Embedding large code snippets
- Generic advice ("write clean code")
- Exceeding line limits

## Success Criteria

Creation is complete when:

- File exists at correct location
- All core sections present and customized
- Format efficiency >80%
- Within line/instruction limits
- User understands maintenance approach
- Enforcement setup recommended

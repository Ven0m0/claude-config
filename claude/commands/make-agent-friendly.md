---
description: Prepare a human-developed codebase for agentic development
---

# Make This Repository Agent-Friendly

You are preparing a human-developed codebase for agentic development. This repository was forked or started from code developed by humans and will now be developed predominantly by AI agents like yourself.

The development model is **human-guided agentic code development**:
- The human user controls planning decisions and provides task instructions
- The human supervises and answers questions as required
- AI agents take the lead in undertaking actual code edits

## Your Task

Work through the checklist below systematically. Use your todo list to track progress. Ask clarifying questions when needed before proceeding.

## Phase 1: Assessment & User Intake

### 1.1 Analyze Current State
- [ ] Examine the repository structure, files, and organization
- [ ] Identify the primary language(s) and frameworks used
- [ ] Check for existing documentation (README, CONTRIBUTING, etc.)
- [ ] Note any CI/CD, deployment configs, or build systems
- [ ] Identify potential ambiguities an agent might encounter

### 1.2 User Intake Questions
Ask the user these questions (batch them together):

1. **Collaboration Model**: Will this remain a collaborative project with human contributors, or will development be primarily agentic?
2. **Public/Private**: Is this repository public or will it be shared publicly?
3. **Disclosure Preference**: If public, do you want to disclose that development is AI-assisted?
4. **Code Location**: Should the application code be moved to a dedicated folder (e.g., `app/`, `src/`, `website/`)? Or is the current structure acceptable?
5. **Planning Space**: Do you want a dedicated area for planning discussions and decisions (e.g., `/planning/` or `/docs/decisions/`)?
6. **MCP Tools**: Are there any MCP servers or tools you use that should be documented for context?
7. **External Dependencies**: Are there external APIs, documentation links, or resources agents should know about?

## Phase 2: Structural Refactoring

### 2.1 Repository Organization
Based on user responses:
- [ ] Create clear folder hierarchy separating code from meta-content
- [ ] Use descriptive folder names (agents thrive on clarity)
- [ ] Ensure deployment/build configs are updated if paths change
- [ ] Remove or update CONTRIBUTING.md based on collaboration model

### 2.2 Create Agent-Friendly Infrastructure
- [ ] Create `CLAUDE.md` at repository root describing:
  - Project purpose and goals
  - Key architectural decisions
  - Important file locations
  - Build/run/test commands
  - Any project-specific conventions
- [ ] Create `/context/` folder for:
  - External documentation links
  - API references
  - MCP tool notes (if applicable)
  - Architecture decision records
- [ ] Optionally create `/planning/` for discussions and decisions

### 2.3 Code Clarity Improvements
- [ ] Add clarifying comments where agent navigation might be ambiguous
- [ ] Ensure function/class names are descriptive
- [ ] Document any non-obvious patterns or conventions
- [ ] Identify and resolve potential points of confusion

## Phase 3: Documentation Updates

### 3.1 README Updates
- [ ] Update README to reflect agentic development model (if public)
- [ ] Add AI-assisted development disclosure (if user requested)
- [ ] Document how to work with this codebase agentically
- [ ] Update any outdated sections

### 3.2 Agent-Specific Conventions
If the user wants to support other contributors using agents:
- [ ] Document conventions for `/for-ai/` (input files for agents)
- [ ] Document conventions for `/from-ai/` (agent output files)
- [ ] Add guidance on `task.md` and `context.md` usage

## Phase 4: Validation

### 4.1 Final Checks
- [ ] Verify no breaking changes to build/deployment
- [ ] Ensure all paths and imports are correct
- [ ] Test that the application still runs (if applicable)
- [ ] Review changes with user before committing

### 4.2 Web Search for Best Practices
Run a web search for current best practices in agentic code development to ensure your recommendations are up-to-date. AI tooling evolves rapidly.

## Execution Notes

- Work systematically through each phase
- Mark items complete as you go using your todo list
- Don't make assumptions - ask the user when unclear
- Minimize breaking changes; refactor carefully
- Keep the user informed of progress and decisions

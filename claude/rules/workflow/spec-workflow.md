# SPEC Workflow

Three-phase development workflow with token budget management.

## Phase Overview

| Phase | Purpose | Token Budget |
|-------|---------|--------------|
| Plan | Create SPEC document | 30K |
| Run | DDD implementation | 180K |
| Sync | Documentation sync | 40K |

## Plan Phase

Create comprehensive specification using EARS format.

Token Strategy:
- Allocation: 30,000 tokens
- Load requirements only
- Execute /clear after completion
- Saves 45-50K tokens for implementation

Output:
- SPEC document at `docs/specs/SPEC-XXX/spec.md` or `.claude/specs/SPEC-XXX/spec.md`
- EARS format requirements
- Acceptance criteria
- Technical approach

## Run Phase

Implement specification using DDD cycle.

Token Strategy:
- Allocation: 180,000 tokens
- Selective file loading
- Enables 70% larger implementations

DDD Cycle:
1. ANALYZE: Read existing code, identify dependencies, map domain boundaries
2. PRESERVE: Write characterization tests, capture current behavior
3. IMPROVE: Make incremental changes, run tests after each change

Success Criteria:
- All SPEC requirements implemented
- Characterization tests passing
- 85%+ code coverage
- TRUST 5 quality gates passed

## Sync Phase

Generate documentation and prepare for deployment.

Token Strategy:
- Allocation: 40,000 tokens
- Result caching
- 60% fewer redundant file reads

Output:
- API documentation
- Updated README
- CHANGELOG entry
- Pull request

## Completion Markers

AI uses markers to signal task completion:
- Task complete / full completion markers as agreed in workflow

## Context Management

/clear Strategy:
- After plan phase completion (mandatory)
- When context exceeds 150K tokens
- Before major phase transitions

Progressive Disclosure:
- Level 1: Metadata only (~100 tokens)
- Level 2: Skill body when triggered (~5000 tokens)
- Level 3: Bundled files on-demand

## Phase Transitions

Plan to Run:
- Trigger: SPEC document approved
- Action: Execute /clear, then run phase for SPEC-XXX

Run to Sync:
- Trigger: Implementation complete, tests passing
- Action: Execute sync phase for SPEC-XXX

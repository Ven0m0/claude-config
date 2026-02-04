---
name: prd
description: Generate a comprehensive Product Requirements Document (PRD) in Markdown, detailing user stories, acceptance criteria, technical considerations, and metrics. Optionally create GitHub issues upon user confirmation.
allowed-tools: codebase, edit/editFiles, fetch, findTestFiles, list_issues, githubRepo, search, create_issue, get_issue, search_issues, grep, read, bash
model: opus
skills:
  - repomix
  - mgrep-code-search
  - sequential-thinking
---

# PRD Generator

Create detailed Product Requirements Documents with optional GitHub issue creation.

## Workflow

1. **Clarify** - Ask 3-5 questions about target audience, features, constraints
2. **Analyze** - Review codebase for architecture and integration points
3. **Draft** - Create PRD following the outline below
4. **Review** - Present for approval
5. **Issues** - Create GitHub issues for user stories if requested

## PRD Outline

```markdown
# PRD: {project_title}

## 1. Product overview
- Document title and version
- Product summary (2-3 paragraphs)

## 2. Goals
- Business goals
- User goals
- Non-goals

## 3. User personas
- Key user types
- Role-based access

## 4. Functional requirements
- **{feature}** (Priority: {level})
  - Requirements

## 5. User experience
- Entry points & first-time flow
- Core experience
- Advanced features & edge cases
- UI/UX highlights

## 6. Narrative
User journey paragraph

## 7. Success metrics
- User-centric metrics
- Business metrics
- Technical metrics

## 8. Technical considerations
- Integration points
- Data storage & privacy
- Scalability & performance
- Potential challenges

## 9. Milestones & sequencing
- Project estimate
- Team size & composition
- Suggested phases

## 10. User stories
### 10.x. {title}
- **ID**: GH-001
- **Description**: As a {user}, I want to {action} so that {benefit}
- **Acceptance criteria**: [list]
```

## Guidelines

| Rule | Details |
|------|---------|
| IDs | Unique per story: GH-001, GH-002 |
| Testable | Each story must be verifiable |
| Coverage | Include auth, edge cases, errors |
| Formatting | Sentence case headings, no dividers |
| Location | Ask user or suggest project root |

## Final Checklist

- [ ] Every user story is testable
- [ ] Acceptance criteria are clear and specific
- [ ] All functionality covered
- [ ] Auth/security addressed if applicable

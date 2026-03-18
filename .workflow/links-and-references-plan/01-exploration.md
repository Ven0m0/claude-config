---
task: "links-and-references-plan"
phase: "explore"
status: "complete"
timestamp: "2026-03-18T00:00:00Z"
agent: "explorer"
model: "claude-haiku-4-5"
---

## Codebase Map
- Repo root: `/home/runner/work/claude-config/claude-config`
- Marketplace surface:
  - `/home/runner/work/claude-config/claude-config/README.md` — top-level marketplace guide and install surface
  - `/home/runner/work/claude-config/claude-config/.claude-plugin/marketplace.json` — machine-readable plugin registry with external `homepage`/`repository` links
- Planning/backlog surfaces:
  - `/home/runner/work/claude-config/claude-config/TODO.md` — root TODO plus external resource list (`TODO: linkify`)
  - `/home/runner/work/claude-config/claude-config/opencode/TODO.md` — ecosystem-specific integration backlog with resource links and integration status
  - `/home/runner/work/claude-config/claude-config/plugins/conserve/docs/modularization-plan.md` — existing implementation-plan style doc
  - `/home/runner/work/claude-config/claude-config/claude/skills/ralph-planner/templates/ROADMAP.template.md` — roadmap template, not an active repo roadmap
- Validation/config:
  - `/home/runner/work/claude-config/claude-config/package.json` — `lint:claude`, `lint:claude:fix`
  - `/home/runner/work/claude-config/claude-config/.claudelint.yaml` — marketplace/plugin markdown+JSON validation rules
  - `/home/runner/work/claude-config/claude-config/.claudelintrc.json` — stricter custom claudelint rules
- Recent activity intersecting this task (last 7 days): `README.md`, `TODO.md`, `.claude-plugin/marketplace.json`, `opencode/TODO.md`, `plugins/conserve/docs/modularization-plan.md`, `claude/skills/ralph-planner/templates/ROADMAP.template.md`

## Relevant Files
- `/home/runner/work/claude-config/claude-config/TODO.md`
  - Most directly relevant existing file.
  - Already contains a `Resources` block of external directories/sites and explicit `TODO: linkify` marker.
  - Best fit if the issue is primarily “collect links/references first, then plan integration work”.
- `/home/runner/work/claude-config/claude-config/.claude-plugin/marketplace.json`
  - Canonical marketplace index.
  - Existing entries already store external repo metadata via `homepage`, `repository`, `source`, `keywords`.
  - Relevant if the plan is meant to drive future marketplace additions from external repos/packages.
- `/home/runner/work/claude-config/claude-config/README.md`
  - Public-facing marketplace documentation.
  - Relevant for any human-readable summary of added links/references or follow-up documentation after planning.
- `/home/runner/work/claude-config/claude-config/opencode/TODO.md`
  - Strongest existing example of integration planning for external ecosystem items.
  - Has `Resources`, `Plugin Integration Status`, `Integrated`, and `Needs Validation` sections for external plugins/packages.
  - Good structural precedent if this issue should produce a scoped backlog rather than generic notes.
- `/home/runner/work/claude-config/claude-config/plugins/conserve/docs/modularization-plan.md`
  - Best in-repo example of a fuller implementation-plan document.
  - Uses phased plan + task breakdown + migration steps; useful if the issue expects a dedicated plan doc instead of TODO bullets.
- `/home/runner/work/claude-config/claude-config/claude/skills/ralph-planner/templates/ROADMAP.template.md`
  - Existing roadmap template.
  - Relevant only as a formatting pattern; no evidence it is the current destination for repo backlog content.

## Patterns Found
- Markdown planning/checklist conventions:
  - H1 title, then H2/H3 hierarchy (`##`, `###`) for phases/status/sections.
  - Checklists use `- [ ]` bullets; status lines often use inline options like `**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete`.
  - Planning docs favor phased structure: `## Implementation Plan` → `### Phase N` → `**Task N.M**`.
  - Resource/link collections are plain bulleted URLs under `## Resources`; sometimes wrapped in `<details><summary>...</summary>` (root `TODO.md`).
- Existing destination types:
  - TODO/backlog: `/home/runner/work/claude-config/claude-config/TODO.md`
  - Ecosystem-specific integration backlog: `/home/runner/work/claude-config/claude-config/opencode/TODO.md`
  - Machine-readable marketplace index: `/home/runner/work/claude-config/claude-config/.claude-plugin/marketplace.json`
  - Plan template/example: `/home/runner/work/claude-config/claude-config/claude/skills/ralph-planner/templates/ROADMAP.template.md`, `/home/runner/work/claude-config/claude-config/plugins/conserve/docs/modularization-plan.md`
- Validation commands relevant to likely edits (`.md` / `.json`):
  - `npm run lint:claude` — from `/home/runner/work/claude-config/claude-config/package.json`
  - `npm run lint:claude:fix` — from `/home/runner/work/claude-config/claude-config/package.json`
  - CI equivalent: `uv tool run "claudelint@${CLAUDELINT_VERSION}" --strict .` — from `/home/runner/work/claude-config/claude-config/.github/workflows/claudelint.yml`
  - No dedicated tests found for root TODO/README/marketplace planning docs; validation is lint-centric.

## Risks
- No single dedicated root “integration plan for external repos/npm packages” doc exists; content could plausibly land in `TODO.md`, `opencode/TODO.md`, or a new plan doc.
- `TODO.md` is broad and informal; adding too much structure there may mix backlog items with reference inventory.
- `.claude-plugin/marketplace.json` is authoritative but not a planning document; adding speculative items there would conflate plan vs shipped registry.
- If a new plan doc is created, matching existing phase/checklist formatting will reduce inconsistency.
- Relevant files were all touched recently, so concurrent drift risk is moderate.

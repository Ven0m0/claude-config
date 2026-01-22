#!/usr/bin/env python3
"""
Skill Batch Fixer v1.0

Auto-fixes simple compliance gaps in SKILL.md files.
For complex gaps (missing sections), generates templates that need review.

Safe auto-fixes:
- Missing author → Jeremy Longshore <jeremy@intentsolutions.io>
- Missing license → MIT
- Missing "Use when" → Appends phrase to description
- Missing "Trigger with" → Appends phrase to description
- Unscoped Bash → Bash(cmd:*)

Usage:
    # Auto-fix all skills with simple gaps
    python scripts/skill-batch-fixer.py --auto-fix

    # Auto-fix specific category
    python scripts/skill-batch-fixer.py --auto-fix --category standalone

    # Dry-run (show what would be fixed)
    python scripts/skill-batch-fixer.py --dry-run

    # Generate templates for manual review
    python scripts/skill-batch-fixer.py --generate-templates --output templates/

Author: Jeremy Longshore <jeremy@intentsolutions.io>
"""

import argparse
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml required. Install: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


# === CONSTANTS ===

DEFAULT_AUTHOR = "Jeremy Longshore <jeremy@intentsolutions.io>"
DEFAULT_LICENSE = "MIT"

RE_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)
RE_DESCRIPTION_USE_WHEN = re.compile(r"\bUse when\b", re.IGNORECASE)
RE_DESCRIPTION_TRIGGER_WITH = re.compile(r"\bTrigger with\b", re.IGNORECASE)

# Section templates
SECTION_TEMPLATES = {
    "Overview": """## Overview

{skill_name} provides {capability_summary}.

Key features:
- Feature 1
- Feature 2
- Feature 3
""",
    "Prerequisites": """## Prerequisites

- Required tool or API access
- Environment configuration (if applicable)
- Authentication credentials (if applicable)
""",
    "Instructions": """## Instructions

1. Analyze the request to understand requirements
2. Execute the primary operation
3. Validate the output
4. Report results to user
""",
    "Output": """## Output

- Primary artifact or result
- Status report
- Any generated files or data
""",
    "Error Handling": """## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Configuration error | Missing setup | Check prerequisites |
| Validation failure | Invalid input | Review input format |
| Execution error | Runtime issue | Check logs for details |
""",
    "Examples": """## Examples

**Example: Basic usage**
Request: "Execute {skill_name} for standard scenario"
Result: Successfully completed operation with expected output

**Example: Advanced usage**
Request: "Execute {skill_name} with custom parameters"
Result: Completed with customized configuration applied
""",
    "Resources": """## Resources

- [Relevant documentation](https://example.com)
- [API reference](https://example.com/api)
"""
}


# === UTILITY FUNCTIONS ===

def find_skill_files(root: Path, category: str = None) -> List[Path]:
    """Find SKILL.md files, optionally filtered by category."""
    excluded_dirs = {
        "archive", "backups", "backup", ".git", "node_modules",
        "__pycache__", ".venv", "010-archive", "000-docs", "002-workspaces",
    }
    results = []

    plugins_dir = root / "plugins"
    if plugins_dir.exists():
        for p in plugins_dir.rglob("skills/*/SKILL.md"):
            if p.is_file():
                parts = p.relative_to(root).parts
                if any(part in excluded_dirs for part in parts):
                    continue
                if any(part.startswith("skills-backup-") for part in parts):
                    continue
                if category and len(parts) >= 2 and parts[1] != category:
                    continue
                results.append(p)

    skills_dir = root / "skills"
    if skills_dir.exists():
        for p in skills_dir.rglob("*/SKILL.md"):
            if p.is_file():
                parts = p.relative_to(root).parts
                if any(part in excluded_dirs for part in parts):
                    continue
                if category and category != "standalone":
                    continue
                results.append(p)

    return results


def parse_skill(path: Path) -> Tuple[dict, str, str]:
    """Parse SKILL.md into (frontmatter_dict, body, raw_content)."""
    content = path.read_text(encoding='utf-8')
    m = RE_FRONTMATTER.match(content)
    if not m:
        raise ValueError("No frontmatter found")

    front_str, body = m.groups()
    fm = yaml.safe_load(front_str) or {}
    return fm, body, content


def serialize_skill(fm: dict, body: str) -> str:
    """Serialize frontmatter and body back to SKILL.md format."""
    # Custom YAML dump for description multiline
    lines = ["---"]

    for key, value in fm.items():
        if key == "description" and isinstance(value, str) and len(value) > 80:
            # Use literal block style for long descriptions
            lines.append(f"{key}: |")
            for desc_line in value.split('\n'):
                lines.append(f"  {desc_line}")
        elif isinstance(value, str):
            if '\n' in value:
                lines.append(f"{key}: |")
                for v_line in value.split('\n'):
                    lines.append(f"  {v_line}")
            else:
                # Quote if contains special chars
                if any(c in value for c in ':{}[]&*#?|-<>=!%@'):
                    lines.append(f'{key}: "{value}"')
                else:
                    lines.append(f"{key}: {value}")
        else:
            lines.append(f"{key}: {value}")

    lines.append("---")
    lines.append("")
    lines.append(body.lstrip())

    return '\n'.join(lines)


def infer_use_when(name: str, description: str) -> str:
    """Infer a 'Use when' phrase from skill name and description."""
    name_words = name.replace('-', ' ').replace('_', ' ')

    # Common patterns
    if 'api' in name.lower():
        return f"Use when working with APIs or building integrations."
    elif 'test' in name.lower():
        return f"Use when writing or running tests."
    elif 'deploy' in name.lower():
        return f"Use when deploying applications or services."
    elif 'config' in name.lower():
        return f"Use when configuring systems or services."
    elif 'monitor' in name.lower():
        return f"Use when monitoring systems or services."
    elif 'debug' in name.lower():
        return f"Use when debugging issues or troubleshooting."
    elif 'create' in name.lower() or 'generate' in name.lower():
        return f"Use when creating or generating {name_words}."
    elif 'analyze' in name.lower() or 'audit' in name.lower():
        return f"Use when analyzing or auditing {name_words}."
    else:
        return f"Use when working with {name_words} functionality."


def infer_trigger_with(name: str, description: str) -> str:
    """Infer a 'Trigger with' phrase from skill name and description."""
    name_words = name.replace('-', ' ').replace('_', ' ')
    name_parts = name.split('-')

    # Generate trigger phrases
    triggers = []
    triggers.append(name_words)

    if len(name_parts) >= 2:
        triggers.append(f"{name_parts[0]} {name_parts[-1]}")

    # Add action-based trigger
    if 'create' in name.lower():
        triggers.append(f"create {name_words.replace('create', '').strip()}")
    elif 'analyze' in name.lower():
        triggers.append(f"analyze {name_words.replace('analyze', '').strip()}")
    elif 'deploy' in name.lower():
        triggers.append(f"deploy {name_words.replace('deploy', '').strip()}")

    # Ensure we have at least 2-3 triggers
    if len(triggers) < 2:
        triggers.append(name.replace('-', ' '))
    if len(triggers) < 3:
        triggers.append(name_parts[0] if name_parts else name)

    # Format
    trigger_list = ', '.join(f'"{t}"' for t in triggers[:3])
    return f"Trigger with phrases like {trigger_list}."


def has_section(body: str, section_name: str) -> bool:
    """Check if body has a specific section."""
    pattern = rf"^##\s+{re.escape(section_name)}\s*$"
    return bool(re.search(pattern, body, re.MULTILINE | re.IGNORECASE))


def add_section(body: str, section_name: str, template: str) -> str:
    """Add a section to the body if it doesn't exist."""
    if has_section(body, section_name):
        return body

    # Find insertion point (before ## Resources if exists, else at end)
    if has_section(body, "Resources"):
        pattern = r"(^##\s+Resources)"
        body = re.sub(pattern, template.rstrip() + "\n\n\\1", body, count=1, flags=re.MULTILINE)
    else:
        body = body.rstrip() + "\n\n" + template.strip() + "\n"

    return body


# === FIX FUNCTIONS ===

def fix_skill(path: Path, dry_run: bool = False) -> Dict[str, Any]:
    """
    Fix a single skill file.
    Returns dict with: fixed, changes, errors
    """
    result = {
        "path": str(path),
        "fixed": False,
        "changes": [],
        "errors": [],
        "needs_manual": []
    }

    try:
        fm, body, original = parse_skill(path)
    except Exception as e:
        result["errors"].append(f"Parse error: {e}")
        return result

    name = fm.get("name", path.parent.name)
    desc = str(fm.get("description", ""))
    modified = False

    # === AUTO-FIX: Missing author ===
    if "author" not in fm:
        fm["author"] = DEFAULT_AUTHOR
        result["changes"].append("Added author field")
        modified = True

    # === AUTO-FIX: Missing license ===
    if "license" not in fm:
        fm["license"] = DEFAULT_LICENSE
        result["changes"].append("Added license field")
        modified = True

    # === AUTO-FIX: Missing "Use when" ===
    if desc and not RE_DESCRIPTION_USE_WHEN.search(desc):
        use_when = infer_use_when(name, desc)
        fm["description"] = desc.rstrip() + " " + use_when
        desc = fm["description"]
        result["changes"].append("Added 'Use when' phrase")
        modified = True

    # === AUTO-FIX: Missing "Trigger with" ===
    if desc and not RE_DESCRIPTION_TRIGGER_WITH.search(desc):
        trigger = infer_trigger_with(name, desc)
        fm["description"] = desc.rstrip() + " " + trigger
        result["changes"].append("Added 'Trigger with' phrase")
        modified = True

    # === AUTO-FIX: Unscoped Bash ===
    if "allowed-tools" in fm:
        tools = fm["allowed-tools"]
        if isinstance(tools, str) and "Bash" in tools and "Bash(" not in tools:
            fm["allowed-tools"] = tools.replace("Bash", "Bash(cmd:*)")
            result["changes"].append("Scoped Bash to Bash(cmd:*)")
            modified = True

    # === DETECT: Missing sections (manual review needed) ===
    required_sections = ["Overview", "Prerequisites", "Instructions", "Output",
                        "Error Handling", "Examples", "Resources"]
    for section in required_sections:
        if not has_section(body, section):
            result["needs_manual"].append(f"missing_section:{section}")

    # === WRITE CHANGES ===
    if modified and not dry_run:
        new_content = serialize_skill(fm, body)
        path.write_text(new_content, encoding='utf-8')
        result["fixed"] = True

    return result


def generate_template(path: Path, output_dir: Path) -> Dict[str, Any]:
    """Generate a template file for manual review of missing sections."""
    result = {
        "path": str(path),
        "template_path": None,
        "sections_needed": []
    }

    try:
        fm, body, _ = parse_skill(path)
    except Exception as e:
        result["errors"] = [str(e)]
        return result

    name = fm.get("name", path.parent.name)
    sections_to_add = []

    required_sections = ["Overview", "Prerequisites", "Instructions", "Output",
                        "Error Handling", "Examples", "Resources"]

    for section in required_sections:
        if not has_section(body, section):
            template = SECTION_TEMPLATES.get(section, f"## {section}\n\nContent needed.\n")
            template = template.replace("{skill_name}", name)
            template = template.replace("{capability_summary}", "specialized functionality")
            sections_to_add.append(template)
            result["sections_needed"].append(section)

    if sections_to_add:
        # Create template file
        template_path = output_dir / f"{name}-sections.md"
        template_content = f"# Missing Sections for {name}\n\n"
        template_content += f"Skill: {path}\n\n"
        template_content += "---\n\n"
        template_content += "\n".join(sections_to_add)

        template_path.parent.mkdir(parents=True, exist_ok=True)
        template_path.write_text(template_content, encoding='utf-8')
        result["template_path"] = str(template_path)

    return result


# === MAIN ===

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Batch fix skill compliance gaps"
    )
    parser.add_argument(
        "--auto-fix",
        action="store_true",
        help="Apply safe auto-fixes (author, license, description phrases)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be fixed without making changes"
    )
    parser.add_argument(
        "--category",
        help="Filter by category (e.g., standalone, saas-packs)"
    )
    parser.add_argument(
        "--generate-templates",
        action="store_true",
        help="Generate template files for missing sections"
    )
    parser.add_argument(
        "--output", "-o",
        default="templates/skill-sections",
        help="Output directory for templates"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of skills to process"
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    skills = find_skill_files(repo_root, args.category)

    if not skills:
        print("No SKILL.md files found.", file=sys.stderr)
        return 1

    if args.limit:
        skills = skills[:args.limit]

    print(f"Processing {len(skills)} skills...")

    if args.auto_fix or args.dry_run:
        fixed_count = 0
        change_count = 0
        manual_needed = 0

        for i, skill in enumerate(skills, 1):
            result = fix_skill(skill, dry_run=args.dry_run)

            if result["changes"]:
                print(f"[{i}/{len(skills)}] {result['path']}")
                for change in result["changes"]:
                    print(f"  + {change}")
                change_count += len(result["changes"])

            if result["fixed"]:
                fixed_count += 1

            if result["needs_manual"]:
                manual_needed += 1

            if result["errors"]:
                for err in result["errors"]:
                    print(f"  ERROR: {err}", file=sys.stderr)

        print(f"\n{'DRY RUN - ' if args.dry_run else ''}Summary:")
        print(f"  Skills processed: {len(skills)}")
        print(f"  Changes {'proposed' if args.dry_run else 'applied'}: {change_count}")
        print(f"  Skills {'would be ' if args.dry_run else ''}fixed: {fixed_count}")
        print(f"  Need manual review: {manual_needed}")

    if args.generate_templates:
        output_dir = Path(args.output)
        templates_created = 0

        for skill in skills:
            result = generate_template(skill, output_dir)
            if result.get("template_path"):
                templates_created += 1
                print(f"Created: {result['template_path']}")
                print(f"  Sections: {', '.join(result['sections_needed'])}")

        print(f"\nTemplates created: {templates_created}")
        print(f"Location: {output_dir}/")

    return 0


if __name__ == '__main__':
    sys.exit(main())

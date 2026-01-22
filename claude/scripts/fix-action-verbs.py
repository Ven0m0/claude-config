#!/usr/bin/env python3
"""
Fix missing action verbs in skill descriptions.

Action verb patterns:
- Analyze, Audit, Build, Configure, Create, Debug, Deploy, Design
- Detect, Execute, Export, Generate, Import, Implement, Initialize
- Install, Manage, Monitor, Optimize, Parse, Process, Run, Scan
- Setup, Test, Transform, Validate, Verify
"""

import os
import re
from pathlib import Path

SKILLS_DIRS = [Path("skills"), Path("plugins")]

# Map skill name patterns to appropriate action verbs
VERB_MAP = {
    "generator": "Generate",
    "creator": "Create",
    "builder": "Build",
    "analyzer": "Analyze",
    "scanner": "Scan",
    "checker": "Check",
    "validator": "Validate",
    "manager": "Manage",
    "helper": "Assist with",
    "setup": "Configure",
    "config": "Configure",
    "optimizer": "Optimize",
    "monitor": "Monitor",
    "detector": "Detect",
    "deployer": "Deploy",
    "tester": "Test",
    "profiler": "Profile",
    "parser": "Parse",
    "processor": "Process",
    "handler": "Handle",
    "transformer": "Transform",
    "converter": "Convert",
    "exporter": "Export",
    "importer": "Import",
    "installer": "Install",
    "runner": "Run",
    "planner": "Plan",
    "designer": "Design",
    "auditor": "Audit",
    "tracker": "Track",
    "scheduler": "Schedule",
    "calculator": "Calculate",
    "visualizer": "Visualize",
    "integrator": "Integrate",
}

ACTION_VERBS = [
    "Analyze", "Audit", "Build", "Configure", "Create", "Debug", "Deploy",
    "Design", "Detect", "Execute", "Export", "Generate", "Handle", "Import",
    "Implement", "Initialize", "Install", "Manage", "Monitor", "Optimize",
    "Parse", "Plan", "Process", "Profile", "Run", "Scan", "Schedule", "Setup",
    "Test", "Track", "Transform", "Validate", "Verify", "Visualize"
]

def has_action_verb(description: str) -> bool:
    """Check if description starts with an action verb."""
    first_word = description.strip().split()[0] if description.strip() else ""
    return first_word in ACTION_VERBS

def get_action_verb(skill_name: str) -> str:
    """Determine appropriate action verb based on skill name."""
    skill_lower = skill_name.lower()
    for pattern, verb in VERB_MAP.items():
        if pattern in skill_lower:
            return verb
    # Default based on common patterns
    if "test" in skill_lower:
        return "Test"
    if "deploy" in skill_lower:
        return "Deploy"
    if "api" in skill_lower:
        return "Configure"
    if "model" in skill_lower:
        return "Build"
    if "data" in skill_lower:
        return "Process"
    return "Execute"  # Default fallback

def fix_skill(filepath: Path) -> bool:
    """Fix action verb in skill description."""
    content = filepath.read_text()

    # Extract description from frontmatter
    desc_match = re.search(r'(description: \|?\n)((?:\s+.+\n)+)', content)
    if not desc_match:
        return False

    desc_prefix = desc_match.group(1)
    desc_content = desc_match.group(2)

    # Get first line of description
    lines = desc_content.split('\n')
    first_line = lines[0].strip() if lines else ""

    if has_action_verb(first_line):
        return False  # Already has action verb

    skill_name = filepath.parent.name
    verb = get_action_verb(skill_name)

    # Transform the first line to start with action verb
    # Pattern: "Skill Name - description" -> "Verb skill name operations. Description"
    if " - " in first_line:
        parts = first_line.split(" - ", 1)
        new_first = f"{verb} {parts[0].lower()} operations. {parts[1]}"
    else:
        new_first = f"{verb} {first_line.lower()}" if not first_line[0].isupper() else f"{verb} {first_line[0].lower()}{first_line[1:]}"

    # Reconstruct description
    indent = "  " if desc_prefix.endswith("|\n") else ""
    lines[0] = indent + new_first
    new_desc = '\n'.join(lines)

    new_content = content.replace(desc_match.group(0), desc_prefix + new_desc)

    if new_content != content:
        filepath.write_text(new_content)
        return True
    return False

def main():
    fixed = 0
    total = 0

    for skills_dir in SKILLS_DIRS:
        if not skills_dir.exists():
            continue
        for filepath in skills_dir.glob("**/SKILL.md"):
            total += 1
            try:
                if fix_skill(filepath):
                    fixed += 1
                    print(f"  ✓ {filepath.parent.name}")
            except Exception as e:
                print(f"  ✗ {filepath}: {e}")

    print(f"\nFixed {fixed}/{total} skills")

if __name__ == "__main__":
    main()

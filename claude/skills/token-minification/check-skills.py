#!/usr/bin/env python3
# check-skills.py
# Purpose: Validate SKILL.md files using std-lib Python for robust string handling.
# Ref: https://github.com/agentskills/agentskills
# Constraint: Zero external dependencies (No PyYAML).

import os
import re
import sys
from typing import Dict, List, Optional, Tuple

# --- Configuration ---
REQUIRED_FIELDS = {'name', 'description'}
# Spec: Lowercase, numbers, hyphens. No spaces/underscores.
NAME_PATTERN = re.compile(r'^[a-z0-9-]+$') 
MAX_DESC_LEN = 1024

class ValidationResult:
    def __init__(self, path: str):
        self.path = path
        self.errors: List[str] = []
        self.name: Optional[str] = None

    def add_error(self, msg: str):
        self.errors.append(msg)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

def parse_frontmatter(content: str) -> Dict[str, str]:
    """
    Parses simple YAML frontmatter without external libs.
    Handles: key: value, key: "val", key: 'val', comments.
    """
    data = {}
    lines = content.splitlines()
    
    # Frontmatter must start with ---
    if not lines or lines[0].strip() != '---':
        return {}

    for line in lines[1:]:
        line = line.strip()
        if line == '---':
            break
        if not line or line.startswith('#'):
            continue
        
        # Split on first colon only
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip()
            
            # Remove wrapping quotes if present
            if (val.startswith('"') and val.endswith('"')) or \
               (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            
            data[key] = val
            
    return data

def validate_file(filepath: str) -> ValidationResult:
    res = ValidationResult(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        res.add_error(f"Read error: {str(e)}")
        return res

    # 1. Check Frontmatter Existence
    if not content.startswith('---\n'):
        res.add_error("Missing frontmatter start (---)")
        return res

    # 2. Parse
    try:
        data = parse_frontmatter(content)
    except Exception as e:
        res.add_error(f"Parsing error: {str(e)}")
        return res

    # 3. Validate Fields
    # Name
    name = data.get('name')
    if not name:
        res.add_error("Missing field: 'name'")
    else:
        res.name = name
        if not NAME_PATTERN.match(name):
            res.add_error(f"Invalid name format: '{name}' (Must be kebab-case: a-z0-9-)")
        if len(name) > 64:
             res.add_error(f"Name too long: {len(name)} > 64 chars")

    # Description
    desc = data.get('description')
    if not desc:
        res.add_error("Missing field: 'description'")
    else:
        if len(desc) > MAX_DESC_LEN:
            res.add_error(f"Description too long: {len(desc)} > {MAX_DESC_LEN} chars")

    return res

def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    
    if not os.path.isdir(target_dir):
        print(f"Error: Directory '{target_dir}' not found.")
        sys.exit(1)

    print(f"Scanning '{target_dir}' for SKILL.md files...")
    
    files_checked = 0
    failures = 0

    for root, _, files in os.walk(target_dir):
        if "SKILL.md" in files:
            path = os.path.join(root, "SKILL.md")
            files_checked += 1
            result = validate_file(path)
            
            if result.is_valid:
                print(f"PASS: {result.path} ({result.name})")
            else:
                failures += 1
                print(f"FAIL: {result.path}")
                for err in result.errors:
                    print(f"  - {err}")

    print("-" * 40)
    print(f"Summary: Checked {files_checked} | Failed {failures}")
    
    if failures > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()

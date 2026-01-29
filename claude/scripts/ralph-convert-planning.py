#!/usr/bin/env python3

import sys
import re
from datetime import datetime

def parse_planning_doc(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Planning document not found: {filepath}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        sys.exit(1)

    frontmatter_match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)

    if frontmatter_match:
        yaml_content = frontmatter_match.group(1)
        markdown_content = frontmatter_match.group(2)
    else:
        yaml_content = ""
        markdown_content = content

    tasks = []
    current_task = None
    current_section = None

    lines = markdown_content.split('\n')

    for line in lines:
        stripped = line.strip()

        if not stripped:
            continue

        task_match = re.match(r'^#{2,3}\s*Task:\s*(.+)$', stripped, re.IGNORECASE)
        if task_match:
            if current_task:
                tasks.append(current_task)

            current_task = {
                'title': task_match.group(1).strip(),
                'description': '',
                'details': [],
                'section': current_section or 'General',
                'acceptance': []
            }
            continue

        section_match = re.match(r'^#{2,3}\s*([A-Z][A-Z\s]+):?\s*$', stripped)
        if section_match:
            current_section = section_match.group(1).strip()
            continue

        if current_task:
            if stripped.startswith('- [ ]') or stripped.startswith('- [x]'):
                criteria = re.sub(r'^- \[.\]\s*', '', stripped).strip()
                current_task['acceptance'].append(criteria)
            elif stripped.startswith('- ') or stripped.startswith('* '):
                detail = stripped[2:].strip()
                current_task['details'].append(detail)
            elif stripped.startswith('Acceptance:'):
                acceptance_text = re.sub(r'^Acceptance:\s*', '', stripped).strip()
                current_task['acceptance'].append(acceptance_text)
            elif stripped:
                if current_task['description']:
                    current_task['description'] += ' ' + stripped
                else:
                    current_task['description'] = stripped

    if current_task:
        tasks.append(current_task)

    return {
        'metadata': yaml_content,
        'tasks': tasks,
        'source_file': filepath
    }

def generate_goals_xml(planning_data):
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<goals>']

    for i, task in enumerate(planning_data['tasks'], 1):
        task_id = f"goal-{i:03d}"
        title = task['title']
        section = task.get('section', 'General')

        promise_detail = task['details'][0] if task['details'] else task['description']
        if not promise_detail:
            promise_detail = title

        promise = f"<promise>{promise_detail}</promise>"

        xml_lines.extend([
            f'  <goal id="{task_id}" section="{section}">',
            f'    <title>{title}</title>',
            f'    <description>{task.get("description", "")}</description>',
            f'    {promise}'
        ])

        if task.get('acceptance'):
            xml_lines.append('    <acceptance>')
            for criteria in task['acceptance']:
                escaped_criteria = criteria.replace('<', '&lt;').replace('>', '&gt;')
                xml_lines.append(f'      <item>{escaped_criteria}</item>')
            xml_lines.append('    </acceptance>')

        xml_lines.extend([
            f'    <status>pending</status>',
            f'  </goal>'
        ])

    xml_lines.append('</goals>')
    return '\n'.join(xml_lines)

def main():
    if len(sys.argv) < 2:
        print("Usage: convert-planning.py <planning_document.md>", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]

    try:
        planning_data = parse_planning_doc(filepath)

        if not planning_data['tasks']:
            print("Warning: No tasks found in planning document", file=sys.stderr)

        xml_output = generate_goals_xml(planning_data)
        print(xml_output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

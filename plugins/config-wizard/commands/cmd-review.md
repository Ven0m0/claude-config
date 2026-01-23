---
description: Review an existing slash command from the current project.
---

# Command Review

First, search for all command files in:
1. The current project's .claude/commands directory
2. All plugin command directories: plugins/*/commands/

If no commands are found in either location, inform the user that there are no commands to review.

If commands are found, use the AskUserQuestion tool to ask:
- Question: "Which command would you like to review?"
- Header: "Command"
- Options: List all the available commands found in both locations (show the filename without the .md extension, and indicate whether it's a project command or plugin command)

After receiving the user's answer:
1. Read the selected command file
2. Analyze the command and provide a comprehensive review covering:
   - Purpose and functionality
   - Clarity and completeness of instructions
   - Potential improvements or issues
   - Best practices and recommendations
   - Whether the command follows Claude Code conventions

Provide actionable feedback to help improve the command.

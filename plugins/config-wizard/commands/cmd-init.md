---
description: Initialize a new slash command for Claude Code.
---

# Command Initialization

## Name

config-wizard:cmd-init - Initialize a new slash command

## Synopsis

/cmd-init

## Description

Interactively create a new slash command for Claude Code. Supports creating commands in the current project, personal directory, or as a distributable plugin command.

## Implementation

First, ask the user where they want to create the command using the AskUserQuestion tool with a single choice question:

- Question: "Where should this command be created?"
- Header: "Location"
- Options:
  1. "Project" - Create in the current project's .claude/commands directory (only available to this project)
  1. "Personal" - Create in your personal ~/.claude/commands directory (available across all projects)
  1. "Plugin" - Create as a plugin in .claude-plugin/commands (for distribution and reuse)

If the user selects "Plugin", make a second AskUserQuestion call asking:

- Question: "Which plugin should contain this command?"
- Header: "Plugin"
- Options: List the available plugins found in the plugins/ directory or .claude-plugin/ directories

After receiving the user's answers, create the command in the appropriate location.

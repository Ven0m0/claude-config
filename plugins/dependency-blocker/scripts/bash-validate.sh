#!/usr/bin/env bash
set -euo pipefail

# This script validates bash commands before execution.
# It blocks direct access to excluded directories but allows:
# - Tool invocations (npm, yarn, cargo, make, etc.)
# - Tool orchestration with navigation (cd dir && npm run build)
#
# Philosophy:
# - Tool invocations manage their own directories (trusted)
# - Navigation commands (cd, pwd, pushd, popd) are allowed
# - File access commands (cat, grep, find, ls) are checked for excluded dirs
# - Any checked command accessing excluded dirs in a chain blocks the entire chain

# ============================================
# Configuration
# ============================================

# List of excluded directories (critical bloat offenders)
# Each of these can cause massive token waste if accessed
declare -a EXCLUDED_DIRS=(
  "node_modules" # JS/Node dependencies - can be 100k+ files
  ".git"         # Git version control history - entire repo history
  "vendor"       # PHP/Go/Ruby dependencies - like node_modules for other languages
  "target"       # Rust/Java build output - compiled artifacts
  ".venv"        # Python virtual environment - entire stdlib + packages
  "venv"         # Python virtual environment (alternate name)
  "dist"         # Build output - minified/compiled/bundled files
  "build"        # Build output - compiled artifacts and assets
)

# List of trusted tool invocations that manage their own directories
# These are always allowed, even when they operate on excluded directories
declare -a TRUSTED_TOOLS=(
  "npm"    # Node Package Manager
  "yarn"   # Yarn package manager
  "pnpm"   # pnpm package manager
  "cargo"  # Rust package manager
  "make"   # Build automation
  "python" # Python interpreter (for pip, etc.)
  "go"     # Go compiler
  "ruby"   # Ruby interpreter
  "java"   # Java runtime
  "gradle" # Gradle build tool
  "maven"  # Maven build tool
  "pip"    # Python package installer
)

# List of always-allowed navigation commands
# Note: cd is handled separately - it's allowed unless navigating TO excluded dirs
declare -a SAFE_COMMANDS=(
  "pwd"   # Print working directory
  "pushd" # Push directory
  "popd"  # Pop directory
)

# List of checked commands that can access files/directories
# These commands are checked for references to excluded directories
declare -a CHECKED_COMMANDS=(
  "ls"   # List directory contents
  "cat"  # Concatenate and print files
  "grep" # Search file contents
  "find" # Find files
  "head" # Output first part of files
  "tail" # Output last part of files
  "less" # View file contents
  "more" # View file contents
  "tree" # List directory tree
  "du"   # Disk usage
  "stat" # File status
  "file" # Determine file type
  "wc"   # Word count
  "diff" # Compare files
  "sort" # Sort lines
  "uniq" # Report or omit repeated lines
  "cut"  # Remove sections from lines
  "awk"  # Pattern scanning and processing
  "sed"  # Stream editor
  "rg"   # Ripgrep
  "ag"   # Silver searcher
  "ack"  # Code search tool
)

# ============================================
# Helper Functions
# ============================================

# Check if a command is in the safe commands list
is_safe_command() {
  local cmd="$1"
  for safe_cmd in "${SAFE_COMMANDS[@]}"; do
    [[ $cmd == "$safe_cmd" ]] && return 0
  done
  return 1
}

# Check if a command is in the trusted tools list
is_trusted_tool() {
  local cmd="$1"
  for tool in "${TRUSTED_TOOLS[@]}"; do
    [[ $cmd == "$tool" ]] && return 0
  done
  return 1
}

# Check if a command is in the checked commands list
# Uses case-insensitive matching to handle macOS case-insensitive filesystem
is_checked_command() {
  local cmd="$1"
  local cmd_lower
  cmd_lower=$(echo "$cmd" | tr '[:upper:]' '[:lower:]')
  for checked in "${CHECKED_COMMANDS[@]}"; do
    [[ $cmd_lower == "$checked" ]] && return 0
  done
  return 1
}

# Check if a directory name is in the excluded list
is_excluded_directory() {
  local dir_name="$1"
  for excluded in "${EXCLUDED_DIRS[@]}"; do
    [[ $dir_name == "$excluded" ]] && return 0
  done
  return 1
}

# Strip quotes from a string (both single and double quotes)
strip_quotes() {
  local text="$1"
  # Remove surrounding quotes and quotes around path components
  text="${text//\'/}" # Remove single quotes
  text="${text//\"/}" # Remove double quotes
  echo "$text"
}

# Check if text contains an excluded directory as a complete path component
# This ensures we match "node_modules" but not "node_module" or "my_node_modules_backup"
# Also handles wildcards and quotes
contains_excluded_dir_as_path_component() {
  local text="$1"
  local dir="$2"

  # Strip quotes from the text first
  text=$(strip_quotes "$text")

  # Check for exact match with word boundaries
  # Match patterns:
  # - Start of string or space or / before dir
  # - End of string or space or / after dir
  if [[ $text =~ (^|[[:space:]]|/)${dir}([[:space:]]|/|$) ]]; then
    return 0 # Found
  fi

  # Check for wildcard patterns that could match the excluded directory
  # We need to check if there's a wildcard pattern that could expand to the directory name
  # Examples: node_modu*, node_module?, */node_modules, ~*/node_modules, *node_modules*

  # Split the directory name into a pattern to match with wildcards
  # For "node_modules", check for patterns like: nod*, node_*, *modules, etc.
  local dir_pattern=""
  local i
  for ((i = 0; i < ${#dir}; i++)); do
    local prefix="${dir:0:i}"
    local suffix="${dir:i}"

    # Check if the text contains this prefix followed by a wildcard
    # Pattern: (prefix)*
    if [[ -n $prefix ]] && [[ $text =~ (^|[[:space:]]|/)${prefix}[*?] ]]; then
      return 0
    fi

    # Check if the text contains a wildcard followed by this suffix
    # Pattern: *(suffix)
    if [[ -n $suffix ]] && [[ $text =~ [*?]${suffix}([[:space:]]|/|$) ]]; then
      return 0
    fi
  done

  # Also check for wildcards in parent directories: */node_modules, ~*/node_modules
  if [[ $text =~ \*/.*${dir} ]] \
    || [[ $text =~ ~[^/]*/.*${dir} ]]; then
    return 0 # Found with wildcard
  fi

  return 1 # Not found
}

# Extract the target directory from a cd command
get_cd_target() {
  local segment="$1"
  local target

  # Remove "cd" and leading whitespace
  target="${segment#cd}"
  target="${target#"${target%%[![:space:]]*}"}" # trim leading whitespace

  # Extract first word (the directory argument)
  target="${target%% *}"

  echo "$target"
}

# Validate a cd command - blocks navigation to excluded directories
validate_cd_command() {
  local segment="$1"
  local target

  target=$(get_cd_target "$segment")

  # Check if the target is an excluded directory
  if is_excluded_directory "$target"; then
    echo "Blocked: Cannot navigate to excluded directory '$target'. This would expose dependency/build files that cause token bloat. Use tool commands (npm, make, etc.) which manage these directories internally." >&2
    return 1
  fi

  return 0
}

# Check if a segment contains any excluded directories
check_segment_for_excluded_dirs() {
  local segment="$1"

  for dir in "${EXCLUDED_DIRS[@]}"; do
    if contains_excluded_dir_as_path_component "$segment" "$dir"; then
      echo "Blocked: Command segment '$segment' accesses excluded directory '$dir'. This directory contains dependency/build files that would waste tokens. Consider using tool-specific commands instead." >&2
      return 1
    fi
  done

  return 0
}

# Validate a single command segment
validate_segment() {
  local segment="$1"
  local first_word

  # Trim leading and trailing whitespace
  segment="${segment#"${segment%%[![:space:]]*}"}" # trim leading
  segment="${segment%"${segment##*[![:space:]]}"}" # trim trailing

  # Skip empty segments
  [[ -z $segment ]] && return 0

  # Extract the first word (the command)
  first_word="${segment%% *}"

  # Special handling for cd - check if it's navigating to an excluded directory
  if [[ $first_word == "cd" ]]; then
    validate_cd_command "$segment"
    return $?
  fi

  # Check if the command is always-allowed (navigation) or trusted (tools)
  if is_safe_command "$first_word" || is_trusted_tool "$first_word"; then
    return 0
  fi

  # Check if segment contains redirection operators (>, <, >>, <<)
  # These can be used to read from or write to excluded directories
  if [[ $segment =~ [[:space:]]*[\<\>] ]]; then
    check_segment_for_excluded_dirs "$segment"
    return $?
  fi

  # Only check for excluded directories if this is a checked command
  # Unchecked commands are allowed (they may fail with "command not found" anyway)
  if is_checked_command "$first_word"; then
    check_segment_for_excluded_dirs "$segment"
    return $?
  fi

  # Unchecked command - allow it
  return 0
}

# Check for dangerous shell features that could bypass validation
check_dangerous_features() {
  local cmd="$1"

  # Check for command substitution: $(...) or `...`
  if [[ $cmd =~ \$\( ]] || [[ $cmd =~ \` ]]; then
    echo 'Blocked: Command substitution $(...) or backticks are not allowed as they could bypass directory validation. Run commands separately instead of nesting them.' >&2
    return 1
  fi

  # Check for process substitution: <(...) or >(...)
  if [[ $cmd =~ \<\( ]] || [[ $cmd =~ \>\( ]]; then
    echo "Blocked: Process substitution <(...) or >(...) is not allowed as it could bypass directory validation. Use temporary files or separate commands instead." >&2
    return 1
  fi

  # Check for brace expansion with excluded directories
  for dir in "${EXCLUDED_DIRS[@]}"; do
    # Match patterns like {node_modules,dist} or {a,node_modules}
    if [[ $cmd =~ \{[^}]*${dir}[^}]*\} ]]; then
      echo "Blocked: Brace expansion {...} contains excluded directory '$dir'. This could expand to paths in dependency/build directories. Avoid using brace expansion with excluded directories." >&2
      return 1
    fi

    # Check for variable assignments to excluded directories
    # Pattern: VAR=excluded_dir or VAR="excluded_dir" or VAR='excluded_dir'
    if [[ $cmd =~ [A-Za-z_][A-Za-z0-9_]*=[\"\']*${dir}[\"\']*([[:space:]]|$|\&\&|\|\||;) ]]; then
      echo "Blocked: Cannot assign variable to excluded directory '$dir'. Variable assignments to dependency/build directories could be used to bypass validation later in the command chain." >&2
      return 1
    fi
  done

  return 0
}

# Split a command by separators (&&, ||, ;, |) and validate each segment
validate_command() {
  local cmd="$1"
  local segment

  # First check for dangerous shell features
  if ! check_dangerous_features "$cmd"; then
    return 1
  fi

  # Replace separators with newlines to split the command
  # This handles: &&, ||, ;, and |
  local segments
  segments="${cmd//&&/$'\n'}"      # Replace && with newline
  segments="${segments//||/$'\n'}" # Replace || with newline
  segments="${segments//;/$'\n'}"  # Replace ; with newline
  segments="${segments//|/$'\n'}"  # Replace | with newline

  # Process each segment
  while IFS= read -r segment; do
    if ! validate_segment "$segment"; then
      return 1
    fi
  done <<<"$segments"

  return 0
}

# Parse command from JSON input
parse_json_command() {
  local json="$1"
  local command

  # Extract command from JSON: {"tool_input": {"command": "..."}}
  # Always use the robust method that handles escaped quotes properly

  # Extract everything after "command":
  local temp="${json#*\"command\"}"
  temp="${temp#*:}"
  temp="${temp#*\"}"

  # Find the closing quote, accounting for escaped quotes
  local result=""
  local escaped=false
  local i
  for ((i = 0; i < ${#temp}; i++)); do
    local char="${temp:i:1}"
    if "$escaped"; then
      # Previous character was backslash, so this character is escaped
      result+="$char"
      escaped=false
    elif [[ $char == '\' ]]; then
      # This is a backslash, next character will be escaped
      escaped=true
    elif [[ $char == '"' ]]; then
      # Unescaped quote - end of command string
      break
    else
      result+="$char"
    fi
  done

  command="$result"
  echo "$command"
}

# ============================================
# Main Logic
# ============================================

# Read input - either JSON from stdin or command-line arguments
if [[ $# -gt 0 ]]; then
  # Command-line arguments provided (testing mode)
  CMD="$*"
else
  # No arguments, read JSON from stdin (Claude Code hook mode)
  INPUT=$(cat)
  CMD=$(parse_json_command "$INPUT")
fi

# Skip check if no command was extracted
if [[ -z $CMD ]]; then
  exit 0
fi

# Validate the entire command
if ! validate_command "$CMD"; then
  exit 2
fi

exit 0

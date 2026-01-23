#!/usr/bin/env bash

# Shared test helpers for dependency-blocker plugin tests
# This file is sourced by all BATS test files

# ============================================
# Common Assertions
# ============================================

# Assert that a command was blocked (exit code 2, "Blocked" in output)
assert_blocked() {
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

# Assert that a command was allowed (exit code 0)
assert_allowed() {
    [ "$status" -eq 0 ]
}

# ============================================
# Test Execution Helpers
# ============================================

# Test a script with a single argument in CLI mode
# Usage: test_script_with_arg "$SCRIPT" "argument"
test_script_with_arg() {
    local script="$1"
    local arg="$2"
    run "$script" "$arg"
}

# Create JSON payload for hook mode testing
# Usage: create_json "tool_name" "param_name" "param_value"
create_json() {
    local tool_name="$1"
    local param_name="$2"
    local param_value="$3"

    cat <<EOF
{
  "session_id": "test",
  "hook_event_name": "PreToolUse",
  "tool_name": "$tool_name",
  "tool_input": {
    "$param_name": "$param_value"
  }
}
EOF
}

# Test a script in JSON/hook mode
# Usage: test_script_json "$SCRIPT" "tool_name" "param_name" "param_value"
test_script_json() {
    local script="$1"
    local tool_name="$2"
    local param_name="$3"
    local param_value="$4"
    local json

    json=$(create_json "$tool_name" "$param_name" "$param_value")
    run bash -c "echo '$json' | '$script'"
}

# ============================================
# Bash-specific Helpers
# ============================================

# Test a bash command in CLI mode
test_bash_command() {
    run "$SCRIPT" "$1"
}

# Test a bash command in JSON/hook mode
test_bash_json_command() {
    local command="$1"
    test_script_json "$SCRIPT" "Bash" "command" "$command"
}

# ============================================
# Read-specific Helpers
# ============================================

# Test a read file path in CLI mode
test_read_path() {
    run "$SCRIPT" "$1"
}

# Test a read file path in JSON/hook mode
test_read_json_path() {
    local file_path="$1"
    test_script_json "$SCRIPT" "Read" "file_path" "$file_path"
}

# ============================================
# Glob-specific Helpers
# ============================================

# Test a glob pattern in CLI mode
test_glob_pattern() {
    run "$SCRIPT" "$@"
}

# ============================================
# Grep-specific Helpers
# ============================================

# Test a grep path in CLI mode
test_grep_path() {
    run "$SCRIPT" "$1"
}

# ============================================
# Data-driven Test Helper
# ============================================

# Run a test function over an array of test cases
# Usage: run_test_cases test_function assert_function "case1" "case2" "case3"
# Example: run_test_cases test_bash_command assert_blocked "ls node_modules" "cat .git/config"
run_test_cases() {
    local test_func="$1"
    local assert_func="$2"
    shift 2
    local cases=("$@")

    for test_case in "${cases[@]}"; do
        $test_func "$test_case"
        $assert_func || {
            echo "Failed test case: $test_case" >&2
            return 1
        }
    done
}

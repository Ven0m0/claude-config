#!/usr/bin/env bats

# Tests for bash-validate.sh

setup() {
    DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    SCRIPT="$DIR/../scripts/bash-validate.sh"
    chmod +x "$SCRIPT"
}

# ============================================
# Command-line mode - Should Block
# ============================================

@test "blocks cat .env" {
    run "$SCRIPT" "cat .env"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cat .bashrc" {
    run "$SCRIPT" "cat .bashrc"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cat .zshrc" {
    run "$SCRIPT" "cat .zshrc"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks ls .ssh" {
    run "$SCRIPT" "ls .ssh"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cat with absolute path to .env" {
    run "$SCRIPT" "cat /home/user/.env"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cat with nested .env" {
    run "$SCRIPT" "cat /project/.env.production"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks find with .aws" {
    run "$SCRIPT" "find .aws -name credentials"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .gitconfig" {
    run "$SCRIPT" "grep token .gitconfig"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cp from .npmrc" {
    run "$SCRIPT" "cp .npmrc backup/"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks cat .docker/config.json" {
    run "$SCRIPT" "cat .docker/config.json"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

# ============================================
# Command-line mode - Should Allow
# ============================================

@test "allows cat on regular file" {
    run "$SCRIPT" "cat src/index.js"
    [ "$status" -eq 0 ]
}

@test "allows ls on directory" {
    run "$SCRIPT" "ls src/"
    [ "$status" -eq 0 ]
}

@test "allows grep in source files" {
    run "$SCRIPT" "grep -r 'function' src/"
    [ "$status" -eq 0 ]
}

@test "allows commands with 'env' but not '.env'" {
    run "$SCRIPT" "cat environment.js"
    [ "$status" -eq 0 ]
}

@test "allows commands with 'ssh' but not '.ssh'" {
    run "$SCRIPT" "cat ssh-utils.js"
    [ "$status" -eq 0 ]
}

@test "allows echo command" {
    run "$SCRIPT" "echo 'hello world'"
    [ "$status" -eq 0 ]
}

# ============================================
# JSON mode - Should Block
# ============================================

@test "JSON: blocks cat .env" {
    run bash -c "echo '{\"tool_input\": {\"command\": \"cat .env\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "JSON: blocks cat .bashrc" {
    run bash -c "echo '{\"tool_input\": {\"command\": \"cat /home/user/.bashrc\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "JSON: blocks ls .ssh" {
    run bash -c "echo '{\"tool_input\": {\"command\": \"ls .ssh/\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

# ============================================
# JSON mode - Should Allow
# ============================================

@test "JSON: allows cat on regular file" {
    run bash -c "echo '{\"tool_input\": {\"command\": \"cat src/main.js\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "JSON: allows ls command" {
    run bash -c "echo '{\"tool_input\": {\"command\": \"ls -la\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

# ============================================
# Edge Cases
# ============================================

@test "handles empty input gracefully" {
    run "$SCRIPT" ""
    [ "$status" -eq 0 ]
}

@test "handles JSON with missing command" {
    run bash -c "echo '{\"tool_input\": {}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "handles malformed JSON gracefully" {
    run bash -c "echo 'invalid json' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

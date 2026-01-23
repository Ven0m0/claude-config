#!/usr/bin/env bats

# Tests for grep-validate.sh

setup() {
    DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    SCRIPT="$DIR/../scripts/grep-validate.sh"
    chmod +x "$SCRIPT"
}

# ============================================
# Command-line mode - Should Block
# ============================================

@test "blocks grep in .env" {
    run "$SCRIPT" ".env"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .bashrc" {
    run "$SCRIPT" ".bashrc"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .zshrc" {
    run "$SCRIPT" ".zshrc"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .ssh directory" {
    run "$SCRIPT" ".ssh"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .ssh subdirectory" {
    run "$SCRIPT" ".ssh/keys"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .aws directory" {
    run "$SCRIPT" ".aws"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep with absolute path to .env" {
    run "$SCRIPT" "/home/user/.env"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "blocks grep in .docker directory" {
    run "$SCRIPT" ".docker"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

# ============================================
# Command-line mode - Should Allow
# ============================================

@test "allows grep in src directory" {
    run "$SCRIPT" "src"
    [ "$status" -eq 0 ]
}

@test "allows grep in current directory (empty path)" {
    run "$SCRIPT" ""
    [ "$status" -eq 0 ]
}

@test "allows grep in config directory" {
    run "$SCRIPT" "config"
    [ "$status" -eq 0 ]
}

@test "allows grep with 'env' substring" {
    run "$SCRIPT" "environment"
    [ "$status" -eq 0 ]
}

@test "allows grep with 'ssh' substring" {
    run "$SCRIPT" "src/ssh-client"
    [ "$status" -eq 0 ]
}

# ============================================
# JSON mode - Should Block
# ============================================

@test "JSON: blocks grep in .env" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"API_KEY\", \"path\": \".env\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "JSON: blocks grep in .bashrc" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"export\", \"path\": \".bashrc\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "JSON: blocks grep in .ssh" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"ssh\", \"path\": \".ssh\"}}' | '$SCRIPT'"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

# ============================================
# JSON mode - Should Allow
# ============================================

@test "JSON: allows grep in src directory" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"function\", \"path\": \"src\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "JSON: allows grep without path (defaults to current dir)" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"TODO\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "JSON: allows grep in safe directory" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"import\", \"path\": \"lib\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

# ============================================
# Edge Cases
# ============================================

@test "handles empty path gracefully" {
    run "$SCRIPT" ""
    [ "$status" -eq 0 ]
}

@test "handles JSON with missing path" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"search\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "handles JSON with empty path" {
    run bash -c "echo '{\"tool_input\": {\"pattern\": \"search\", \"path\": \"\"}}' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

@test "handles malformed JSON gracefully" {
    run bash -c "echo 'invalid json' | '$SCRIPT'"
    [ "$status" -eq 0 ]
}

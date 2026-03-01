#!/usr/bin/env bats

# Tests for JSON injection vulnerability in read, grep, and glob validator scripts

setup_file() {
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT_READ="$TEST_DIR/../scripts/read-validate.sh"
    export SCRIPT_GREP="$TEST_DIR/../scripts/grep-validate.sh"
    export SCRIPT_GLOB="$TEST_DIR/../scripts/glob-validate.sh"
    chmod +x "$SCRIPT_READ"
    chmod +x "$SCRIPT_GREP"
    chmod +x "$SCRIPT_GLOB"
}

setup() {
    load test_helper
}

@test "SECURITY: read-validate.sh blocks when fake key appears in note" {
    local json='{
        "tool_input": {
            "note": "Here is a fake \"file_path\": \"safe.txt\"",
            "file_path": "node_modules/package.json"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT_READ'"
    assert_blocked
}

@test "SECURITY: grep-validate.sh blocks when fake key appears in note" {
    local json='{
        "tool_input": {
            "note": "Here is a fake \"path\": \"safe.txt\"",
            "path": "node_modules/package.json"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT_GREP'"
    assert_blocked
}

@test "SECURITY: glob-validate.sh blocks when fake key appears in note" {
    # Check injection in pattern
    local json1='{
        "tool_input": {
            "note": "Here is a fake \"pattern\": \"*.txt\"",
            "pattern": "node_modules/*.js",
            "path": "src/"
        }
    }'

    run bash -c "echo '$json1' | '$SCRIPT_GLOB'"
    assert_blocked

    # Check injection in path
    local json2='{
        "tool_input": {
            "note": "Here is a fake \"path\": \"src/\"",
            "pattern": "*.js",
            "path": "node_modules/"
        }
    }'

    run bash -c "echo '$json2' | '$SCRIPT_GLOB'"
    assert_blocked
}

#!/usr/bin/env bats

# Tests for JSON injection vulnerability in bash-validate.sh

setup_file() {
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/bash-validate.sh"
    chmod +x "$SCRIPT"
}

setup() {
    load test_helper
}

@test "SECURITY: blocks command when 'command' key appears in string value before real command" {
    # Malicious JSON: "note" contains a fake command key-value pair.
    # The naive parser might find the first "command" string and use its value.
    # Real command accesses excluded directory (should be blocked).

    local json='{
        "tool_input": {
            "note": "Here is a fake \"command\": \"echo safe\"",
            "command": "cat node_modules/package.json"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT'"

    # Should exit with status 2 (blocked)
    # If vulnerability exists, it will exit with 0 (allowed) and this test will fail
    assert_blocked
}

@test "SECURITY: blocks command when deeply nested 'command' key is present" {
    # Check if recursive search works correctly (or at least finds the right one)
    # If the parser is naive, it might pick the first one it sees.

    local json='{
        "tool_input": {
            "nested": {
                "ignore_me": "fake",
                "command": "cat node_modules/package.json"
            }
        }
    }'

    # Note: The current bash script finds "command" anywhere, so this should be blocked.
    # The fix should also handle this correctly (recursive search).

    run bash -c "echo '$json' | '$SCRIPT'"
    assert_blocked
}

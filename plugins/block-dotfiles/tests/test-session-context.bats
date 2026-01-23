#!/usr/bin/env bats

# Tests for session-context.sh

# ============================================
# Setup
# ============================================

setup_file() {
    # Run once before all tests
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/session-context.sh"
    chmod +x "$SCRIPT"
}

# ============================================
# Tests
# ============================================

@test "session context script executes successfully" {
    run "$SCRIPT"

    # Should exit with code 0
    [ "$status" -eq 0 ]

    # Should produce non-empty output
    [ -n "$output" ]
}

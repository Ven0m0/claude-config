#!/usr/bin/env bats

# Tests for grep-validate.sh

# ============================================
# Setup
# ============================================

setup_file() {
    # Run once before all tests
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/grep-validate.sh"
    chmod +x "$SCRIPT"
}

setup() {
    # Load shared test helpers
    load test_helper
}

# ============================================
# Tests: Blocked Search Paths
# ============================================

@test "blocks grep in excluded directories" {
    local -a paths=(
        "node_modules"
        "node_modules/"
        "node_modules/package"
        ".git"
        "vendor"
        "target"
        "dist"
        "build/"
        ".venv"
        "venv"
    )

    for path in "${paths[@]}"; do
        test_grep_path "$path"
        assert_blocked || {
            echo "Failed to block: $path" >&2
            return 1
        }
    done
}

@test "blocks grep in absolute paths to excluded directories" {
    test_grep_path "/home/user/project/node_modules"
    assert_blocked
}

# ============================================
# Tests: Allowed Search Paths
# ============================================

@test "allows grep in safe directories" {
    local -a paths=(
        "src"
        "lib"
        "test"
        ""
        "src/components"
    )

    for path in "${paths[@]}"; do
        test_grep_path "$path"
        assert_allowed || {
            echo "Failed to allow: $path" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Edge Cases
# ============================================

@test "allows files with similar names to excluded dirs" {
    test_grep_path "src/distribution.js"
    assert_allowed
}

@test "blocks exact excluded directory names" {
    test_grep_path "dist"
    assert_blocked
}

# ============================================
# Tests: Security Edge Cases
# ============================================

@test "SECURITY: blocks grep when 'path' key appears in string value before real path" {
    local json='{
        "tool_input": {
            "pattern": "TODO",
            "note": "fake \"path\": \"safe\"",
            "path": "node_modules"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT'"
    assert_blocked
}

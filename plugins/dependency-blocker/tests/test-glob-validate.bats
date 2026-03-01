#!/usr/bin/env bats

# Tests for glob-validate.sh

# ============================================
# Setup
# ============================================

setup_file() {
    # Run once before all tests
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/glob-validate.sh"
    chmod +x "$SCRIPT"
}

setup() {
    # Load shared test helpers
    load test_helper
}

# ============================================
# Tests: Blocked Glob Patterns
# ============================================

@test "blocks glob patterns targeting excluded directories" {
    local -a patterns=(
        "node_modules/**"
        "node_modules/*"
        "**/node_modules/**"
        ".git/**"
        "vendor/**"
        "target/**"
        "dist/*.js"
        "build/**/*.js"
    )

    for pattern in "${patterns[@]}"; do
        test_glob_pattern "$pattern"
        assert_blocked || {
            echo "Failed to block pattern: $pattern" >&2
            return 1
        }
    done
}

@test "blocks glob with path argument in excluded directory" {
    test_glob_pattern "*.js" "node_modules/react"
    assert_blocked
}

# ============================================
# Tests: Allowed Glob Patterns
# ============================================

@test "allows glob patterns in safe directories" {
    local -a patterns=(
        "src/**"
        "**/*.js"
        "lib/**/*.ts"
        "*.json"
    )

    for pattern in "${patterns[@]}"; do
        test_glob_pattern "$pattern"
        assert_allowed || {
            echo "Failed to allow pattern: $pattern" >&2
            return 1
        }
    done
}

@test "allows glob with safe path argument" {
    test_glob_pattern "*.js" "src"
    assert_allowed
}

# ============================================
# Tests: Edge Cases
# ============================================

@test "allows files with similar names to excluded dirs" {
    test_glob_pattern "src/builds.ts"
    assert_allowed
}

@test "blocks exact excluded directory patterns" {
    test_glob_pattern "build/*"
    assert_blocked
}

# ============================================
# Tests: Security Edge Cases
# ============================================

@test "SECURITY: blocks glob when 'pattern' key appears in string value before real pattern" {
    local json='{
        "tool_input": {
            "note": "fake \"pattern\": \"safe\"",
            "pattern": "node_modules/**"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT'"
    assert_blocked
}

@test "SECURITY: blocks glob when 'path' key appears in string value before real path" {
    local json='{
        "tool_input": {
            "pattern": "*.js",
            "note": "fake \"path\": \"safe\"",
            "path": "node_modules"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT'"
    assert_blocked
}

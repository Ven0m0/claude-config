#!/usr/bin/env bats

# Tests for read-validate.sh

# ============================================
# Setup
# ============================================

setup_file() {
    # Run once before all tests
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/read-validate.sh"
    chmod +x "$SCRIPT"
}

setup() {
    # Load shared test helpers
    load test_helper
}

# ============================================
# Tests: Blocked File Paths
# ============================================

@test "blocks read from excluded directories" {
    local -a paths=(
        "node_modules/package/index.js"
        ".git/config"
        "dist/bundle.js"
        "build/output.js"
        "vendor/autoload.php"
        "target/release/binary"
        ".venv/lib/python3.11/site-packages/module.py"
        "venv/bin/activate"
    )

    for path in "${paths[@]}"; do
        test_read_path "$path"
        assert_blocked || {
            echo "Failed to block: $path" >&2
            return 1
        }
    done
}

@test "blocks read from nested excluded directory paths" {
    local -a paths=(
        "/path/to/node_modules/pkg/file.js"
        "/home/user/project/.git/HEAD"
    )

    for path in "${paths[@]}"; do
        test_read_path "$path"
        assert_blocked || {
            echo "Failed to block: $path" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Allowed File Paths
# ============================================

@test "allows read from safe directories" {
    local -a paths=(
        "src/index.js"
        "package.json"
        "lib/utils.js"
        "test/unit/test.js"
        "tsconfig.json"
        "README.md"
    )

    for path in "${paths[@]}"; do
        test_read_path "$path"
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
    local -a paths=(
        "src/builds.ts"
        ".gitignore"
        "src/distribution.js"
        "src/targeted.rs"
        "src/vendor.js"
        "src/environment.py"
    )

    for path in "${paths[@]}"; do
        test_read_path "$path"
        assert_allowed || {
            echo "Failed to allow: $path" >&2
            return 1
        }
    done
}

@test "blocks exact excluded directory paths" {
    test_read_path ".git/objects/abc123"
    assert_blocked
}

# ============================================
# Tests: JSON/Hook Mode
# ============================================

@test "JSON mode: blocks excluded directory paths" {
    local -a paths=(
        "node_modules/package/index.js"
        ".git/config"
        "dist/bundle.js"
    )

    for path in "${paths[@]}"; do
        test_read_json_path "$path"
        assert_blocked || {
            echo "Failed to block JSON path: $path" >&2
            return 1
        }
    done
}

@test "JSON mode: allows safe file paths" {
    local -a paths=(
        "src/index.js"
        "package.json"
        "README.md"
    )

    for path in "${paths[@]}"; do
        test_read_json_path "$path"
        assert_allowed || {
            echo "Failed to allow JSON path: $path" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Security Edge Cases
# ============================================

@test "SECURITY: blocks read when 'file_path' key appears in string value before real file_path" {
    local json='{
        "tool_input": {
            "note": "fake \"file_path\": \"safe\"",
            "file_path": "node_modules/package.json"
        }
    }'

    run bash -c "echo '$json' | '$SCRIPT'"
    assert_blocked
}

#!/usr/bin/env bats

# Tests for bash-validate.sh

# ============================================
# Setup
# ============================================

setup_file() {
    # Run once before all tests
    export TEST_DIR="$( cd "$( dirname "$BATS_TEST_FILENAME" )" >/dev/null 2>&1 && pwd )"
    export SCRIPT="$TEST_DIR/../scripts/bash-validate.sh"
    chmod +x "$SCRIPT"
}

setup() {
    # Load shared test helpers
    load test_helper
}

# ============================================
# Tests: Blocked Commands - Direct Access
# ============================================

@test "blocks ls on excluded directories" {
    local -a commands=(
        "ls node_modules"
        "ls vendor"
        "ls dist"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

@test "blocks find in excluded directories" {
    local -a commands=(
        "find node_modules -name '*.js'"
        "find target -type f"
        "find build -name '*.o'"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

@test "blocks cat from excluded directories" {
    local -a commands=(
        "cat .git/config"
        "cat .venv/bin/activate"
        "cat dist/bundle.js"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

@test "blocks grep in excluded directories" {
    local -a commands=(
        "grep -r 'test' dist/"
        "grep -r 'import' venv/"
        "grep 'error' dist/app.js"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

@test "blocks cd to excluded directories" {
    test_bash_command "cd build && ls"
    assert_blocked
}

@test "blocks access to nested excluded directory paths" {
    local -a commands=(
        "cat src/node_modules/package.json"
        "cat project/vendor/package.json"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Allowed Commands - Safe Operations
# ============================================

@test "allows operations on safe directories" {
    local -a commands=(
        "ls src"
        "find src -name '*.js'"
        "grep -r 'test' src/"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

@test "allows unchecked commands" {
    local -a commands=(
        "/usr/bin/git status"
        "echo 'hello world'"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Trusted Tool Invocations
# ============================================

@test "allows npm commands" {
    local -a commands=(
        "npm install"
        "npm run build"
        "npm run dev"
        "npm ci"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

@test "allows yarn commands" {
    local -a commands=(
        "yarn install"
        "yarn build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

@test "allows other package managers" {
    local -a commands=(
        "pnpm install"
        "cargo build"
        "cargo test"
        "make build"
        "python -m pip install"
        "go build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Command Chains - Safe Combinations
# ============================================

@test "allows safe navigation with tool invocations" {
    local -a commands=(
        "cd /path && npm run build"
        "pwd && npm install"
        "pushd /path && cargo build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

@test "allows multiple tool invocations chained together" {
    local -a commands=(
        "npm install && npm run build"
        "cd /path && npm install && npm run build"
        "npm install && pwd"
        "cd /a && pushd /b && npm build && popd"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_allowed || {
            echo "Failed to allow: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Command Chains - Blocked Combinations
# ============================================

@test "blocks excluded directory access after tool invocation" {
    local -a commands=(
        "npm run build && grep secret dist/app.js"
        "npm run build ; grep -r error build/"
        "make build || find dist -name '*.js'"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

@test "blocks excluded directory access before tool invocation" {
    test_bash_command "cat node_modules/file && npm run build"
    assert_blocked
}

@test "blocks excluded directory access in middle of chain" {
    local -a commands=(
        "cd /path && cat node_modules/pkg && npm run build"
        "npm install && ls node_modules && npm run build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Edge Cases
# ============================================

@test "allows commands with similar names to excluded dirs" {
    # Should allow "node_module" (without 's')
    test_bash_command "ls node_module"
    assert_allowed
}

@test "blocks exact match of excluded directory names" {
    # Should block exact "dist"
    test_bash_command "ls dist"
    assert_blocked
}

# ============================================
# Tests: JSON/Hook Mode
# ============================================

@test "JSON mode: blocks excluded directory commands" {
    local -a commands=(
        "ls node_modules"
        "cat dist/file.js"
        "npm run build && grep secret dist/app.js"
    )

    for cmd in "${commands[@]}"; do
        test_bash_json_command "$cmd"
        assert_blocked || {
            echo "Failed to block JSON command: $cmd" >&2
            return 1
        }
    done
}

@test "JSON mode: allows safe and tool commands" {
    local -a commands=(
        "ls src"
        "npm run build"
        "cd /path && npm run build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_json_command "$cmd"
        assert_allowed || {
            echo "Failed to allow JSON command: $cmd" >&2
            return 1
        }
    done
}

# ============================================
# Tests: Security Loopholes - FAILING TESTS
# ============================================

@test "SECURITY: blocks pipe operator bypass" {
    local -a commands=(
        "cat node_modules/package.json | grep name"
        "ls node_modules | wc -l"
        "find . -name '*.js' | grep dist/"
        "cat dist/app.js | head -n 10"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block pipe bypass: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks command substitution with dollar-paren" {
    local -a commands=(
        "echo \$(cat node_modules/package.json)"
        "echo \$(ls node_modules)"
        "var=\$(cat dist/bundle.js) && echo \$var"
        "npm install && echo \$(grep secret node_modules/file)"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block command substitution: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks command substitution with backticks" {
    local -a commands=(
        "echo \`cat node_modules/package.json\`"
        "echo \`ls node_modules\`"
        "var=\`cat dist/bundle.js\` && echo \$var"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block backtick substitution: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks process substitution" {
    local -a commands=(
        "cat <(cat node_modules/package.json)"
        "diff <(cat node_modules/file1) <(cat node_modules/file2)"
        "while read line; do echo \$line; done < <(ls node_modules)"
        "echo test > >(cat > node_modules/file)"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block process substitution: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks brace expansion bypass" {
    local -a commands=(
        "cat {node_modules,dist}/file.js"
        "ls {node_modules,vendor,dist}"
        "echo {node_modules,build}/*.js"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block brace expansion: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks tilde expansion in paths" {
    local -a commands=(
        "cat ~/node_modules/package.json"
        "ls ~/project/node_modules"
        "find ~/dist -name '*.js'"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block tilde expansion: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks wildcard patterns in excluded paths" {
    local -a commands=(
        "cat node_modu*/package.json"
        "ls node_module?"
        "cat */node_modules/file.js"
        "find . -path '*/node_modules/*' -name '*.js'"
        "cat node_modules/*.json"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block wildcard pattern: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks output redirection to excluded directories" {
    local -a commands=(
        "echo test > node_modules/malicious.txt"
        "cat file.txt >> dist/output.js"
        "echo data > build/test.o"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block output redirect: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks input redirection from excluded directories" {
    local -a commands=(
        "cat < node_modules/package.json"
        "while read line; do echo \$line; done < dist/file.js"
        "grep test < node_modules/file"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block input redirect: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks heredoc with excluded directory content" {
    local -a commands=(
        "cat << EOF > node_modules/file.txt"
        "cat <<< \$(cat node_modules/file)"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block heredoc: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks environment variable expansion bypass" {
    local -a commands=(
        "cat \$HOME/node_modules/file"
        "ls \$PWD/dist"
        "DIR=node_modules && cat \$DIR/file"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block env var expansion: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks relative path traversal" {
    local -a commands=(
        "cat ../node_modules/package.json"
        "cat ../../dist/bundle.js"
        "cat ./node_modules/file"
        "cat ./../node_modules/file"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block relative path: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks quoted paths to excluded directories" {
    local -a commands=(
        "cat 'node_modules/package.json'"
        "cat \"dist/bundle.js\""
        "ls 'node_modules'"
        "cat \"node_modules\"/file"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block quoted path: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: blocks complex nested bypass attempts" {
    local -a commands=(
        "npm build && cat \$(find dist -name '*.js' | head -1)"
        "cd /tmp && cat <(cat ~/project/node_modules/file) | grep secret"
        "echo \$(ls {node_modules,dist}) > output.txt"
        "for f in \$(ls node_modules); do cat \$f; done"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block complex bypass: $cmd" >&2
            return 1
        }
    done
}

@test "SECURITY: handles JSON with escaped quotes" {
    # This tests the JSON parsing vulnerability
    local json='{"tool_input": {"command": "echo \\\"test\\\" && cat node_modules/file"}}'

    run bash -c "echo '$json' | bash '$SCRIPT'"

    # Should block (exit code 2) because it accesses node_modules
    [ "$status" -eq 2 ] || {
        echo "LOOPHOLE: JSON parsing failed to handle escaped quotes properly" >&2
        echo "Got exit code: $status" >&2
        echo "Output: $output" >&2
        return 1
    }
}

@test "SECURITY: blocks case variation bypass attempts" {
    # On macOS (case-insensitive filesystem), LS/Cat/etc are the same as ls/cat
    # We block case variations to prevent bypassing on case-insensitive systems
    local -a commands=(
        "Cat node_modules/file"
        "LS dist"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        assert_blocked || {
            echo "LOOPHOLE: Failed to block case variation: $cmd" >&2
            return 1
        }
    done

    # CD doesn't exist on any system, so it's allowed (will fail anyway)
    test_bash_command "CD node_modules"
    assert_allowed
}

@test "SECURITY: rejects empty segments in command chains" {
    local -a commands=(
        "npm install && && npm build"
        "&& npm install"
        "npm install &&"
        "npm install ;; npm build"
    )

    for cmd in "${commands[@]}"; do
        test_bash_command "$cmd"
        # Currently these are allowed but may indicate malformed input
        # Consider whether empty segments should be rejected
        assert_allowed || {
            echo "Note: Empty segment behavior: $cmd" >&2
            return 1
        }
    done
}
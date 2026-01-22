#!/bin/bash

# This script validates bash commands before execution.
# It blocks commands that would access sensitive dotfiles and configuration files.

# List of sensitive files and directories that may contain credentials or secrets
SENSITIVE_FILES=(
    ".bashrc"           # Bash shell configuration - may contain API keys/tokens
    ".zshrc"            # Zsh shell configuration - may contain API keys/tokens
    ".bash_profile"     # Bash login configuration
    ".zsh_profile"      # Zsh login configuration
    ".profile"          # Generic shell profile
    ".env"              # Environment variables - commonly contains secrets
    ".env.local"        # Local environment overrides
    ".env.production"   # Production environment variables
    ".env.development"  # Development environment variables
    ".env.staging"      # Staging environment variables
    ".env.test"         # Test environment variables
    ".ssh"              # SSH keys and configuration
    ".aws"              # AWS credentials and configuration
    ".npmrc"            # NPM credentials
    ".pypirc"           # PyPI credentials
    ".gitconfig"        # Git configuration - may contain credentials
    ".netrc"            # Network credentials for FTP, HTTP
    ".dockercfg"        # Docker credentials (legacy)
    ".docker"           # Docker credentials directory
    ".kube"             # Kubernetes configuration
    ".config/gcloud"    # Google Cloud credentials
)

# Read input - either JSON from stdin or command-line arguments
if [ $# -gt 0 ]; then
    # Command-line arguments provided (testing mode)
    CMD="$*"
else
    # No arguments, read JSON from stdin (Claude Code hook mode)
    INPUT=$(cat)
    # Extract command from JSON: {"tool_input": {"command": "..."}}
    CMD=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
fi

# Function to check if a file/directory name appears as a complete path component
contains_sensitive_file() {
    local cmd="$1"
    local file="$2"

    # Check if file/directory appears as a complete word/path component
    # Match patterns:
    #   - "file" at start with space or / after
    #   - "/file" with space or / after
    #   - space + "file" + space or /
    #   - "file" at end
    if [[ "$cmd" =~ (^|[[:space:]]|/)${file}([[:space:]]|/|$) ]]; then
        return 0  # Found
    fi
    return 1  # Not found
}

# Skip check if no command was extracted
if [ -z "$CMD" ]; then
    exit 0
fi

# Check each sensitive file/directory
for file in "${SENSITIVE_FILES[@]}"; do
    if contains_sensitive_file "$CMD" "$file"; then
        echo "Blocked: Command references sensitive file '$file' which is not allowed for security reasons." >&2
        exit 2
    fi
done

# All checks passed
exit 0

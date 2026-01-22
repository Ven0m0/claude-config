#!/bin/bash

# This script validates Grep operations before execution.
# It blocks grep operations that search in sensitive dotfiles and configuration files.

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
    PATH_ARG="$1"
else
    # No arguments, read JSON from stdin (Claude Code hook mode)
    INPUT=$(cat)
    # Extract path from JSON: {"tool_input": {"path": "...", "pattern": "..."}}
    PATH_ARG=$(echo "$INPUT" | grep -o '"path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"path"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
fi

# Function to check if a file/directory name appears as a complete path component
contains_sensitive_file() {
    local text="$1"
    local file="$2"

    # Check if file/directory appears as a complete path component
    # Match patterns:
    #   - "file" at start with / after
    #   - "/file/" in the middle
    #   - "/file" at end
    #   - "file/" at start (for relative paths)
    #   - "file" alone (for searching in file)
    if [[ "$text" =~ (^|/)${file}(/|$) ]] || [[ "$text" =~ ^${file}/ ]] || [[ "$text" == "$file" ]]; then
        return 0  # Found
    fi
    return 1  # Not found
}

# If no path specified, default to current directory (allow)
if [ -z "$PATH_ARG" ]; then
    exit 0
fi

# Check path for sensitive files
for file in "${SENSITIVE_FILES[@]}"; do
    if contains_sensitive_file "$PATH_ARG" "$file"; then
        echo "Blocked: Grep path '$PATH_ARG' contains sensitive file '$file' which is not allowed for security reasons." >&2
        exit 2
    fi
done

# All checks passed
exit 0

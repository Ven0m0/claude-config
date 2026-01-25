#!/usr/bin/env bash
set -euo pipefail

# This script validates read operations before execution.
# It blocks reads from sensitive dotfiles and configuration files to protect credentials.

# List of sensitive files and directories that may contain credentials or secrets
SENSITIVE_FILES=(
  ".bashrc"          # Bash shell configuration - may contain API keys/tokens
  ".zshrc"           # Zsh shell configuration - may contain API keys/tokens
  ".bash_profile"    # Bash login configuration
  ".zsh_profile"     # Zsh login configuration
  ".profile"         # Generic shell profile
  ".env"             # Environment variables - commonly contains secrets
  ".env.local"       # Local environment overrides
  ".env.production"  # Production environment variables
  ".env.development" # Development environment variables
  ".env.staging"     # Staging environment variables
  ".env.test"        # Test environment variables
  ".ssh"             # SSH keys and configuration
  ".aws"             # AWS credentials and configuration
  ".npmrc"           # NPM credentials
  ".pypirc"          # PyPI credentials
  ".gitconfig"       # Git configuration - may contain credentials
  ".netrc"           # Network credentials for FTP, HTTP
  ".dockercfg"       # Docker credentials (legacy)
  ".docker"          # Docker credentials directory
  ".kube"            # Kubernetes configuration
  ".config/gcloud"   # Google Cloud credentials
)

# Read input - either JSON from stdin or command-line arguments
if [[ $# -gt 0 ]]; then
  # Command-line arguments provided (testing mode)
  FILE_PATH="$1"
else
  # No arguments, read JSON from stdin (Claude Code hook mode)
  INPUT=$(cat)
  # Extract file_path from JSON: {"tool_input": {"file_path": "..."}}
  if command -v jq >/dev/null 2>&1; then
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
  else
    FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"file_path"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')
  fi
fi

# Function to check if a file/directory name appears as a complete path component
contains_sensitive_file() {
  local path="$1"
  local file="$2"

  # Check if file/directory appears as a complete path component
  # Match patterns:
  #   - "file" at start with / after
  #   - "/file" in the path
  #   - "/file/" in the middle
  #   - "/file" at end
  #   - "file" as the entire path
  if [[ $path =~ (^|/)${file}(/|$) ]] || [[ $path == "$file" ]]; then
    return 0 # Found
  fi
  return 1 # Not found
}

# Skip check if no file path was extracted
if [[ -z $FILE_PATH ]]; then
  exit 0
fi

# Check each sensitive file/directory
for file in "${SENSITIVE_FILES[@]}"; do
  if contains_sensitive_file "$FILE_PATH" "$file"; then
    echo "Blocked: Access to sensitive file '$file' is not allowed for security reasons." >&2
    exit 2
  fi
done

# All checks passed
exit 0

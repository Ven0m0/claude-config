# Block Dotfiles Plugin

Blocks Claude Code access to sensitive dotfiles and configuration files that may contain credentials, API keys, and other secrets.

## Overview

The Block Dotfiles plugin automatically prevents Claude Code from reading or executing commands that access sensitive configuration files commonly containing credentials. This provides an additional security layer to protect secrets stored in dotfiles like `.env`, `.bashrc`, `.ssh/`, and credential configuration files.

## Features

- **Proactive Security Context**: SessionStart hook warns Claude about sensitive files upfront
- **Bash Command Validation**: Blocks bash commands that reference sensitive dotfiles
- **Read Validation**: Prevents file reads from sensitive configuration files
- **Glob Validation**: Blocks glob patterns that target sensitive dotfiles
- **Grep Validation**: Blocks grep searches in sensitive files
- **Comprehensive Coverage**: Protects 20+ common sensitive file types
- **Security Focused**: Prevents accidental exposure of credentials and secrets
- **Extensive Testing**: 105 tests ensuring reliable blocking behavior

## Installation

### From Marketplace

```shell
/plugin install block-dotfiles@wombat9000-marketplace
```

## Blocked Files

By default, the following sensitive files and directories are blocked:

### Shell Configuration

- `.bashrc` - Bash shell configuration (may contain API keys/tokens)
- `.zshrc` - Zsh shell configuration (may contain API keys/tokens)
- `.bash_profile` - Bash login configuration
- `.zsh_profile` - Zsh login configuration
- `.profile` - Generic shell profile

### Environment Variables

- `.env` - Environment variables (commonly contains secrets)
- `.env.local` - Local environment overrides
- `.env.production` - Production environment variables
- `.env.development` - Development environment variables
- `.env.staging` - Staging environment variables
- `.env.test` - Test environment variables

### Credentials & Keys

- `.ssh/` - SSH keys and configuration
- `.aws/` - AWS credentials and configuration
- `.npmrc` - NPM authentication tokens
- `.pypirc` - PyPI credentials
- `.gitconfig` - Git configuration (may contain credentials)
- `.netrc` - Network credentials for FTP, HTTP
- `.dockercfg` - Docker credentials (legacy format)
- `.docker/` - Docker credentials directory
- `.kube/` - Kubernetes configuration
- `.config/gcloud/` - Google Cloud credentials

## How It Works

The plugin uses a SessionStart hook for proactive security warnings and four PreToolUse validation hooks that run before tool execution:

### 0. SessionStart Hook

Provides upfront security context to Claude:

- Warns about all sensitive files blocked by the plugin at session start
- Lists categories: shell configs, environment files, credential stores
- Explicitly instructs Claude NOT to access these files
- Explains they contain credentials and secrets
- Recommends asking the user for configuration instead
- Runs once per session, before any tools are executed

### 1. Bash Hook

Validates bash command executions

### 2. Read Hook

Validates file read operations

### 3. Glob Hook

Validates file pattern matching operations

### 4. Grep Hook

Validates content search operations

When Claude attempts to access a blocked file, the validation hook will:

1. Check if the path/command/pattern contains any sensitive file
1. Block the operation and display an informative security message
1. Return exit code 2 to prevent execution

## Example Usage

### Blocked Operations

**Read operation:**

```bash
Read: .env
```

Blocked with: `Blocked: Access to sensitive file '.env' is not allowed for security reasons.`

**Bash command:**

```bash
cat .bashrc
```

Blocked with: `Blocked: Command references sensitive file '.bashrc' which is not allowed for security reasons.`

**Glob pattern:**

```bash
**/.env*
```

Blocked with: `Blocked: Glob pattern '**/.env*' targets sensitive file '.env' which is not allowed for security reasons.`

**Grep search:**

```bash
Grep: pattern="API_KEY", path=".env"
```

Blocked with: `Blocked: Grep path '.env' contains sensitive file '.env' which is not allowed for security reasons.`

### Allowed Operations

The plugin only blocks access to sensitive dotfiles. Normal project files work as expected:

```bash
# These operations are allowed
cat src/config.js
grep "import" src/
**/*.js
environment/settings.json
```

## Benefits

- **Security**: Prevents accidental exposure of credentials and secrets
- **Compliance**: Helps maintain security best practices
- **Peace of Mind**: Claude won't accidentally read sensitive configuration
- **Focused Assistance**: Keeps Claude focused on your source code, not credentials

## Customization

To add more files to the block list, edit the `SENSITIVE_FILES` array in all validation scripts:

**scripts/bash-validate.sh**, **scripts/read-validate.sh**, **scripts/glob-validate.sh**, and **scripts/grep-validate.sh**:

```bash
SENSITIVE_FILES=(
    ".bashrc"
    ".zshrc"
    ".env"
    # Add your own sensitive files here:
    # ".custom_secrets"
    # ".api_keys"
)
```

## Testing

This plugin includes a comprehensive test suite using BATS (Bash Automated Testing System).

### Prerequisites

Install BATS:

```bash
# macOS
brew install bats-core

# Ubuntu/Debian
sudo apt-get install bats

# npm
npm install -g bats
```

### Running Tests

```bash
# Run all tests
make test

# Or run individual test suites
bats tests/test-session-context.bats
bats tests/test-bash-validate.bats
bats tests/test-read-validate.bats
bats tests/test-glob-validate.bats
bats tests/test-grep-validate.bats
```

### Test Coverage

The test suite includes 105 tests organized by hook:

- **test-session-context.bats (1 test)**: SessionStart hook execution verification
- **test-bash-validate.bats (26 tests)**: Command validation with blocking/allowing scenarios
- **test-read-validate.bats (28 tests)**: File path validation in command-line and JSON modes
- **test-glob-validate.bats (26 tests)**: Pattern and path parameter validation
- **test-grep-validate.bats (24 tests)**: Search path validation and edge cases

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Important Notes

### False Positives

The plugin blocks any path component matching a sensitive filename. For example:

- `.env` is blocked
- `path/to/.env` is blocked
- But `environment.js` is allowed (different name)

### Workarounds

If you need Claude to read a specific dotfile for legitimate reasons, you can temporarily disable the plugin:

```shell
/plugin disable block-dotfiles
```

Remember to re-enable it afterward:

```shell
/plugin enable block-dotfiles
```

## Security Best Practices

This plugin is one layer of security. Always follow these practices:

1. **Never commit secrets** to version control
1. **Use environment variables** for sensitive configuration
1. **Keep `.env` in `.gitignore`**
1. **Use secret management systems** for production (Vault, AWS Secrets Manager, etc.)
1. **Rotate credentials** regularly
1. **Use different credentials** for each environment

## Version

**1.0.0**

## Category

**security**

## License

MIT

## Support

For issues or questions, please open an issue on the marketplace repository.

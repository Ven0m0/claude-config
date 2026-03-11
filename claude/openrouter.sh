#!/usr/bin/env bash
# Usage: openrouter [--dangerously-skip-permissions] ...

export OPENROUTER_API_KEY="<your-openrouter-api-key>"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export API_TIMEOUT_MS=3000000
unset CLAUDE_CODE_MAX_OUTPUT_TOKENS

exec "$@"

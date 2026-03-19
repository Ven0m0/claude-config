#!/usr/bin/env bash
# Usage: llm-provider <minimax|openrouter|zai> [claude-args...]
set -euo pipefail
provider="${1:?Usage: llm-provider <minimax|openrouter|zai> [args...]}"
shift
case "$provider" in
  minimax)
    export ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic \
      ANTHROPIC_MODEL="MiniMax-M2.5" ANTHROPIC_SMALL_FAST_MODEL="MiniMax-M2.5" \
      ANTHROPIC_DEFAULT_OPUS_MODEL="MiniMax-M2.7" ANTHROPIC_DEFAULT_SONNET_MODEL="MiniMax-M2.5" \
      ANTHROPIC_DEFAULT_HAIKU_MODEL="MiniMax-M2.5" ANTHROPIC_AUTH_TOKEN="${MINIMAX_API_KEY:?MINIMAX_API_KEY unset}";;
  openrouter)
    export ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1" ANTHROPIC_AUTH_TOKEN="${OPENROUTER_API_KEY:?OPENROUTER_API_KEY unset}";;
  zai)
    export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" ANTHROPIC_MODEL="glm-4.7" ANTHROPIC_SMALL_FAST_MODEL="glm-4.5-air" \
      ANTHROPIC_DEFAULT_OPUS_MODEL="glm-5" ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.7" ANTHROPIC_DEFAULT_HAIKU_MODEL="glm-4.5-air" \
      ANTHROPIC_AUTH_TOKEN="${ZAI_API_KEY:?ZAI_API_KEY unset}";;
  *) echo "Unknown provider: $provider. Valid: minimax, openrouter, zai" >&2; exit 1;;
esac
export ANTHROPIC_API_KEY="" CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 API_TIMEOUT_MS=3000000
unset CLAUDE_CODE_MAX_OUTPUT_TOKENS
exec "$@"

# vim: set ft=sh

#!/usr/bin/env bash
# Usage: llm-provider <minimax|openrouter|zai|glm|kimi|gemini|openai> [claude-args...]
set -euo pipefail
provider="${1:?Usage: llm-provider <minimax|openrouter|zai|glm|kimi|gemini|openai> [args...]}"
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
  glm)
    export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" \
      ANTHROPIC_AUTH_TOKEN="${GLM_API_KEY:?GLM_API_KEY unset}" \
      ANTHROPIC_DEFAULT_SONNET_MODEL="glm-4.6" ANTHROPIC_DEFAULT_OPUS_MODEL="glm-4.6" \
      CLAUDE_CONFIG_DIR="${HOME}/.glm"
    mkdir -p "${CLAUDE_CONFIG_DIR}";;
  kimi)
    export ANTHROPIC_BASE_URL="https://api.kimi.com/coding" \
      ANTHROPIC_AUTH_TOKEN="${KIMI_API_KEY:?KIMI_API_KEY unset}" \
      ANTHROPIC_DEFAULT_SONNET_MODEL="kimi-k2-thinking" ANTHROPIC_DEFAULT_OPUS_MODEL="kimi-k2-thinking" \
      CLAUDE_CONFIG_DIR="${HOME}/.kimi"
    mkdir -p "${CLAUDE_CONFIG_DIR}";;
  gemini)
    export ANTHROPIC_BASE_URL="https://generativelanguage.googleapis.com" \
      ANTHROPIC_AUTH_TOKEN="${GEMINI_API_KEY:?GEMINI_API_KEY unset}" \
      ANTHROPIC_DEFAULT_SONNET_MODEL="gemini-3-pro-preview" ANTHROPIC_DEFAULT_OPUS_MODEL="gemini-3-pro-preview" \
      CLAUDE_CONFIG_DIR="${HOME}/.gemini"
    mkdir -p "${CLAUDE_CONFIG_DIR}";;
  openai)
    export ANTHROPIC_BASE_URL="https://api.openai.com/v1" \
      ANTHROPIC_AUTH_TOKEN="${OPENAI_API_KEY:?OPENAI_API_KEY unset}" \
      CLAUDE_CONFIG_DIR="${HOME}/.openai"
    mkdir -p "${CLAUDE_CONFIG_DIR}";;
  *) echo "Unknown provider: $provider. Valid: minimax, openrouter, zai, glm, kimi, gemini, openai" >&2; exit 1;;
esac
export ANTHROPIC_API_KEY="" CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 API_TIMEOUT_MS=3000000
unset CLAUDE_CODE_MAX_OUTPUT_TOKENS
exec "$@"

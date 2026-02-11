#!/usr/bin/env bash
set -euo pipefail

export ZAGI_STRIP_COAUTHORS=1
curl -fsSL zagi.sh/install | bash
# or "mise use -g github:mattzcarey/zagi"


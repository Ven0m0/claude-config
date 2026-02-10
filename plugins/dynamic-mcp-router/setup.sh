#!/bin/bash

uv install fastmcp orjson httpx tomli ruff json-repair

# Install AI service servers
bunx --bun @modelcontextprotocol/server-exa
bunx --bun @modelcontextprotocol/server-serena
bunx --bun @modelcontextprotocol/server-sequential-thinking
bunx --bun @modelcontextprotocol/server-morph-lmm

# Install other example servers if needed
bunx --bun @modelcontextprotocol/server-filesystem /tmp
bunx --bun @modelcontextprotocol/server-github
bunx --bun @modelcontextprotocol/server-memory


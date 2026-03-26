# Security Rules

## Files and Secrets — MUST NOT READ OR WRITE

Never read, write, or pass to any tool:
- `.env`, `.env.*` (except `.env.example`)
- `secrets/`, `credentials/`
- `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.jks`
- `*-key.*`, `*_key.*`, `private-key*`, `*-secret-key.*`, `*-api-key.*`
- `.claude/settings/api_settings.json`
- `.mcp.json` (may contain tokens)
- `.ssh/`, `id_rsa`, `id_ed25519` and any private key variants

## Code Patterns — FORBIDDEN

- `eval()` in Python, JS, or shell
- `subprocess.run(..., shell=True)` — use list form instead
- String-interpolated shell commands: `os.system(f"cmd {user_input}")` — use `shlex` + list
- Hardcoded tokens, passwords, or API keys anywhere in source
- `--no-verify` on git commits (bypasses hooks)

## Hook Scripts Specifically

- Hook scripts read from stdin (JSON); never from environment variables that could leak
- Never log the full stdin payload to stderr — it may contain file contents or tokens
- Hooks must not make outbound network requests unless explicitly designed for it

## Input Validation

- Validate all external input (CLI args, stdin JSON, webhook payloads) at entry points
- Fail fast with a specific error message when validation fails — do not silently ignore

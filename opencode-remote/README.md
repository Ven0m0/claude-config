# opencode-remote

Reproducible setup for accessing [OpenCode](https://github.com/sst/opencode) remotely
via Cloudflare Tunnel. Three install modes: local systemd services (default), Docker Compose
with openchamber web UI, or Docker Compose with opencode-container HTTP API.

## Quick Start

### 1. Configure

```bash
cp .env.example .env
# Edit .env: fill in CLOUDFLARE_API_TOKEN (or CLOUDFLARE_EMAIL + key), UI_PASSWORD, TUNNEL_HOSTNAME
```

### 2a. Local install (default, no Docker)

```bash
sudo bash install-local.sh    # Installs openchamber + cloudflared as systemd services
```

### 2b. Docker install — openchamber web UI

```bash
make setup    # Provisions Cloudflare tunnel + DNS (run once)
make up       # Start openchamber + cloudflared via Docker Compose
```

### 2c. Docker install — opencode-container HTTP API

Runs [`opencode serve`](https://github.com/spiermar/opencode-container) on port 9898 instead of
the openchamber web UI. Suitable when you want direct OpenCode HTTP API access (e.g. from an
IDE extension or custom client) rather than a browser-based UI.

```bash
# Add ANTHROPIC_API_KEY (and optionally GITHUB_TOKEN) to .env
make setup           # Provisions Cloudflare tunnel + DNS (run once)
make up-opencode     # Start opencode-container + cloudflared
```

After setup, configure the Cloudflare tunnel ingress to route to `http://opencode:9898`.
Do this in Zero Trust > Tunnels > \<tunnel\> > Public Hostname, or via the Cloudflare API.

## Cloudflare Credentials

Two credential types supported:

- **API Token** (recommended, 40 chars): create at dash.cloudflare.com/profile/api-tokens
  with `Zone:DNS:Edit` + `Account:Cloudflare Tunnel:Edit`
- **Global API Key** (37 hex chars): also set `CLOUDFLARE_EMAIL=` in `.env`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Yes | API Token or Global API Key |
| `CLOUDFLARE_EMAIL` | If Global Key | Account email (Global API Key only) |
| `UI_PASSWORD` | Yes | Password for the openchamber web UI |
| `TUNNEL_HOSTNAME` | Yes | Public hostname (e.g. opencode.example.com) |
| `TUNNEL_NAME` | Yes | Unique tunnel name in your CF account |
| `INSTALL_MODE` | No | `local` (default) or `docker` |
| `OPENCHAMBER_PORT` | Local only | Port for local mode (default: 3000) |
| `ANTHROPIC_API_KEY` | opencode-container | LLM provider key for opencode-container mode |
| `GITHUB_TOKEN` | opencode-container | GitHub token for opencode-container MCP access |

## Make Targets

| Target | Description |
|--------|-------------|
| `make setup` | Provision Cloudflare tunnel and DNS |
| `make setup-local` | Full local install (tunnel + systemd services) |
| `make setup-docker` | Provision tunnel + start Docker services |
| `make start` | Start systemd services (local mode) |
| `make stop` | Stop systemd services (local mode) |
| `make up` | Start openchamber Docker services |
| `make down` | Stop openchamber Docker services |
| `make logs` | Follow openchamber Docker logs |
| `make up-opencode` | Start opencode-container Docker services |
| `make down-opencode` | Stop opencode-container Docker services |
| `make logs-opencode` | Follow opencode-container Docker logs |
| `make pull-opencode` | Pull latest opencode-container image |
| `make status` | Show service status (Docker + systemd) |
| `make restart` | Restart all services |

## Advanced: sandboxed.sh

[sandboxed.sh](https://github.com/Th0rgal/sandboxed.sh) is an alternative if you want to
orchestrate multiple concurrent agent missions with per-mission workspace isolation instead of
a single always-on OpenCode server.

Key differences from this setup:

| | opencode-remote | sandboxed.sh |
|---|---|---|
| UI | openchamber web UI or raw HTTP API | Next.js dashboard + iOS app |
| Workspaces | Single shared session | Isolated per-mission containers |
| Runtimes | OpenCode | Claude Code, OpenCode, Amp |
| Cloudflare Tunnel | Included | Add alongside its port 3000 |

To run sandboxed.sh behind a Cloudflare Tunnel, point the tunnel at `localhost:3000` (its
web UI port) using the same `setup.sh` from this repo, then start its services separately
via its own `docker-compose.yml`.

## Notes

- openchamber daemon mode is broken in bun environments; local mode uses node directly
- Cloudflare manages TLS - no self-signed cert warnings
- Secrets for local mode are stored in `/etc/openchamber/env` (chmod 600, root-owned)
- The `.env` file is protected with `chmod 600` immediately on first read
- opencode-container mode does not use `UI_PASSWORD` for HTTP API authentication at runtime; it is
  still required by `setup.sh` provisioning. Authentication to opencode itself is handled by
  Cloudflare Access or application-level API keys

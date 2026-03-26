# opencode-remote

Reproducible setup for accessing [OpenCode](https://github.com/sst/opencode) remotely
via Cloudflare Tunnel. Two install modes: local systemd services (default) or Docker Compose.

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

### 2b. Docker install

```bash
make setup    # Provisions Cloudflare tunnel + DNS (run once)
make up       # Start services via Docker Compose
```

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

## Make Targets

| Target | Description |
|--------|-------------|
| `make setup` | Provision Cloudflare tunnel and DNS |
| `make setup-local` | Full local install (tunnel + systemd services) |
| `make setup-docker` | Provision tunnel + start Docker services |
| `make start` | Start systemd services (local mode) |
| `make stop` | Stop systemd services (local mode) |
| `make up` | Start Docker services |
| `make down` | Stop Docker services |
| `make logs` | Follow Docker logs |
| `make status` | Show service status (Docker + systemd) |
| `make restart` | Restart all services |

## Notes

- openchamber daemon mode is broken in bun environments; local mode uses node directly
- Cloudflare manages TLS - no self-signed cert warnings
- Secrets for local mode are stored in `/etc/openchamber/env` (chmod 600, root-owned)
- The `.env` file is protected with `chmod 600` immediately on first read

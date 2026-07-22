# opencode-remote

Reproducible setup for accessing [OpenCode](https://github.com/sst/opencode) remotely via
Cloudflare Tunnel, using [opencode-manager](https://github.com/chriswritescode-dev/opencode-manager)
as the web UI. Docker Compose only.

## Quick Start

### 1. Configure

```bash
cp .env.example .env
# Edit .env: fill in CLOUDFLARE_API_TOKEN (or CLOUDFLARE_EMAIL + key), AUTH_SECRET,
# ADMIN_EMAIL, ADMIN_PASSWORD, TUNNEL_HOSTNAME
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 2. Provision + start

```bash
make setup    # Provisions Cloudflare tunnel + DNS (run once)
make up       # Start opencode-manager + cloudflared via Docker Compose
```

Open `https://$TUNNEL_HOSTNAME` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Because those
are pre-seeded in `.env`, self-signup is disabled - no one else can claim the admin account.

## Cloudflare Credentials

Two credential types supported:

- **API Token** (recommended, 40 chars): create at dash.cloudflare.com/profile/api-tokens
  with `Zone:DNS:Edit` + `Account:Cloudflare Tunnel:Edit`
- **Global API Key** (37 hex chars): also set `CLOUDFLARE_EMAIL=` in `.env`

## Environment Variables

| Variable               | Required     | Description                                          |
| ----------------------- | ------------ | ----------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Yes          | API Token or Global API Key                            |
| `CLOUDFLARE_EMAIL`      | If Global Key | Account email (Global API Key only)                   |
| `AUTH_SECRET`           | Yes          | Better Auth signing secret (`openssl rand -base64 32`) |
| `ADMIN_EMAIL`           | Yes          | Pre-seeded admin login, disables self-signup           |
| `ADMIN_PASSWORD`        | Yes          | Pre-seeded admin password                              |
| `ADMIN_PASSWORD_RESET`  | No           | Set `true` to force-reset admin password on next boot  |
| `TUNNEL_HOSTNAME`       | Yes          | Public hostname (e.g. opencode.example.com)            |
| `TUNNEL_NAME`           | Yes          | Unique tunnel name in your CF account                  |

## Make Targets

| Target             | Description                            |
| ------------------ | --------------------------------------- |
| `make setup`       | Provision Cloudflare tunnel and DNS      |
| `make setup-docker`| Provision tunnel + start Docker services |
| `make up`          | Start Docker services                    |
| `make down`        | Stop Docker services                     |
| `make logs`        | Follow Docker logs                       |
| `make pull`        | Pull latest images                       |
| `make status`      | Show service status                      |
| `make restart`     | Restart all services                     |

## Advanced: sandboxed.sh

[sandboxed.sh](https://github.com/Th0rgal/sandboxed.sh) is an alternative if you want to
orchestrate multiple concurrent agent missions with per-mission workspace isolation instead of
a single always-on OpenCode server.

Key differences from this setup:

|                   | opencode-remote                       | sandboxed.sh                    |
| ----------------- | -------------------------------------- | -------------------------------- |
| UI                | opencode-manager web UI                | Next.js dashboard + iOS app       |
| Workspaces        | Single shared session                  | Isolated per-mission containers   |
| Runtimes          | OpenCode                               | Claude Code, OpenCode, Amp        |
| Cloudflare Tunnel | Included                                | Add alongside its port 3000       |

To run sandboxed.sh behind a Cloudflare Tunnel, point the tunnel at `localhost:3000` (its
web UI port) using the same `setup.sh` from this repo, then start its services separately
via its own `docker-compose.yml`.

## Notes

- Cloudflare manages TLS - no self-signed cert warnings
- The `.env` file is protected with `chmod 600` immediately on first read
- opencode-manager's internal OpenCode server binds to `127.0.0.1:5551` inside the container
  and is never exposed to the host or the tunnel
- Data persists in the named Docker volumes `opencode-workspace` and `opencode-data`

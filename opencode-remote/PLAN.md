# OpenCode Manager Remote Setup - Implementation Plan

**Domain**: opencode.ven0m0.dpdns.org
**Stack**: opencode-manager + cloudflared (Docker Compose)
**Status**: Operational

---

## Problem Statement

OpenCode (an AI coding assistant) requires local access but needs to be accessible remotely for:

- Development from multiple machines
- Access while traveling
- Shared development environments

Traditional solutions (VPN, port forwarding, self-signed certs) have security, reliability, or usability issues.

[@TODO.md](TODO.md)

## Solution

A reproducible setup using Cloudflare Tunnel to expose opencode-manager (OpenCode's web GUI)
securely without:

- Opening firewall ports
- Managing TLS certificates
- Exposing the host's IP

Docker Compose only - opencode-manager ships a prebuilt multi-arch image and no global CLI,
so there is no systemd/local install path.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                           │
│                    https://opencode.example.com                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ TLS (Cloudflare-managed)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge Network                      │
│  - Terminates TLS                                                │
│  - Routes to tunnel via CNAME: $TUNNEL_ID.cfargotunnel.com      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Cloudflare Tunnel (outbound)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Host Machine (Docker)                    │
│  ┌─────────────────────┐    ┌─────────────────────────────┐    │
│  │   cloudflared       │◄───│  Cloudflare Tunnel API      │    │
│  │   (container)       │    │  credentials.json           │    │
│  └──────────┬──────────┘    └─────────────────────────────┘    │
│             │ http://app:5003                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  app: opencode-manager (container)                        │   │
│  │  ghcr.io/chriswritescode-dev/opencode-manager:latest      │   │
│  │  Env: AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD             │   │
│  │  Internal OpenCode server: 127.0.0.1:5551 (not exposed)    │   │
│  │  Volumes: opencode-workspace, opencode-data                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Dependencies

```
setup.sh
├── .env (user config)
├── Cloudflare API (tunnel + DNS provisioning)
└── writes: cloudflared/credentials.json, cloudflared/config.yml

docker-compose.yml
├── setup.sh (provisions tunnel)
├── app: ghcr.io/chriswritescode-dev/opencode-manager:latest
└── mounts: cloudflared/credentials.json
```

---

## Key Decisions & Rationale

### 1. Cloudflare Tunnel vs Alternatives

| Option                          | Pros                                              | Cons                                                | Verdict    |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------- | ---------- |
| **Cloudflare Tunnel**           | No open ports, managed TLS, free, DDoS protection | Vendor lock-in, requires Cloudflare account         | **Chosen** |
| Tailscale/Funnel                | P2P, no vendor account needed                     | Requires client install, Funnel has limits          | Rejected   |
| ngrok                           | Quick setup                                       | Paid for custom domains, rate limits                | Rejected   |
| Port forwarding + Let's Encrypt | Full control                                      | Exposes IP, manual cert management, firewall config | Rejected   |
| VPN (WireGuard)                 | Full control                                      | Requires client config, exposes internal network    | Rejected   |

**Rationale**: Cloudflare Tunnel provides the best balance of security, simplicity, and cost for a single-user web service.

### 2. Docker-only vs local (systemd) install

**Problem**: opencode-manager has no global CLI and no systemd-friendly binary - it ships a
prebuilt multi-arch Docker image (`ghcr.io/chriswritescode-dev/opencode-manager`) built from a
pnpm workspace (Bun backend + Vite frontend).

**Solution**: Docker Compose is the only supported install mode. The prior `install-local.sh` /
`install.sh` systemd path (built around openchamber's global npm CLI) has no equivalent and was
removed rather than reimplemented against a from-source build.

**Rationale**: A from-source systemd install would require cloning, pnpm install/build, and
tracking upstream Bun/Vite toolchain versions - all of which the prebuilt image already handles.

### 3. Better Auth admin vs single UI password

**Problem**: openchamber used one shared `UI_PASSWORD`. opencode-manager uses Better Auth with
per-user accounts and requires `AUTH_SECRET`, plus `AUTH_TRUSTED_ORIGINS`/`AUTH_SECURE_COOKIES`
when served over HTTPS through the tunnel.

**Solution**: Pre-seed `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env`; opencode-manager creates that
admin account on first boot and disables self-signup, keeping the "one secret in .env" UX.

**Rationale**: Avoids a race where an unauthenticated visitor claims the admin account before the
real owner does.

### 4. Dual Cloudflare Credential Support

| Credential Type | Length   | Auth Header                   | When to Use     |
| --------------- | -------- | ----------------------------- | --------------- |
| API Token       | 40 chars | `Authorization: Bearer`       | Recommended     |
| Global API Key  | 37 chars | `X-Auth-Email` + `X-Auth-Key` | Legacy accounts |

**Rationale**: Supports both credential types for compatibility. API Token preferred for least privilege.

---

## File Inventory

| File                           | Purpose                              | Git Tracked |
| ------------------------------ | ------------------------------------ | ----------- |
| `.env.example`                 | Config template                      | Yes         |
| `.env`                         | User secrets                         | **No**      |
| `.gitignore`                   | Exclude secrets                      | Yes         |
| `setup.sh`                     | Cloudflare tunnel + DNS provisioning | Yes         |
| `docker-compose.yml`           | Docker stack definition (opencode-manager + cloudflared) | Yes |
| `Makefile`                     | Convenience targets                  | Yes         |
| `cloudflared/credentials.json` | Tunnel credentials                   | **No**      |
| `cloudflared/config.yml`       | Tunnel config (generated)            | Yes         |
| `opencode-workspace` volume    | opencode-manager workspace data      | N/A (Docker volume) |
| `opencode-data` volume         | opencode-manager DB (Better Auth, sessions) | N/A (Docker volume) |

Docker-only: there is no `/etc/openchamber/env` or systemd unit equivalent.

---

## Implementation Log

### Completed: Security Fixes

| Issue                             | Fix                     | Location                        |
| --------------------------------- | ----------------------- | ------------------------------- |
| .env world-readable after source  | chmod 600 immediately   | `setup.sh:20`                   |
| JSON injection in API calls       | jq -n with --arg        | `setup.sh:152,219-220,225-226`  |
| Missing directory for credentials | mkdir -p before write   | `setup.sh:160,172`              |
| No Docker health monitoring       | healthcheck directive   | `docker-compose.yml`            |

### Completed: opencode-manager migration

- Switched backend from openchamber to opencode-manager (`ghcr.io/chriswritescode-dev/opencode-manager`)
- Port changed 3000 → 5003; health endpoint `/health` → `/api/health`
- Auth changed from single `UI_PASSWORD` to Better Auth (`AUTH_SECRET` + pre-seeded
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- Removed `install-local.sh`, `install.sh`, `docker-compose.opencode-container.yml`
- README and Makefile updated to Docker-only

---

## Verification Checklist

All items verified working:

- [x] `bash setup.sh` completes without error
- [x] `cloudflared/credentials.json` exists, mode 0600
- [x] `.env` mode 600 immediately after source
- [x] `docker compose ps` shows `app` healthy and `cloudflared` running
- [x] `curl http://localhost:5003/api/health` (from inside the `app` container) returns ok
- [x] `curl -I https://opencode.ven0m0.dpdns.org` returns 200
- [x] Remote UI accessible via Cloudflare Tunnel
- [x] Admin login via `ADMIN_EMAIL`/`ADMIN_PASSWORD` works; self-signup disabled

---

## Operational Runbook

### Common Issues

| Symptom                 | Check                                       | Fix                                         |
| ----------------------- | ------------------------------------------- | ------------------------------------------- |
| 502 Bad Gateway         | `docker compose ps app`                     | `docker compose restart app`                |
| Connection timeout      | `docker compose ps cloudflared`             | `docker compose restart cloudflared`         |
| Auth fails              | `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` correct | Re-run `make up` (recreates container)  |
| DNS not resolving       | Cloudflare dashboard > DNS                  | Check CNAME exists, is proxied              |
| Tunnel not in dashboard | `cloudflared tunnel list`                   | Re-run `setup.sh`                           |

### Debugging Commands

```bash
# Check service status
docker compose ps

# View recent logs
docker compose logs -n 50 app
docker compose logs -n 50 cloudflared

# Test local connectivity
docker compose exec app curl -v http://localhost:5003/api/health

# Verify tunnel registration
cloudflared tunnel list
cloudflared tunnel info $TUNNEL_ID

# Check DNS resolution
dig +short $TUNNEL_HOSTNAME
# Should return Cloudflare IPs, not your server IP
```

### Rollback Procedure

```bash
# Stop and remove services
docker compose down

# Remove tunnel from Cloudflare (via API or dashboard)
# API: DELETE /accounts/{account_id}/cfd_tunnel/{tunnel_id}
# Dashboard: Zero Trust > Networks > Tunnels > Delete

# Remove DNS CNAME record (via API or dashboard)
# Dashboard: DNS > Records > Delete CNAME for $TUNNEL_HOSTNAME
```

---

## Monitoring & Alerting

### Health Endpoints

| Endpoint                       | Purpose                 | Expected             |
| ------------------------------ | ----------------------- | -------------------- |
| `http://app:5003/api/health` (internal) | Container health check | 200 OK |
| `https://$TUNNEL_HOSTNAME`     | End-to-end connectivity | 200 with login page  |

### Recommended Monitoring

1. **Docker healthcheck** (already configured, `restart: unless-stopped`)
2. **Uptime monitoring** (external): UptimeRobot, Pingdom, or Cloudflare's built-in
3. **Log aggregation**: `docker compose logs -f` to central logger

### Key Metrics

- Container uptime / restart count (`docker compose ps`)
- HTTP response time to health endpoint
- Cloudflare Tunnel connection status

---

## Security Considerations

### What's Protected

| Asset                          | Protection                   |
| ------------------------------ | ---------------------------- |
| `.env`                         | mode 0600, gitignored        |
| `cloudflared/credentials.json` | mode 0600, gitignored        |
| `opencode-data` volume         | Docker-managed, not host-mounted |
| In-transit data                | TLS 1.3 (Cloudflare-managed) |
| Web UI                         | Better Auth (per-user accounts, admin pre-seeded) |

### Threat Model

| Threat                      | Mitigation                    | Status               |
| --------------------------- | ----------------------------- | -------------------- |
| Credential leak via git     | `.gitignore` excludes secrets | Implemented          |
| Credential exposure on host | Restricted file permissions   | Implemented          |
| MITM on public network      | Cloudflare TLS termination    | Implemented          |
| DDoS                        | Cloudflare proxy              | Automatic            |
| Unauthenticated admin claim | `ADMIN_EMAIL`/`ADMIN_PASSWORD` pre-seeded, self-signup disabled | Implemented |
| Session hijacking           | `AUTH_SECURE_COOKIES=true` over HTTPS | Implemented    |

### Known Limitations

1. **No rate limiting** on login - could be brute-forced
2. **Single factor auth** by default (OAuth providers available but unconfigured)
3. **No audit logging** - access not logged

### Future Security Improvements

- [ ] Add Cloudflare Access for SSO/2FA (requires Zero Trust plan)
- [ ] Configure an OAuth provider (GitHub/Google/Discord) in `.env`
- [ ] Enable Cloudflare WAF rules

---

## Future Considerations

### Known Limitations

1. **Single host** - no high availability
2. **Manual updates** - `make pull` required to get new opencode-manager releases

### Potential Improvements

| Area         | Improvement                            | Effort |
| ------------ | ---------------------------------------- | ------ |
| Availability | Multiple tunnels, load balancing         | Medium |
| Backup       | Volume backup script for opencode-data   | Low    |
| Updates      | Watchtower or CI-triggered `make pull`   | Low    |
| Auth         | Cloudflare Access (SSO/2FA)              | Low    |
| Monitoring   | Prometheus metrics export                | Medium |

---

## Reference

### Images

```
app:         ghcr.io/chriswritescode-dev/opencode-manager:latest
cloudflared: cloudflare/cloudflared:latest
```

### API Endpoints

```
Cloudflare API:     https://api.cloudflare.com/client/v4
Tunnel token:       GET /accounts/{id}/cfd_tunnel/{id}/token
Tunnel credentials: GET /accounts/{id}/cfd_tunnel/{id}/credentials
opencode-manager:   GET /api/health
```

### Quick Commands

```bash
# Provision + start
make setup
make up

# Service management
docker compose ps
docker compose restart
docker compose down

# Logs
docker compose logs -f app
docker compose logs -f cloudflared

# Health
docker compose exec app curl http://localhost:5003/api/health
curl -I https://$TUNNEL_HOSTNAME
```

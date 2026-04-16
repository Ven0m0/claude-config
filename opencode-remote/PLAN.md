# OpenChamber Remote Setup - Implementation Plan

**Domain**: opencode.ven0m0.dpdns.org
**Stack**: openchamber + cloudflared (local systemd or Docker Compose)
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

A reproducible setup using Cloudflare Tunnel to expose openchamber (OpenCode's web GUI) securely without:

- Opening firewall ports
- Managing TLS certificates
- Exposing the host's IP

Supports two install modes:

- **Local mode** (default): systemd services, no Docker
- **Docker mode**: Docker Compose stack

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
│                         Host Machine                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐    │
│  │   cloudflared       │◄───│  Cloudflare Tunnel API      │    │
│  │   (systemd)         │    │  credentials.json           │    │
│  └──────────┬──────────┘    └─────────────────────────────┘    │
│             │ http://localhost:3000                              │
│             ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  openchamber (systemd)                                   │   │
│  │  node .../server/index.js --port 3000                   │   │
│  │  Env: OPENCHAMBER_UI_PASSWORD (from /etc/openchamber/env)│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Dependencies

```
setup.sh
├── .env (user config)
├── Cloudflare API (tunnel + DNS provisioning)
└── writes: cloudflared/credentials.json, cloudflared/config.yml

install-local.sh
├── setup.sh (provisions tunnel)
├── bun/npm (package managers)
├── installs: openchamber, cloudflared
└── creates: /etc/systemd/system/openchamber.service
             /etc/systemd/system/cloudflared-openchamber.service
             /etc/openchamber/env (secrets)

docker-compose.yml
├── setup.sh (provisions tunnel)
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

### 2. Local (systemd) vs Docker

| Mode      | Pros                                              | Cons                                | When to Use                     |
| --------- | ------------------------------------------------- | ----------------------------------- | ------------------------------- |
| **Local** | Lower overhead, native logging, simpler debugging | Host package dependency             | Default, production servers     |
| Docker    | Isolation, reproducible environment               | Extra layer, Docker daemon required | Development, multi-tenant hosts |

**Rationale**: Local mode is default because this is a single-user service on a dedicated host. Docker adds unnecessary complexity.

### 3. Direct node Execution vs openchamber CLI

**Problem**: `openchamber serve` uses bun's IPC which fails in systemd (daemon mode broken).

**Solution**: Bypass the CLI wrapper and execute the server script directly:

```bash
node /usr/lib/node_modules/@openchamber/web/server/index.js --port 3000
```

**Rationale**: The CLI adds no value for systemd-managed services. Direct execution is simpler and works reliably.

### 4. Secrets in EnvironmentFile vs Inline

**Problem**: systemd unit files are world-readable (`/etc/systemd/system/*.service`).

**Solution**: Store secrets in `/etc/openchamber/env` (mode 0600, root-owned), reference via `EnvironmentFile=`.

**Rationale**: Prevents accidental credential exposure via `systemctl cat` or file listing.

### 5. Dual Cloudflare Credential Support

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
| `install-local.sh`             | Local systemd installation           | Yes         |
| `docker-compose.yml`           | Docker stack definition              | Yes         |
| `Makefile`                     | Convenience targets                  | Yes         |
| `cloudflared/credentials.json` | Tunnel credentials                   | **No**      |
| `cloudflared/config.yml`       | Tunnel config (generated)            | Yes         |
| `/etc/openchamber/env`         | Runtime secrets (local mode)         | **No**      |

---

## Implementation Log

### Completed: Security Fixes

| Issue                             | Fix                     | Location                        |
| --------------------------------- | ----------------------- | ------------------------------- |
| Secrets in systemd unit files     | EnvironmentFile pattern | `install-local.sh:153-161`      |
| .env world-readable after source  | chmod 600 immediately   | `setup.sh:20`                   |
| JSON injection in API calls       | jq -n with --arg        | `setup.sh:152,219-220,225-226`  |
| Missing directory for credentials | mkdir -p before write   | `setup.sh:160,172`              |
| No Docker health monitoring       | healthcheck directive   | `docker-compose.yml:7-12,25-27` |

### Completed: Install Mode

- Default changed from Docker to local
- `.env.example` defaults: `INSTALL_MODE=local`
- README and Makefile updated

---

## Verification Checklist

All items verified working:

- [x] `bash setup.sh` completes without error
- [x] `cloudflared/credentials.json` exists, mode 0600
- [x] `.env` mode 600 immediately after source
- [x] `/etc/openchamber/env` exists, mode 600, root-owned
- [x] `systemctl status openchamber` shows active (running)
- [x] `systemctl status cloudflared-openchamber` shows active (running)
- [x] `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [x] `curl -I https://opencode.ven0m0.dpdns.org` returns 200
- [x] Remote UI accessible via Cloudflare Tunnel
- [x] UI_PASSWORD authentication works

---

## Operational Runbook

### Common Issues

| Symptom                 | Check                                       | Fix                                         |
| ----------------------- | ------------------------------------------- | ------------------------------------------- |
| 502 Bad Gateway         | `systemctl status openchamber`              | `systemctl restart openchamber`             |
| Connection timeout      | `systemctl status cloudflared-openchamber`  | `systemctl restart cloudflared-openchamber` |
| Auth fails              | `/etc/openchamber/env` has correct password | Re-run `install-local.sh`                   |
| DNS not resolving       | Cloudflare dashboard > DNS                  | Check CNAME exists, is proxied              |
| Tunnel not in dashboard | `cloudflared tunnel list`                   | Re-run `setup.sh`                           |

### Debugging Commands

```bash
# Check service status
systemctl status openchamber cloudflared-openchamber

# View recent logs
journalctl -u openchamber -n 50 --no-pager
journalctl -u cloudflared-openchamber -n 50 --no-pager

# Test local connectivity
curl -v http://localhost:3000/health

# Verify tunnel registration
cloudflared tunnel list
cloudflared tunnel info $TUNNEL_ID

# Check DNS resolution
dig +short $TUNNEL_HOSTNAME
# Should return Cloudflare IPs, not your server IP
```

### Rollback Procedure

```bash
# Stop services
sudo systemctl stop cloudflared-openchamber openchamber

# Disable at boot
sudo systemctl disable cloudflared-openchamber openchamber

# Remove service files (optional)
sudo rm /etc/systemd/system/openchamber.service
sudo rm /etc/systemd/system/cloudflared-openchamber.service
sudo systemctl daemon-reload

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
| `http://localhost:3000/health` | Local service health    | `{"status":"ok"}`    |
| `https://$TUNNEL_HOSTNAME`     | End-to-end connectivity | 200 with auth prompt |

### Recommended Monitoring

1. **systemd watchdog** (already configured via `Restart=on-failure`)
2. **Uptime monitoring** (external): UptimeRobot, Pingdom, or Cloudflare's built-in
3. **Log aggregation**: `journalctl -u openchamber -u cloudflared-openchamber` to central logger

### Key Metrics

- Service uptime (systemd)
- HTTP response time to health endpoint
- Cloudflare Tunnel connection status

---

## Security Considerations

### What's Protected

| Asset                          | Protection                   |
| ------------------------------ | ---------------------------- |
| `.env`                         | mode 0600, gitignored        |
| `cloudflared/credentials.json` | mode 0600, gitignored        |
| `/etc/openchamber/env`         | mode 0600, root-owned        |
| In-transit data                | TLS 1.3 (Cloudflare-managed) |
| Web UI                         | Password authentication      |

### Threat Model

| Threat                      | Mitigation                    | Status               |
| --------------------------- | ----------------------------- | -------------------- |
| Credential leak via git     | `.gitignore` excludes secrets | Implemented          |
| Credential exposure on host | Restricted file permissions   | Implemented          |
| MITM on public network      | Cloudflare TLS termination    | Implemented          |
| DDoS                        | Cloudflare proxy              | Automatic            |
| Brute force UI password     | No rate limiting              | **Known limitation** |
| Session hijacking           | No HTTPS-only cookies         | **Known limitation** |

### Known Limitations

1. **No rate limiting** on UI password - could be brute-forced
2. **No session management** - long-lived sessions
3. **Single factor auth** - password only, no 2FA
4. **No audit logging** - access not logged

### Future Security Improvements

- [ ] Add Cloudflare Access for SSO/2FA (requires Zero Trust plan)
- [ ] Implement session timeout
- [ ] Add fail2ban for repeated auth failures
- [ ] Enable Cloudflare WAF rules

---

## Future Considerations

### Known Limitations

1. **Single host** - no high availability
2. **No persistence** - openchamber data not backed up
3. **Manual updates** - packages must be updated manually

### Potential Improvements

| Area         | Improvement                          | Effort |
| ------------ | ------------------------------------ | ------ |
| Availability | Multiple tunnels, load balancing     | Medium |
| Backup       | Persistent volume, backup script     | Low    |
| Updates      | Auto-update cloudflared, openchamber | Low    |
| Auth         | Cloudflare Access (SSO/2FA)          | Low    |
| Monitoring   | Prometheus metrics export            | Medium |

---

## Reference

### Binary Paths

```
openchamber server: /usr/lib/node_modules/@openchamber/web/server/index.js
cloudflared:        /usr/bin/cloudflared (v2026.3.0)
bun:                /usr/bin/bun
node:               $(command -v node)
```

### API Endpoints

```
Cloudflare API:     https://api.cloudflare.com/client/v4
Tunnel token:       GET /accounts/{id}/cfd_tunnel/{id}/token
Tunnel credentials: GET /accounts/{id}/cfd_tunnel/{id}/credentials
```

### Quick Commands

```bash
# Local install (default)
sudo bash install-local.sh

# Service management
systemctl start openchamber cloudflared-openchamber
systemctl stop openchamber cloudflared-openchamber
systemctl status openchamber
systemctl status cloudflared-openchamber

# Logs
journalctl -u openchamber -f
journalctl -u cloudflared-openchamber -f

# Health
curl http://localhost:3000/health
curl -I https://$TUNNEL_HOSTNAME
```

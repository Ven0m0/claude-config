---
name: tailnet-publish
description: Publish information to a Tailscale tailnet for remote access. Use when sharing logs, outputs, or status with team members on the same tailnet.
---

# Tailnet Publish

Share outputs, logs, or status updates via Tailscale network.

## Prerequisites

- Tailscale installed and authenticated
- Access to target tailnet
- `tailscale` command available

## Usage

### Publish File
```bash
tailscale serve --bg <file>
# Or use tailscale file sharing
tailscale cp <filepath> <user>@<host>:
```

### Share Log Output
```bash
# Pipe output to Tailscale serve
some-command | tailscale serve /local -
```

### Check Status
```bash
tailscale status
tailscale serve status
```

## Configuration

Set up Tailscale auth key for programmatic access:
```bash
export TS_AUTHKEY="tskey-auth-..."
```

## Common Patterns

### Share Build Output
```bash
make build 2>&1 | tee build.log
tailscale serve --bg build.log
# Returns HTTPS URL for team
```

### Share Directory (HTTP)
```bash
cd /path/to/directory
tailscale serve /dir --
```

### Real-time Log Streaming
```bash
tailscale serve /logs kubectl logs -f <pod> -
```

## Safety Notes

- Only share with authenticated tailnet members
- Avoid sharing sensitive credentials or tokens
- Use `--bg` flag to run serve in background
- Consider using `--https=false` for internal-only access

## Limitations

- Requires Tailscale to be running
- File size limits apply for `tailscale cp`
- Serve requires `tailscale serve` to be configured

## Notes/Inspiration

Inspired by [`@kitlangton/tailcode`](https://www.npmjs.com/package/@kitlangton/tailcode) - Publishes OpenCode to Tailscale tailnet.

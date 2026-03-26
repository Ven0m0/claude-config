.PHONY: help setup setup-local setup-docker up down logs restart status pull \
        start stop enable disable \
        up-opencode down-opencode logs-opencode pull-opencode

help:
	@echo "Usage:"
	@echo ""
	@echo "  Local install (default, no Docker):"
	@echo "    sudo make setup-local  - Install + provision + enable systemd services"
	@echo "    make start          - Start systemd services"
	@echo "    make stop           - Stop systemd services"
	@echo "    make enable         - Enable services at boot"
	@echo "    make disable        - Disable services at boot"
	@echo ""
	@echo "  Docker install (openchamber web UI):"
	@echo "    make setup          - Provision Cloudflare tunnel + DNS"
	@echo "    make setup-docker   - Provision tunnel + start Docker services"
	@echo "    make up             - Start Docker services"
	@echo "    make down           - Stop Docker services"
	@echo "    make logs           - Follow Docker logs"
	@echo "    make pull           - Pull latest images"
	@echo ""
	@echo "  Docker install (opencode-container HTTP API on port 9898):"
	@echo "    make setup          - Provision Cloudflare tunnel + DNS (run once)"
	@echo "    make up-opencode    - Start opencode-container + cloudflared"
	@echo "    make down-opencode  - Stop opencode-container services"
	@echo "    make logs-opencode  - Follow opencode-container logs"
	@echo "    make pull-opencode  - Pull latest opencode-container image"
	@echo ""
	@echo "  Shared:"
	@echo "    make status         - Show service status (all modes)"
	@echo "    make restart        - Restart all services (auto-detects mode)"

# ── Cloudflare provisioning ───────────────────────────────────────────────────

setup:
	@bash setup.sh

setup-local:
	@bash install-local.sh

setup-docker: setup
	docker compose up -d

# ── Docker targets ────────────────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

pull:
	docker compose pull

# ── opencode-container targets ────────────────────────────────────────────────

up-opencode:
	docker compose -f docker-compose.opencode-container.yml up -d

down-opencode:
	docker compose -f docker-compose.opencode-container.yml down

logs-opencode:
	docker compose -f docker-compose.opencode-container.yml logs -f

pull-opencode:
	docker compose -f docker-compose.opencode-container.yml pull

status:
	@docker compose ps 2>/dev/null || echo "(Docker services not running)"
	@echo ""
	@echo "Systemd services:"
	@systemctl is-active openchamber 2>/dev/null && echo "  openchamber: active" || echo "  openchamber: inactive"
	@systemctl is-active cloudflared-openchamber 2>/dev/null && echo "  cloudflared-openchamber: active" || echo "  cloudflared-openchamber: inactive"

restart:
	@if docker compose ps -q 2>/dev/null | grep -q .; then \
	  docker compose restart; \
	else \
	  systemctl restart openchamber cloudflared-openchamber 2>/dev/null || echo "No services running"; \
	fi

# ── Local / systemd targets ───────────────────────────────────────────────────

start:
	systemctl start openchamber cloudflared-openchamber

stop:
	systemctl stop openchamber cloudflared-openchamber

enable:
	systemctl enable openchamber cloudflared-openchamber

disable:
	systemctl disable openchamber cloudflared-openchamber

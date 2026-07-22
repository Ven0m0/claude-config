.PHONY: help setup setup-docker up down logs pull restart status

help:
	@echo "Usage:"
	@echo ""
	@echo "  make setup          - Provision Cloudflare tunnel + DNS (run once)"
	@echo "  make setup-docker   - Provision tunnel + start Docker services"
	@echo "  make up             - Start Docker services"
	@echo "  make down           - Stop Docker services"
	@echo "  make logs           - Follow Docker logs"
	@echo "  make pull           - Pull latest images"
	@echo "  make status         - Show service status"
	@echo "  make restart        - Restart all services"

# ── Cloudflare provisioning ───────────────────────────────────────────────────

setup:
	@bash setup.sh

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

status:
	@docker compose ps

restart:
	docker compose restart

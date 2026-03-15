# ── UAE Jobs Portal — Local Development ──────────────────────────────────────
#
# QUICK START (choose one):
#
#   Option A – Full Docker preview (easiest):
#     make preview
#     → Frontend: http://localhost:3001
#     → API:      http://localhost:4001
#     → API Docs: http://localhost:4001/api/docs
#
#   Option B – npm dev with Docker DB (hot-reload):
#     make dev-db      ← start postgres + redis only
#     make migrate     ← apply DB migrations once
#     make seed        ← seed admin account once
#     make dev         ← start API + frontend with hot-reload
#     → Frontend: http://localhost:5173
#     → API:      http://localhost:4000

.PHONY: help preview preview-build preview-down dev dev-db migrate seed \
        logs logs-api logs-web install clean

# ── Docker Preview ────────────────────────────────────────────────────────────

preview: ## Build and start the full Docker stack
	docker compose up --build

preview-d: ## Build and start the full Docker stack (detached)
	docker compose up --build -d
	@echo ""
	@echo "  Frontend : http://localhost:3001"
	@echo "  API      : http://localhost:4001"
	@echo "  API Docs : http://localhost:4001/api/docs"
	@echo "  Health   : http://localhost:4001/health"
	@echo ""
	@echo "  Logs: make logs"
	@echo ""

preview-build: ## Rebuild Docker images without cache
	docker compose build --no-cache

preview-down: ## Stop and remove Docker containers
	docker compose down

preview-down-v: ## Stop containers AND delete volumes (wipes DB!)
	docker compose down -v

# ── npm Dev (hot-reload) ──────────────────────────────────────────────────────

dev-db: ## Start only postgres + redis in Docker (for npm dev)
	docker compose up -d postgres redis
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@echo "  PostgreSQL : localhost:5433"
	@echo "  Redis      : localhost:6380"

dev: ## Start API + frontend in dev mode (requires dev-db first)
	npm run dev

dev-api: ## Start only the backend in dev mode
	npm run dev:api

dev-web: ## Start only the frontend in dev mode
	npm run dev:web

# ── Database ──────────────────────────────────────────────────────────────────

migrate: ## Apply pending Prisma migrations to local Docker postgres
	cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/uaejobs npx prisma migrate deploy

migrate-dev: ## Create a new migration (dev only)
	cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/uaejobs npx prisma migrate dev

seed: ## Seed admin account into local Docker postgres
	cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/uaejobs npx tsx prisma/seed.ts

studio: ## Open Prisma Studio (DB GUI) against local Docker postgres
	cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/uaejobs npx prisma studio

# ── Utilities ─────────────────────────────────────────────────────────────────

install: ## Install all npm dependencies
	npm install

logs: ## Tail all Docker container logs
	docker compose logs -f

logs-api: ## Tail API container logs
	docker compose logs -f api

logs-web: ## Tail web container logs
	docker compose logs -f web

clean: ## Remove node_modules and build artifacts
	rm -rf node_modules backend/node_modules frontend/node_modules shared/node_modules
	rm -rf backend/dist frontend/dist shared/dist

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

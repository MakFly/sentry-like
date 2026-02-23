# ErrorWatch Development Makefile
# ================================

.PHONY: help
.PHONY: dev dev-tmux
.PHONY: start-api start-dashboard
.PHONY: stop
.PHONY: restart status
.PHONY: install build clean
.PHONY: infra-check infra-up infra-down
.PHONY: db-push db-migrate db-reset db-create
.PHONY: redis-flush
# Production
.PHONY: prod-up prod-down prod-build prod-logs prod-status prod-restart
.PHONY: prod-db-migrate prod-db-backup prod-db-restore
# Oneshot Production (VPS - direct install)
.PHONY: oneshot-install oneshot-build oneshot-setup oneshot-start oneshot-stop oneshot-restart oneshot-status oneshot-logs oneshot-logs-api oneshot-logs-dashboard oneshot-mon
.PHONY: oneshot-db-create oneshot-db-push oneshot-db-migrate oneshot-db-reset
.PHONY: oneshot-redis-cli oneshot-db-shell

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
RESET  := \033[0m

# Directory paths
ROOT_DIR := $(shell pwd)
LOG_DIR := $(ROOT_DIR)/logs

# Infra Docker credentials
POSTGRES_HOST := postgres
POSTGRES_USER := errorwatch
POSTGRES_PASS := errorwatch
POSTGRES_DB := errorwatch

help: ## Show this help
	@echo "$(CYAN)ErrorWatch Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-24s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: ## Show dev instructions + check infra
	@echo "$(CYAN)Starting ErrorWatch dev environment...$(RESET)"
	@echo ""
	@$(MAKE) infra-check
	@echo ""
	@echo "$(GREEN)Run these commands in separate terminals:$(RESET)"
	@echo ""
	@echo "  Terminal 1: $(YELLOW)make start-api$(RESET)        (API + workers)"
	@echo "  Terminal 2: $(YELLOW)make start-dashboard$(RESET)"
	@echo ""

dev-tmux: ## Start all with tmux (runs everything automatically)
	@$(MAKE) infra-check
	@tmux new-session -s errorwatch -d -c $(ROOT_DIR) "make start-api" 2>/dev/null || echo "tmux not available"
	@tmux split-window -h -t errorwatch "make start-dashboard" 2>/dev/null || true
	@echo "$(GREEN)All services started in tmux session 'errorwatch'$(RESET)"
	@echo "Attach with: $(YELLOW)tmux attach -t errorwatch$(RESET)"

start-api: ## Start monitoring server (port 3333)
	@echo "$(GREEN)Starting API server on port 3333...$(RESET)"
	@cd apps/monitoring-server && bun run dev:standalone

start-dashboard: ## Start dashboard (port 4001)
	@echo "$(GREEN)Starting dashboard on port 4001...$(RESET)"
	@cd apps/dashboard && bun run dev:standalone

stop: ## Stop all apps (kill processes)
	@echo "$(YELLOW)Stopping all ErrorWatch services...$(RESET)"
	-@pkill -9 -f "tsx watch.*monitoring-server" 2>/dev/null || true
	-@pkill -9 -f "next dev" 2>/dev/null || true
	-@pkill -f "tsx" 2>/dev/null || true
	-@pkill -f "next" 2>/dev/null || true
	@echo "$(GREEN)All services stopped.$(RESET)"

restart: stop dev ## Restart

status: ## Check all services status
	@echo "$(CYAN)=== ErrorWatch Services Status ===$(RESET)"
	@echo ""
	@echo "$(CYAN)Dashboard (4001):$(RESET)"
	@curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:4001 || echo "  $(RED)Not running$(RESET)"
	@echo ""
	@echo "$(CYAN)Monitoring Server (3333):$(RESET)"
	@curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:3333/health || echo "  $(RED)Not running$(RESET)"
	@echo ""
	@echo "$(CYAN)Workers (embedded in API):$(RESET)"
	@if pgrep -f "tsx watch.*monitoring-server" > /dev/null; then echo "  $(GREEN)Running$(RESET)"; else echo "  $(RED)Not running$(RESET)"; fi

# =============================================================================
# INFRASTRUCTURE (uses existing dev-infra Docker services)
# =============================================================================

infra-check: ## Check if infra services are running
	@echo "$(CYAN)Checking infrastructure services...$(RESET)"
	@echo ""
	@echo "  $(CYAN)PostgreSQL (5432):$(RESET)"
	@docker exec $(POSTGRES_HOST) pg_isready -U $(POSTGRES_USER) > /dev/null 2>&1 && echo "    $(GREEN)Running$(RESET)" || echo "    $(RED)Not running - start with: docker start $(POSTGRES_HOST)$(RESET)"
	@echo ""
	@echo "  $(CYAN)Redis (6379):$(RESET)"
	@docker exec infra-redis redis-cli ping > /dev/null 2>&1 && echo "    $(GREEN)Running$(RESET)" || echo "    $(RED)Not running - start with: docker start infra-redis$(RESET)"

infra-up: ## Start infra containers if stopped
	@echo "$(GREEN)Starting infrastructure containers...$(RESET)"
	@docker start $(POSTGRES_HOST) 2>/dev/null || echo "  $(YELLOW)infra-postgres not found$(RESET)"
	@docker start infra-redis 2>/dev/null || echo "  $(YELLOW)infra-redis not found$(RESET)"
	@sleep 2
	@$(MAKE) infra-check

infra-down: ## Stop infra containers
	@echo "$(YELLOW)Stopping infrastructure containers...$(RESET)"
	@docker stop $(POSTGRES_HOST) 2>/dev/null || true
	@docker stop infra-redis 2>/dev/null || true
	@echo "$(GREEN)Done.$(RESET)"

# =============================================================================
# SETUP & BUILD
# =============================================================================

install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@bun install
	@cd packages/sdk-symfony && composer install --no-interaction || true
	@echo "$(GREEN)Done.$(RESET)"

build: ## Build for production
	@echo "$(GREEN)Building...$(RESET)"
	@bun run build

clean: ## Clean build artifacts and logs
	@echo "$(YELLOW)Cleaning...$(RESET)"
	@rm -rf apps/dashboard/.next
	@rm -rf apps/monitoring-server/dist
	@rm -rf $(LOG_DIR)
	@rm -rf node_modules/.cache
	@echo "$(GREEN)Done.$(RESET)"

# =============================================================================
# DATABASE
# =============================================================================

db-create: ## Create errorwatch database if not exists
	@echo "$(GREEN)Creating database $(POSTGRES_DB)...$(RESET)"
	@docker exec $(POSTGRES_HOST) psql -U $(POSTGRES_USER) -d devhub -c "SELECT 1 FROM pg_database WHERE datname = '$(POSTGRES_DB)'" | grep -q 1 || \
		docker exec $(POSTGRES_HOST) psql -U $(POSTGRES_USER) -d devhub -c "CREATE DATABASE $(POSTGRES_DB);"
	@echo "$(GREEN)Done.$(RESET)"

db-push: ## Push database schema
	@echo "$(GREEN)Pushing database schema...$(RESET)"
	@bun run db:push

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(RESET)"
	@cd apps/monitoring-server && bun run db:migrate

db-reset: ## Reset database (drop and recreate schema)
	@echo "$(YELLOW)Resetting PostgreSQL database...$(RESET)"
	@docker exec $(POSTGRES_HOST) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || \
		(echo "$(YELLOW)Could not connect, checking infra...$(RESET)" && $(MAKE) infra-up && sleep 2 && docker exec $(POSTGRES_HOST) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
	@echo "$(GREEN)Schema dropped. Pushing fresh schema...$(RESET)"
	@bun run db:push
	@echo "$(GREEN)Database reset complete!$(RESET)"

# =============================================================================
# REDIS
# =============================================================================

redis-flush: ## Flush Redis cache
	@echo "$(YELLOW)Flushing Redis...$(RESET)"
	@docker exec infra-redis redis-cli FLUSHALL
	@echo "$(GREEN)Done.$(RESET)"

redis-cli: ## Open Redis CLI
	@docker exec -it infra-redis redis-cli

# =============================================================================
# TESTING
# =============================================================================

test-api: ## Test API endpoints
	@echo "$(CYAN)Testing API...$(RESET)"
	@echo ""
	@echo "Health check:"
	@curl -s http://localhost:3333/health | jq . || echo "API not running"
	@echo ""
	@echo "Auth session:"
	@curl -s http://localhost:3333/api/auth/get-session | jq . || echo "API not running"

# =============================================================================
# PRODUCTION (docker-compose.prod.yml)
# =============================================================================

# Production compose file
COMPOSE_PROD := docker-compose.prod.yml

prod-build: ## Build production Docker images
	@echo "$(GREEN)Building production images...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) build --no-cache
	@echo "$(GREEN)Build complete.$(RESET)"

prod-up: ## Start production stack (all services)
	@echo "$(GREEN)Starting production stack...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) up -d
	@echo ""
	@echo "$(CYAN)Waiting for services to be healthy...$(RESET)"
	@sleep 5
	@$(MAKE) prod-status

prod-down: ## Stop production stack
	@echo "$(YELLOW)Stopping production stack...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) down
	@echo "$(GREEN)Done.$(RESET)"

prod-restart: ## Restart production stack
	@echo "$(YELLOW)Restarting production stack...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) restart
	@echo "$(GREEN)Done.$(RESET)"

prod-status: ## Check production services status
	@echo "$(CYAN)=== ErrorWatch Production Status ===$(RESET)"
	@echo ""
	@docker compose -f $(COMPOSE_PROD) ps
	@echo ""
	@echo "$(CYAN)Health checks:$(RESET)"
	@echo "  $(CYAN)Dashboard (3001):$(RESET)"
	@curl -s -o /dev/null -w "    HTTP %{http_code}\n" http://localhost:3001 || echo "    $(RED)Not responding$(RESET)"
	@echo "  $(CYAN)API (3333):$(RESET)"
	@curl -s -o /dev/null -w "    HTTP %{http_code}\n" http://localhost:3333/health/live || echo "    $(RED)Not responding$(RESET)"

prod-logs: ## Show production logs (all services)
	@docker compose -f $(COMPOSE_PROD) logs -f

prod-logs-api: ## Show API logs only
	@docker compose -f $(COMPOSE_PROD) logs -f api

prod-logs-dashboard: ## Show dashboard logs only
	@docker compose -f $(COMPOSE_PROD) logs -f dashboard

prod-db-migrate: ## Run production migrations
	@echo "$(GREEN)Running production migrations...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) exec api bun run db:migrate

prod-db-shell: ## Open PostgreSQL shell in production
	@docker compose -f $(COMPOSE_PROD) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

prod-db-backup: ## Backup production database
	@echo "$(GREEN)Creating database backup...$(RESET)"
	@mkdir -p backups
	@docker compose -f $(COMPOSE_PROD) exec postgres pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/$(RESET)"

prod-db-restore: ## Restore database from backup (requires BACKUP_FILE=path)
ifndef BACKUP_FILE
	@echo "$(RED)Error: BACKUP_FILE is required$(RESET)"
	@echo "Usage: make prod-db-restore BACKUP_FILE=backups/backup_20240101_120000.sql"
	@exit 1
endif
	@echo "$(YELLOW)Restoring database from $(BACKUP_FILE)...$(RESET)"
	@cat $(BACKUP_FILE) | docker compose -f $(COMPOSE_PROD) exec -T postgres psql -U $(POSTGRES_USER) $(POSTGRES_DB)
	@echo "$(GREEN)Restore complete.$(RESET)"

prod-redis-cli: ## Open Redis CLI in production
	@docker compose -f $(COMPOSE_PROD) exec redis redis-cli

prod-shell-api: ## Open shell in API container
	@docker compose -f $(COMPOSE_PROD) exec api /bin/sh

prod-shell-dashboard: ## Open shell in dashboard container
	@docker compose -f $(COMPOSE_PROD) exec dashboard /bin/sh

# =============================================================================
# ONESHOT PRODUCTION (VPS - Direct Install + PM2)
# =============================================================================

ONESHOT_ENV_FILE := .env.production
ONESHOT_PORT_API := 3333
ONESHOT_PORT_DASHBOARD := 3001
ONESHOT_PM2_NAME := errorwatch

oneshot-install: ## Install dependencies and build
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@bun install
	@echo ""
	@echo "$(GREEN)Building applications...$(RESET)"
	@bun run build
	@echo ""
	@echo "$(GREEN)Done. Run 'make oneshot-start' to launch services.$(RESET)"

oneshot-build: ## Build applications only
	@echo "$(GREEN)Building applications...$(RESET)"
	@bun run build

oneshot-setup: ## Setup infrastructure (PostgreSQL, Redis, Caddy, PM2)
	@echo "$(GREEN)Setting up infrastructure...$(RESET)"
	@chmod +x scripts/install-infra.sh
	@./scripts/install-infra.sh

oneshot-start: ## Start all services via PM2
	@echo "$(GREEN)Starting ErrorWatch services...$(RESET)"
	@echo ""
	@echo "$(CYAN)Checking PostgreSQL...$(RESET)"
	@pg_isready -h localhost -p 5432 > /dev/null 2>&1 && echo "  $(GREEN)PostgreSQL ready$(RESET)" || (echo "  $(RED)PostgreSQL not ready - run 'make oneshot-setup' first$(RESET)" && exit 1)
	@echo ""
	@echo "$(CYAN)Checking Redis...$(RESET)"
	@redis-cli ping > /dev/null 2>&1 && echo "  $(GREEN)Redis ready$(RESET)" || (echo "  $(RED)Redis not ready - run 'make oneshot-setup' first$(RESET)" && exit 1)
	@echo ""
	@echo "$(CYAN)Checking environment file...$(RESET)"
	@if [ -f $(ONESHOT_ENV_FILE) ]; then \
		echo "  $(GREEN)$(ONESHOT_ENV_FILE) found$(RESET)"; \
	else \
		echo "  $(YELLOW)$(ONESHOT_ENV_FILE) not found - copying from example$(RESET)"; \
		cp .env.production.example $(ONESHOT_ENV_FILE); \
		echo "  $(YELLOW)Please edit $(ONESHOT_ENV_FILE) before starting!$(RESET)"; \
	fi
	@echo ""
	@echo "$(CYAN)Starting services via PM2...$(RESET)"
	@chmod +x scripts/oneshot-start.sh
	@./scripts/oneshot-start.sh
	@echo ""
	@echo "$(GREEN)All services started!$(RESET)"
	@echo ""
	@$(MAKE) oneshot-status

oneshot-stop: ## Stop all services via PM2
	@echo "$(YELLOW)Stopping ErrorWatch services...$(RESET)"
	@bunx pm2 stop $(ONESHOT_PM2_NAME) 2>/dev/null || true
	@echo "$(GREEN)All services stopped.$(RESET)"

oneshot-restart: oneshot-stop oneshot-start ## Restart all services

oneshot-status: ## Check services status
	@echo "$(CYAN)=== ErrorWatch Oneshot Status ===$(RESET)"
	@echo ""
	@echo "$(CYAN)PM2 Processes:$(RESET)"
	@bunx pm2 status $(ONESHOT_PM2_NAME) 2>/dev/null || echo "  $(YELLOW)No PM2 processes running$(RESET)"
	@echo ""
	@echo "$(CYAN)Health Checks:$(RESET)"
	@curl -s -o /dev/null -w "  Dashboard: HTTP %{http_code}\n" http://localhost:$(ONESHOT_PORT_DASHBOARD) 2>/dev/null || echo "  Dashboard: $(RED)Not responding$(RESET)"
	@curl -s -o /dev/null -w "  API:       HTTP %{http_code}\n" http://localhost:$(ONESHOT_PORT_API)/health/live 2>/dev/null || echo "  API:       $(RED)Not responding$(RESET)"
	@echo ""
	@echo "$(CYAN)Infrastructure:$(RESET)"
	@pg_isready -h localhost -p 5432 > /dev/null 2>&1 && echo "  PostgreSQL: $(GREEN)ready$(RESET)" || echo "  PostgreSQL: $(RED)not ready$(RESET)"
	@redis-cli ping > /dev/null 2>&1 && echo "  Redis:      $(GREEN)ready$(RESET)" || echo "  Redis:      $(RED)not ready$(RESET)"

oneshot-logs: ## Show PM2 logs
	@bunx pm2 logs $(ONESHOT_PM2_NAME)

oneshot-logs-api: ## Show API logs
	@bunx pm2 logs $(ONESHOT_PM2_NAME)-api

oneshot-logs-dashboard: ## Show dashboard logs
	@bunx pm2 logs $(ONESHOT_PM2_NAME)-dashboard

oneshot-mon: ## Monitor PM2 processes
	@bunx pm2 monit

oneshot-db-create: ## Create database
	@echo "$(GREEN)Creating database...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "SELECT 1 FROM pg_database WHERE datname = '$(POSTGRES_DB)'" | grep -q 1 || \
		docker compose -f $(COMPOSE_PROD) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "CREATE DATABASE $(POSTGRES_DB);"
	@echo "$(GREEN)Database created.$(RESET)"

oneshot-db-push: ## Push database schema
	@echo "$(GREEN)Pushing database schema...$(RESET)"
	@cd apps/monitoring-server && bun run db:push

oneshot-db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(RESET)"
	@cd apps/monitoring-server && bun run db:migrate

oneshot-db-reset: ## Reset database
	@echo "$(YELLOW)Resetting database...$(RESET)"
	@sudo -u postgres psql -d errorwatch -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
	@$(MAKE) oneshot-db-push

oneshot-db-shell: ## Open PostgreSQL shell
	@sudo -u postgres psql -d errorwatch

oneshot-redis-cli: ## Open Redis CLI
	@redis-cli

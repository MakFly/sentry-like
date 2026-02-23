# ErrorWatch Makefile
# ===================

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
RESET  := \033[0m

# Docker Compose files
COMPOSE_DEV := docker-compose.yml
COMPOSE_PROD := docker-compose.prod.yml

# PostgreSQL credentials (prod)
POSTGRES_USER := errorwatch
POSTGRES_DB := errorwatch

.PHONY: help

help: ## Show this help
	@echo "$(CYAN)ErrorWatch Makefile$(RESET)"
	@echo ""
	@echo "$(CYAN)DEVELOPMENT:$(RESET)"
	@grep -E '^dev-|^start-|^stop:|^status:|^install:|^build:|^clean:' $(MAKEFILE_LIST) | grep -E '^[^:]*:' | sed 's/:.*## /: /' | sed 's/^/  /'
	@echo ""
	@echo "$(CYAN)INFRASTRUCTURE:$(RESET)"
	@grep -E '^(infra|db-|redis-)' $(MAKEFILE_LIST) | grep -E '^[^:]*:' | sed 's/:.*## /: /' | sed 's/^/  /'
	@echo ""
	@echo "$(CYAN)PRODUCTION (VPS - Native):$(RESET)"
	@grep -E '^prod-oneshot' $(MAKEFILE_LIST) | grep -E '^[^:]*:' | sed 's/:.*## /: /' | sed 's/^/  /'
	@echo ""
	@echo "$(CYAN)PRODUCTION (Docker):$(RESET)"
	@grep -E '^prod-docker' $(MAKEFILE_LIST) | grep -E '^[^:]*:' | sed 's/:.*## /: /' | sed 's/^/  /'

# =============================================================================
# DEVELOPMENT
# =============================================================================

install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@bun install

build: ## Build all apps for production
	@echo "$(GREEN)Building applications...$(RESET)"
	@cd apps/monitoring-server && bun run build
	@cd apps/dashboard && bun run build

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning...$(RESET)"
	@rm -rf apps/dashboard/.next
	@rm -rf apps/monitoring-server/dist

dev: ## Show dev instructions
	@echo "$(CYAN)=== Development ===$(RESET)"
	@echo "Terminal 1: $(YELLOW)make dev-api$(RESET)"
	@echo "Terminal 2: $(YELLOW)make dev-dashboard$(RESET)"
	@echo ""
	@$(MAKE) infra-check

dev-api: ## Start API server (port 3333)
	@cd apps/monitoring-server && bun run dev:standalone

dev-dashboard: ## Start dashboard (port 4001)
	@cd apps/dashboard && bun run dev:standalone

start: ## Start all dev services
	@$(MAKE) dev

stop: ## Stop all dev processes
	@pkill -f "tsx" 2>/dev/null || true
	@pkill -f "next" 2>/dev/null || true

status: ## Check dev services
	@echo "$(CYAN)=== Dev Status ===$(RESET)"
	@curl -s -o /dev/null -w "Dashboard:   HTTP %{http_code}\n" http://localhost:4001 || echo "Dashboard:   $(RED)Not running$(RESET)"
	@curl -s -o /dev/null -w "API Server:  HTTP %{http_code}\n" http://localhost:3333/health || echo "API Server:  $(RED)Not running$(RESET)"

# =============================================================================
# INFRASTRUCTURE (Docker)
# =============================================================================

infra-up: ## Start Docker infra (postgres + redis)
	@echo "$(GREEN)Starting infrastructure...$(RESET)"
	@docker compose -f $(COMPOSE_DEV) up -d postgres redis

infra-down: ## Stop Docker infra
	@echo "$(YELLOW)Stopping infrastructure...$(RESET)"
	@docker compose -f $(COMPOSE_DEV) down

infra-check: ## Check infra status
	@echo "$(CYAN)Infra:$(RESET)"
	@docker compose -f $(COMPOSE_DEV) ps postgres redis 2>/dev/null || echo "  $(RED)No infra running$(RESET)"

# =============================================================================
# DATABASE
# =============================================================================

db-create: ## Create database (dev)
	@docker compose -f $(COMPOSE_DEV) exec postgres psql -U errorwatch -d errorwatch -c "CREATE DATABASE IF NOT EXISTS errorwatch;" 2>/dev/null || \
		docker compose -f $(COMPOSE_DEV) exec postgres psql -U errorwatch -c "CREATE DATABASE errorwatch;"

db-push: ## Push schema to database
	@cd apps/monitoring-server && bun run db:push

db-migrate: ## Run migrations
	@cd apps/monitoring-server && bun run db:migrate

db-reset: ## Reset database
	@echo "$(YELLOW)Resetting database...$(RESET)"
	@docker compose -f $(COMPOSE_DEV) exec postgres psql -U errorwatch -d errorwatch -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
	@$(MAKE) db-push

# =============================================================================
# REDIS
# =============================================================================

redis-cli: ## Open Redis CLI (dev)
	@docker compose -f $(COMPOSE_DEV) exec redis redis-cli

# =============================================================================
# PRODUCTION - ONESHOT (VPS - Native + PM2)
# =============================================================================

prod-oneshot-start: ## Start all services (infra + PM2)
	@chmod +x scripts/oneshot-start.sh
	@./scripts/oneshot-start.sh

prod-oneshot-stop: ## Stop PM2 services
	@bunx pm2 stop all

prod-oneshot-restart: ## Restart all services
	@$(MAKE) prod-oneshot-stop
	@$(MAKE) prod-oneshot-start

prod-oneshot-status: ## Check services status
	@echo "$(CYAN)=== Production Status ===$(RESET)"
	@bunx pm2 list
	@echo ""
	@curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\n" http://localhost:4001 || echo "Dashboard: $(RED)Not responding$(RESET)"
	@curl -s -o /dev/null -w "API:      HTTP %{http_code}\n" http://localhost:3333/health/live || echo "API:      $(RED)Not responding$(RESET)"

prod-oneshot-logs: ## Show PM2 logs
	@bunx pm2 logs

prod-oneshot-logs-api: ## Show API logs
	@bunx pm2 logs errorwatch-api

prod-oneshot-logs-dashboard: ## Show dashboard logs
	@bunx pm2 logs errorwatch-dashboard

prod-oneshot-mon: ## Monitor PM2
	@bunx pm2 monit

# =============================================================================
# PRODUCTION - DOCKER
# =============================================================================

prod-docker-up: ## Start production stack (Docker)
	@echo "$(GREEN)Starting production stack...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) up -d

prod-docker-down: ## Stop production stack
	@echo "$(YELLOW)Stopping production stack...$(RESET)"
	@docker compose -f $(COMPOSE_PROD) down

prod-docker-status: ## Check production status
	@docker compose -f $(COMPOSE_PROD) ps

prod-docker-logs: ## Show logs
	@docker compose -f $(COMPOSE_PROD) logs -f

prod-docker-db-shell: ## Open PostgreSQL shell
	@docker compose -f $(COMPOSE_PROD) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

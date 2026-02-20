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
POSTGRES_HOST := infra-postgres
POSTGRES_USER := test
POSTGRES_PASS := test
POSTGRES_DB := errorwatch

help: ## Show this help
	@echo "$(CYAN)ErrorWatch Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'

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

start-dashboard: ## Start dashboard (port 3001)
	@echo "$(GREEN)Starting dashboard on port 3001...$(RESET)"
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
	@echo "$(CYAN)Dashboard (3001):$(RESET)"
	@curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:3001 || echo "  $(RED)Not running$(RESET)"
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

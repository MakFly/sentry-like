# ErrorWatch Development Makefile
# ================================

.PHONY: help
.PHONY: dev dev-tmux
.PHONY: start-api start-dashboard start-worker
.PHONY: stop
.PHONY: restart status
.PHONY: install build clean
.PHONY: docker-up docker-down docker-logs docker-flush
.PHONY: db-push db-migrate db-reset

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
RESET  := \033[0m

# Directory paths
ROOT_DIR := $(shell pwd)
LOG_DIR := $(ROOT_DIR)/logs

help: ## Show this help
	@echo "$(CYAN)ErrorWatch Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: ## Start Docker + show instructions
	@echo "$(CYAN)Starting ErrorWatch dev environment...$(RESET)"
	@echo ""
	@echo "$(GREEN)Run these commands in separate terminals:$(RESET)"
	@echo ""
	@echo "  Terminal 1: $(YELLOW)make start-api$(RESET)"
	@echo "  Terminal 2: $(YELLOW)make start-dashboard$(RESET)"
	@echo "  Terminal 3: $(YELLOW)make start-worker$(RESET)"
	@echo ""
	@$(MAKE) docker-up

dev-tmux: ## Start all with tmux (runs everything automatically)
	@$(MAKE) docker-up
	@tmux new-session -s errorwatch -d -c $(ROOT_DIR) "make start-api" 2>/dev/null || echo "tmux not available"
	@tmux new-session -s errorwatch -d -c $(ROOT_DIR) "make start-dashboard" 2>/dev/null || echo "tmux not available"
	@tmux new-session -s errorwatch -d -c $(ROOT_DIR) "make start-worker" 2>/dev/null || echo "tmux not available"
	@echo "$(GREEN)All services started in tmux session 'errorwatch'$(RESET)"
	@echo "Attach with: $(YELLOW)tmux attach -t errorwatch$(RESET)"

start-api: ## Start monitoring server (port 3333)
	@echo "$(GREEN)Starting API server on port 3333...$(RESET)"
	@cd apps/monitoring-server && bun run dev:standalone

start-dashboard: ## Start dashboard (port 3001)
	@echo "$(GREEN)Starting dashboard on port 3001...$(RESET)"
	@cd apps/dashboard && bun run dev:standalone

start-worker: ## Start background worker
	@echo "$(GREEN)Starting worker...$(RESET)"
	@cd apps/worker && bun run dev:standalone

stop: ## Stop all apps + Docker (kill everything)
	@echo "$(YELLOW)Stopping all ErrorWatch services...$(RESET)"
	-@pkill -9 -f "tsx watch.*monitoring-server" 2>/dev/null || true
	-@pkill -9 -f "next dev" 2>/dev/null || true
	-@pkill -9 -f "tsx watch.*worker" 2>/dev/null || true
	-@pkill -f "tsx" 2>/dev/null || true
	-@pkill -f "next" 2>/dev/null || true
	@docker compose -f docker-compose.dev.yml down || true
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
	@echo "$(CYAN)Worker:$(RESET)"
	@if pgrep -f "tsx watch.*worker" > /dev/null; then echo "  $(GREEN)Running$(RESET)"; else echo "  $(RED)Not running$(RESET)"; fi

# =============================================================================
# DOCKER
# =============================================================================

docker-up: ## Start Docker services (PostgreSQL, Redis)
	@echo "$(GREEN)Starting Docker services...$(RESET)"
	@docker compose -f docker-compose.dev.yml up -d

docker-down: ## Stop Docker services
	@echo "$(YELLOW)Stopping Docker services...$(RESET)"
	@docker compose -f docker-compose.dev.yml down

docker-logs: ## Show Docker logs
	@docker compose -f docker-compose.dev.yml logs -f

docker-flush: ## Flush Redis cache
	@echo "$(YELLOW)Flushing Redis...$(RESET)"
	@docker exec errorwatch-redis-dev redis-cli FLUSHALL
	@echo "$(GREEN)Done.$(RESET)"

# =============================================================================
# SETUP & BUILD
# =============================================================================

install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@bun install
	@cd example-client && composer install --no-interaction || true
	@echo "$(GREEN)Done.$(RESET)"

build: ## Build for production
	@echo "$(GREEN)Building...$(RESET)"
	@bun run build

clean: ## Clean build artifacts and logs
	@echo "$(YELLOW)Cleaning...$(RESET)"
	@rm -rf apps/dashboard/.next
	@rm -rf apps/monitoring-server/dist
	@rm -rf apps/worker/dist
	@rm -rf $(LOG_DIR)
	@rm -rf node_modules/.cache
	@echo "$(GREEN)Done.$(RESET)"

# =============================================================================
# DATABASE
# =============================================================================

db-push: ## Push database schema
	@echo "$(GREEN)Pushing database schema...$(RESET)"
	@bun run db:push

db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(RESET)"
	@cd apps/monitoring-server && bun run db:migrate

db-reset: ## Reset database (PostgreSQL Docker)
	@echo "$(YELLOW)Resetting PostgreSQL database...$(RESET)"
	@docker exec errorwatch-postgres-dev psql -U errorwatch -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" || echo "$(YELLOW)Could not connect to PostgreSQL, trying to start Docker...$(RESET)"
	@$(MAKE) docker-up 2>/dev/null || true
	@sleep 2
	@docker exec errorwatch-postgres-dev psql -U errorwatch -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
	@echo "$(GREEN)Schema dropped. Pushing fresh schema...$(RESET)"
	@bun run db:push
	@echo "$(GREEN)Database reset complete!$(RESET)"

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

# ErrorWatch Development Makefile
# ================================

.PHONY: help dev stop restart status test-client install build clean db-push db-reset docker-up docker-down docker-logs docker-flush

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

help: ## Show this help
	@echo "$(CYAN)ErrorWatch Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: docker-up ## Start all dev servers (Docker + Turbo apps)
	@echo "$(GREEN)Starting ErrorWatch dev servers...$(RESET)"
	@bun run dev:no-docker

dev-apps: ## Start only Turbo apps (no Docker)
	@echo "$(GREEN)Starting Turbo apps...$(RESET)"
	@bun run dev:no-docker

stop: ## Stop all dev servers
	@echo "$(YELLOW)Stopping dev servers...$(RESET)"
	@-pkill -f "turbo run dev" 2>/dev/null || true
	@-pkill -f "bun.*monitoring-server" 2>/dev/null || true
	@-pkill -f "next dev" 2>/dev/null || true
	@$(MAKE) docker-down
	@echo "$(GREEN)Stopped.$(RESET)"

restart: stop dev ## Restart all dev servers

status: ## Check server status
	@echo "$(CYAN)Server Status:$(RESET)"
	@echo ""
	@echo "Dashboard (3001):"
	@curl -s -o /dev/null -w "  %{http_code}\n" http://localhost:3001 || echo "  Not running"
	@echo ""
	@echo "Monitoring Server (3333):"
	@curl -s -o /dev/null -w "  %{http_code}\n" http://localhost:3333/health || echo "  Not running"
	@echo ""
	@echo "Example Client (8899):"
	@curl -s -o /dev/null -w "  %{http_code}\n" http://localhost:8899 || echo "  Not running"

# =============================================================================
# EXAMPLE CLIENT (PHP/Symfony)
# =============================================================================

test-client: ## Start example Symfony client (port 8899)
	@echo "$(GREEN)Starting example-client on http://localhost:8899$(RESET)"
	@cd example-client && php -S localhost:8899 -t public

test-client-bg: ## Start example client in background
	@echo "$(GREEN)Starting example-client in background on http://localhost:8899$(RESET)"
	@cd example-client && php -S localhost:8899 -t public > /dev/null 2>&1 &
	@echo "$(GREEN)Started. PID: $$(pgrep -f 'php -S localhost:8899')$(RESET)"

stop-client: ## Stop example client
	@echo "$(YELLOW)Stopping example-client...$(RESET)"
	@-pkill -f "php -S localhost:8899" 2>/dev/null || true
	@echo "$(GREEN)Stopped.$(RESET)"

# =============================================================================
# DOCKER
# =============================================================================

docker-up: ## Start Docker services (Redis, etc.)
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
	@cd example-client && composer install --no-interaction
	@echo "$(GREEN)Done.$(RESET)"

build: ## Build for production
	@echo "$(GREEN)Building...$(RESET)"
	@bun run build

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning...$(RESET)"
	@rm -rf apps/dashboard/.next
	@rm -rf apps/monitoring-server/dist
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

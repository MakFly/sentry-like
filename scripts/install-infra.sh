#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo -e "${CYAN}=== ErrorWatch Infrastructure Setup ===${RESET}"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${RESET}"
    exit 1
fi

echo -e "${CYAN}Updating package list...${RESET}"
apt update

echo -e "${CYAN}Installing PostgreSQL 16...${RESET}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql-16 postgresql-client-16
else
    echo -e "${YELLOW}PostgreSQL already installed${RESET}"
fi

echo -e "${CYAN}Installing Redis...${RESET}"
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
else
    echo -e "${YELLOW}Redis already installed${RESET}"
fi

echo -e "${CYAN}Installing Caddy (manual update required)...${RESET}"
if ! command -v caddy &> /dev/null; then
    apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
else
    echo -e "${YELLOW}Caddy already installed${RESET}"
    echo -e "${YELLOW}To update Caddy, run: apt update && apt install caddy${RESET}"
fi

echo -e "${CYAN}Installing Bun...${RESET}"
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
else
    echo -e "${YELLOW}Bun already installed${RESET}"
fi

BUN_PATH="$HOME/.bun/bin/bun"
if [ ! -f "$BUN_PATH" ]; then
    BUN_PATH="/root/.bun/bin/bun"
fi

echo -e "${CYAN}Installing PM2...${RESET}"
if ! command -v pm2 &> /dev/null; then
    $BUN_PATH global add pm2
else
    echo -e "${YELLOW}PM2 already installed${RESET}"
fi

echo -e "${CYAN}Configuring PostgreSQL...${RESET}"
systemctl enable postgresql
systemctl start postgresql

POSTGRES_PASSWORD="errorwatch"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRES_PASSWORD';" 2>/dev/null || true

if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw errorwatch; then
    sudo -u postgres psql -c "CREATE DATABASE errorwatch;"
    sudo -u postgres psql -c "CREATE USER errorwatch WITH PASSWORD '$POSTGRES_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE errorwatch TO errorwatch;"
    sudo -u postgres psql -d errorwatch -c "GRANT ALL ON SCHEMA public TO errorwatch;"
    echo -e "${GREEN}Database 'errorwatch' created${RESET}"
else
    echo -e "${YELLOW}Database 'errorwatch' already exists${RESET}"
fi

echo -e "${CYAN}Configuring Redis...${RESET}"
systemctl enable redis-server
systemctl start redis-server

if ! grep -q "maxmemory 256mb" /etc/redis/redis.conf 2>/dev/null; then
    echo "maxmemory 256mb" >> /etc/redis/redis.conf
    echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
    systemctl restart redis-server
fi

PROJECT_ROOT="$(cd "$(dirname "$0")" && cd .. && pwd)"

echo -e "${CYAN}Setting up PM2 startup script...${RESET}"
if command -v pm2 &> /dev/null; then
    $BUN_PATH pm2 startup 2>/dev/null || true
    $BUN_PATH pm2 save 2>/dev/null || true
    echo -e "${GREEN}PM2 startup configured${RESET}"
fi

echo ""
echo -e "${GREEN}=== Infrastructure Setup Complete ===${RESET}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${CYAN}Configure environment:${RESET}"
echo -e "     cp .env.production.example .env.production"
echo -e "     nano .env.production"
echo ""
echo -e "  2. ${CYAN}Build the application:${RESET}"
echo -e "     make oneshot-build"
echo ""
echo -e "  3. ${CYAN}Start services:${RESET}"
echo -e "     make oneshot-start"
echo ""
echo -e "  4. ${CYAN}Configure Caddy:${RESET}"
echo -e "     cp Caddyfile /etc/caddy/Caddyfile"
echo -e "     systemctl enable caddy"
echo -e "     systemctl start caddy"
echo ""

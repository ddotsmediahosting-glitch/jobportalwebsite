#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# UAE Jobs Portal — One-Command VPS Deployment Script
# Usage: bash deploy.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── 1. Verify prerequisites ────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v docker  >/dev/null 2>&1 || error "Docker not installed. Run: curl -fsSL https://get.docker.com | sh"
command -v docker  >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || \
  error "Docker Compose v2 not available. Update Docker Desktop or install the plugin."
success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
success "Docker Compose $(docker compose version --short)"

# ── 2. Ensure .env.production exists ──────────────────────────────────────────
if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    warn ".env.production not found — copying from example template."
    cp .env.production.example .env.production
    error "Please edit .env.production and fill in all CHANGE_ME values, then re-run this script."
  else
    error ".env.production not found. Create it from .env.production.example first."
  fi
fi

# Check for unfilled placeholders
if grep -q "CHANGE_ME" .env.production 2>/dev/null; then
  error "Found CHANGE_ME placeholders in .env.production. Fill in all values before deploying."
fi

success ".env.production looks good"

# ── 3. Pull latest code (if running from a git repo) ──────────────────────────
if [ -d .git ]; then
  info "Pulling latest code from git..."
  git pull --ff-only || warn "git pull failed — deploying with current local code."
fi

# ── 4. Build & start containers ───────────────────────────────────────────────
info "Building Docker images (this may take a few minutes on first run)..."
docker compose -f docker-compose.prod.yml build --pull

info "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# ── 5. Wait for health checks ─────────────────────────────────────────────────
info "Waiting for services to become healthy..."
MAX_WAIT=120
ELAPSED=0
until docker compose -f docker-compose.prod.yml ps | grep -E "api.*healthy" >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    warn "API container did not report healthy within ${MAX_WAIT}s — check logs with: docker compose -f docker-compose.prod.yml logs api"
    break
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
  echo -n "."
done
echo ""

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
info "Access your site at: http://$(curl -s ifconfig.me 2>/dev/null || echo '<YOUR_SERVER_IP>')"
info "View logs:  docker compose -f docker-compose.prod.yml logs -f"
info "Stop:       docker compose -f docker-compose.prod.yml down"
echo ""

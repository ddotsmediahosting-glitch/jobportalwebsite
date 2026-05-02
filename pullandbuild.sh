#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ddotsmediajobs — production deploy script
# Run this from the project root (typically /opt/jobportalwebsite) on the server.
#
# What it does (in order):
#   1. Verify prerequisites (docker, .env.production, no CHANGE_ME placeholders)
#   2. Pull latest from origin/main with conflict-safe stash-stash-pop
#   3. Force-clean any stuck containers from previous failed deploys
#   4. Build all images with full output streamed live (no truncation)
#   5. Bring services up and wait for HEALTHY (mariadb, api, web)
#   6. Print a real success/failure verdict — the script exits non-zero if
#      anything failed, so callers (cron, CI) actually see the failure.
#
# Designed to be safe to re-run: every step is idempotent, and the script
# fails fast on the first error rather than continuing into a broken state.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
step()    { echo -e "\n${BOLD}${CYAN}▶ $*${NC}"; }
info()    { echo -e "  ${CYAN}·${NC} $*"; }
ok()      { echo -e "  ${GREEN}✓${NC} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${NC} $*"; }
fail()    { echo -e "  ${RED}✗${NC} $*"; }

# ── Resolve project dir + compose command ─────────────────────────────────────
PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

cd "$PROJECT_DIR"

DC=(docker compose -f "$COMPOSE_FILE")
PROJECT_NAME="$(basename "$PROJECT_DIR")"

# ── Error trap ────────────────────────────────────────────────────────────────
# When anything fails, print the LAST lines of every container's logs so the
# user gets the actual error in the same output, not a truncated tail.
on_error() {
  local exit_code=$?
  local line=$1
  echo
  echo -e "${RED}${BOLD}═══ DEPLOY FAILED (exit $exit_code at line $line) ═══${NC}"
  echo -e "${YELLOW}Recent logs from each running container:${NC}"
  for svc in mariadb redis api web prerender; do
    echo -e "\n${BOLD}── $svc ──${NC}"
    "${DC[@]}" logs --tail=30 "$svc" 2>/dev/null || echo "(not running)"
  done
  echo
  echo -e "${RED}${BOLD}Deploy failed. See output above.${NC}"
  echo -e "  Re-run after fixing:    ${BOLD}bash $0${NC}"
  echo -e "  Watch live logs:        ${BOLD}${DC[*]} logs -f${NC}"
  echo -e "  Container status:       ${BOLD}${DC[*]} ps${NC}"
  exit "$exit_code"
}
trap 'on_error $LINENO' ERR

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
step "1. Checking prerequisites"
command -v docker >/dev/null 2>&1 || { fail "docker not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { fail "docker compose v2 plugin missing"; exit 1; }
ok "docker $(docker --version | awk '{print $3}' | tr -d ',')"

[ -f "$COMPOSE_FILE" ] || { fail "$COMPOSE_FILE not found in $(pwd)"; exit 1; }
[ -f "$ENV_FILE" ]     || { fail "$ENV_FILE not found — copy from $ENV_FILE.example and fill in values"; exit 1; }

if grep -q 'CHANGE_ME' "$ENV_FILE" 2>/dev/null; then
  fail "$ENV_FILE still has CHANGE_ME placeholders — fill them in before deploying"
  grep -n 'CHANGE_ME' "$ENV_FILE" | head -5
  exit 1
fi

# Verify the vars MariaDB needs are non-empty (this caused a real outage)
for var in MARIADB_ROOT_PASSWORD MARIADB_USER MARIADB_PASSWORD MARIADB_DATABASE; do
  val=$(grep "^$var=" "$ENV_FILE" | head -1 | cut -d'=' -f2- || true)
  if [ -z "${val:-}" ]; then
    fail "$ENV_FILE: $var is empty or missing — MariaDB will not start"
    exit 1
  fi
done
ok "$ENV_FILE is populated"

# ── 2. Pull latest from git ───────────────────────────────────────────────────
step "2. Syncing with origin/main"
if [ -d .git ]; then
  # Stash any local changes so a dirty working tree never blocks the pull
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "uncommitted local changes detected — stashing"
    git stash push -u -m "auto-deploy stash $(date +%s)" >/dev/null
    STASHED=1
  else
    STASHED=0
  fi

  git fetch origin main --quiet
  LOCAL_SHA=$(git rev-parse HEAD)
  REMOTE_SHA=$(git rev-parse origin/main)
  if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
    ok "already at latest commit ($(git log -1 --pretty=%h\ %s))"
  else
    info "pulling $LOCAL_SHA → $REMOTE_SHA"
    git reset --hard origin/main
    ok "fast-forwarded to $(git log -1 --pretty=%h\ %s)"
  fi

  if [ "${STASHED:-0}" = "1" ]; then
    git stash pop || warn "stash pop had conflicts — left in stash, run 'git stash list' to see"
  fi
else
  warn "not a git repository — skipping pull"
fi

# ── 3. Clean up stuck containers ──────────────────────────────────────────────
step "3. Cleaning stuck containers from previous deploys"
# A previous failed deploy can leave containers in "Created" or "Exited" state
# that compose can't gracefully stop ("permission denied" errors). Force-remove
# everything for this project so the next `up` starts from a clean slate.
# Volumes (DB data) are preserved — only containers are removed.
for cid in $(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT_NAME" 2>/dev/null); do
  state=$(docker inspect --format '{{.State.Status}}' "$cid" 2>/dev/null || echo "unknown")
  name=$(docker inspect --format '{{.Name}}' "$cid" 2>/dev/null | sed 's|^/||' || echo "?")
  info "stopping $name (state: $state)"
  docker rm -f "$cid" >/dev/null 2>&1 || {
    warn "  docker rm failed — trying kill via PID"
    pid=$(docker inspect --format '{{.State.Pid}}' "$cid" 2>/dev/null || echo 0)
    [ "$pid" -gt 0 ] && kill -9 "$pid" 2>/dev/null || true
    docker rm -f "$cid" >/dev/null 2>&1 || warn "  could not remove $name; you may need: sudo systemctl restart docker"
  }
done
ok "containers cleaned"

# ── 4. Build images (full output, no caching surprises) ───────────────────────
step "4. Building images"
info "this can take 3-5 minutes on first run; subsequent builds use cache"
# --progress=plain shows the FULL output of each RUN step, so a vite/tsc error
# is visible inline instead of being truncated by buildkit's pretty printer.
"${DC[@]}" build --pull --progress=plain
ok "all images built"

# ── 5. Start services ─────────────────────────────────────────────────────────
step "5. Starting services"
"${DC[@]}" up -d --remove-orphans
ok "containers started"

# ── 6. Wait for health ────────────────────────────────────────────────────────
step "6. Waiting for services to become healthy"
WANT_HEALTHY=(mariadb redis api)   # web has no healthcheck; we only require these three
MAX_WAIT=180   # 3 minutes — covers MariaDB cold-start on slow VPS
ELAPSED=0

while :; do
  all_ok=1
  status_line=""
  for svc in "${WANT_HEALTHY[@]}"; do
    cid=$("${DC[@]}" ps -q "$svc" 2>/dev/null || true)
    if [ -z "$cid" ]; then
      all_ok=0
      status_line+="$svc=missing  "
      continue
    fi
    health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "?")
    status_line+="$svc=$health  "
    case "$health" in
      healthy|running) ;;
      *) all_ok=0 ;;
    esac
  done

  if [ "$all_ok" = "1" ]; then
    ok "all required services healthy ($status_line)"
    break
  fi

  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    fail "timed out after ${MAX_WAIT}s — current state: $status_line"
    "${DC[@]}" ps
    exit 1
  fi

  printf "  %s\r" "$status_line"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

# ── 7. Final verification ─────────────────────────────────────────────────────
step "7. Final state"
"${DC[@]}" ps
echo
docker image prune -f >/dev/null 2>&1 || true   # reclaim space, never fail the deploy on this

# ── Done ──────────────────────────────────────────────────────────────────────
echo
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ Deploy succeeded — $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "  Commit:  $(git log -1 --pretty='%h %s' 2>/dev/null || echo '(no git)')"
echo -e "  Logs:    ${BOLD}${DC[*]} logs -f${NC}"
echo -e "  Status:  ${BOLD}${DC[*]} ps${NC}"
echo

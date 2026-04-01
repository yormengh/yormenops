#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  YormenOps — Local Development Init
#  Moses Amartey's Tech & DevOps Journal
#
#  Usage: ./scripts/init.sh
#  Starts: MongoDB (Docker) + Lambda local server + Frontend (Vite)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; DIM='\033[2m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[YormenOps]${RESET} $*"; }
ok()   { echo -e "${GREEN}  ✓${RESET} $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET} $*"; }
die()  { echo -e "${RED}  ✗${RESET} $*"; exit 1; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║   YormenOps — Local Dev                   ║${RESET}"
echo -e "${CYAN}║   Moses Amartey (@yormengh)               ║${RESET}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${RESET}"
echo ""

# ── Preflight ──────────────────────────────────────────────────────────────────
log "Checking prerequisites..."
command -v docker &>/dev/null || die "Docker not installed"
docker info &>/dev/null       || die "Docker daemon not running"
command -v node   &>/dev/null || die "Node.js not installed"
command -v npm    &>/dev/null || die "npm not installed"
ok "All prerequisites met"

# ── MongoDB via Docker ────────────────────────────────────────────────────────
log "Starting MongoDB..."
if docker ps --format '{{.Names}}' | grep -q "^yormenops-mongo$"; then
  ok "MongoDB already running"
else
  docker run -d \
    --name yormenops-mongo \
    --restart unless-stopped \
    -p 27017:27017 \
    -e MONGO_INITDB_DATABASE=yormenops \
    -v yormenops-mongo-data:/data/db \
    mongo:7 \
    --quiet \
    2>/dev/null || docker start yormenops-mongo 2>/dev/null
  ok "MongoDB started on port 27017"
fi

export MONGODB_URI="mongodb://localhost:27017/yormenops"

# ── Lambda deps ───────────────────────────────────────────────────────────────
log "Installing Lambda dependencies..."
(cd lambda && npm install --silent)
ok "Lambda deps ready"

# ── Frontend deps ─────────────────────────────────────────────────────────────
log "Installing frontend dependencies..."
(cd frontend && npm install --prefer-offline --silent)
ok "Frontend deps ready"

# ── Start Lambda local server ─────────────────────────────────────────────────
log "Starting Lambda local API on :4000..."
MONGODB_URI="$MONGODB_URI" node lambda/src/local.js &
LAMBDA_PID=$!
echo "$LAMBDA_PID" > /tmp/yormenops-lambda.pid

sleep 2
if kill -0 "$LAMBDA_PID" 2>/dev/null; then
  ok "Lambda API running (PID $LAMBDA_PID)"
else
  die "Lambda API failed to start — check MONGODB_URI"
fi

# ── Seed DB ───────────────────────────────────────────────────────────────────
log "Seeding database..."
sleep 1
curl -sf -X POST "http://localhost:4000/api/seed" \
  -H "Content-Type: application/json" \
  -o /dev/null && ok "Database seeded with 3 starter posts" || warn "Seed skipped (posts may already exist)"

# ── Start frontend ────────────────────────────────────────────────────────────
log "Starting frontend dev server on :3000..."
VITE_API_URL="http://localhost:4000/api" npm --prefix frontend run dev &
VITE_PID=$!
echo "$VITE_PID" > /tmp/yormenops-vite.pid

sleep 3

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║   YormenOps is running! 🛸                ║${RESET}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${CYAN}Frontend${RESET}  →  ${GREEN}http://localhost:3000${RESET}"
echo -e "  ${CYAN}API       →  http://localhost:4000/api/health${RESET}"
echo -e "  ${CYAN}MongoDB   →  mongodb://localhost:27017/yormenops${RESET}"
echo ""
echo -e "  ${DIM}Stop:     ./scripts/teardown.sh${RESET}"
echo -e "  ${DIM}Logs:     kill \$(cat /tmp/yormenops-lambda.pid) to stop API${RESET}"
echo ""

# Keep script alive so Ctrl+C stops everything
trap 'echo ""; log "Shutting down..."; kill $LAMBDA_PID $VITE_PID 2>/dev/null; exit 0' INT TERM
wait

#!/usr/bin/env bash
# YormenOps — Teardown local dev environment
# Usage: ./scripts/teardown.sh [--volumes]
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
REMOVE_VOLUMES=false
[[ "${1:-}" == "--volumes" ]] && REMOVE_VOLUMES=true

log()  { echo -e "${CYAN}[YormenOps]${RESET} $*"; }
ok()   { echo -e "${GREEN}  ✓${RESET} $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET} $*"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════╗${RESET}"
echo -e "${CYAN}║  YormenOps — Teardown        ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════╝${RESET}"
echo ""

# Kill Lambda local server
if [[ -f /tmp/yormenops-lambda.pid ]]; then
  kill "$(cat /tmp/yormenops-lambda.pid)" 2>/dev/null && ok "Lambda API stopped" || warn "Lambda API already stopped"
  rm -f /tmp/yormenops-lambda.pid
fi

# Kill Vite
if [[ -f /tmp/yormenops-vite.pid ]]; then
  kill "$(cat /tmp/yormenops-vite.pid)" 2>/dev/null && ok "Frontend stopped" || warn "Frontend already stopped"
  rm -f /tmp/yormenops-vite.pid
fi

# Stop MongoDB container
log "Stopping MongoDB..."
docker stop yormenops-mongo 2>/dev/null && ok "MongoDB stopped" || warn "MongoDB not running"

if [[ "$REMOVE_VOLUMES" == true ]]; then
  warn "Removing MongoDB data volume..."
  docker rm -f yormenops-mongo 2>/dev/null || true
  docker volume rm yormenops-mongo-data 2>/dev/null && ok "Volume removed" || warn "Volume not found"
fi

echo ""
echo -e "${GREEN}Teardown complete.${RESET}"
echo -e "  Restart:    ${CYAN}./scripts/init.sh${RESET}"
echo -e "  Full reset: ${CYAN}./scripts/teardown.sh --volumes${RESET}"
echo ""

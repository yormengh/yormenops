#!/usr/bin/env bash
# YormenOps — Build Lambda zip artifacts
# Usage: ./scripts/build-lambda.sh
# Output: lambda/lambda.zip + lambda/mongodb-layer.zip

set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RESET='\033[0m'
log() { echo -e "${CYAN}[build-lambda]${RESET} $*"; }
ok()  { echo -e "${GREEN}  ✓${RESET} $*"; }

echo ""
log "Building YormenOps Lambda artifacts..."

# ── Lambda function zip ───────────────────────────────────────────────────────
log "Building lambda.zip..."
(cd lambda && npm install --silent)
(cd lambda && zip -r lambda.zip src/ node_modules/ package.json \
  --exclude "*.test.js" \
  --exclude "src/local.js")
ok "lambda.zip — $(du -sh lambda/lambda.zip | cut -f1)"

# ── MongoDB layer zip ─────────────────────────────────────────────────────────
log "Building mongodb-layer.zip..."
(cd lambda/layers/mongodb/nodejs && npm install --silent)
(cd lambda/layers/mongodb && zip -r ../../mongodb-layer.zip nodejs/)
ok "mongodb-layer.zip — $(du -sh lambda/mongodb-layer.zip | cut -f1)"

echo ""
echo -e "${GREEN}Artifacts ready:${RESET}"
echo "  lambda/lambda.zip"
echo "  lambda/mongodb-layer.zip"
echo ""
echo "Next: terraform -chdir=infrastructure/environments/prod apply"
echo ""

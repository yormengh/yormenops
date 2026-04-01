#!/usr/bin/env bash
# YormenOps — Manual Deploy Helper
# Usage: ./scripts/deploy.sh [lambda|frontend|all]
# Env vars needed: AWS_REGION, S3_BUCKET, CLOUDFRONT_ID (for frontend)
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'
TARGET="${1:-all}"
AWS_REGION="${AWS_REGION:-us-east-2}"
SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")

log() { echo -e "${CYAN}[deploy]${RESET} $*"; }
ok()  { echo -e "${GREEN}  ✓${RESET} $*"; }
die() { echo -e "${RED}  ✗${RESET} $*"; exit 1; }
chk() { [[ -n "${!1:-}" ]] || die "Env var $1 is required"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  YormenOps Manual Deploy — ${TARGET}   ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════╝${RESET}"
echo ""

deploy_lambda() {
  log "Building Lambda artifacts..."
  ./scripts/build-lambda.sh

  log "Deploying Lambda functions..."
  for FUNC in yormenops-posts yormenops-comments yormenops-health yormenops-seed; do
    aws lambda update-function-code \
      --function-name "$FUNC" \
      --zip-file fileb://lambda/lambda.zip \
      --region "$AWS_REGION" \
      --no-cli-pager
    ok "Updated $FUNC"
  done

  log "Publishing MongoDB layer..."
  aws lambda publish-layer-version \
    --layer-name yormenops-mongodb-layer \
    --zip-file fileb://lambda/mongodb-layer.zip \
    --compatible-runtimes nodejs20.x \
    --region "$AWS_REGION" \
    --no-cli-pager
  ok "Layer published"
}

deploy_frontend() {
  chk S3_BUCKET; chk CLOUDFRONT_ID

  log "Building frontend..."
  (cd frontend && npm ci --silent && VITE_API_URL="${VITE_API_URL:-}" npm run build)
  ok "Frontend built"

  log "Syncing to s3://$S3_BUCKET..."
  aws s3 sync frontend/dist/ "s3://$S3_BUCKET/" \
    --region "$AWS_REGION" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html"

  aws s3 cp frontend/dist/index.html "s3://$S3_BUCKET/index.html" \
    --region "$AWS_REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"
  ok "S3 sync complete"

  log "Invalidating CloudFront $CLOUDFRONT_ID..."
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --no-cli-pager
  ok "CloudFront invalidated"
}

case "$TARGET" in
  lambda)   deploy_lambda ;;
  frontend) deploy_frontend ;;
  all)      deploy_lambda && deploy_frontend ;;
  *) die "Unknown target: $TARGET. Use: lambda | frontend | all" ;;
esac

echo ""
echo -e "${GREEN}Deploy complete! 🚀  sha=${SHORT_SHA}${RESET}"
echo ""

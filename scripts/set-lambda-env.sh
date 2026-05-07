#!/usr/bin/env bash
# ── Set Lambda environment variables ─────────────────────────────────────────
# Usage: MONGODB_URI="..." ./scripts/set-lambda-env.sh
# Or set MONGODB_URI in your shell before running.
set -euo pipefail

REGION='us-east-2'
CORS='https://d23y79wn0wvbn0.cloudfront.net'

if [ -z "${MONGODB_URI:-}" ]; then
  echo "ERROR: MONGODB_URI environment variable is not set."
  echo "Usage: MONGODB_URI='mongodb+srv://...' ./scripts/set-lambda-env.sh"
  exit 1
fi

# Write env JSON to a temp file to avoid shell escaping issues
cat > /tmp/lambda-env.json << ENVEOF
{
  "Variables": {
    "NODE_ENV": "prod",
    "MONGODB_URI": "${MONGODB_URI}",
    "CORS_ORIGIN": "${CORS}",
    "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
  }
}
ENVEOF

echo "Updating Lambda environment variables..."

for FUNC in yormenops-posts yormenops-comments yormenops-health yormenops-seed; do
  echo "  → $FUNC"
  aws lambda update-function-configuration \
    --function-name "$FUNC" \
    --environment "file:///tmp/lambda-env.json" \
    --region "$REGION" \
    --no-cli-pager \
    --query 'FunctionName' \
    --output text
  aws lambda wait function-updated \
    --function-name "$FUNC" \
    --region "$REGION"
done

echo ""
echo "✅ All functions updated. Verifying..."
aws lambda get-function-configuration \
  --function-name yormenops-posts \
  --region "$REGION" \
  --query 'Environment.Variables' \
  --output json

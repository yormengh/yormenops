#!/usr/bin/env bash
set -euo pipefail

REGION='us-east-2'
CORS='https://d23y79wn0wvbn0.cloudfront.net'

# Write env JSON to a temp file to avoid shell escaping issues
cat > /tmp/lambda-env.json << 'ENVEOF'
{
  "Variables": {
    "NODE_ENV": "prod",
    "MONGODB_URI": "mongodb+srv://yormenops-app:YormenOps2026@yormenops-prod.myqeuvm.mongodb.net/yormenops?retryWrites=true&w=majority",
    "CORS_ORIGIN": "https://d23y79wn0wvbn0.cloudfront.net",
    "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
  }
}
ENVEOF

echo "Env file contents:"
cat /tmp/lambda-env.json

for FUNC in yormenops-posts yormenops-comments yormenops-health yormenops-seed; do
  echo "Updating $FUNC..."
  aws lambda update-function-configuration \
    --function-name "$FUNC" \
    --environment "file:///tmp/lambda-env.json" \
    --region "$REGION" \
    --no-cli-pager \
    --query 'FunctionName' \
    --output text
done

echo ""
echo "Verifying MONGODB_URI on yormenops-health..."
aws lambda get-function-configuration \
  --function-name yormenops-health \
  --region "$REGION" \
  --query 'Environment.Variables.MONGODB_URI' \
  --output text

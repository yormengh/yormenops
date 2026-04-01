#!/usr/bin/env bash
# Usage: ./scripts/set-lambda-env.sh
# Sets MONGODB_URI on all Lambda functions

MONGO_URI='mongodb+srv://yormenops-app:YormenOps2026@yormenops-prod.myqeuvm.mongodb.net/yormenops?retryWrites=true&w=majority'
CORS='https://d23y79wn0wvbn0.cloudfront.net'
REGION='us-east-2'

ENV_JSON=$(printf '{"Variables":{"NODE_ENV":"prod","MONGODB_URI":"%s","CORS_ORIGIN":"%s","AWS_NODEJS_CONNECTION_REUSE_ENABLED":"1"}}' "$MONGO_URI" "$CORS")

for FUNC in yormenops-posts yormenops-comments yormenops-health yormenops-seed; do
  echo "Updating $FUNC..."
  aws lambda update-function-configuration \
    --function-name "$FUNC" \
    --environment "$ENV_JSON" \
    --region "$REGION" \
    --no-cli-pager \
    --query 'FunctionName' \
    --output text
done

echo "Done. Verifying..."
aws lambda get-function-configuration \
  --function-name yormenops-health \
  --region "$REGION" \
  --query 'Environment.Variables.MONGODB_URI' \
  --output text

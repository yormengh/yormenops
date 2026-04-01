'use strict'

const { connectDB } = require('../db/connection')
const { Post }      = require('../db/models')
const { ok, serverErr, withErrorHandling } = require('../middleware/response')

const SEED_POSTS = [
  {
    title:      'Zero-Downtime Kubernetes Deployments with Helm & GitHub Actions',
    authorName: 'Moses Amartey',
    tags:       ['devops', 'k8s', 'cicd'],
    body: `## The Problem

Every DevOps engineer has been there — you push a deployment and your monitoring goes wild. Pods are crashing, users are seeing 502s, and you're frantically running \`kubectl rollout undo\`.

Here's how to never experience that again.

## The Strategy

We combine three things:
1. **Helm** for templated, versioned releases
2. **GitHub Actions** for the CI/CD pipeline
3. **Kubernetes rolling updates** with proper health probes

## Helm Values

\`\`\`yaml
replicaCount: 3

strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
\`\`\`

## GitHub Actions Pipeline

\`\`\`yaml
- name: Deploy with Helm
  run: |
    helm upgrade --install my-app ./charts/app \\
      --atomic \\
      --timeout 5m \\
      --set image.tag=$GITHUB_SHA
\`\`\`

> The \`--atomic\` flag is your safety net — if the rollout fails health checks, Helm automatically rolls back.

## Key Takeaways

- Always set \`maxUnavailable: 0\` to guarantee zero downtime
- Readiness probes gate traffic; liveness probes restart stuck pods
- OIDC auth over static credentials — always
- \`--atomic\` in Helm = auto-rollback on failure`,
  },
  {
    title:      'Serverless on AWS: Lambda + API Gateway + MongoDB Atlas — The Complete Pattern',
    authorName: 'Moses Amartey',
    tags:       ['aws', 'devops', 'terraform'],
    body: `## Why Serverless?

When you're running a blog platform, you don't need EC2 humming 24/7. Lambda gives you:
- **Zero idle cost** — you pay only for invocations
- **Infinite scale** — AWS handles concurrency
- **No server management** — no patching, no AMIs

## The Architecture

\`\`\`
CloudFront → S3              (frontend)
     ↓
API Gateway → Lambda         (backend)
     ↓
MongoDB Atlas                (database)
\`\`\`

## Lambda Cold Start Optimisation

The biggest gotcha with Lambda + MongoDB is connection overhead. Here's the pattern:

\`\`\`javascript
let cachedConnection = null

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection  // Reuse warm connection
  }
  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 1,           // One connection per instance
    serverSelectionTimeoutMS: 5000,
  })
  return cachedConnection
}
\`\`\`

The key is \`context.callbackWaitsForEmptyEventLoop = false\` — this tells Lambda not to wait for the event loop to drain before returning, which lets the DB connection stay alive between warm invocations.

## Terraform Module

\`\`\`hcl
resource "aws_lambda_function" "api" {
  function_name = "yormenops-api"
  runtime       = "nodejs20.x"
  handler       = "src/handlers/posts.listPosts"
  
  environment {
    variables = {
      MONGODB_URI  = var.mongodb_uri
      CORS_ORIGIN  = var.frontend_url
    }
  }
}
\`\`\`

## Pro Tips

- Use Lambda Layers for \`node_modules\` — keeps your deployment package tiny
- Set reserved concurrency to avoid thundering herd against MongoDB
- Use AWS Secrets Manager for \`MONGODB_URI\`, not plain env vars`,
  },
  {
    title:      'DevSecOps Pipeline: Embedding Security Into Every Git Push',
    authorName: 'Moses Amartey',
    tags:       ['devsecops', 'security', 'cicd'],
    body: `## Security as Code, Not an Afterthought

Most teams treat security as a gate at the end — a checklist before prod. That's backwards.

## The 5 Pipeline Gates

### 1. Pre-commit: Gitleaks

\`\`\`bash
gitleaks detect --source . --verbose
\`\`\`

Never commit secrets. This runs before every push.

### 2. SAST: Semgrep

\`\`\`yaml
- uses: semgrep/semgrep-action@v1
  with:
    config: p/owasp-top-ten p/nodejs
\`\`\`

### 3. Container Scanning: Trivy

\`\`\`yaml
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: ECR_REGISTRY/IMAGE_NAME:GIT_SHA
    severity: CRITICAL,HIGH
    exit-code: 1
\`\`\`

### 4. IaC Scanning: Checkov

\`\`\`bash
checkov -d ./infrastructure --framework terraform
\`\`\`

### 5. Dependency Audit

\`\`\`bash
npm audit --audit-level=high
\`\`\`

## SOC2 Controls You Get For Free

| Control | Implementation |
|---------|---------------|
| CC6.1 | OIDC — no static AWS keys |
| CC7.1 | Trivy + Semgrep vulnerability management |
| CC8.1 | Git + CI gates for change management |

> Security isn't a product. It's a practice.`,
  },
]

const seedDatabase = withErrorHandling(async (event) => {
  // Guard: only allow in non-production or with a secret token
  const token = event?.queryStringParameters?.token
  if (process.env.NODE_ENV === 'production' && token !== process.env.SEED_TOKEN) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  await connectDB()

  const existing = await Post.countDocuments()
  if (existing > 0) {
    return ok({ message: `Skipped — ${existing} posts already exist`, seeded: 0 })
  }

  const posts = await Post.insertMany(SEED_POSTS)
  return ok({ message: 'Database seeded', seeded: posts.length })
})

module.exports = { seedDatabase }

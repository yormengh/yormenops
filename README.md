# 🛸 YormenOps — Tech & DevOps Journal

> **Moses Amartey's** serverless tech & DevOps journal — powered by AWS Lambda, MongoDB Atlas, API Gateway, CloudFront + S3, and ECR. All infrastructure in `us-east-2`.

[![Lambda Deploy](https://github.com/yormengh/yormenops/actions/workflows/lambda.yml/badge.svg)](https://github.com/yormengh/yormenops/actions/workflows/lambda.yml)
[![Frontend Deploy](https://github.com/yormengh/yormenops/actions/workflows/frontend.yml/badge.svg)](https://github.com/yormengh/yormenops/actions/workflows/frontend.yml)
[![Infra](https://github.com/yormengh/yormenops/actions/workflows/infra.yml/badge.svg)](https://github.com/yormengh/yormenops/actions/workflows/infra.yml)
[![Security](https://github.com/yormengh/yormenops/actions/workflows/security.yml/badge.svg)](https://github.com/yormengh/yormenops/actions/workflows/security.yml)

---

## ✨ Features

- **Futuristic glassmorphism UI** — neon accents, blurred panels, space-age dark theme
- **Markdown editor** with live preview and per-language syntax-highlighted code blocks with copy button
- **Tags** — DevOps, AWS, Kubernetes, Terraform, Lambda, MongoDB, CI/CD, Docker, Security, Linux
- **Reaction system** — 🔥 🚀 🧠 🐛 ⭐ (stored in MongoDB, per-reaction counters)
- **Comments** — embedded in MongoDB Post document, served via Lambda
- **Auto-excerpt** — generated from post body (strips markdown syntax) via Mongoose pre-save hook
- **Auto read time** — calculated at write time (~200 wpm)
- **View counter** — incremented atomically on each post read

---

## 🏗️ Architecture

```
Browser
  │
  ├── CloudFront → S3          (React SPA — static assets, edge-cached)
  │
  └── API Gateway (HTTP API v2)
        │
        ├── GET  /api/posts           → Lambda: yormenops-posts
        ├── POST /api/posts           → Lambda: yormenops-posts
        ├── GET  /api/posts/{id}      → Lambda: yormenops-posts
        ├── PUT  /api/posts/{id}      → Lambda: yormenops-posts
        ├── DELETE /api/posts/{id}    → Lambda: yormenops-posts
        ├── POST /api/posts/{id}/react→ Lambda: yormenops-posts
        ├── GET  /api/tags            → Lambda: yormenops-posts
        ├── GET  /api/posts/{id}/comments  → Lambda: yormenops-comments
        ├── POST /api/posts/{id}/comments  → Lambda: yormenops-comments
        ├── DELETE /posts/{id}/comments/{cid} → Lambda: yormenops-comments
        ├── GET  /api/health          → Lambda: yormenops-health
        └── POST /api/seed            → Lambda: yormenops-seed
                │
                └── MongoDB Atlas Serverless (us-east-2)
                      └── Database: yormenops
                            └── Collection: posts
                                  (comments embedded as subdocuments)
```

### AWS Infrastructure (us-east-2)

| Service | Purpose | Config |
|---------|---------|--------|
| **CloudFront + S3** | Frontend CDN | Edge-cached SPA, HTTPS, OAC-only S3 access |
| **API Gateway v2** | HTTP API | Throttled (50 rps / 100 burst), access logs to CloudWatch |
| **Lambda × 4** | Backend handlers | Node.js 20, 256MB, 29s timeout, X-Ray tracing |
| **Lambda Layer** | `mongoose` + `slugify` | Shared across all functions, reduces cold start |
| **ECR** | Container images | Immutable tags, scan-on-push, lifecycle policies |
| **MongoDB Atlas** | Database | Serverless instance, pay-per-operation, PITR backups |
| **Secrets Manager** | MongoDB URI | Encrypted, versioned, IAM-controlled access |
| **IAM OIDC** | GitHub Actions auth | Zero static credentials |

---

## 📁 Project Structure

```
yormenops/
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── components/              # Navbar, Layout, PostCard
│   │   ├── pages/                   # Home, PostDetail, NewPost, EditPost, TagFeed
│   │   ├── utils/                   # api.js (API GW client), tags.js
│   │   └── styles/globals.css       # Design system — glassmorphism
│   ├── public/favicon.svg
│   ├── Dockerfile                   # Multi-stage: Vite build → nginx:alpine
│   └── nginx.conf
│
├── lambda/                          # Lambda handlers (no Express — pure functions)
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js        # Cached mongoose connection (warm reuse)
│   │   │   └── models.js            # Post + Comment schemas, hooks, indexes
│   │   ├── middleware/
│   │   │   └── response.js          # API GW v2 response builder, error wrapper
│   │   ├── handlers/
│   │   │   ├── posts.js             # listPosts, getPost, createPost, updatePost,
│   │   │   │                        # deletePost, reactToPost, listTags
│   │   │   ├── comments.js          # listComments, addComment, deleteComment
│   │   │   ├── health.js            # healthCheck (DB ping + latency)
│   │   │   └── seed.js              # seedDatabase (3 starter DevOps posts)
│   │   └── local.js                 # Local dev server (simulates API GW events)
│   └── layers/mongodb/nodejs/       # Lambda Layer: mongoose + slugify
│
├── infrastructure/
│   ├── bootstrap/                   # Run once: creates S3 state bucket + DynamoDB lock
│   │   └── main.tf
│   ├── modules/
│   │   ├── lambda/                  # 4 functions, IAM role, Layer, CloudWatch
│   │   ├── api-gateway/             # HTTP API v2, all routes, Lambda permissions
│   │   ├── mongodb/                 # Atlas Serverless, DB user, Secrets Manager
│   │   ├── s3-cloudfront/           # S3 (private OAC), CloudFront distribution
│   │   ├── ecr/                     # frontend + lambda repos, lifecycle policies
│   │   └── iam/                     # GitHub OIDC provider + deploy role
│   └── environments/prod/
│       ├── main.tf                  # Wires all modules
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars.example
│
├── .github/workflows/
│   ├── lambda.yml       # lint → build zip → Trivy → ECR push → Lambda deploy
│   ├── frontend.yml     # build → S3 sync (smart cache) → CloudFront invalidation
│   ├── infra.yml        # fmt → init → validate → Checkov → plan/apply
│   └── security.yml     # Gitleaks + Semgrep + npm audit + Checkov (scheduled weekly)
│
├── scripts/
│   ├── init.sh          # Start MongoDB (Docker) + Lambda local API + Vite
│   ├── teardown.sh      # Stop all local services
│   ├── build-lambda.sh  # Build lambda.zip + mongodb-layer.zip
│   └── deploy.sh        # Manual emergency deploy (lambda | frontend | all)
│
└── docker-compose.yml   # MongoDB only (Lambda runs natively for local dev)
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Docker (for MongoDB)
- Node.js 20+

### One command

```bash
git clone https://github.com/yormengh/yormenops.git
cd yormenops
./scripts/init.sh
```

This starts MongoDB in Docker, installs deps, starts the Lambda local API server on `:4000`, seeds 3 DevOps posts, and starts the Vite dev server on `:3000`.

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api/health
- **MongoDB**: `mongodb://localhost:27017/yormenops`

Stop everything: `./scripts/teardown.sh`

---

## ☁️ Deploying to AWS

### Step 1 — Bootstrap Terraform remote state (once)

```bash
cd infrastructure/bootstrap
terraform init && terraform apply
# Note the outputs — paste into environments/prod/main.tf backend block
```

### Step 2 — Get MongoDB Atlas credentials

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) (free)
2. Create an Organization API Key: **Access Manager → API Keys**
3. Note your `Org ID`, `Public Key`, `Private Key`

### Step 3 — Build Lambda artifacts

```bash
./scripts/build-lambda.sh
# Produces: lambda/lambda.zip + lambda/mongodb-layer.zip
```

### Step 4 — Apply infrastructure

```bash
cd infrastructure/environments/prod
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

export TF_VAR_atlas_private_key="your-key"
export TF_VAR_db_password="strong-password"

terraform -chdir=infrastructure/environments/prod init
terraform -chdir=infrastructure/environments/prod plan
terraform -chdir=infrastructure/environments/prod apply

```

### Step 5 — Set GitHub Actions secrets

| Secret | Where to get it |
|--------|----------------|
| `AWS_ROLE_ARN` | `terraform output github_actions_role_arn` |
| `S3_BUCKET_NAME` | `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` |
| `VITE_API_URL` | `terraform output api_endpoint` + `/api` |
| `ATLAS_ORG_ID` | cloud.mongodb.com |
| `ATLAS_PUBLIC_KEY` | cloud.mongodb.com |
| `ATLAS_PRIVATE_KEY` | cloud.mongodb.com |
| `DB_PASSWORD` | Your chosen password |
| `GITHUB_ORG` | `yormengh` |

### Step 6 — Push to main

```bash
git push origin main
# lambda.yml  → builds, scans, deploys all 4 Lambda functions
# frontend.yml → builds React, syncs to S3, invalidates CloudFront
```

---

## 📊 Monitoring & Observability

All CloudWatch resources are managed by `infrastructure/modules/monitoring/`.

### Dashboard

After `terraform apply`, get the direct dashboard URL:
```bash
terraform output dashboard_url
```
Opens the **YormenOps Overview** dashboard with 6 rows covering every layer of the stack.

### Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| `yormenops-posts-errors` | Lambda Errors | ≥ 5 / min | SNS email |
| `yormenops-comments-errors` | Lambda Errors | ≥ 5 / min | SNS email |
| `yormenops-posts-throttles` | Lambda Throttles | ≥ 5 / min | SNS |
| `yormenops-posts-duration-p99` | Lambda P99 Duration | ≥ 10 000ms | SNS |
| `yormenops-lambda-concurrency` | Concurrent Executions | ≥ 50 | SNS |
| `yormenops-posts-cold-starts` | InitDuration count | ≥ 10 / 5 min | SNS |
| `yormenops-apigw-5xx-errors` | API GW 5xx | ≥ 10 / min | SNS email |
| `yormenops-apigw-4xx-spike` | API GW 4xx | ≥ 50 / min | SNS |
| `yormenops-apigw-latency-p99` | Integration latency | ≥ 5 000ms | SNS |
| `yormenops-db-connection-errors` | Custom metric filter | ≥ 1 / min | SNS email |
| `yormenops-service-degraded` | **Composite** — posts errors AND apigw 5xx | Both firing | SNS email |

Enable email alerts by setting `alert_email` in `terraform.tfvars`.

### Custom Metric Filters (extracted from Lambda logs)

| Metric | Namespace | Filter Pattern |
|--------|-----------|----------------|
| `DBConnectionErrors` | `YormenOps/Lambda` | Log lines matching `DB*Connection*failed` |
| `UnhandledErrors` | `YormenOps/Lambda` | Log lines matching `ERROR` |
| `ColdStarts` | `YormenOps/Lambda` | Log lines matching `INIT_START` |
| `SlowDBQueries` | `YormenOps/Lambda` | Structured JSON where `dbLatencyMs > 1000` |

### Saved Log Insights Queries

8 queries pre-loaded in CloudWatch Log Insights — find them under **Queries → Saved**:

- **Lambda Errors — Last Hour** — All `ERROR` lines across all functions
- **Lambda Cold Starts — Frequency** — Cold start count + avg init duration over 5-min bins
- **Lambda P99 Duration by Function** — Percentile breakdown + billed seconds
- **MongoDB Latency Distribution** — `dbLatencyMs` avg / p95 / p99 / max over time
- **API Gateway — Errors by Route** — Which routes are returning 4xx/5xx and how often
- **API Gateway — Request Volume by Route** — Traffic, success rate, latency per route
- **API Gateway — Slow Requests (>3s)** — Individual slow requests with source IP
- **API Gateway — Top Source IPs** — Who is calling the API most

### Log Groups & Retention

| Log Group | Retention | Purpose |
|-----------|-----------|---------|
| `/aws/lambda/yormenops-posts` | 30 days | Lambda handler logs |
| `/aws/lambda/yormenops-comments` | 30 days | Lambda handler logs |
| `/aws/lambda/yormenops-health` | 30 days | Lambda handler logs |
| `/aws/lambda/yormenops-seed` | 30 days | Lambda handler logs |
| `/aws/apigateway/yormenops` | 14 days | API GW access logs (structured JSON) |
| `/aws/apigateway/yormenops/execution` | 7 days | API GW execution logs (verbose) |
| `/yormenops/application` | 30 days | Application-level structured logs |
| `yormenops-cf-access-logs-prod` (S3) | 30 days | CloudFront access logs |

Tune retention via `log_retention_days` in `terraform.tfvars`.

---

## 🔒 Security Controls

| Control | Implementation |
|---------|---------------|
| No static AWS keys | GitHub OIDC → `sts:AssumeRoleWithWebIdentity` |
| Container scanning | Trivy on every ECR push — blocks CRITICAL/HIGH |
| Secrets scanning | Gitleaks on every push + weekly schedule |
| SAST | Semgrep (OWASP Top 10 + Node.js rules) |
| IaC scanning | Checkov on every Terraform PR |
| Dependency audit | `npm audit --audit-level=high` for both packages |
| DB credentials | Stored in Secrets Manager, never in env vars directly |
| S3 never public | OAC-only access via CloudFront |
| Lambda least privilege | Per-function IAM with minimal action set |
| API rate limiting | 50 rps / 100 burst per stage in API Gateway |
| Input validation | Mongoose schema validation + handler-level checks |

---

## 📡 API Reference

All routes prefixed `/api`. Base URL from `terraform output api_endpoint`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | DB ping + latency |
| `GET` | `/posts?tag=&limit=&offset=&q=` | List posts (filterable) |
| `POST` | `/posts` | Create post |
| `GET` | `/posts/:id` | Get post (increments views) |
| `PUT` | `/posts/:id` | Update post |
| `DELETE` | `/posts/:id` | Delete post |
| `POST` | `/posts/:id/react` | `{ reaction: "fire" }` |
| `GET` | `/posts/:id/comments` | List comments |
| `POST` | `/posts/:id/comments` | Add comment |
| `DELETE` | `/posts/:id/comments/:cid` | Delete comment |
| `GET` | `/tags` | All tags with counts |
| `POST` | `/seed` | Seed starter posts |

---

## 🧑‍💻 Built by

**Moses Amartey** ([@yormengh](https://github.com/yormengh)) — Senior DevOps Engineer, Accra, Ghana  
[linkedin.com/in/moses-amartey](https://linkedin.com/in/moses-amartey) · [github.com/yormengh](https://github.com/yormengh)

> *"No servers to manage. No idle costs. Just infrastructure as code and knowledge as posts."*

---
*YormenOps // Lambda + MongoDB Atlas + CloudFront // us-east-2 ☁️*

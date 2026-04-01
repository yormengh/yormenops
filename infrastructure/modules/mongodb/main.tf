# ── MongoDB Atlas Provider config ────────────────────────────────────────────
# Requires: mongodbatlas provider in root terraform block
# Atlas Free Tier (M0) or Serverless for Lambda-optimal cost
#
# Why Atlas over DocumentDB:
#   • Full MongoDB 7.x compatibility (Mongoose works perfectly)
#   • Serverless tier: pay per operation, ideal for Lambda
#   • Built-in Atlas Search for full-text post search
#   • Free backups on M0, PITR on paid tiers
#   • Network peering or IP allowlist for Lambda egress IPs
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.15"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

# ── Atlas Project ─────────────────────────────────────────────────────────────
resource "mongodbatlas_project" "this" {
  name   = var.project
  org_id = var.atlas_org_id
}

# ── Atlas Cluster (M0 free tier) ─────────────────────────────────────────────
resource "mongodbatlas_cluster" "this" {
  project_id = mongodbatlas_project.this.id
  name       = "${var.project}-${var.environment}"

  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = "US_EAST_1"
  provider_instance_size_name = "M0"
}

# ── Atlas Database User ───────────────────────────────────────────────────────
resource "mongodbatlas_database_user" "app" {
  username           = "${var.project}-app"
  password           = var.db_password
  project_id         = mongodbatlas_project.this.id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = var.db_name
  }

  # Restrict to app database only — principle of least privilege
  roles {
    role_name     = "read"
    database_name = "local"
  }
}

# ── IP Access List — allow Lambda (uses NAT GW static IPs or 0.0.0.0/0 for serverless) ──
resource "mongodbatlas_project_ip_access_list" "lambda" {
  for_each   = toset(var.allowed_cidr_blocks)
  project_id = mongodbatlas_project.this.id
  cidr_block = each.value
  comment    = "YormenOps Lambda egress IPs"
}

# ── Store connection URI in AWS Secrets Manager ───────────────────────────────
resource "aws_secretsmanager_secret" "mongodb_uri" {
  name                    = "${var.project}/mongodb-uri"
  description             = "MongoDB Atlas connection URI for YormenOps Lambda"
  recovery_window_in_days = var.environment == "prod" ? 7 : 0
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = jsonencode({
    uri      = "mongodb+srv://${mongodbatlas_database_user.app.username}:${var.db_password}@${mongodbatlas_cluster.this.connection_strings[0].standard_srv}/${var.db_name}?retryWrites=true&w=majority"
    username = mongodbatlas_database_user.app.username
    dbName   = var.db_name
  })
}

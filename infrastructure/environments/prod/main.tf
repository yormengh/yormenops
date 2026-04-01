terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.15"
    }
  }

  backend "s3" {
    bucket         = "yormenops-tfstate-us-east-2"
    key            = "prod/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "yormenops-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
  default_tags { tags = local.tags }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

locals {
  project     = "yormenops"
  environment = "prod"
  tags = {
    Project     = "yormenops"
    Environment = "prod"
    ManagedBy   = "terraform"
    Owner       = "moses-amartey"
    Region      = var.region
  }
}

data "aws_caller_identity" "current" {}

# ── S3 + CloudFront (frontend) ────────────────────────────────────────────────
module "s3_cloudfront" {
  source      = "../../modules/s3-cloudfront"
  project     = local.project
  environment = local.environment
  domain_name = var.domain_name
  tags        = local.tags
}

# ── ECR (container images) ────────────────────────────────────────────────────
module "ecr" {
  source  = "../../modules/ecr"
  project = local.project
  tags    = local.tags
}

# ── MongoDB Atlas ─────────────────────────────────────────────────────────────
module "mongodb" {
  source       = "../../modules/mongodb"
  project      = local.project
  environment  = local.environment
  atlas_org_id = var.atlas_org_id
  db_password  = var.db_password
  db_name      = "yormenops"
  tags         = local.tags
}

# ── Lambda functions ──────────────────────────────────────────────────────────
module "lambda" {
  source                 = "../../modules/lambda"
  project                = local.project
  region                 = var.region
  environment            = local.environment
  lambda_zip_path        = var.lambda_zip_path
  mongodb_layer_zip_path = var.mongodb_layer_zip_path
  mongodb_uri            = var.mongodb_uri_override != "" ? var.mongodb_uri_override : ""
  mongodb_secret_arn     = module.mongodb.secret_arn
  frontend_url           = "https://${module.s3_cloudfront.cloudfront_domain}"
  seed_token             = var.seed_token
  tags                   = local.tags
}

# ── API Gateway ───────────────────────────────────────────────────────────────
module "api_gateway" {
  source                 = "../../modules/api-gateway"
  project                = local.project
  frontend_url           = "https://${module.s3_cloudfront.cloudfront_domain}"
  posts_function_arn     = module.lambda.posts_function_arn
  posts_function_name    = module.lambda.posts_function_name
  comments_function_arn  = module.lambda.comments_function_arn
  comments_function_name = module.lambda.comments_function_name
  health_function_arn    = module.lambda.health_function_arn
  health_function_name   = module.lambda.health_function_name
  seed_function_arn      = module.lambda.seed_function_arn
  seed_function_name     = module.lambda.seed_function_name
  custom_domain_name     = var.api_domain_name
  acm_certificate_arn    = var.acm_certificate_arn
  tags                   = local.tags
}

# ── CloudWatch Monitoring ─────────────────────────────────────────────────────
module "monitoring" {
  source      = "../../modules/monitoring"
  project     = local.project
  region      = var.region
  environment = local.environment

  # Lambda function names
  posts_function_name    = module.lambda.posts_function_name
  comments_function_name = module.lambda.comments_function_name
  health_function_name   = module.lambda.health_function_name

  # API Gateway
  api_gateway_id = module.api_gateway.api_id

  # Alerting
  alert_email = var.alert_email

  # Thresholds (tunable per environment)
  log_retention_days           = var.log_retention_days
  lambda_error_threshold       = 5
  lambda_duration_threshold_ms = 10000
  lambda_concurrency_threshold = 50
  apigw_5xx_threshold          = 10
  apigw_latency_threshold_ms   = 5000

  tags = local.tags
}

# ── IAM (GitHub OIDC) ─────────────────────────────────────────────────────────
module "iam" {
  source        = "../../modules/iam"
  project       = local.project
  github_org    = var.github_org
  github_repo   = var.github_repo
  ecr_repo_arns = [module.ecr.frontend_repo_arn, module.ecr.lambda_repo_arn]
  lambda_function_arns = [
    module.lambda.posts_function_arn,
    module.lambda.comments_function_arn,
    module.lambda.health_function_arn,
    module.lambda.seed_function_arn,
  ]
  frontend_bucket_arn         = module.s3_cloudfront.s3_bucket_arn
  cloudfront_distribution_arn = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${module.s3_cloudfront.cloudfront_distribution_id}"
  tfstate_bucket_arn          = "arn:aws:s3:::yormenops-tfstate-us-east-2"
  tfstate_lock_table_arn      = "arn:aws:dynamodb:us-east-2:${data.aws_caller_identity.current.account_id}:table/yormenops-tfstate-lock"
  tags                        = local.tags
}

# Frontend
output "cloudfront_domain" {
  value = module.s3_cloudfront.cloudfront_domain
}

output "cloudfront_distribution_id" {
  value = module.s3_cloudfront.cloudfront_distribution_id
}

output "s3_bucket_name" {
  value = module.s3_cloudfront.s3_bucket_name
}

# API
output "api_endpoint" {
  value       = module.api_gateway.api_endpoint
  description = "Base URL for all API calls"
}

output "api_invoke_url" {
  value = module.api_gateway.stage_invoke_url
}

# ECR
output "ecr_frontend_url" { value = module.ecr.frontend_repo_url }
output "ecr_lambda_url" { value = module.ecr.lambda_repo_url }
output "ecr_registry_id" { value = module.ecr.registry_id }

# MongoDB
output "mongodb_secret_arn" {
  value = module.mongodb.secret_arn
}

output "mongodb_cluster_name" {
  value = module.mongodb.cluster_name
}

# IAM
output "github_actions_role_arn" {
  value       = module.iam.github_actions_role_arn
  description = "Set as AWS_ROLE_ARN in GitHub Actions secrets"
}

# Lambda
output "lambda_layer_arn" {
  value = module.lambda.layer_arn
}

output "posts_function_name" {
  value = module.lambda.posts_function_name
}

output "comments_function_name" {
  value = module.lambda.comments_function_name
}

# Monitoring
output "dashboard_url" {
  value       = module.monitoring.dashboard_url
  description = "CloudWatch dashboard — open this in your browser"
}

output "sns_alerts_arn" { value = module.monitoring.sns_topic_arn }
output "app_log_group" { value = module.monitoring.app_log_group }
output "cf_logs_bucket" { value = module.monitoring.cf_logs_bucket }

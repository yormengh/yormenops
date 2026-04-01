variable "project" { type = string }
variable "environment" { type = string }

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "lambda_zip_path" {
  type        = string
  description = "Path to lambda.zip built by CI"
}

variable "mongodb_layer_zip_path" {
  type        = string
  description = "Path to mongodb-layer.zip"
}

variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "mongodb_secret_arn" {
  type        = string
  description = "Secrets Manager ARN for MONGODB_URI"
}

variable "frontend_url" {
  type        = string
  description = "CloudFront URL for CORS"
}

variable "seed_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

output "posts_function_name" { value = aws_lambda_function.posts.function_name }
output "posts_function_arn" { value = aws_lambda_function.posts.arn }
output "comments_function_name" { value = aws_lambda_function.comments.function_name }
output "comments_function_arn" { value = aws_lambda_function.comments.arn }
output "health_function_name" { value = aws_lambda_function.health.function_name }
output "health_function_arn" { value = aws_lambda_function.health.arn }
output "seed_function_name" { value = aws_lambda_function.seed.function_name }
output "seed_function_arn" { value = aws_lambda_function.seed.arn }
output "lambda_role_arn" { value = aws_iam_role.lambda.arn }
output "layer_arn" { value = aws_lambda_layer_version.mongodb.arn }

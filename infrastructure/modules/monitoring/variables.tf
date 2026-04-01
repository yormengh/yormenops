variable "project" {
  type        = string
  description = "Project name prefix for all resources"
}

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "posts_function_name" { type = string }
variable "comments_function_name" { type = string }
variable "health_function_name" { type = string }
variable "api_gateway_id" { type = string }

variable "alert_email" {
  type        = string
  default     = ""
  description = "Email address to receive SNS alert notifications (leave empty to skip)"
}

variable "log_retention_days" {
  type        = number
  default     = 30
  description = "CloudWatch log retention in days (7 | 14 | 30 | 60 | 90 | 180 | 365)"
}

variable "lambda_error_threshold" {
  type        = number
  default     = 5
  description = "Number of Lambda errors in one 60s window before alarm fires"
}

variable "lambda_duration_threshold_ms" {
  type        = number
  default     = 10000
  description = "Lambda P99 duration (ms) before duration alarm fires"
}

variable "lambda_concurrency_threshold" {
  type        = number
  default     = 50
  description = "Concurrent Lambda executions before concurrency alarm fires"
}

variable "apigw_5xx_threshold" {
  type        = number
  default     = 10
  description = "Number of API Gateway 5xx responses in one 60s window before alarm fires"
}

variable "apigw_latency_threshold_ms" {
  type        = number
  default     = 5000
  description = "API Gateway P99 integration latency (ms) before latency alarm fires"
}

variable "tags" {
  type    = map(string)
  default = {}
}

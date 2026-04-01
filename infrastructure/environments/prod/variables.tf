variable "region" {
  type    = string
  default = "us-east-2"
}

variable "github_org" {
  type    = string
  default = "yormengh"
}

variable "github_repo" {
  type    = string
  default = "yormenops"
}

# MongoDB Atlas
variable "atlas_org_id" {
  type        = string
  description = "Atlas Org ID from cloud.mongodb.com"
}

variable "atlas_public_key" {
  type      = string
  sensitive = true
}

variable "atlas_private_key" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "mongodb_uri_override" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Override URI (leave empty to use Atlas-generated URI from module)"
}

# Lambda artefact paths — built by CI before terraform apply
variable "lambda_zip_path" {
  type    = string
  default = "../../../lambda/lambda.zip"
}

variable "mongodb_layer_zip_path" {
  type    = string
  default = "../../../lambda/mongodb-layer.zip"
}

# Domains (optional — leave empty for CloudFront/APIGW default domains)
variable "domain_name" {
  type        = string
  default     = ""
  description = "Custom domain for CloudFront"
}

variable "api_domain_name" {
  type        = string
  default     = ""
  description = "Custom domain for API Gateway"
}

variable "acm_certificate_arn" {
  type        = string
  default     = ""
  description = "ACM cert (us-east-1 for CF, regional for APIGW)"
}

variable "seed_token" {
  type      = string
  default   = ""
  sensitive = true
}

variable "alert_email" {
  type        = string
  default     = ""
  description = "Email for CloudWatch SNS alerts — leave empty to skip email subscription"
}

variable "log_retention_days" {
  type        = number
  default     = 30
  description = "CloudWatch log retention in days"
}

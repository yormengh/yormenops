variable "project" { type = string }
variable "environment" { type = string }

variable "atlas_org_id" {
  type        = string
  description = "MongoDB Atlas Organization ID"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_name" {
  type    = string
  default = "yormenops"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "CIDRs allowed to connect to Atlas"
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  type    = map(string)
  default = {}
}

output "secret_arn" { value = aws_secretsmanager_secret.mongodb_uri.arn }
output "secret_name" { value = aws_secretsmanager_secret.mongodb_uri.name }
output "atlas_project_id" { value = mongodbatlas_project.this.id }
output "cluster_name" { value = mongodbatlas_cluster.this.name }

output "connection_string_srv" {
  value     = mongodbatlas_cluster.this.connection_strings[0].standard_srv
  sensitive = true
}

# ── Variables ──────────────────────────────────────────────────────────────────
variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "mongodb_atlas_org_id" { # Fixed: consistent naming
  type        = string
  description = "MongoDB Atlas Organization ID"
  sensitive   = true
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







variable "project" { type = string }
variable "frontend_url" { type = string }
variable "posts_function_arn" { type = string }
variable "posts_function_name" { type = string }
variable "comments_function_arn" { type = string }
variable "comments_function_name" { type = string }
variable "health_function_arn" { type = string }
variable "health_function_name" { type = string }
variable "seed_function_arn" { type = string }
variable "seed_function_name" { type = string }

variable "custom_domain_name" {
  type    = string
  default = ""
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

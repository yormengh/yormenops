terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.40" }
  }
}

provider "aws" { region = "us-east-2" }

locals {
  project = "yormenops"
  tags    = { Project = "yormenops", ManagedBy = "terraform-bootstrap", Owner = "moses-amartey" }
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "${local.project}-tfstate-us-east-2"
  tags   = merge(local.tags, { Name = "${local.project}-tfstate" })
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tfstate_lock" {
  name         = "${local.project}-tfstate-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
  tags = merge(local.tags, { Name = "${local.project}-tfstate-lock" })
  lifecycle { prevent_destroy = true }
}

output "state_bucket" { value = aws_s3_bucket.tfstate.bucket }
output "lock_table" { value = aws_dynamodb_table.tfstate_lock.name }
output "next_steps" {
  value = <<-EOT
  Bootstrap complete!
  Uncomment backend "s3" in infrastructure/environments/prod/main.tf
  bucket         = "${aws_s3_bucket.tfstate.bucket}"
  key            = "prod/terraform.tfstate"
  region         = "us-east-2"
  dynamodb_table = "${aws_dynamodb_table.tfstate_lock.name}"
  EOT
}

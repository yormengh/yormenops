resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project}/frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = var.tags
}

resource "aws_ecr_repository" "lambda" {
  name                 = "${var.project}/lambda"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = var.tags
}

locals {
  lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged after 1 day"
        selection    = { tagStatus = "untagged", countType = "sinceImagePushed", countUnit = "days", countNumber = 1 }
        action       = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep last 10 tagged images"
        selection    = { tagStatus = "tagged", tagPrefixList = ["sha-", "v"], countType = "imageCountMoreThan", countNumber = 10 }
        action       = { type = "expire" }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name
  policy     = local.lifecycle_policy
}

resource "aws_ecr_lifecycle_policy" "lambda" {
  repository = aws_ecr_repository.lambda.name
  policy     = local.lifecycle_policy
}

variable "project" { type = string }

variable "tags" {
  type    = map(string)
  default = {}
}

output "frontend_repo_url" { value = aws_ecr_repository.frontend.repository_url }
output "frontend_repo_arn" { value = aws_ecr_repository.frontend.arn }
output "lambda_repo_url" { value = aws_ecr_repository.lambda.repository_url }
output "lambda_repo_arn" { value = aws_ecr_repository.lambda.arn }
output "registry_id" { value = aws_ecr_repository.frontend.registry_id }

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
  tags            = var.tags
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "github_actions_policy" {
  statement {
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:DescribeImages",
    ]
    resources = var.ecr_repo_arns
  }

  statement {
    effect = "Allow"
    actions = [
      "lambda:UpdateFunctionCode",
      "lambda:PublishLayerVersion",
      "lambda:UpdateFunctionConfiguration",
      "lambda:GetFunction",
    ]
    resources = var.lambda_function_arns
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:DeleteObject", "s3:GetObject", "s3:ListBucket"]
    resources = [var.frontend_bucket_arn, "${var.frontend_bucket_arn}/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [var.cloudfront_distribution_arn]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"]
    resources = [var.tfstate_bucket_arn, "${var.tfstate_bucket_arn}/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = [var.tfstate_lock_table_arn]
  }

  # Terraform plan — read permissions
  statement {
    effect    = "Allow"
    actions   = [
      "iam:GetRole", "iam:GetPolicy", "iam:GetPolicyVersion",
      "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
      "iam:GetOpenIDConnectProvider", "iam:GetRolePolicy",
    ]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups", "logs:ListTagsLogGroup"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:DescribeSecret"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["sns:GetTopicAttributes", "sns:ListTagsForResource"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = [
      "s3:GetBucketPolicy", "s3:GetBucketPublicAccessBlock",
      "s3:GetBucketVersioning", "s3:GetBucketEncryption",
      "s3:GetBucketTagging", "s3:GetBucketLocation",
      "s3:GetLifecycleConfiguration", "s3:GetBucketLogging",
    ]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = [
      "cloudfront:GetDistribution", "cloudfront:GetOriginAccessControl",
      "cloudfront:ListTagsForResource", "cloudfront:GetDistributionConfig",
    ]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["lambda:GetLayerVersion", "lambda:GetFunctionConfiguration", "lambda:ListTags"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["apigateway:GET"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["cloudwatch:DescribeAlarms", "cloudwatch:ListTagsForResource", "cloudwatch:GetDashboard"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["ecr:DescribeRepositories", "ecr:ListTagsForResource", "ecr:GetLifecyclePolicy"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "github_actions" {
  name   = "${var.project}-github-actions-policy"
  policy = data.aws_iam_policy_document.github_actions_policy.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

variable "project" { type = string }
variable "github_org" { type = string }
variable "github_repo" { type = string }
variable "ecr_repo_arns" { type = list(string) }
variable "lambda_function_arns" { type = list(string) }
variable "frontend_bucket_arn" { type = string }
variable "cloudfront_distribution_arn" { type = string }
variable "tfstate_bucket_arn" { type = string }
variable "tfstate_lock_table_arn" { type = string }

variable "tags" {
  type    = map(string)
  default = {}
}

output "github_actions_role_arn" { value = aws_iam_role.github_actions.arn }
output "oidc_provider_arn" { value = aws_iam_openid_connect_provider.github.arn }

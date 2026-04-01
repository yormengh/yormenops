# ── IAM Role for Lambda ───────────────────────────────────────────────────────
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.tags
}

# Basic execution + VPC (for future VPC placement) + Secrets Manager read
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.region}:*:log-group:/aws/lambda/${var.project}-*:*"]
  }

  statement {
    sid    = "SecretsManager"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [var.mongodb_secret_arn]
  }

  statement {
    sid    = "XRay"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["YormenOps/Lambda"]
    }
  }
}

resource "aws_iam_policy" "lambda" {
  name   = "${var.project}-lambda-policy"
  policy = data.aws_iam_policy_document.lambda_policy.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda.arn
}

# ── Lambda Layer — mongoose + slugify ─────────────────────────────────────────
resource "aws_lambda_layer_version" "mongodb" {
  filename            = var.mongodb_layer_zip_path
  layer_name          = "${var.project}-mongodb-layer"
  compatible_runtimes = ["nodejs20.x"]
  description         = "mongoose + slugify for YormenOps"

  lifecycle {
    create_before_destroy = true
  }
}

# ── CloudWatch Log Groups ─────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "functions" {
  for_each          = toset(local.function_names)
  name              = "/aws/lambda/${var.project}-${each.key}"
  retention_in_days = 14
  tags              = var.tags
}

locals {
  function_names = ["posts", "comments", "health", "seed"]

  # Common Lambda config
  common_config = {
    runtime     = "nodejs20.x"
    role        = aws_iam_role.lambda.arn
    timeout     = 29 # API Gateway max is 29s
    memory_size = 256
    layers      = [aws_lambda_layer_version.mongodb.arn]
    environment_variables = {
      NODE_ENV                            = var.environment
      MONGODB_URI                         = var.mongodb_uri # Injected from Secrets Manager at deploy time
      CORS_ORIGIN                         = var.frontend_url
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1" # Reuse HTTP keep-alive connections
    }
  }
}

# ── Lambda Functions ──────────────────────────────────────────────────────────
resource "aws_lambda_function" "posts" {
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  function_name    = "${var.project}-posts"
  role             = local.common_config.role
  handler          = "src/handlers/index.handler" # central dispatcher
  runtime          = local.common_config.runtime
  timeout          = local.common_config.timeout
  memory_size      = local.common_config.memory_size
  layers           = local.common_config.layers

  environment {
    variables = local.common_config.environment_variables
  }

  tracing_config { mode = "Active" }

  tags = merge(var.tags, { Handler = "posts" })

  depends_on = [aws_cloudwatch_log_group.functions]
}

resource "aws_lambda_function" "comments" {
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  function_name    = "${var.project}-comments"
  role             = local.common_config.role
  handler          = "src/handlers/index.handler"
  runtime          = local.common_config.runtime
  timeout          = local.common_config.timeout
  memory_size      = local.common_config.memory_size
  layers           = local.common_config.layers

  environment {
    variables = local.common_config.environment_variables
  }

  tracing_config { mode = "Active" }

  tags = merge(var.tags, { Handler = "comments" })

  depends_on = [aws_cloudwatch_log_group.functions]
}

resource "aws_lambda_function" "health" {
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  function_name    = "${var.project}-health"
  role             = local.common_config.role
  handler          = "src/handlers/index.handler"
  runtime          = local.common_config.runtime
  timeout          = 10
  memory_size      = 128
  layers           = local.common_config.layers

  environment {
    variables = local.common_config.environment_variables
  }

  tags = merge(var.tags, { Handler = "health" })

  depends_on = [aws_cloudwatch_log_group.functions]
}

resource "aws_lambda_function" "seed" {
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  function_name    = "${var.project}-seed"
  role             = local.common_config.role
  handler          = "src/handlers/index.handler"
  runtime          = local.common_config.runtime
  timeout          = 60
  memory_size      = 256
  layers           = local.common_config.layers

  environment {
    variables = merge(local.common_config.environment_variables, {
      SEED_TOKEN = var.seed_token
    })
  }

  tags = merge(var.tags, { Handler = "seed" })

  depends_on = [aws_cloudwatch_log_group.functions]
}

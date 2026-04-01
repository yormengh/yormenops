# ── HTTP API (v2) — cheaper + faster than REST API for this use case ──────────
resource "aws_apigatewayv2_api" "this" {
  name          = "${var.project}-api"
  protocol_type = "HTTP"
  description   = "YormenOps — Tech & DevOps Journal API"

  cors_configuration {
    allow_origins = [var.frontend_url, "http://localhost:3000"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Api-Key"]
    max_age       = 86400
  }

  tags = var.tags
}

# ── Stage ─────────────────────────────────────────────────────────────────────
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      sourceIp           = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      protocol           = "$context.protocol"
      httpMethod         = "$context.httpMethod"
      resourcePath       = "$context.resourcePath"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      responseLength     = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  tags = var.tags
}

# ── CloudWatch Log Group for API GW ──────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.project}"
  retention_in_days = 14
  tags              = var.tags
}

# ── Lambda Integrations ───────────────────────────────────────────────────────
locals {
  integrations = {
    posts    = var.posts_function_arn
    comments = var.comments_function_arn
    health   = var.health_function_arn
    seed     = var.seed_function_arn
  }
}

resource "aws_apigatewayv2_integration" "functions" {
  for_each = local.integrations

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

# ── Routes ────────────────────────────────────────────────────────────────────
locals {
  routes = {
    "GET /api/health"                             = "health"
    "POST /api/seed"                              = "seed"
    "GET /api/tags"                               = "posts"
    "GET /api/posts"                              = "posts"
    "POST /api/posts"                             = "posts"
    "GET /api/posts/{id}"                         = "posts"
    "PUT /api/posts/{id}"                         = "posts"
    "DELETE /api/posts/{id}"                      = "posts"
    "POST /api/posts/{id}/react"                  = "posts"
    "GET /api/posts/{id}/comments"                = "comments"
    "POST /api/posts/{id}/comments"               = "comments"
    "DELETE /api/posts/{id}/comments/{commentId}" = "comments"
  }
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.functions[each.value].id}"
}

# ── Lambda permissions — allow API GW to invoke each function ─────────────────
resource "aws_lambda_permission" "posts" {
  statement_id  = "AllowAPIGatewayPosts"
  action        = "lambda:InvokeFunction"
  function_name = var.posts_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "comments" {
  statement_id  = "AllowAPIGatewayComments"
  action        = "lambda:InvokeFunction"
  function_name = var.comments_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "health" {
  statement_id  = "AllowAPIGatewayHealth"
  action        = "lambda:InvokeFunction"
  function_name = var.health_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "seed" {
  statement_id  = "AllowAPIGatewaySeed"
  action        = "lambda:InvokeFunction"
  function_name = var.seed_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}

# ── API Key for protected write routes (optional layer on top) ─────────────────
resource "aws_apigatewayv2_api_mapping" "custom_domain" {
  count       = var.custom_domain_name != "" ? 1 : 0
  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_apigatewayv2_domain_name" "this" {
  count       = var.custom_domain_name != "" ? 1 : 0
  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

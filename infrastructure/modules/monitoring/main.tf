resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  tags = var.tags
}
resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
locals {
  lambda_functions = {
    posts    = var.posts_function_name
    comments = var.comments_function_name
    health   = var.health_function_name
  }
}
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each            = local.lambda_functions
  alarm_name          = "${var.project}-${each.key}-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 2
  threshold           = var.lambda_error_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = var.tags
}
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "${var.project}-apigw-5xx-errors"
  namespace           = "AWS/ApiGateway"
  metric_name         = "5XXError"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 2
  threshold           = var.apigw_5xx_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  dimensions          = { ApiId = var.api_gateway_id, Stage = "$default" }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  tags                = var.tags
}
resource "aws_cloudwatch_log_metric_filter" "db_errors" {
  name           = "${var.project}-db-errors"
  log_group_name = "/aws/lambda/${var.project}-posts"
  pattern        = "ERROR"
  metric_transformation {
    name          = "DBConnectionErrors"
    namespace     = "YormenOps/Lambda"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
  depends_on = [aws_cloudwatch_log_group.app]
}
resource "aws_cloudwatch_metric_alarm" "db_connection_errors" {
  alarm_name          = "${var.project}-db-connection-errors"
  namespace           = "YormenOps/Lambda"
  metric_name         = "DBConnectionErrors"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = var.tags
}
resource "aws_cloudwatch_composite_alarm" "service_degraded" {
  alarm_name    = "${var.project}-service-degraded"
  alarm_rule    = "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors["posts"].alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.apigw_5xx.alarm_name})"
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = var.tags
}
resource "aws_s3_bucket" "cf_logs" {
  bucket = "${var.project}-cf-access-logs-${var.environment}"
  tags   = var.tags
}
resource "aws_s3_bucket_public_access_block" "cf_logs" {
  bucket                  = aws_s3_bucket.cf_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project}/application"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-overview"
  dashboard_body = jsonencode({ widgets = [
    { type = "text", x = 0, y = 0, width = 24, height = 2,
      properties = { markdown = "# YormenOps | ${var.region}" } },
    { type = "metric", x = 0, y = 2, width = 12, height = 6,
      properties = { title = "Lambda Errors", view = "timeSeries", region = var.region,
        period = 60, stat = "Sum",
        metrics = [["AWS/Lambda", "Errors", "FunctionName", var.posts_function_name]] } },
  ]})
}

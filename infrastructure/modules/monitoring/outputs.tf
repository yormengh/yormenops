output "sns_topic_arn"       { value = aws_sns_topic.alerts.arn }
output "dashboard_name"      { value = aws_cloudwatch_dashboard.main.dashboard_name }
output "cf_logs_bucket"      { value = aws_s3_bucket.cf_logs.bucket }
output "app_log_group"       { value = aws_cloudwatch_log_group.app.name }
output "composite_alarm_arn" { value = aws_cloudwatch_composite_alarm.service_degraded.arn }

output "dashboard_url" {
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
  description = "Direct link to the CloudWatch dashboard in the AWS console"
}

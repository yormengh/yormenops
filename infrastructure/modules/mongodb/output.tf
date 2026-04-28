# ── Outputs ───────────────────────────────────────────────────────────────────
output "secret_arn" {
  value = aws_secretsmanager_secret.mongodb_uri.arn
}

output "secret_name" {
  value = aws_secretsmanager_secret.mongodb_uri.name
}

output "atlas_project_id" {
  value = mongodbatlas_project.this.id
}

output "cluster_name" {
  value = mongodbatlas_cluster.this.name
}

output "connection_string_srv" {
  value     = mongodbatlas_cluster.this.connection_strings[0].standard_srv
  sensitive = true
}

output "connection_uri" {
  value     = "mongodb+srv://${mongodbatlas_database_user.app.username}:${var.db_password}@${mongodbatlas_cluster.this.connection_strings[0].standard_srv}/${var.db_name}?retryWrites=true&w=majority"
  sensitive = true
}
# Outputs for SeedPlanner infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "nat_gateway_ids" {
  description = "List of IDs of the NAT Gateways"
  value       = module.vpc.natgw_ids
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the load balancer"
  value       = aws_lb.main.arn_suffix
}

# Target Group Outputs
output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "frontend_target_group_arn" {
  description = "ARN of the Frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "api_task_definition_arn" {
  description = "ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "frontend_task_definition_arn" {
  description = "ARN of the Frontend task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

# Database Outputs
output "mongodb_endpoint" {
  description = "MongoDB endpoint"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].endpoint : "Use MongoDB Atlas or external MongoDB"
}

output "mongodb_port" {
  description = "MongoDB port"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].port : "27017"
}

output "mongodb_reader_endpoint" {
  description = "MongoDB reader endpoint"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].reader_endpoint : "Use MongoDB Atlas or external MongoDB"
}

# S3 Outputs
output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.app_storage.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.app_storage.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.app_storage.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.app_storage.bucket_regional_domain_name
}

# Security Group Outputs
output "mongodb_security_group_id" {
  description = "ID of the MongoDB security group"
  value       = aws_security_group.mongodb.id
}

output "api_security_group_id" {
  description = "ID of the API security group"
  value       = aws_security_group.api.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

# CloudWatch Outputs
output "api_log_group_name" {
  description = "Name of the API CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

output "frontend_log_group_name" {
  description = "Name of the Frontend CloudWatch log group"
  value       = aws_cloudwatch_log_group.frontend.name
}

# IAM Outputs
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

# Application URLs
output "application_url" {
  description = "URL of the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "URL of the API"
  value       = "http://${aws_lb.main.dns_name}/api"
}

# Connection Information
output "mongodb_connection_string" {
  description = "MongoDB connection string"
  value       = var.use_documentdb ? "mongodb://${var.mongodb_username}:${var.mongodb_password}@${aws_docdb_cluster.mongodb[0].endpoint}:27017/seedplanner?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" : var.mongodb_uri
  sensitive   = true
}

# Environment Variables for Application
output "environment_variables" {
  description = "Environment variables for the application"
  value = {
    NODE_ENV                = "production"
    PORT                    = "4000"
    MONGODB_URI            = var.use_documentdb ? "mongodb://${var.mongodb_username}:${var.mongodb_password}@${aws_docdb_cluster.mongodb[0].endpoint}:27017/seedplanner?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" : var.mongodb_uri
    VITE_API_BASE_URL      = "http://${aws_lb.main.dns_name}/api"
    S3_BUCKET_NAME         = aws_s3_bucket.app_storage.bucket
    AWS_REGION             = var.aws_region
  }
  sensitive = true
}


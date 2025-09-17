# Variables for SeedPlanner infrastructure

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "seedplanner"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

# Database Configuration
variable "use_documentdb" {
  description = "Whether to use AWS DocumentDB instead of MongoDB Atlas"
  type        = bool
  default     = true  # Changed to true for DocumentDB-first approach
}

variable "mongodb_uri" {
  description = "MongoDB connection URI (for MongoDB Atlas)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "mongodb_username" {
  description = "MongoDB username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "mongodb_password" {
  description = "MongoDB password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "mongodb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

# ECS Configuration
variable "api_cpu" {
  description = "CPU units for API container"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "Memory for API container"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for Frontend container"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for Frontend container"
  type        = number
  default     = 512
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret for API authentication"
  type        = string
  sensitive   = true
}

# GitHub Integration Configuration
variable "github_webhook_secret" {
  description = "GitHub webhook secret for signature verification"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_app_id" {
  description = "GitHub App ID (if using GitHub App)"
  type        = string
  default     = ""
}

variable "github_private_key" {
  description = "GitHub App private key (if using GitHub App)"
  type        = string
  sensitive   = true
  default     = ""
}

# File Upload Configuration
variable "max_file_upload_size" {
  description = "Maximum file upload size in bytes"
  type        = string
  default     = "10485760"  # 10MB
}

variable "allowed_file_types" {
  description = "Comma-separated list of allowed file types"
  type        = string
  default     = "csv,xlsx,pdf,doc,docx,txt"
}

# Report Generation Configuration
variable "enable_report_generation" {
  description = "Enable report generation features"
  type        = bool
  default     = true
}

variable "report_retention_days" {
  description = "Number of days to retain generated reports"
  type        = number
  default     = 90
}

# Secrets Manager Configuration
variable "use_secrets_manager" {
  description = "Use AWS Secrets Manager for sensitive configuration"
  type        = bool
  default     = true
}

variable "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  type        = string
  default     = "seedplanner-app-secrets"
}

# Lambda Configuration
variable "enable_lambda_functions" {
  description = "Enable Lambda functions for serverless operations"
  type        = bool
  default     = true
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

# Scaling Configuration
variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "target_memory_utilization" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

# Security Configuration
variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = false
}

# Backup Configuration
variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Backup window"
  type        = string
  default     = "07:00-09:00"
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}


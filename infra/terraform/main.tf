# Main Terraform configuration for SeedPlanner infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    mongodb = {
      source  = "mongodb/mongodb"
      version = "~> 1.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SeedPlanner"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Security Groups
resource "aws_security_group" "mongodb" {
  name_prefix = "${var.project_name}-mongodb-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-mongodb-sg"
  }
}

resource "aws_security_group" "api" {
  name_prefix = "${var.project_name}-api-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-api-sg"
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "app_storage" {
  bucket = "${var.project_name}-storage-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-storage"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket CORS configuration for file uploads
resource "aws_s3_bucket_cors_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE"]
    allowed_origins = ["https://${var.domain_name != "" ? var.domain_name : aws_lb.main.dns_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket policy for ECS task role access
resource "aws_s3_bucket_policy" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# RDS for MongoDB Atlas or DocumentDB
resource "aws_docdb_cluster" "mongodb" {
  count = var.use_documentdb ? 1 : 0
  
  cluster_identifier      = "${var.project_name}-mongodb"
  engine                  = "docdb"
  master_username         = var.mongodb_username
  master_password         = var.mongodb_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot    = true

  vpc_security_group_ids = [aws_security_group.mongodb.id]
  db_subnet_group_name   = aws_docdb_subnet_group.mongodb[0].name

  tags = {
    Name = "${var.project_name}-mongodb-cluster"
  }
}

resource "aws_docdb_subnet_group" "mongodb" {
  count = var.use_documentdb ? 1 : 0
  
  name       = "${var.project_name}-mongodb-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "${var.project_name}-mongodb-subnet-group"
  }
}

resource "aws_docdb_cluster_instance" "mongodb" {
  count = var.use_documentdb ? 1 : 0
  
  identifier         = "${var.project_name}-mongodb-instance"
  cluster_identifier = aws_docdb_cluster.mongodb[0].id
  instance_class     = var.mongodb_instance_class
}

# AWS Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "app_secrets" {
  count = var.use_secrets_manager ? 1 : 0
  
  name        = var.secrets_manager_secret_name
  description = "Secrets for SeedPlanner application"
  
  tags = {
    Name = "${var.project_name}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  count = var.use_secrets_manager ? 1 : 0
  
  secret_id = aws_secretsmanager_secret.app_secrets[0].id
  
  secret_string = jsonencode({
    jwt_secret              = var.jwt_secret
    github_webhook_secret   = var.github_webhook_secret
    github_app_id          = var.github_app_id
    github_private_key     = var.github_private_key
    mongodb_username       = var.mongodb_username
    mongodb_password       = var.mongodb_password
    mongodb_uri            = var.use_documentdb ? "mongodb://${var.mongodb_username}:${var.mongodb_password}@${aws_docdb_cluster.mongodb[0].endpoint}:27017/seedplanner?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" : var.mongodb_uri
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-alb"
  }
}

resource "aws_lb_target_group" "api" {
  name     = "${var.project_name}-api-tg"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-api-tg"
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "${var.project_name}-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-frontend-tg"
  }
}

# Load Balancer Listeners
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.api.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ECS Services
resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.min_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }

  depends_on = [aws_lb_listener.api]

  tags = {
    Name = "${var.project_name}-api-service"
  }
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.project_name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.min_capacity
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.efs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.api, aws_efs_mount_target.frontend_assets]

  tags = {
    Name = "${var.project_name}-frontend-service"
  }
}

# ECS Cluster for containerized applications
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# ECS Task Definition for API
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}-api:latest"
      
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "4000"
        },
        {
          name  = "MONGODB_URI"
          value = var.use_documentdb ? "mongodb://${var.mongodb_username}:${var.mongodb_password}@${aws_docdb_cluster.mongodb[0].endpoint}:27017/seedplanner?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" : var.mongodb_uri
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        },
        {
          name  = "CORS_ORIGIN"
          value = "https://${var.domain_name != "" ? var.domain_name : aws_lb.main.dns_name}"
        },
        {
          name  = "GITHUB_WEBHOOK_SECRET"
          value = var.github_webhook_secret
        },
        {
          name  = "GITHUB_APP_ID"
          value = var.github_app_id
        },
        {
          name  = "GITHUB_PRIVATE_KEY"
          value = var.github_private_key
        },
        {
          name  = "MAX_FILE_UPLOAD_SIZE"
          value = var.max_file_upload_size
        },
        {
          name  = "ALLOWED_FILE_TYPES"
          value = var.allowed_file_types
        },
        {
          name  = "ENABLE_REPORT_GENERATION"
          value = var.enable_report_generation
        },
        {
          name  = "REPORT_RETENTION_DAYS"
          value = var.report_retention_days
        },
        {
          name  = "AWS_S3_BUCKET"
          value = aws_s3_bucket.app_storage.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "USE_SECRETS_MANAGER"
          value = var.use_secrets_manager
        },
        {
          name  = "SECRETS_MANAGER_SECRET_NAME"
          value = var.use_secrets_manager ? aws_secretsmanager_secret.app_secrets[0].name : ""
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-api-task"
  }
}

# ECS Task Definition for Frontend (Static Site)
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "nginx:alpine"
      
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]

      environment = [
        {
          name  = "API_BASE_URL"
          value = "http://${aws_lb.main.dns_name}/api"
        }
      ]

      mountPoints = [
        {
          sourceVolume  = "frontend-assets"
          containerPath = "/usr/share/nginx/html"
          readOnly      = true
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  volume {
    name = "frontend-assets"
    efs_volume_configuration {
      file_system_id = aws_efs_file_system.frontend_assets.id
      root_directory = "/"
    }
  }

  tags = {
    Name = "${var.project_name}-frontend-task"
  }
}

# EFS File System for Frontend Assets
resource "aws_efs_file_system" "frontend_assets" {
  creation_token = "${var.project_name}-frontend-assets"
  encrypted      = true

  tags = {
    Name = "${var.project_name}-frontend-assets"
  }
}

resource "aws_efs_mount_target" "frontend_assets" {
  count           = length(module.vpc.private_subnets)
  file_system_id  = aws_efs_file_system.frontend_assets.id
  subnet_id       = module.vpc.private_subnets[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name_prefix = "${var.project_name}-efs-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-efs-sg"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-frontend-logs"
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-s3-access"
  description = "Policy for S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.app_storage.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.app_storage.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Secrets Manager access policy
resource "aws_iam_policy" "secrets_manager_access" {
  count = var.use_secrets_manager ? 1 : 0
  
  name        = "${var.project_name}-secrets-manager-access"
  description = "Policy for Secrets Manager access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.app_secrets[0].arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_secrets_policy" {
  count = var.use_secrets_manager ? 1 : 0
  
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.secrets_manager_access[0].arn
}

# Lambda Functions for serverless operations
resource "aws_lambda_function" "report_generator" {
  count = var.enable_lambda_functions ? 1 : 0
  
  filename         = "lambda-report-generator.zip"
  function_name    = "${var.project_name}-report-generator"
  role            = aws_iam_role.lambda_role[0].arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_report_generator[0].output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      SECRETS_MANAGER_SECRET_NAME = var.use_secrets_manager ? aws_secretsmanager_secret.app_secrets[0].name : ""
      S3_BUCKET_NAME             = aws_s3_bucket.app_storage.bucket
      AWS_REGION                 = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda[0].id]
  }

  tags = {
    Name = "${var.project_name}-report-generator"
  }
}

resource "aws_lambda_function" "file_processor" {
  count = var.enable_lambda_functions ? 1 : 0
  
  filename         = "lambda-file-processor.zip"
  function_name    = "${var.project_name}-file-processor"
  role            = aws_iam_role.lambda_role[0].arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_file_processor[0].output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      SECRETS_MANAGER_SECRET_NAME = var.use_secrets_manager ? aws_secretsmanager_secret.app_secrets[0].name : ""
      S3_BUCKET_NAME             = aws_s3_bucket.app_storage.bucket
      AWS_REGION                 = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda[0].id]
  }

  tags = {
    Name = "${var.project_name}-file-processor"
  }
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_role" {
  count = var.enable_lambda_functions ? 1 : 0
  
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  count = var.enable_lambda_functions ? 1 : 0
  
  role       = aws_iam_role.lambda_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda S3 access policy
resource "aws_iam_role_policy_attachment" "lambda_s3_policy" {
  count = var.enable_lambda_functions ? 1 : 0
  
  role       = aws_iam_role.lambda_role[0].name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Lambda Secrets Manager access policy
resource "aws_iam_role_policy_attachment" "lambda_secrets_policy" {
  count = var.use_secrets_manager && var.enable_lambda_functions ? 1 : 0
  
  role       = aws_iam_role.lambda_role[0].name
  policy_arn = aws_iam_policy.secrets_manager_access[0].arn
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  count = var.enable_lambda_functions ? 1 : 0
  
  name_prefix = "${var.project_name}-lambda-"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

# Lambda deployment packages (placeholder)
data "archive_file" "lambda_report_generator" {
  count = var.enable_lambda_functions ? 1 : 0
  
  type        = "zip"
  output_path = "lambda-report-generator.zip"
  
  source {
    content = <<EOF
exports.handler = async (event) => {
    console.log('Report generator Lambda function');
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Report generator placeholder' })
    };
};
EOF
    filename = "index.js"
  }
}

data "archive_file" "lambda_file_processor" {
  count = var.enable_lambda_functions ? 1 : 0
  
  type        = "zip"
  output_path = "lambda-file-processor.zip"
  
  source {
    content = <<EOF
exports.handler = async (event) => {
    console.log('File processor Lambda function');
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'File processor placeholder' })
    };
};
EOF
    filename = "index.js"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_storage.bucket
}

output "mongodb_endpoint" {
  description = "MongoDB endpoint"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].endpoint : "Use MongoDB Atlas or external MongoDB"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = var.use_secrets_manager ? aws_secretsmanager_secret.app_secrets[0].arn : "Secrets Manager not enabled"
}

output "lambda_report_generator_arn" {
  description = "ARN of the report generator Lambda function"
  value       = var.enable_lambda_functions ? aws_lambda_function.report_generator[0].arn : "Lambda functions not enabled"
}

output "lambda_file_processor_arn" {
  description = "ARN of the file processor Lambda function"
  value       = var.enable_lambda_functions ? aws_lambda_function.file_processor[0].arn : "Lambda functions not enabled"
}

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].endpoint : "DocumentDB not enabled"
}

output "documentdb_port" {
  description = "DocumentDB cluster port"
  value       = var.use_documentdb ? aws_docdb_cluster.mongodb[0].port : "DocumentDB not enabled"
}


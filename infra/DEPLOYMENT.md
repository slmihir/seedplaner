# SeedPlanner Deployment Guide

This guide explains how to deploy the SeedPlanner application to AWS using Terraform.

## 🏗️ Architecture Overview

The infrastructure deploys a modern, serverless-first web application with:

- **Frontend**: React/Vite application served via Nginx on ECS Fargate
- **Backend**: Node.js/Express API on ECS Fargate
- **Database**: AWS DocumentDB (MongoDB-compatible) for scalable data storage
- **Secrets Management**: AWS Secrets Manager for secure configuration storage
- **Serverless Functions**: AWS Lambda for report generation and file processing
- **Load Balancer**: Application Load Balancer with path-based routing
- **Storage**: S3 bucket for file storage, uploads, and static assets
- **File Processing**: Lambda functions for CSV/Excel processing and report generation
- **GitHub Integration**: Webhook endpoints for automated status transitions
- **Monitoring**: CloudWatch logs and metrics
- **Security**: VPC isolation, IAM roles, and encrypted storage

## 📋 Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Node.js** and **npm** for building the application
4. **AWS Account** with appropriate permissions for:
   - ECS Fargate
   - DocumentDB
   - S3
   - Lambda
   - Secrets Manager
   - VPC and networking
5. **GitHub App** (optional) for GitHub integration features
6. **Domain name** (optional) for custom domain setup

## 🚀 Deployment Steps

### 1. Configure Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
# Required variables
aws_region     = "us-west-2"
aws_account_id = "123456789012"  # Your AWS Account ID
jwt_secret     = "your-super-secret-jwt-key-change-in-production"

# GitHub Integration (optional)
github_webhook_secret = "your-github-webhook-secret"
github_app_id        = "123456"  # If using GitHub App
github_private_key   = "your-github-private-key"  # If using GitHub App

# File Upload Configuration
max_file_upload_size = "10485760"  # 10MB
allowed_file_types   = "csv,xlsx,pdf,doc,docx,txt"

# Report Generation
enable_report_generation = true
report_retention_days    = 90

# Database Configuration - Using AWS DocumentDB (Recommended)
use_documentdb = true  # Set to false to use MongoDB Atlas instead

# For MongoDB Atlas (when use_documentdb = false)
mongodb_uri = "mongodb+srv://username:password@cluster.mongodb.net/seedplanner"

# For AWS DocumentDB (when use_documentdb = true) - RECOMMENDED
mongodb_username = "admin"
mongodb_password = "your-secure-password"

# Secrets Manager Configuration
use_secrets_manager = true
secrets_manager_secret_name = "seedplanner-app-secrets"

# Lambda Configuration
enable_lambda_functions = true
lambda_timeout = 300
lambda_memory_size = 512
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Deploy infrastructure
terraform apply
```

### 3. Build and Deploy Application

#### Option A: Manual Deployment (Recommended)

1. **Build Frontend**:
   ```bash
   cd ../../apps/frontend
   npm install
   npm run build
   ```

2. **Upload Frontend Assets**:
   ```bash
   # Get EFS file system ID from Terraform output
   EFS_ID=$(terraform output -raw efs_file_system_id)
   
   # Mount EFS and copy build files
   # (This requires an EC2 instance or AWS CLI with EFS support)
   ```

3. **Deploy API**:
   ```bash
   cd ../api
   npm install --production
   
   # Create deployment package
   zip -r api-deployment.zip . -x "node_modules/.cache/*" "*.log"
   ```

#### Option B: Using AWS CLI

```bash
# Upload frontend build to S3
aws s3 sync apps/frontend/dist/ s3://your-bucket-name/frontend/

# Deploy API using AWS CLI
aws ecs update-service \
  --cluster seedplanner-cluster \
  --service seedplanner-api \
  --force-new-deployment
```

### 4. Configure Domain (Optional)

If you have a custom domain:

1. **Create Route 53 hosted zone**
2. **Request SSL certificate** in AWS Certificate Manager
3. **Update terraform.tfvars**:
   ```hcl
   domain_name     = "seedplanner.example.com"
   certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/..."
   ```
4. **Re-apply Terraform**:
   ```bash
   terraform apply
   ```

## 🚀 Serverless Architecture Components

### AWS DocumentDB
- **MongoDB-Compatible**: Fully compatible with MongoDB drivers and queries
- **Managed Service**: No server management required
- **High Availability**: Multi-AZ deployment with automatic failover
- **Backup**: Automated backups with point-in-time recovery
- **Security**: VPC isolation and encryption at rest and in transit

### AWS Secrets Manager
- **Secure Storage**: Encrypted storage of sensitive configuration
- **Automatic Rotation**: Built-in secret rotation capabilities
- **IAM Integration**: Fine-grained access control
- **Audit Logging**: CloudTrail integration for compliance
- **Cost Effective**: Pay-per-secret pricing model

### AWS Lambda Functions
- **Report Generator**: Serverless report generation (PDF, Excel, CSV)
- **File Processor**: Asynchronous processing of uploaded files
- **Event-Driven**: Triggered by S3 events or API calls
- **Auto-Scaling**: Automatically scales with demand
- **Cost Efficient**: Pay-per-execution pricing

### Enhanced S3 Configuration
- **CORS Support**: Cross-origin requests for file uploads
- **Event Notifications**: S3 events trigger Lambda functions
- **Lifecycle Policies**: Automatic cleanup of old files
- **Encryption**: Server-side encryption for all stored data
- **Access Logging**: Detailed access logs for auditing

## 🆕 New Features Infrastructure

### File Upload Support
The infrastructure now includes enhanced S3 configuration for file uploads:

- **S3 Bucket**: Configured with CORS for web uploads
- **File Types**: Support for CSV, Excel, PDF, and document uploads
- **Size Limits**: Configurable file size limits (default: 10MB)
- **Security**: Bucket policies restrict access to ECS task role only

### GitHub Integration
Webhook endpoints are automatically configured for GitHub integration:

- **Webhook URL**: `https://your-domain.com/api/github/webhook/{integrationId}`
- **Security**: Webhook signature verification using configured secrets
- **Processing**: Asynchronous webhook processing with retry logic
- **Monitoring**: Webhook events logged to CloudWatch

### Report Generation
Enhanced infrastructure for automated report generation:

- **S3 Storage**: Reports stored in dedicated S3 bucket
- **Export Formats**: PDF, Excel, CSV export capabilities
- **Retention**: Configurable report retention periods
- **Performance**: Optimized for large report generation

## 🔧 Configuration

### Environment Variables

The API container receives these environment variables:

**Core Configuration:**
- `NODE_ENV=production`
- `PORT=4000`
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed CORS origins

**GitHub Integration:**
- `GITHUB_WEBHOOK_SECRET` - Webhook signature verification
- `GITHUB_APP_ID` - GitHub App ID (if using GitHub App)
- `GITHUB_PRIVATE_KEY` - GitHub App private key

**File Upload & Storage:**
- `MAX_FILE_UPLOAD_SIZE` - Maximum file size in bytes (default: 10MB)
- `ALLOWED_FILE_TYPES` - Comma-separated allowed file types
- `AWS_S3_BUCKET` - S3 bucket name for file storage
- `AWS_REGION` - AWS region for S3 operations

**Report Generation:**
- `ENABLE_REPORT_GENERATION` - Enable/disable report features
- `REPORT_RETENTION_DAYS` - Days to retain generated reports

**Secrets Manager:**
- `USE_SECRETS_MANAGER` - Enable/disable Secrets Manager integration
- `SECRETS_MANAGER_SECRET_NAME` - Name of the secret in Secrets Manager

**Lambda Integration:**
- `LAMBDA_REPORT_GENERATOR_ARN` - ARN of the report generator Lambda function
- `LAMBDA_FILE_PROCESSOR_ARN` - ARN of the file processor Lambda function

### Load Balancer Routing

- `/api/*` → API service (port 4000)
- `/*` → Frontend service (port 80)

## 🎯 Architecture Benefits

### Cost Optimization
- **Serverless**: Pay only for actual usage with Lambda functions
- **Managed Services**: No server maintenance costs with DocumentDB
- **Auto-Scaling**: ECS Fargate scales automatically based on demand
- **Storage Efficiency**: S3 lifecycle policies reduce storage costs

### Security & Compliance
- **Encryption**: All data encrypted at rest and in transit
- **VPC Isolation**: Private subnets for database and Lambda functions
- **IAM Roles**: Least-privilege access with fine-grained permissions
- **Secrets Management**: Centralized, encrypted configuration storage
- **Audit Logging**: Comprehensive logging with CloudTrail integration

### High Availability & Reliability
- **Multi-AZ**: DocumentDB and ECS services across multiple availability zones
- **Auto-Scaling**: Automatic scaling based on demand and health checks
- **Backup & Recovery**: Automated backups with point-in-time recovery
- **Health Monitoring**: CloudWatch monitoring with automated alerting

### Developer Experience
- **Infrastructure as Code**: Terraform for reproducible deployments
- **Environment Parity**: Consistent environments across development and production
- **Easy Updates**: Rolling deployments with zero downtime
- **Monitoring**: Built-in observability with CloudWatch and X-Ray

### Health Checks

- **API**: `GET /health` and `GET /db-health`
- **Frontend**: `GET /` (serves index.html)

## 📊 Monitoring

### CloudWatch Logs

- API logs: `/ecs/seedplanner-api`
- Frontend logs: `/ecs/seedplanner-frontend`

### Metrics

- ECS service metrics
- Application Load Balancer metrics
- Database performance metrics

## 🔐 Security

### Network Security

- VPC with public/private subnets
- Security groups with least privilege access
- Private subnets for application and database tiers

### Data Security

- Encryption at rest and in transit
- IAM roles with minimal permissions
- Secure environment variable handling

## 💰 Cost Optimization

### Right-sizing

- Start with minimal resources (256 CPU, 512 MB memory)
- Monitor usage and scale up as needed
- Use Spot instances for non-critical workloads

### Auto Scaling

- Configure based on CPU/memory utilization
- Set appropriate min/max capacity
- Monitor scaling effectiveness

## 🛠️ Troubleshooting

### Common Issues

1. **Service won't start**: Check CloudWatch logs
2. **Database connection failed**: Verify MongoDB URI and security groups
3. **Frontend not loading**: Check EFS mount and file permissions
4. **API not responding**: Verify load balancer target group health

### Debug Commands

```bash
# Check service status
aws ecs describe-services --cluster seedplanner-cluster --services seedplanner-api

# View logs
aws logs tail /ecs/seedplanner-api --follow

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete all resources and data.

## 📈 Scaling

### Horizontal Scaling

Update `terraform.tfvars`:

```hcl
min_capacity = 2
max_capacity = 20
```

Then apply:

```bash
terraform apply
```

### Vertical Scaling

Update CPU/memory values:

```hcl
api_cpu     = 512
api_memory  = 1024
frontend_cpu    = 512
frontend_memory = 1024
```

## 🔄 Updates

### Application Updates

1. **Build new version**:
   ```bash
   cd apps/frontend && npm run build
   cd ../api && npm install --production
   ```

2. **Deploy**:
   ```bash
   # Update EFS with new frontend assets
   # Update ECS service to force new deployment
   aws ecs update-service --cluster seedplanner-cluster --service seedplanner-api --force-new-deployment
   ```

### Infrastructure Updates

1. **Update Terraform configuration**
2. **Plan changes**:
   ```bash
   terraform plan
   ```
3. **Apply changes**:
   ```bash
   terraform apply
   ```

## 📞 Support

For issues or questions:

1. Check CloudWatch logs
2. Review Terraform state
3. Verify security group rules
4. Check database connectivity

# SeedPlanner Infrastructure as Code

This directory contains Terraform configurations for deploying SeedPlanner on AWS infrastructure.

## 🏗️ Architecture Overview

The infrastructure includes:

- **VPC** with public and private subnets across multiple AZs
- **ECS Fargate** for containerized application hosting
- **Application Load Balancer** for traffic distribution
- **DocumentDB** (or MongoDB Atlas) for database
- **S3** for file storage
- **CloudWatch** for monitoring and logging
- **IAM** roles and policies for security
- **Auto Scaling** for dynamic capacity management

## 📁 Structure

```
terraform/
├── main.tf                 # Main infrastructure configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── versions.tf             # Provider version constraints
├── terraform.tfvars.example # Example variables file
├── modules/
│   └── ecs-service/        # Reusable ECS service module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **AWS Account** with necessary permissions

### Setup

1. **Clone and navigate to terraform directory:**
   ```bash
   cd infra/terraform
   ```

2. **Copy and configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## 🔧 Configuration

### Required Variables

- `aws_region` - AWS region for deployment
- `aws_account_id` - Your AWS Account ID

### Database Options

#### Option 1: MongoDB Atlas (Recommended)
```hcl
use_documentdb = false
mongodb_uri = "mongodb+srv://username:password@cluster.mongodb.net/seedplanner"
```

#### Option 2: AWS DocumentDB
```hcl
use_documentdb = true
mongodb_username = "admin"
mongodb_password = "your-secure-password"
```

### Environment Configuration

#### Development
```hcl
environment = "development"
min_capacity = 1
max_capacity = 3
```

#### Production
```hcl
environment = "production"
min_capacity = 2
max_capacity = 10
enable_monitoring = true
```

## 📊 Resources Created

### Networking
- VPC with public/private subnets
- Internet Gateway
- NAT Gateway
- Route Tables
- Security Groups

### Compute
- ECS Fargate Cluster
- ECS Task Definitions (API & Frontend)
- ECS Services with Auto Scaling
- Application Load Balancer

### Storage
- S3 Bucket for file storage
- DocumentDB Cluster (optional)

### Monitoring
- CloudWatch Log Groups
- CloudWatch Alarms
- Auto Scaling Policies

### Security
- IAM Roles and Policies
- Security Groups
- S3 Bucket Policies

## 🔐 Security Considerations

### Network Security
- Private subnets for database and application tiers
- Public subnets only for load balancer
- Security groups with least privilege access

### Data Security
- S3 bucket encryption at rest
- DocumentDB encryption in transit
- IAM roles with minimal permissions

### Access Control
- VPC endpoints for AWS services
- WAF integration (optional)
- CloudTrail for audit logging

## 📈 Monitoring and Scaling

### Auto Scaling
- CPU-based scaling policies
- Memory-based scaling policies
- Configurable min/max capacity

### Monitoring
- CloudWatch metrics for ECS services
- Custom alarms for critical metrics
- Log aggregation and analysis

### Health Checks
- Application Load Balancer health checks
- ECS service health monitoring
- Database connection monitoring

## 🚀 Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy new version
terraform apply -var="environment=blue"

# Switch traffic
# Update DNS to point to new load balancer
```

### Rolling Updates
```bash
# Update task definition
terraform apply -var="task_definition_version=new"

# ECS will perform rolling update
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    paths: ['infra/terraform/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - name: Terraform Plan
        run: terraform plan
      - name: Terraform Apply
        run: terraform apply -auto-approve
```

## 🧹 Cleanup

### Destroy Infrastructure
```bash
terraform destroy
```

### Selective Destruction
```bash
# Destroy specific resources
terraform destroy -target=aws_ecs_service.api
```

## 📝 Outputs

After deployment, Terraform provides:

- Application URL
- API Endpoint
- Database Connection String
- S3 Bucket Name
- CloudWatch Log Groups
- Security Group IDs

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check AWS credentials
   - Verify IAM permissions

2. **Resource Limits**
   - Check AWS service limits
   - Request limit increases if needed

3. **Network Issues**
   - Verify VPC configuration
   - Check security group rules

4. **Database Connection**
   - Verify security group rules
   - Check connection string format

### Debug Commands

```bash
# Check Terraform state
terraform state list
terraform state show aws_ecs_service.api

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive
```

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Fargate Documentation](https://docs.aws.amazon.com/ecs/latest/developerguide/AWS_Fargate.html)
- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the configuration
5. Submit a pull request

## 📄 License

This infrastructure code is licensed under the MIT License.


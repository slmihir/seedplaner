# Infrastructure

This directory contains infrastructure configuration files for the SeedPlanner application, focusing on production cloud infrastructure using Terraform.

## 🏗️ Infrastructure as Code (IaC)

### Terraform Configuration

The `terraform/` directory contains complete AWS infrastructure definitions:

- **VPC & Networking**: Multi-AZ VPC with public/private subnets
- **Compute**: ECS Fargate cluster for containerized applications
- **Database**: DocumentDB cluster or MongoDB Atlas integration
- **Storage**: S3 bucket for file storage
- **Load Balancing**: Application Load Balancer with health checks
- **Monitoring**: CloudWatch logs and alarms
- **Security**: IAM roles, security groups, and encryption
- **Auto Scaling**: Dynamic capacity management

### Quick Start with Terraform

```bash
# Navigate to terraform directory
cd terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

## 🚀 Production Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0 installed
- Node.js and npm for building the application

### Deployment Steps

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure:**
   ```bash
   # Using the deployment script
   cd scripts
   ./deploy.sh production apply
   
   # Or manually
   cd terraform
   terraform init
   terraform plan -var="environment=production"
   terraform apply -var="environment=production"
   ```

3. **Build and deploy application:**
   ```bash
   # Build the application
   npm run build
   
   # Deploy to ECS (configured in Terraform)
   # The ECS service will pull from your configured container registry
   ```

4. **Update ECS services:**
   ```bash
   aws ecs update-service --cluster seedplanner-cluster --service seedplanner-api --force-new-deployment
   aws ecs update-service --cluster seedplanner-cluster --service seedplanner-frontend --force-new-deployment
   ```

## 📊 Infrastructure Monitoring

### CloudWatch Dashboards

- ECS Service Metrics
- Application Load Balancer Metrics
- Database Performance Metrics
- Custom Application Metrics

### Alerts

- High CPU/Memory utilization
- Database connection failures
- Application errors
- Security events

## 🔐 Security Best Practices

### Network Security
- Private subnets for application and database tiers
- Security groups with least privilege access
- VPC endpoints for AWS services

### Data Security
- Encryption at rest and in transit
- IAM roles with minimal permissions
- Regular security updates

### Compliance
- CloudTrail for audit logging
- Config for compliance monitoring
- Security Hub for centralized security findings

## 📈 Cost Optimization

### Right-sizing
- Monitor resource utilization
- Adjust instance types based on usage
- Use Spot instances for non-critical workloads

### Storage Optimization
- S3 lifecycle policies
- EBS volume optimization
- CloudWatch log retention policies

### Auto Scaling
- Configure appropriate scaling policies
- Use scheduled scaling for predictable workloads
- Monitor scaling effectiveness

## 🛠️ Local Development

For local development, you can run the application directly without Docker:

1. **Start MongoDB locally:**
   - Install MongoDB locally or use MongoDB Atlas
   - Configure connection string in `.env` file

2. **Run API locally:**
   ```bash
   cd apps/api
   npm install
   npm run dev
   ```

3. **Run Frontend locally:**
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/seedplanner

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API
NODE_ENV=development
PORT=4000

# Frontend
VITE_API_BASE_URL=http://localhost:4000
```
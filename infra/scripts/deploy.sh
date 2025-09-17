#!/bin/bash

# SeedPlanner Infrastructure Deployment Script
# This script automates the deployment of SeedPlanner infrastructure using Terraform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../terraform" && pwd)"
ENVIRONMENT=${1:-"development"}
ACTION=${2:-"plan"}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

setup_terraform() {
    log_info "Setting up Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init
    
    # Validate configuration
    terraform validate
    
    log_success "Terraform setup completed"
}

create_terraform_vars() {
    log_info "Creating terraform.tfvars file..."
    
    if [ ! -f "terraform.tfvars" ]; then
        if [ -f "terraform.tfvars.example" ]; then
            cp terraform.tfvars.example terraform.tfvars
            log_warning "Created terraform.tfvars from example. Please update with your values."
        else
            log_error "terraform.tfvars.example not found. Please create terraform.tfvars manually."
            exit 1
        fi
    else
        log_info "terraform.tfvars already exists"
    fi
}

plan_deployment() {
    log_info "Planning deployment for environment: $ENVIRONMENT"
    
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -out="terraform-$ENVIRONMENT.tfplan"
    
    log_success "Plan completed. Review the plan before applying."
}

apply_deployment() {
    log_info "Applying deployment for environment: $ENVIRONMENT"
    
    if [ -f "terraform-$ENVIRONMENT.tfplan" ]; then
        terraform apply "terraform-$ENVIRONMENT.tfplan"
    else
        log_warning "No plan file found. Running terraform apply directly."
        terraform apply -var="environment=$ENVIRONMENT" -auto-approve
    fi
    
    log_success "Deployment completed successfully"
}

destroy_infrastructure() {
    log_warning "This will destroy all infrastructure for environment: $ENVIRONMENT"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        log_info "Destroying infrastructure..."
        terraform destroy -var="environment=$ENVIRONMENT" -auto-approve
        log_success "Infrastructure destroyed"
    else
        log_info "Destruction cancelled"
    fi
}

show_outputs() {
    log_info "Infrastructure outputs:"
    terraform output
}

deploy_application() {
    log_info "Deploying application to ECS..."
    
    # Get ECS cluster name from Terraform output
    CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    
    if [ -z "$CLUSTER_NAME" ]; then
        log_error "Could not get ECS cluster name from Terraform output"
        exit 1
    fi
    
    # Update ECS service (this would typically be done through CI/CD)
    log_info "ECS cluster: $CLUSTER_NAME"
    log_warning "Application deployment to ECS requires additional setup. Please refer to the documentation."
}

main() {
    log_info "SeedPlanner Infrastructure Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Action: $ACTION"
    
    check_prerequisites
    setup_terraform
    create_terraform_vars
    
    case $ACTION in
        "plan")
            plan_deployment
            ;;
        "apply")
            plan_deployment
            apply_deployment
            show_outputs
            ;;
        "destroy")
            destroy_infrastructure
            ;;
        "output")
            show_outputs
            ;;
        "deploy-app")
            deploy_application
            ;;
        *)
            log_error "Unknown action: $ACTION"
            echo "Usage: $0 <environment> <action>"
            echo "Actions: plan, apply, destroy, output, deploy-app"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"


#!/bin/bash

# SeedPlanner Serverless API Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command_exists serverless; then
        print_error "Serverless Framework is not installed. Please install it globally: npm install -g serverless"
        exit 1
    fi
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install AWS CLI"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js >= $REQUIRED_VERSION"
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Function to check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials are not configured. Please run 'aws configure'"
        exit 1
    fi
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region)
    
    print_success "AWS credentials are valid (Account: $AWS_ACCOUNT_ID, Region: $AWS_REGION)"
}

# Function to check environment variables
check_environment() {
    print_status "Checking environment variables..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please edit .env file with your values before deploying"
        exit 1
    fi
    
    # Check if JWT_SECRET is set
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your-super-secret-jwt-key-change-in-production" .env; then
        print_error "JWT_SECRET is not set in .env file. Please set a secure JWT secret"
        exit 1
    fi
    
    print_success "Environment variables are configured"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_status "Dependencies already installed"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        print_success "Tests passed"
    else
        print_warning "No tests configured"
    fi
}

# Function to deploy to AWS
deploy_to_aws() {
    local stage=$1
    
    print_status "Deploying to AWS (stage: $stage)..."
    
    # Deploy using serverless framework
    serverless deploy --stage "$stage" --verbose
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
        
        # Get API Gateway URL
        API_URL=$(serverless info --stage "$stage" --verbose | grep "endpoint:" | awk '{print $2}')
        if [ -n "$API_URL" ]; then
            print_success "API Gateway URL: $API_URL"
            print_status "Update your frontend .env file with:"
            echo "REACT_APP_API_URL=$API_URL"
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [STAGE]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy to AWS (default: dev)"
    echo "  dev        Deploy to development stage"
    echo "  prod       Deploy to production stage"
    echo "  check      Check prerequisites and configuration"
    echo "  test       Run tests"
    echo "  clean      Clean up deployment artifacts"
    echo ""
    echo "Examples:"
    echo "  $0 deploy dev"
    echo "  $0 prod"
    echo "  $0 check"
}

# Function to clean up
clean_up() {
    print_status "Cleaning up deployment artifacts..."
    
    rm -rf .serverless
    rm -rf node_modules/.cache
    
    print_success "Cleanup completed"
}

# Main script logic
main() {
    local command=${1:-deploy}
    local stage=${2:-dev}
    
    case $command in
        "deploy"|"dev"|"prod")
            if [ "$command" = "dev" ]; then
                stage="dev"
            elif [ "$command" = "prod" ]; then
                stage="prod"
            fi
            
            print_status "Starting deployment process for stage: $stage"
            check_prerequisites
            check_aws_credentials
            check_environment
            install_dependencies
            run_tests
            deploy_to_aws "$stage"
            ;;
        "check")
            check_prerequisites
            check_aws_credentials
            check_environment
            print_success "All checks passed"
            ;;
        "test")
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        "clean")
            clean_up
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

@echo off
REM SeedPlanner Infrastructure Deployment Script for Windows
REM This script automates the deployment of SeedPlanner infrastructure using Terraform

setlocal enabledelayedexpansion

REM Configuration
set TERRAFORM_DIR=%~dp0..\terraform
set ENVIRONMENT=%1
set ACTION=%2

if "%ENVIRONMENT%"=="" set ENVIRONMENT=development
if "%ACTION%"=="" set ACTION=plan

echo [INFO] SeedPlanner Infrastructure Deployment
echo [INFO] Environment: %ENVIRONMENT%
echo [INFO] Action: %ACTION%

REM Check prerequisites
echo [INFO] Checking prerequisites...

where aws >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI is not installed. Please install it first.
    exit /b 1
)

where terraform >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Terraform is not installed. Please install it first.
    exit /b 1
)

aws sts get-caller-identity >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] AWS credentials not configured. Please run 'aws configure' first.
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed

REM Setup Terraform
echo [INFO] Setting up Terraform...
cd /d "%TERRAFORM_DIR%"

terraform init
if %errorlevel% neq 0 (
    echo [ERROR] Terraform init failed
    exit /b 1
)

terraform validate
if %errorlevel% neq 0 (
    echo [ERROR] Terraform validation failed
    exit /b 1
)

echo [SUCCESS] Terraform setup completed

REM Create terraform.tfvars if it doesn't exist
if not exist "terraform.tfvars" (
    if exist "terraform.tfvars.example" (
        copy "terraform.tfvars.example" "terraform.tfvars" >nul
        echo [WARNING] Created terraform.tfvars from example. Please update with your values.
    ) else (
        echo [ERROR] terraform.tfvars.example not found. Please create terraform.tfvars manually.
        exit /b 1
    )
) else (
    echo [INFO] terraform.tfvars already exists
)

REM Execute action
if "%ACTION%"=="plan" (
    echo [INFO] Planning deployment for environment: %ENVIRONMENT%
    terraform plan -var="environment=%ENVIRONMENT%" -out="terraform-%ENVIRONMENT%.tfplan"
    if %errorlevel% neq 0 (
        echo [ERROR] Terraform plan failed
        exit /b 1
    )
    echo [SUCCESS] Plan completed. Review the plan before applying.
    
) else if "%ACTION%"=="apply" (
    echo [INFO] Planning deployment for environment: %ENVIRONMENT%
    terraform plan -var="environment=%ENVIRONMENT%" -out="terraform-%ENVIRONMENT%.tfplan"
    if %errorlevel% neq 0 (
        echo [ERROR] Terraform plan failed
        exit /b 1
    )
    
    echo [INFO] Applying deployment for environment: %ENVIRONMENT%
    if exist "terraform-%ENVIRONMENT%.tfplan" (
        terraform apply "terraform-%ENVIRONMENT%.tfplan"
    ) else (
        terraform apply -var="environment=%ENVIRONMENT%" -auto-approve
    )
    if %errorlevel% neq 0 (
        echo [ERROR] Terraform apply failed
        exit /b 1
    )
    echo [SUCCESS] Deployment completed successfully
    
    echo [INFO] Infrastructure outputs:
    terraform output
    
) else if "%ACTION%"=="destroy" (
    echo [WARNING] This will destroy all infrastructure for environment: %ENVIRONMENT%
    set /p confirm="Are you sure? (yes/no): "
    if /i "!confirm!"=="yes" (
        echo [INFO] Destroying infrastructure...
        terraform destroy -var="environment=%ENVIRONMENT%" -auto-approve
        if %errorlevel% neq 0 (
            echo [ERROR] Terraform destroy failed
            exit /b 1
        )
        echo [SUCCESS] Infrastructure destroyed
    ) else (
        echo [INFO] Destruction cancelled
    )
    
) else if "%ACTION%"=="output" (
    echo [INFO] Infrastructure outputs:
    terraform output
    
) else if "%ACTION%"=="deploy-app" (
    echo [INFO] Deploying application to ECS...
    for /f "tokens=*" %%i in ('terraform output -raw ecs_cluster_name') do set CLUSTER_NAME=%%i
    if "!CLUSTER_NAME!"=="" (
        echo [ERROR] Could not get ECS cluster name from Terraform output
        exit /b 1
    )
    echo [INFO] ECS cluster: !CLUSTER_NAME!
    echo [WARNING] Application deployment to ECS requires additional setup. Please refer to the documentation.
    
) else (
    echo [ERROR] Unknown action: %ACTION%
    echo Usage: %0 ^<environment^> ^<action^>
    echo Actions: plan, apply, destroy, output, deploy-app
    exit /b 1
)

echo [SUCCESS] Script completed successfully


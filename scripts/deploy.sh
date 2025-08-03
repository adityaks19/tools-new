#!/bin/bash

# SEO NLP App Deployment Script with Cost Optimization
# This script deploys the application to AWS Fargate with intelligent scaling

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
STACK_NAME=${STACK_NAME:-seo-nlp-app}
ENVIRONMENT=${ENVIRONMENT:-production}
ECR_REPOSITORY_NAME="seo-nlp-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    log "Prerequisites check passed"
}

# Get or create ECR repository
setup_ecr() {
    log "Setting up ECR repository..."
    
    # Check if repository exists
    if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $REGION &> /dev/null; then
        log "Creating ECR repository: $ECR_REPOSITORY_NAME"
        aws ecr create-repository \
            --repository-name $ECR_REPOSITORY_NAME \
            --region $REGION \
            --image-scanning-configuration scanOnPush=true
    fi
    
    # Get repository URI
    ECR_URI=$(aws ecr describe-repositories \
        --repository-names $ECR_REPOSITORY_NAME \
        --region $REGION \
        --query 'repositories[0].repositoryUri' \
        --output text)
    
    log "ECR repository URI: $ECR_URI"
}

# Build and push Docker image
build_and_push() {
    log "Building and pushing Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Build image with cost optimization
    log "Building Docker image with multi-stage build..."
    docker build \
        --platform linux/amd64 \
        --build-arg NODE_ENV=production \
        --tag $ECR_URI:latest \
        --tag $ECR_URI:$(git rev-parse --short HEAD) \
        .
    
    # Push images
    log "Pushing images to ECR..."
    docker push $ECR_URI:latest
    docker push $ECR_URI:$(git rev-parse --short HEAD)
    
    log "Image pushed successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure..."
    
    # Get VPC and subnet information
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=is-default,Values=true" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $REGION)
    
    if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
        error "No default VPC found. Please create a VPC first."
    fi
    
    # Get subnet IDs
    PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=false" \
        --query 'Subnets[].SubnetId' \
        --output text \
        --region $REGION | tr '\t' ',')
    
    PUBLIC_SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" \
        --query 'Subnets[].SubnetId' \
        --output text \
        --region $REGION | tr '\t' ',')
    
    if [ -z "$PRIVATE_SUBNETS" ] || [ -z "$PUBLIC_SUBNETS" ]; then
        warn "No private/public subnets found. Using all available subnets."
        ALL_SUBNETS=$(aws ec2 describe-subnets \
            --filters "Name=vpc-id,Values=$VPC_ID" \
            --query 'Subnets[].SubnetId' \
            --output text \
            --region $REGION | tr '\t' ',')
        PRIVATE_SUBNETS=$ALL_SUBNETS
        PUBLIC_SUBNETS=$ALL_SUBNETS
    fi
    
    log "VPC ID: $VPC_ID"
    log "Private Subnets: $PRIVATE_SUBNETS"
    log "Public Subnets: $PUBLIC_SUBNETS"
    
    # Deploy CloudFormation stack
    aws cloudformation deploy \
        --template-file infrastructure/fargate-deployment.yml \
        --stack-name $STACK_NAME \
        --parameter-overrides \
            Environment=$ENVIRONMENT \
            VpcId=$VPC_ID \
            PrivateSubnetIds=$PRIVATE_SUBNETS \
            PublicSubnetIds=$PUBLIC_SUBNETS \
        --capabilities CAPABILITY_IAM \
        --region $REGION \
        --no-fail-on-empty-changeset
    
    log "Infrastructure deployed successfully"
}

# Update ECS service with new image
update_service() {
    log "Updating ECS service with new image..."
    
    # Get cluster and service names from CloudFormation outputs
    CLUSTER_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
        --output text)
    
    SERVICE_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ServiceName`].OutputValue' \
        --output text)
    
    if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ]; then
        error "Could not get cluster or service name from CloudFormation stack"
    fi
    
    log "Cluster: $CLUSTER_NAME, Service: $SERVICE_NAME"
    
    # Force new deployment
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $REGION > /dev/null
    
    log "Service update initiated"
    
    # Wait for deployment to complete
    log "Waiting for deployment to complete..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION
    
    log "Deployment completed successfully"
}

# Setup monitoring and cost optimization
setup_monitoring() {
    log "Setting up monitoring and cost optimization..."
    
    # Create CloudWatch dashboard
    cat > /tmp/dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "$SERVICE_NAME", "ClusterName", "$CLUSTER_NAME" ],
                    [ ".", "MemoryUtilization", ".", ".", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "$REGION",
                "title": "ECS Service Metrics"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "SEO-NLP-App/CostOptimization", "TotalCost" ],
                    [ ".", "CacheHitRate" ],
                    [ ".", "ThrottledRequests" ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "$REGION",
                "title": "Cost Optimization Metrics"
            }
        }
    ]
}
EOF
    
    aws cloudwatch put-dashboard \
        --dashboard-name "$STACK_NAME-monitoring" \
        --dashboard-body file:///tmp/dashboard.json \
        --region $REGION
    
    rm /tmp/dashboard.json
    
    log "Monitoring dashboard created"
}

# Get deployment information
get_deployment_info() {
    log "Getting deployment information..."
    
    # Get load balancer DNS
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text)
    
    # Get auto-scaler function name
    AUTOSCALER_FUNCTION=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`AutoScalerFunctionName`].OutputValue' \
        --output text)
    
    echo ""
    echo -e "${BLUE}=== Deployment Information ===${NC}"
    echo -e "${GREEN}Application URL: http://$ALB_DNS${NC}"
    echo -e "${GREEN}Health Check: http://$ALB_DNS/health${NC}"
    echo -e "${GREEN}ECS Cluster: $CLUSTER_NAME${NC}"
    echo -e "${GREEN}ECS Service: $SERVICE_NAME${NC}"
    echo -e "${GREEN}Auto-scaler Function: $AUTOSCALER_FUNCTION${NC}"
    echo -e "${GREEN}CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$STACK_NAME-monitoring${NC}"
    echo ""
    
    # Test health endpoint
    log "Testing health endpoint..."
    sleep 30 # Wait for service to be ready
    
    if curl -f -s "http://$ALB_DNS/health" > /dev/null; then
        log "Health check passed ✓"
    else
        warn "Health check failed. Service might still be starting up."
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    docker system prune -f || true
}

# Main deployment function
main() {
    log "Starting deployment of SEO NLP App with cost optimization..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    setup_ecr
    build_and_push
    deploy_infrastructure
    update_service
    setup_monitoring
    get_deployment_info
    
    log "Deployment completed successfully! 🚀"
    log "The application will automatically scale to zero when not in use to minimize costs."
}

# Run main function
main "$@"

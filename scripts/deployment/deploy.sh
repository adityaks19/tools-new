#!/bin/bash

# SEO NLP Application Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
STACK_NAME="seo-nlp-app-${ENVIRONMENT}"
DOMAIN_NAME=${3:-your-domain.com}

echo "🚀 Starting deployment for environment: $ENVIRONMENT"
echo "📍 Region: $REGION"
echo "🏗️  Stack: $STACK_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Create or update CloudFormation stack
echo "📦 Deploying infrastructure..."
aws cloudformation deploy \
    --template-file infrastructure/cloudformation.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DomainName=$DOMAIN_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

# Get stack outputs
echo "📋 Getting stack outputs..."
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`FileStorageBucketName`].OutputValue' \
    --output text)

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text)

echo "✅ Infrastructure deployed successfully!"
echo "🪣 S3 Bucket: $S3_BUCKET"
echo "🔗 Load Balancer: $ALB_DNS"

# Build the application
echo "🔨 Building application..."
npm install

# Build client
echo "🎨 Building React client..."
cd client
npm install
npm run build
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p dist
cp -r node_modules dist/
cp -r routes dist/
cp -r config dist/
cp -r middleware dist/
cp server.js dist/
cp package.json dist/
cp -r client/build dist/client/

# Create environment file for deployment
cat > dist/.env << EOF
NODE_ENV=production
PORT=3000
AWS_REGION=$REGION
S3_BUCKET_NAME=$S3_BUCKET
DYNAMODB_TABLE_USERS=seo-nlp-users-$ENVIRONMENT
DYNAMODB_TABLE_SUBSCRIPTIONS=seo-nlp-subscriptions-$ENVIRONMENT
DYNAMODB_TABLE_USAGE=seo-nlp-usage-$ENVIRONMENT
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
FRONTEND_URL=https://$DOMAIN_NAME
JWT_SECRET=\${JWT_SECRET}
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Create application archive
echo "📁 Creating application archive..."
cd dist
zip -r ../seo-nlp-app.zip . -x "*.git*" "node_modules/.cache/*"
cd ..

echo "✅ Deployment package created: seo-nlp-app.zip"
echo ""
echo "🎯 Next steps:"
echo "1. Upload seo-nlp-app.zip to your EC2 instance or ECS"
echo "2. Set environment variables (JWT_SECRET, Stripe keys)"
echo "3. Start the application with 'npm start'"
echo "4. Configure your domain to point to: $ALB_DNS"
echo ""
echo "📚 Manual deployment commands for EC2:"
echo "   scp seo-nlp-app.zip ec2-user@your-instance:/home/ec2-user/"
echo "   ssh ec2-user@your-instance"
echo "   unzip seo-nlp-app.zip"
echo "   export JWT_SECRET='your-secret-key'"
echo "   export STRIPE_SECRET_KEY='your-stripe-key'"
echo "   npm start"
echo ""
echo "🎉 Deployment preparation complete!"

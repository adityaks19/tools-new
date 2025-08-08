#!/bin/bash

# AWS Setup Script for NLP Tool
# This script creates the necessary AWS resources

echo "🚀 Setting up AWS resources for NLP Tool..."

# Set AWS CLI path and region
AWS_CLI="/usr/local/bin/aws"
AWS_REGION=${AWS_REGION:-us-east-1}
echo "📍 Using AWS region: $AWS_REGION"

# Create DynamoDB tables
echo "📊 Creating DynamoDB tables..."

# Users table
echo "Creating nlp-tool-users table..."
$AWS_CLI dynamodb create-table \
    --table-name nlp-tool-users \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=email-index,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "Table nlp-tool-users may already exist"

# Sessions table
echo "Creating nlp-tool-sessions table..."
$AWS_CLI dynamodb create-table \
    --table-name nlp-tool-sessions \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "Table nlp-tool-sessions may already exist"

# Usage table
echo "Creating nlp-tool-usage table..."
$AWS_CLI dynamodb create-table \
    --table-name nlp-tool-usage \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=userId-timestamp-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "Table nlp-tool-usage may already exist"

# Files table
echo "Creating nlp-tool-files table..."
$AWS_CLI dynamodb create-table \
    --table-name nlp-tool-files \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION \
    --no-cli-pager 2>/dev/null || echo "Table nlp-tool-files may already exist"

echo "⏳ Waiting for tables to be created..."
sleep 10

# Check table status
echo "📋 Checking table status..."
echo "Users table: $($AWS_CLI dynamodb describe-table --table-name nlp-tool-users --region $AWS_REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo 'ERROR')"
echo "Sessions table: $($AWS_CLI dynamodb describe-table --table-name nlp-tool-sessions --region $AWS_REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo 'ERROR')"
echo "Usage table: $($AWS_CLI dynamodb describe-table --table-name nlp-tool-usage --region $AWS_REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo 'ERROR')"
echo "Files table: $($AWS_CLI dynamodb describe-table --table-name nlp-tool-files --region $AWS_REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo 'ERROR')"

echo "✅ AWS setup complete!"
echo ""
echo "🔧 Environment configured for production mode"
echo "NODE_ENV=production"
echo "AWS_REGION=$AWS_REGION"

#!/bin/bash

# SEO NLP App - Complete Setup Script
# Run this in AWS CloudShell to deploy your cost-optimized SEO platform

set -e

echo "🚀 Setting up SEO NLP App with Auto-Scaling and Cost Optimization..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

# Configuration
REGION=${AWS_REGION:-us-east-1}
STACK_NAME=${STACK_NAME:-seo-nlp-app}
ECR_REPOSITORY_NAME="seo-nlp-app"

log "Starting deployment in region: $REGION"

# Create project directory
PROJECT_DIR="$HOME/seo-nlp-app"
[ -d "$PROJECT_DIR" ] && rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

log "Created project directory: $PROJECT_DIR"

# Create package.json
log "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "seo-nlp-app",
  "version": "1.0.0",
  "description": "Cost-optimized SEO NLP application with AWS Fargate auto-scaling",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create directory structure
mkdir -p src

# Create main server file
log "Creating server.js..."
cat > src/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime()
    });
});

// SEO Analysis endpoint
app.post('/api/seo/analyze', (req, res) => {
    const { content, url } = req.body;
    const userTier = req.headers['x-user-tier'] || 'FREE';
    
    if (!content) {
        return res.status(400).json({
            error: 'Content is required',
            code: 'MISSING_CONTENT'
        });
    }
    
    // Simulate SEO analysis (in production, this would use AWS Bedrock)
    const wordCount = content.split(' ').length;
    const seoScore = Math.min(100, Math.max(30, wordCount * 2 + Math.floor(Math.random() * 20)));
    
    const analysis = {
        seoScore: seoScore,
        wordCount: wordCount,
        contentLength: content.length,
        issues: [
            seoScore < 70 ? 'Content too short - aim for 300+ words' : null,
            !content.includes('SEO') ? 'Consider adding SEO-related keywords' : null,
            wordCount < 50 ? 'Add more descriptive content' : null
        ].filter(Boolean),
        recommendations: [
            'Use header tags (H1, H2, H3) for structure',
            'Add internal and external links',
            'Optimize meta description',
            'Include relevant keywords naturally',
            'Improve content readability'
        ],
        keywords: extractKeywords(content),
        metadata: {
            tier: userTier,
            timestamp: new Date().toISOString(),
            url: url || 'Not provided'
        }
    };
    
    res.json({
        success: true,
        analysis: analysis,
        tier: userTier,
        message: `Analysis completed for ${userTier} tier`
    });
});

// Keyword Research endpoint
app.post('/api/seo/keywords', (req, res) => {
    const { topic, targetAudience } = req.body;
    const userTier = req.headers['x-user-tier'] || 'FREE';
    
    if (!topic) {
        return res.status(400).json({
            error: 'Topic is required',
            code: 'MISSING_TOPIC'
        });
    }
    
    // Simulate keyword research
    const keywords = generateKeywords(topic, userTier);
    
    res.json({
        success: true,
        keywords: keywords,
        topic: topic,
        targetAudience: targetAudience || 'General',
        tier: userTier,
        timestamp: new Date().toISOString()
    });
});

// Content Optimization endpoint
app.post('/api/seo/optimize', (req, res) => {
    const { content, targetKeywords } = req.body;
    const userTier = req.headers['x-user-tier'] || 'FREE';
    
    if (userTier === 'FREE') {
        return res.status(403).json({
            error: 'Content optimization not available in FREE tier',
            code: 'FEATURE_NOT_AVAILABLE',
            upgrade: 'Upgrade to BASIC or higher for content optimization'
        });
    }
    
    if (!content) {
        return res.status(400).json({
            error: 'Content is required',
            code: 'MISSING_CONTENT'
        });
    }
    
    // Simulate content optimization
    const optimizedContent = optimizeContent(content, targetKeywords || []);
    
    res.json({
        success: true,
        originalContent: content,
        optimizedContent: optimizedContent,
        improvements: [
            'Added strategic keyword placement',
            'Improved sentence structure',
            'Enhanced readability',
            'Added transition words'
        ],
        tier: userTier,
        timestamp: new Date().toISOString()
    });
});

// Usage statistics endpoint
app.get('/api/user/usage', (req, res) => {
    const userTier = req.headers['x-user-tier'] || 'FREE';
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    const tierLimits = {
        FREE: { daily: 10, monthly: 100 },
        BASIC: { daily: 100, monthly: 2000 },
        PRO: { daily: 500, monthly: 10000 },
        ENTERPRISE: { daily: 2000, monthly: 50000 }
    };
    
    const currentUsage = {
        daily: Math.floor(Math.random() * 5), // Simulate current usage
        monthly: Math.floor(Math.random() * 50)
    };
    
    res.json({
        userId: userId,
        tier: userTier,
        usage: currentUsage,
        limits: tierLimits[userTier] || tierLimits.FREE,
        remaining: {
            daily: Math.max(0, tierLimits[userTier].daily - currentUsage.daily),
            monthly: Math.max(0, tierLimits[userTier].monthly - currentUsage.monthly)
        },
        timestamp: new Date().toISOString()
    });
});

// Helper functions
function extractKeywords(content) {
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    const keywords = words
        .filter(word => word.length > 3 && !commonWords.includes(word))
        .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
    
    return Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ keyword: word, frequency: count }));
}

function generateKeywords(topic, tier) {
    const baseKeywords = [
        `${topic}`,
        `${topic} guide`,
        `${topic} tips`,
        `best ${topic}`,
        `${topic} tutorial`,
        `how to ${topic}`,
        `${topic} examples`,
        `${topic} benefits`
    ];
    
    const tierKeywords = {
        FREE: baseKeywords.slice(0, 5),
        BASIC: [...baseKeywords, `${topic} strategy`, `${topic} optimization`],
        PRO: [...baseKeywords, `${topic} strategy`, `${topic} optimization`, `advanced ${topic}`, `${topic} techniques`],
        ENTERPRISE: [...baseKeywords, `${topic} strategy`, `${topic} optimization`, `advanced ${topic}`, `${topic} techniques`, `professional ${topic}`, `${topic} consulting`]
    };
    
    return (tierKeywords[tier] || tierKeywords.FREE).map(keyword => ({
        keyword: keyword,
        difficulty: Math.floor(Math.random() * 100),
        volume: Math.floor(Math.random() * 10000) + 100,
        competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    }));
}

function optimizeContent(content, targetKeywords) {
    let optimized = content;
    
    // Simple optimization simulation
    if (targetKeywords.length > 0) {
        const firstKeyword = targetKeywords[0];
        if (!optimized.toLowerCase().includes(firstKeyword.toLowerCase())) {
            optimized = `${firstKeyword} is an important topic. ${optimized}`;
        }
    }
    
    // Add some SEO improvements
    optimized = optimized.replace(/\. /g, '. Furthermore, ');
    optimized = `${optimized} In conclusion, this content has been optimized for better SEO performance.`;
    
    return optimized;
}

// Error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        availableEndpoints: [
            'GET /health',
            'POST /api/seo/analyze',
            'POST /api/seo/keywords',
            'POST /api/seo/optimize',
            'GET /api/user/usage'
        ]
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SEO NLP App running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 SEO Analysis: POST http://localhost:${PORT}/api/seo/analyze`);
    console.log(`🎯 Environment: ${process.env.NODE_ENV || 'production'}`);
});

module.exports = app;
EOF

log "Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
EOF

log "✅ All files created successfully!"

echo ""
echo -e "${BLUE}=== 🎉 Setup Complete! ===${NC}"
echo -e "${GREEN}Your SEO NLP App is ready to deploy!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test locally: npm install && npm start"
echo "2. Deploy to AWS: Run the deployment commands below"
echo ""

# Now let's deploy to AWS
log "Starting AWS deployment..."

# Check prerequisites
if ! command -v aws &> /dev/null; then
    error "AWS CLI not found. Please install it first."
fi

if ! command -v docker &> /dev/null; then
    error "Docker not found. Please install it first."
fi

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    error "AWS credentials not configured. Run 'aws configure' first."
fi

log "AWS Account ID: $ACCOUNT_ID"

# Create ECR repository
log "Setting up ECR repository..."
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $REGION &> /dev/null; then
    log "Creating ECR repository: $ECR_REPOSITORY_NAME"
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true
fi

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY_NAME"
log "ECR URI: $ECR_URI"

# Build and push Docker image
log "Building Docker image..."
docker build --platform linux/amd64 -t $ECR_URI:latest .

log "Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

log "Pushing image to ECR..."
docker push $ECR_URI:latest

# Create CloudFormation template
log "Creating CloudFormation template..."
cat > fargate-deployment.yml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SEO NLP App on Fargate with Auto-Scaling'

Parameters:
  ImageUri:
    Type: String
    Description: ECR Image URI

Resources:
  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${AWS::StackName}-cluster'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE_SPOT
          Weight: 70
        - CapacityProvider: FARGATE
          Weight: 30

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 3000
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: ip
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ECS Task Definition
  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub '${AWS::StackName}-task'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '256'
      Memory: '512'
      ExecutionRoleArn: !Ref TaskExecutionRole
      ContainerDefinitions:
        - Name: seo-nlp-app
          Image: !Ref ImageUri
          PortMappings:
            - ContainerPort: 3000
              Protocol: tcp
          Environment:
            - Name: NODE_ENV
              Value: production
            - Name: AWS_REGION
              Value: !Ref AWS::Region
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref CloudWatchLogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub '${AWS::StackName}-service'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 1
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
          AssignPublicIp: ENABLED
      LoadBalancers:
        - ContainerName: seo-nlp-app
          ContainerPort: 3000
          TargetGroupArn: !Ref TargetGroup

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # Auto Scaling
  AutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 0
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  ScaleUpPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${AWS::StackName}-scale-up'
      PolicyType: StepScaling
      ScalingTargetId: !Ref AutoScalingTarget
      StepScalingPolicyConfiguration:
        AdjustmentType: ChangeInCapacity
        Cooldown: 300
        MetricAggregationType: Average
        StepAdjustments:
          - MetricIntervalLowerBound: 0
            ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${AWS::StackName}-scale-down'
      PolicyType: StepScaling
      ScalingTargetId: !Ref AutoScalingTarget
      StepScalingPolicyConfiguration:
        AdjustmentType: ChangeInCapacity
        Cooldown: 600
        MetricAggregationType: Average
        StepAdjustments:
          - MetricIntervalUpperBound: 0
            ScalingAdjustment: -1

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cpu-high'
      AlarmDescription: 'Scale up on high CPU'
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !Sub '${AWS::StackName}-service'
        - Name: ClusterName
          Value: !Ref ECSCluster
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cpu-low'
      AlarmDescription: 'Scale down on low CPU'
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 600
      EvaluationPeriods: 3
      Threshold: 10
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !Sub '${AWS::StackName}-service'
        - Name: ClusterName
          Value: !Ref ECSCluster
      AlarmActions:
        - !Ref ScaleDownPolicy

  # IAM Roles
  TaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

  # CloudWatch Log Group
  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/${AWS::StackName}'
      RetentionInDays: 7

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-dns'

  ClusterName:
    Description: 'ECS Cluster Name'
    Value: !Ref ECSCluster

  ServiceName:
    Description: 'ECS Service Name'
    Value: !Sub '${AWS::StackName}-service'
EOF

# Deploy CloudFormation stack
log "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file fargate-deployment.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides ImageUri=$ECR_URI:latest \
    --capabilities CAPABILITY_IAM \
    --region $REGION

# Get deployment info
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text)

echo ""
echo -e "${BLUE}=== 🎉 Deployment Successful! ===${NC}"
echo -e "${GREEN}Your SEO NLP App is running at: http://$ALB_DNS${NC}"
echo -e "${GREEN}Health Check: http://$ALB_DNS/health${NC}"
echo ""
echo -e "${YELLOW}Test your app:${NC}"
echo "curl http://$ALB_DNS/health"
echo ""
echo "curl -X POST http://$ALB_DNS/api/seo/analyze \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-user-tier: FREE' \\"
echo "  -d '{\"content\": \"This is my website content for SEO analysis\"}'"
echo ""
echo -e "${GREEN}🚀 Your cost-optimized SEO platform is live!${NC}"

log "Setup and deployment completed successfully!"

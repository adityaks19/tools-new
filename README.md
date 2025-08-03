# SEO NLP App - Cost-Optimized AI-Powered SEO Platform

A highly cost-optimized, auto-scaling SEO analysis platform built with AWS Fargate, Bedrock AI, and intelligent resource management that scales to zero when not in use.

## 🚀 Features

### Core SEO Features
- **AI-Powered SEO Analysis** - Comprehensive content analysis using AWS Bedrock
- **Keyword Research** - Intelligent keyword suggestions and analysis
- **Content Optimization** - AI-driven content improvement recommendations
- **Real-time Analytics** - Performance tracking and insights

### Cost Optimization Features
- **Tiered AI Models** - Different AI models for different subscription tiers
- **Intelligent Caching** - Redis-based caching to reduce API costs
- **Auto-scaling to Zero** - Fargate tasks scale down to 0 when no traffic
- **Smart Resource Management** - Dynamic resource allocation based on load
- **Usage Tracking** - Detailed cost and usage analytics

### Subscription Tiers

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Daily Requests | 10 | 100 | 500 | 2000 |
| AI Model | Titan Lite | Claude Haiku | Claude Sonnet | Claude Opus |
| Caching | 1 hour | 30 min | 15 min | 5 min |
| Advanced Analytics | ❌ | ❌ | ✅ | ✅ |
| Custom Prompts | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   Load Balancer  │    │   Auto Scaler   │
│   Load Balancer │◄──►│   Target Group   │◄──►│   Lambda        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ECS Fargate   │    │   CloudWatch     │    │   Cost          │
│   Service       │◄──►│   Metrics        │◄──►│   Optimizer     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AWS Bedrock   │    │   Redis Cache    │    │   Usage         │
│   AI Models     │    │   Layer          │    │   Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd seo-nlp-app
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
export AWS_REGION=us-east-1
export NODE_ENV=production
export REDIS_HOST=your-redis-host
```

### 3. Deploy to AWS
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy the application
./scripts/deploy.sh
```

The deployment script will:
- Create ECR repository
- Build and push Docker image
- Deploy CloudFormation infrastructure
- Set up auto-scaling and monitoring
- Configure cost optimization

### 4. Test the Deployment
```bash
# Get the load balancer URL from deployment output
curl http://your-alb-dns/health

# Test SEO analysis
curl -X POST http://your-alb-dns/api/seo/analyze \
  -H "Content-Type: application/json" \
  -H "x-user-tier: FREE" \
  -H "x-user-id: test-user" \
  -d '{"content": "Your content to analyze"}'
```

## 📊 Cost Optimization Features

### 1. Intelligent Auto-Scaling
- **Scale to Zero**: Tasks automatically scale to 0 when no requests
- **Smart Scaling**: Uses CPU, memory, and request metrics for scaling decisions
- **Spot Instances**: Uses Fargate Spot for 70% cost reduction

### 2. Tiered AI Models
```javascript
// Free tier - cheapest models
FREE: {
    textGeneration: 'amazon.titan-text-lite-v1',
    costPerToken: 0.0003
}

// Enterprise tier - best models
ENTERPRISE: {
    textGeneration: 'anthropic.claude-3-opus-20240229-v1:0',
    costPerToken: 0.015
}
```

### 3. Intelligent Caching
- **Tier-based TTL**: Different cache durations for each tier
- **Content-aware**: Smart cache keys based on content and parameters
- **Cost Tracking**: Monitors cache hit rates for optimization

### 4. Usage Analytics
```bash
# Get usage statistics
curl http://your-alb-dns/api/user/usage \
  -H "x-user-tier: PRO" \
  -H "x-user-id: your-user-id"
```

## 🔧 API Endpoints

### SEO Analysis
```bash
POST /api/seo/analyze
Content-Type: application/json
x-user-tier: FREE|BASIC|PRO|ENTERPRISE
x-user-id: unique-user-id

{
  "content": "Content to analyze",
  "url": "https://example.com",
  "options": {}
}
```

### Keyword Research
```bash
POST /api/seo/keywords
Content-Type: application/json
x-user-tier: FREE|BASIC|PRO|ENTERPRISE
x-user-id: unique-user-id

{
  "topic": "SEO optimization",
  "targetAudience": "small businesses",
  "options": {}
}
```

### Content Optimization
```bash
POST /api/seo/optimize
Content-Type: application/json
x-user-tier: BASIC|PRO|ENTERPRISE
x-user-id: unique-user-id

{
  "content": "Content to optimize",
  "targetKeywords": ["seo", "optimization"],
  "options": {}
}
```

### Usage Statistics
```bash
GET /api/user/usage
x-user-tier: FREE|BASIC|PRO|ENTERPRISE
x-user-id: unique-user-id
```

## 📈 Monitoring and Metrics

### CloudWatch Dashboard
The deployment creates a comprehensive dashboard with:
- ECS service metrics (CPU, Memory, Task count)
- Cost optimization metrics (Cache hit rate, Total cost)
- Auto-scaling events and decisions
- Request patterns and throttling

### Custom Metrics
- `SEO-NLP-App/CostOptimization/TotalCost`
- `SEO-NLP-App/CostOptimization/CacheHitRate`
- `SEO-NLP-App/CostOptimization/ThrottledRequests`
- `SEO-NLP-App/CostOptimization/TaskCountChange`

### Alarms and Notifications
- High cost alerts
- Low cache hit rate warnings
- Service scaling events
- Error rate monitoring

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Per-tier request limits
- **Input Validation**: Request sanitization
- **Non-root Container**: Security-hardened Docker image
- **IAM Roles**: Least privilege access

## 🚀 Performance Optimizations

### Application Level
- **Compression**: Gzip compression for responses
- **Connection Pooling**: Efficient AWS SDK usage
- **Memory Management**: Optimized for container environments
- **Graceful Shutdown**: Proper signal handling

### Infrastructure Level
- **Multi-AZ Deployment**: High availability
- **Health Checks**: Comprehensive health monitoring
- **Auto-scaling**: Responsive to load changes
- **Spot Instances**: Cost-effective compute

## 📝 Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Application Configuration
NODE_ENV=production
PORT=3000

# ECS Configuration (set by deployment)
ECS_CLUSTER_NAME=seo-nlp-app-cluster
ECS_SERVICE_NAME=seo-nlp-app-service

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# Monitoring
ENABLE_METRICS=true
METRICS_INTERVAL=60000
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:coverage
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

## 📦 Deployment Options

### 1. Automated Deployment (Recommended)
```bash
./scripts/deploy.sh
```

### 2. Manual CloudFormation
```bash
aws cloudformation deploy \
  --template-file infrastructure/fargate-deployment.yml \
  --stack-name seo-nlp-app \
  --capabilities CAPABILITY_IAM
```

### 3. Local Development
```bash
# Start Redis (required for caching)
docker run -d -p 6379:6379 redis:alpine

# Start the application
npm run dev
```

## 💰 Cost Estimation

### Monthly Cost Breakdown (Estimated)

| Component | Free Tier | Basic | Pro | Enterprise |
|-----------|-----------|-------|-----|------------|
| Fargate | $0-5 | $10-25 | $25-75 | $75-200 |
| Bedrock API | $0-1 | $5-15 | $25-100 | $100-500 |
| Load Balancer | $16 | $16 | $16 | $16 |
| CloudWatch | $0-2 | $2-5 | $5-15 | $15-50 |
| **Total** | **$16-23** | **$33-61** | **$71-206** | **$206-766** |

*Costs vary based on usage patterns and auto-scaling behavior*

## 🔧 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check ECS service logs
   aws logs tail /ecs/seo-nlp-app --follow
   ```

2. **High costs**
   ```bash
   # Check cost optimization recommendations
   curl http://your-alb-dns/api/user/usage
   ```

3. **Scaling issues**
   ```bash
   # Check auto-scaler logs
   aws logs tail /aws/lambda/seo-nlp-app-autoscaler --follow
   ```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Monitoring**: Use CloudWatch dashboard for operational insights

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks
- Monitor cost optimization metrics
- Update AI model configurations
- Review and adjust auto-scaling parameters
- Update dependencies and security patches

### Scaling Considerations
- Monitor cache hit rates and adjust TTL values
- Review tier limits based on usage patterns
- Optimize model selection based on content complexity
- Consider regional deployment for global users

---

**Built with ❤️ for cost-conscious developers who want powerful AI without breaking the bank!**

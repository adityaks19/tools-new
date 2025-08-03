# 🚀 SEO NLP App - Cost-Optimized AI Platform

A production-ready, cost-optimized SEO analysis platform that automatically scales to zero when not in use, saving you money while providing powerful AI-driven SEO insights.

## ✨ Features

- **🤖 AI-Powered SEO Analysis** - Analyze content for SEO optimization
- **🎯 Keyword Research** - Generate relevant keywords for your content
- **📝 Content Optimization** - Improve your content for better SEO
- **💰 Cost-Optimized** - Auto-scales to zero, uses Fargate Spot instances
- **🔄 Auto-Scaling** - Handles traffic spikes automatically
- **📊 Usage Analytics** - Track your API usage and costs

## 🏗️ Architecture

- **AWS Fargate** - Serverless containers (no EC2 management)
- **Application Load Balancer** - High availability and SSL termination
- **Auto Scaling** - Scales from 0 to 10 instances based on demand
- **CloudWatch** - Monitoring and alerting
- **ECR** - Container registry

## 💰 Pricing Tiers

| Tier | Daily Requests | Features | Est. Monthly Cost |
|------|----------------|----------|-------------------|
| **FREE** | 10 | Basic SEO Analysis | $16-25 |
| **BASIC** | 100 | + Keyword Research | $25-50 |
| **PRO** | 500 | + Content Optimization | $50-100 |
| **ENTERPRISE** | 2000 | + Advanced Analytics | $100-200 |

## 🚀 Quick Deploy to AWS

### Prerequisites
- AWS Account with CLI configured
- Docker installed (for CloudShell, it's pre-installed)

### One-Command Deployment

```bash
# In AWS CloudShell or your terminal:
curl -sSL https://raw.githubusercontent.com/adityaks19/tools-new/main/setup-seo-app.sh | bash
```

That's it! The script will:
1. ✅ Create all necessary files
2. ✅ Build and push Docker image to ECR
3. ✅ Deploy infrastructure with CloudFormation
4. ✅ Set up auto-scaling and monitoring
5. ✅ Give you the live URL

## 📱 API Usage

### Health Check
```bash
curl http://your-alb-url/health
```

### SEO Analysis
```bash
curl -X POST http://your-alb-url/api/seo/analyze \
  -H "Content-Type: application/json" \
  -H "x-user-tier: FREE" \
  -H "x-user-id: your-user-id" \
  -d '{"content": "Your content to analyze"}'
```

### Keyword Research
```bash
curl -X POST http://your-alb-url/api/seo/keywords \
  -H "Content-Type: application/json" \
  -H "x-user-tier: BASIC" \
  -H "x-user-id: your-user-id" \
  -d '{"topic": "SEO optimization", "targetAudience": "small businesses"}'
```

### Content Optimization (BASIC+ tiers)
```bash
curl -X POST http://your-alb-url/api/seo/optimize \
  -H "Content-Type: application/json" \
  -H "x-user-tier: PRO" \
  -H "x-user-id: your-user-id" \
  -d '{"content": "Your content", "targetKeywords": ["seo", "optimization"]}'
```

## 🔧 Local Development

```bash
# Clone the repository
git clone https://github.com/adityaks19/tools-new.git
cd tools-new

# Install dependencies
npm install

# Start the server
npm start

# Test locally
curl http://localhost:3000/health
```

## 📊 Cost Optimization Features

- **Auto-scaling to Zero** - No traffic = $0 compute costs
- **Fargate Spot** - 70% cheaper than regular Fargate
- **Intelligent Caching** - Reduces API calls
- **Tiered Pricing** - Pay only for what you use
- **Resource Monitoring** - Track costs in real-time

## 🛡️ Security Features

- Non-root container user
- Rate limiting per tier
- Input validation
- Security headers (Helmet.js)
- VPC isolation

## 📈 Monitoring

The deployment includes:
- CloudWatch dashboards
- Auto-scaling metrics
- Cost tracking
- Performance monitoring
- Error alerting

## 🔄 Updates & Maintenance

To update your deployment:
```bash
# Re-run the setup script
curl -sSL https://raw.githubusercontent.com/adityaks19/tools-new/main/setup-seo-app.sh | bash
```

## 🆘 Troubleshooting

### Check deployment status:
```bash
aws cloudformation describe-stacks --stack-name seo-nlp-app
```

### View logs:
```bash
aws logs tail /ecs/seo-nlp-app --follow
```

### Delete everything:
```bash
aws cloudformation delete-stack --stack-name seo-nlp-app
```

## 📄 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for developers who want powerful SEO tools without the high costs!**

### 🎯 Perfect for:
- Startups building SEO tools
- Agencies offering SEO services  
- Developers learning AWS Fargate
- Anyone wanting cost-optimized AI applications

**Deploy now and start analyzing SEO in minutes!** 🚀

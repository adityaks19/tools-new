# SEO NLP Processor - AI-Powered Content Optimization

A scalable, subscription-based web application that transforms documents into SEO-optimized content using AWS Bedrock AI. Users can drag and drop files, enter custom prompts, and receive professionally optimized content with advanced SEO analysis.

## 🚀 Features

- **Drag & Drop File Processing**: Support for PDF, DOCX, TXT, HTML, and Markdown files
- **AI-Powered Optimization**: Uses AWS Bedrock (Claude 3) for intelligent content transformation
- **SEO Analysis**: Automatic keyword optimization, meta tag generation, and content scoring
- **Subscription Management**: Stripe-integrated billing with multiple tiers
- **Scalable Architecture**: Built on AWS with auto-scaling capabilities
- **Real-time Processing**: Fast file processing with progress tracking
- **Secure**: Enterprise-grade security with AWS IAM and encryption

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express Server │────│   AWS Services  │
│                 │    │                 │    │                 │
│ • File Upload   │    │ • Authentication│    │ • Bedrock (AI)  │
│ • Drag & Drop   │    │ • File Processing│    │ • S3 (Storage)  │
│ • SEO Analysis  │    │ • Subscription  │    │ • DynamoDB      │
│ • Billing       │    │ • Rate Limiting │    │ • CloudWatch    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS Account with appropriate permissions
- Stripe account for payments
- Domain name (for production)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd seo-nlp-app
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. AWS Setup

#### Enable AWS Bedrock
1. Go to AWS Bedrock console
2. Enable model access for Claude 3 Sonnet
3. Note your region (e.g., us-east-1)

#### Create IAM User
```bash
# Create IAM user with programmatic access
aws iam create-user --user-name seo-nlp-app-user

# Attach required policies
aws iam attach-user-policy --user-name seo-nlp-app-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-user-policy --user-name seo-nlp-app-user --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Create custom policy for Bedrock
cat > bedrock-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "*"
        }
    ]
}
EOF

aws iam create-policy --policy-name BedrockInvokePolicy --policy-document file://bedrock-policy.json
aws iam attach-user-policy --user-name seo-nlp-app-user --policy-arn arn:aws:iam::ACCOUNT-ID:policy/BedrockInvokePolicy

# Create access keys
aws iam create-access-key --user-name seo-nlp-app-user
```

### 4. Deploy Infrastructure

```bash
# Deploy AWS infrastructure
./deploy.sh production us-east-1 your-domain.com
```

### 5. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=seo-nlp-files-production-123456789
DYNAMODB_TABLE_USERS=seo-nlp-users-production
DYNAMODB_TABLE_SUBSCRIPTIONS=seo-nlp-subscriptions-production
DYNAMODB_TABLE_USAGE=seo-nlp-usage-production

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Application Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-domain.com

# Stripe Configuration (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 6. Stripe Setup

1. Create Stripe account and get API keys
2. Create products and prices:

```bash
# Create products using Stripe CLI or Dashboard
stripe products create --name "Basic Plan" --description "50 processes per day"
stripe prices create --product prod_xxx --unit-amount 999 --currency usd --recurring interval=month

stripe products create --name "Premium Plan" --description "200 processes per day"
stripe prices create --product prod_xxx --unit-amount 2999 --currency usd --recurring interval=month

stripe products create --name "Enterprise Plan" --description "1000 processes per day"
stripe prices create --product prod_xxx --unit-amount 9999 --currency usd --recurring interval=month
```

3. Update price IDs in `routes/subscriptions.js`
4. Set up webhook endpoint: `https://your-domain.com/api/subscriptions/webhook`

## 🚀 Deployment Options

### Option 1: Docker Deployment

```bash
# Build and run with Docker
docker build -t seo-nlp-app .
docker run -p 3000:3000 --env-file .env seo-nlp-app

# Or use Docker Compose
docker-compose up -d
```

### Option 2: EC2 Deployment

```bash
# Upload to EC2 instance
scp seo-nlp-app.zip ec2-user@your-instance:/home/ec2-user/

# SSH and deploy
ssh ec2-user@your-instance
unzip seo-nlp-app.zip
npm install --production
npm start
```

### Option 3: ECS Deployment

1. Push Docker image to ECR
2. Create ECS task definition
3. Deploy to ECS cluster

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker build -t seo-nlp-app .
docker tag seo-nlp-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/seo-nlp-app:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/seo-nlp-app:latest
```

## 📊 Monitoring and Scaling

### CloudWatch Metrics
- API response times
- Error rates
- File processing success rates
- User activity

### Auto Scaling
- Configure ECS auto scaling based on CPU/memory
- Set up Application Load Balancer health checks
- Monitor DynamoDB read/write capacity

### Cost Optimization
- Use S3 lifecycle policies for old files
- Implement DynamoDB TTL for usage records
- Monitor Bedrock API costs

## 🔧 Development

### Local Development

```bash
# Start development server
npm run dev

# Start client development server (in another terminal)
cd client
npm start
```

### Testing

```bash
# Run server tests
npm test

# Run client tests
cd client
npm test
```

### API Documentation

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### File Processing Endpoints
- `POST /api/files/upload` - Upload and queue file for processing
- `GET /api/files` - Get user's files
- `GET /api/files/:fileId` - Get file details
- `DELETE /api/files/:fileId` - Delete file

#### NLP Processing Endpoints
- `POST /api/nlp/process/:fileId` - Process file with AI
- `POST /api/nlp/seo-analysis` - Analyze content for SEO
- `POST /api/nlp/variations` - Generate content variations

#### Subscription Endpoints
- `GET /api/subscriptions/plans` - Get available plans
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/cancel` - Cancel subscription

## 🔒 Security Features

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- File type validation
- File size limits (10MB default)
- CORS protection
- Helmet.js security headers
- AWS IAM role-based access
- Encrypted S3 storage
- DynamoDB encryption at rest

## 📈 Subscription Tiers

| Feature | Free | Basic ($9.99/mo) | Premium ($29.99/mo) | Enterprise ($99.99/mo) |
|---------|------|------------------|---------------------|------------------------|
| Daily Processing | 5 files | 50 files | 200 files | 1000 files |
| File Size Limit | 5MB | 10MB | 50MB | 100MB |
| SEO Analysis | Basic | ✓ | Advanced | Full Suite |
| Content Variations | ❌ | ❌ | ✓ | ✓ |
| API Access | ❌ | ❌ | ❌ | ✓ |
| Support | Community | Email | Priority | Dedicated |

## 🐛 Troubleshooting

### Common Issues

1. **Bedrock Access Denied**
   - Ensure model access is enabled in AWS Bedrock console
   - Check IAM permissions for bedrock:InvokeModel

2. **File Upload Fails**
   - Check S3 bucket permissions
   - Verify file size limits
   - Ensure supported file format

3. **Stripe Webhook Issues**
   - Verify webhook endpoint URL
   - Check webhook secret in environment variables
   - Test webhook with Stripe CLI

4. **High DynamoDB Costs**
   - Review read/write capacity settings
   - Implement proper indexing
   - Use TTL for temporary data

### Logs and Debugging

```bash
# View application logs
docker logs seo-nlp-app

# Check AWS CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/ecs/seo-nlp

# Monitor API performance
curl -f http://localhost:3000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [Link to docs]
- Issues: [GitHub Issues]
- Email: support@your-domain.com
- Discord: [Community Discord]

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced SEO analytics dashboard
- [ ] Integration with popular CMS platforms
- [ ] Mobile app
- [ ] Team collaboration features
- [ ] API rate limiting per subscription tier
- [ ] Content scheduling and publishing
- [ ] A/B testing for content variations

---

Built with ❤️ using AWS, React, and Node.js

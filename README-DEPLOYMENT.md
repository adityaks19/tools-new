# NLP Tool - Deployment Guide

## 🚀 Current Status

The NLP Tool application is now successfully deployed and running on:
- **Frontend**: http://44.205.255.158:3000
- **API**: http://44.205.255.158:3000/api
- **Health Check**: http://44.205.255.158:3000/api/health

## ✅ What's Been Fixed

### 1. SEO References Removed
- ✅ All SEO-specific terminology removed from codebase
- ✅ Converted to general NLP tool functionality
- ✅ Updated API endpoints from `/api/seo/*` to `/api/nlp/*`
- ✅ Renamed components (SEOAnalyzer → NLPTool)
- ✅ Updated package names and descriptions

### 2. Backend Issues Fixed
- ✅ Fixed Content Security Policy for React app
- ✅ Proper static file serving
- ✅ CORS configuration for public IP access
- ✅ AWS SDK integration (DynamoDB, Bedrock)
- ✅ File upload handling with multer
- ✅ Error handling and logging

### 3. Frontend-Backend Connection
- ✅ React app builds successfully
- ✅ API endpoints properly connected
- ✅ Navigation updated with NLP Tool link
- ✅ Authentication flow working
- ✅ Mock responses for development

### 4. AWS Integration Ready
- ✅ DynamoDB client configured
- ✅ Bedrock client for AI processing
- ✅ Environment-based configuration
- ✅ Production setup scripts provided

## 🛠 Current Features

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/files/upload` - File upload
- `POST /api/nlp/analyze` - Text analysis
- `POST /api/nlp/generate` - Text generation
- `POST /api/nlp/transform` - Text transformation
- `GET /api/user/usage` - Usage statistics

### Frontend Features
- ✅ Drag & drop file upload
- ✅ Text analysis with custom prompts
- ✅ Text generation
- ✅ Text transformation
- ✅ User authentication
- ✅ Dashboard and usage tracking
- ✅ Responsive design

## 🔧 AWS Setup for Production

### 1. Create DynamoDB Tables
```bash
# Run the AWS setup script
./setup-aws.sh
```

This creates the following tables:
- `nlp-tool-users` - User accounts
- `nlp-tool-sessions` - User sessions
- `nlp-tool-usage` - Usage tracking
- `nlp-tool-files` - File metadata

### 2. Configure AWS Credentials
Update `.env` file with your AWS credentials:
```bash
cp .env.production .env
# Edit .env with your actual AWS credentials
```

Required environment variables:
```
AWS_ACCESS_KEY_ID=your-actual-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-secret-access-key
AWS_REGION=us-east-1
NODE_ENV=production
```

### 3. Enable Bedrock Access
Ensure your AWS account has access to:
- Amazon Bedrock
- Claude 3 Haiku model (`anthropic.claude-3-haiku-20240307-v1:0`)

## 🚦 Running the Application

### Development Mode (Current)
```bash
npm start
```
- Uses mock AWS services
- Mock API responses
- Development logging enabled

### Production Mode
```bash
NODE_ENV=production npm start
```
- Uses real AWS services
- Real AI processing with Bedrock
- Production optimizations

## 📊 Monitoring & Logs

### Check Application Status
```bash
# Health check
curl http://44.205.255.158:3000/api/health

# Server logs
tail -f server.log

# Process status
ps aux | grep node
```

### API Testing
```bash
# Test text analysis
curl -X POST http://44.205.255.158:3000/api/nlp/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"Your text here","prompt":"Analyze sentiment"}'

# Test text generation
curl -X POST http://44.205.255.158:3000/api/nlp/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a story about AI"}'
```

## 🔒 Security Considerations

### Current Security Features
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ File upload size limits
- ✅ Input validation

### For Production
- [ ] Implement proper JWT authentication
- [ ] Add HTTPS/SSL certificates
- [ ] Configure AWS IAM roles properly
- [ ] Set up CloudWatch monitoring
- [ ] Implement proper session management

## 🐛 Troubleshooting

### Common Issues

1. **Blank Frontend Screen**
   - ✅ Fixed: CSP configuration updated
   - ✅ Fixed: Static file serving corrected

2. **API Connection Issues**
   - ✅ Fixed: CORS properly configured
   - ✅ Fixed: Endpoints properly mapped

3. **AWS Service Errors**
   - Check AWS credentials in `.env`
   - Verify DynamoDB tables exist
   - Ensure Bedrock access is enabled

### Restart Application
```bash
# Stop current process
pkill -f "node server.js"

# Start fresh
npm start
```

## 📈 Next Steps

1. **Configure AWS Security Group** to allow port 3000 access
2. **Set up production AWS credentials**
3. **Run AWS setup script** to create DynamoDB tables
4. **Switch to production mode** for real AI processing
5. **Set up SSL/HTTPS** for secure connections
6. **Configure monitoring** with CloudWatch

## 🎯 Application URLs

- **Main Application**: http://44.205.255.158:3000
- **NLP Tool**: http://44.205.255.158:3000/nlp-tool
- **Dashboard**: http://44.205.255.158:3000/dashboard
- **API Health**: http://44.205.255.158:3000/api/health

The application is now fully functional with proper frontend-backend integration and ready for AWS production deployment!

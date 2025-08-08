# NLP Tool Application

A cost-optimized NLP application with intelligent auto-scaling and tiered AI models, built with React frontend and Node.js backend.

## 📁 Project Structure

```
nlp-tool-app/
├── backend/                    # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/           # Data models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Utility functions
│   │   └── server.js         # Main server file
│   ├── tests/                # Backend tests
│   └── package.json          # Backend dependencies
├── frontend/                  # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── pages/           # Page components
│   │   └── index.js         # Main React entry
│   ├── public/              # Static assets
│   ├── build/               # Production build
│   └── package.json         # Frontend dependencies
├── infrastructure/           # Infrastructure as Code
│   ├── aws/                 # AWS CloudFormation/CDK
│   ├── docker/              # Docker configurations
│   └── kubernetes/          # K8s manifests
├── scripts/                 # Utility scripts
│   ├── deployment/          # Deployment scripts
│   ├── setup/              # Setup scripts
│   └── monitoring/         # Monitoring scripts
├── docs/                   # Documentation
│   ├── api/               # API documentation
│   ├── deployment/        # Deployment guides
│   └── user-guide/        # User documentation
├── logs/                  # Application logs
├── .env.example          # Environment variables template
├── ecosystem.config.js   # PM2 configuration
└── package.json         # Root package.json (monorepo)
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- AWS CLI configured
- PM2 (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nlp-tool-app.git
   cd nlp-tool-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm start
   ```
   This will start both backend (port 3000) and frontend (port 3001) concurrently.

## 🛠️ Development

### Backend Development

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📦 Available Scripts

### Root Level Scripts

- `npm start` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm test` - Run all tests (backend + frontend)
- `npm run lint` - Run linting on all code
- `npm run clean` - Clean all node_modules and build artifacts

### Production Scripts

- `npm run deploy` - Deploy to production
- `npm run pm2:start` - Start with PM2
- `npm run pm2:stop` - Stop PM2 processes
- `npm run monitor:start` - Start health monitoring
- `npm run scaler:start` - Start auto-scaler

## 🏗️ Architecture

### Backend (Node.js/Express)

- **API Server**: RESTful API with Express.js
- **Authentication**: JWT-based authentication
- **Database**: DynamoDB for user data, Redis for caching
- **File Processing**: Support for PDF, DOCX, TXT files
- **AI Integration**: AWS Bedrock for NLP processing
- **Payment**: Stripe and PayPal integration
- **Monitoring**: Health checks and auto-scaling

### Frontend (React)

- **UI Framework**: React 18 with functional components
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast

### Infrastructure

- **Cloud Provider**: AWS
- **Compute**: ECS Fargate for auto-scaling
- **Storage**: S3 for file storage
- **Database**: DynamoDB
- **Caching**: Redis
- **Load Balancer**: Application Load Balancer
- **Monitoring**: CloudWatch
- **CI/CD**: GitHub Actions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Database
DYNAMODB_TABLE_NAME=nlp-tool-users
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Payment
STRIPE_SECRET_KEY=your_stripe_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# AI Models
BEDROCK_MODEL_ID=anthropic.claude-v2
```

## 🚀 Deployment

### Development Deployment

```bash
# Start development environment
npm start
```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy with PM2**
   ```bash
   npm run pm2:start
   ```

3. **Deploy to AWS**
   ```bash
   npm run deploy
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:up
```

## 📊 Monitoring

### Health Monitoring

The application includes built-in health monitoring:

- **Health Endpoint**: `GET /health`
- **Metrics Endpoint**: `GET /metrics`
- **Auto-scaling**: Based on CPU and memory usage
- **Log Aggregation**: Centralized logging with PM2

### Starting Monitoring Services

```bash
# Start health monitor
npm run monitor:start

# Start auto-scaler
npm run scaler:start

# View logs
npm run pm2:logs
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests with coverage
cd backend && npm run test:coverage
```

### Test Structure

- **Backend Tests**: Located in `backend/tests/`
  - Unit tests for services
  - Integration tests for APIs
  - Load testing configurations

- **Frontend Tests**: Located in `frontend/src/`
  - Component tests with React Testing Library
  - Integration tests for user flows

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### File Processing Endpoints

- `POST /api/files/upload` - Upload file for processing
- `GET /api/files/:id` - Get file processing status
- `DELETE /api/files/:id` - Delete processed file

### NLP Processing Endpoints

- `POST /api/nlp/analyze` - Analyze text with AI
- `GET /api/nlp/models` - Get available AI models
- `POST /api/nlp/batch` - Batch process multiple texts

### Payment Endpoints

- `POST /api/payments/stripe` - Process Stripe payment
- `POST /api/payments/paypal` - Process PayPal payment
- `GET /api/subscriptions` - Get user subscriptions

## 🔒 Security

- **Authentication**: JWT tokens with secure httpOnly cookies
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers with Helmet.js
- **File Upload**: Secure file upload with type validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Built with ❤️ using React, Node.js, and AWS**

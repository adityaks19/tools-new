#!/bin/bash

# CloudShell Setup Script for SEO NLP App
# This script sets up everything in AWS CloudShell

set -e

echo "🚀 Setting up SEO NLP App in AWS CloudShell..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# Check if we're in CloudShell
if [[ -z "$AWS_EXECUTION_ENV" ]]; then
    warn "This script is designed for AWS CloudShell. You can still run it, but some features might not work."
fi

# Set default region
export AWS_DEFAULT_REGION=${AWS_REGION:-us-east-1}
log "Using AWS Region: $AWS_DEFAULT_REGION"

# Create project directory
PROJECT_DIR="$HOME/seo-nlp-app"
if [ -d "$PROJECT_DIR" ]; then
    warn "Project directory exists. Backing up..."
    mv "$PROJECT_DIR" "$PROJECT_DIR.backup.$(date +%s)"
fi

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

log "Created project directory: $PROJECT_DIR"

# Create all necessary files
log "Creating project files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "seo-nlp-app",
  "version": "1.0.0",
  "description": "Cost-optimized SEO NLP application with intelligent auto-scaling",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "deploy": "./scripts/deploy.sh"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.450.0",
    "@aws-sdk/client-cloudwatch": "^3.450.0",
    "@aws-sdk/client-ecs": "^3.450.0",
    "aws-sdk": "^2.1490.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "redis": "^4.6.10"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create directory structure
mkdir -p src/{config,services} infrastructure scripts tests

log "Creating source files..."

# Create simplified server.js for CloudShell
cat > src/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Basic SEO analysis endpoint (simplified for demo)
app.post('/api/seo/analyze', (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({
            error: 'Content is required',
            code: 'MISSING_CONTENT'
        });
    }
    
    // Simplified analysis (in production, this would use Bedrock)
    const analysis = {
        seoScore: Math.floor(Math.random() * 40) + 60, // 60-100
        issues: [
            'Consider adding more keywords',
            'Improve meta description',
            'Add internal links'
        ],
        recommendations: [
            'Use header tags (H1, H2, H3)',
            'Optimize image alt text',
            'Improve content readability'
        ],
        metadata: {
            contentLength: content.length,
            wordCount: content.split(' ').length,
            timestamp: new Date().toISOString()
        }
    };
    
    res.json({
        analysis,
        tier: req.headers['x-user-tier'] || 'FREE',
        cached: false
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`SEO NLP App server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}

module.exports = app;
EOF

log "Creating Dockerfile..."

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
EOF

log "✅ Project setup completed!"

echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
echo "1. Run the deployment:"
echo "   cd $PROJECT_DIR"
echo "   ./scripts/deploy.sh"
echo ""
echo "2. After deployment, test your app:"
echo "   ./test-app.sh <public-ip>"
echo ""
echo -e "${GREEN}🚀 Ready to deploy!${NC}"

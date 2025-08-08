#!/bin/bash

# SEO NLP Application Setup Script
set -e

echo "🚀 SEO NLP Application Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js $(node --version) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm $(npm --version) is installed"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_warning "AWS CLI is not installed. You'll need it for deployment."
    echo "Install it from: https://aws.amazon.com/cli/"
else
    print_status "AWS CLI is installed"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

print_info "Installing server dependencies..."
npm install

print_info "Installing client dependencies..."
cd client
npm install
cd ..

print_status "All dependencies installed successfully"

# Create environment file
echo ""
echo "⚙️  Setting up environment configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_status "Created .env file from template"
    print_warning "Please update .env file with your actual values before running the application"
else
    print_info ".env file already exists"
fi

# Generate JWT secret if not set
if ! grep -q "JWT_SECRET=your_jwt_secret_key_here" .env; then
    print_info "JWT secret already configured"
else
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s | sha256sum | base64 | head -c 32)")
    sed -i "s/JWT_SECRET=your_jwt_secret_key_here/JWT_SECRET=$JWT_SECRET/" .env
    print_status "Generated JWT secret"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."

mkdir -p logs
mkdir -p uploads
mkdir -p dist

print_status "Created necessary directories"

# Set up git hooks (if git is available)
if command -v git &> /dev/null && [ -d .git ]; then
    echo ""
    echo "🔧 Setting up git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run tests before commit
npm test --passWithNoTests
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi
EOF
    
    chmod +x .git/hooks/pre-commit
    print_status "Git pre-commit hook installed"
fi

# Build client for production
echo ""
echo "🏗️  Building client application..."

cd client
npm run build
cd ..

print_status "Client application built successfully"

# Create systemd service file (for Linux deployment)
if [ -f /etc/systemd/system/ ] 2>/dev/null; then
    echo ""
    echo "🔧 Creating systemd service file..."
    
    cat > seo-nlp-app.service << EOF
[Unit]
Description=SEO NLP Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_status "Systemd service file created (seo-nlp-app.service)"
    print_info "To install: sudo cp seo-nlp-app.service /etc/systemd/system/"
fi

# Create nginx configuration template
echo ""
echo "🌐 Creating nginx configuration template..."

cat > nginx.conf.template << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Static files
    location /static/ {
        alias /path/to/your/app/client/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

print_status "Nginx configuration template created"

# Create Docker files if Docker is available
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker is available"
    print_info "Dockerfile and docker-compose.yml are already created"
    print_info "Run 'docker-compose up -d' to start with Docker"
fi

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🔧 Configure your environment:"
echo "   - Edit .env file with your AWS credentials"
echo "   - Set up Stripe API keys"
echo "   - Configure your domain name"
echo ""
echo "2. ☁️  Deploy AWS infrastructure:"
echo "   ./deploy.sh production us-east-1 your-domain.com"
echo ""
echo "3. 🚀 Start the application:"
echo "   npm start"
echo ""
echo "4. 🌐 Access your application:"
echo "   http://localhost:3000"
echo ""
echo "📚 Additional Resources:"
echo "======================="
echo "• Documentation: README.md"
echo "• API Docs: http://localhost:3000/api/health"
echo "• Logs: ./logs/"
echo ""
echo "🔧 Development Commands:"
echo "======================="
echo "• Start development: npm run dev"
echo "• Build client: cd client && npm run build"
echo "• Run tests: npm test"
echo "• Deploy: ./deploy.sh"
echo ""
echo "⚠️  Important Notes:"
echo "=================="
echo "• Update .env with real values before deployment"
echo "• Enable AWS Bedrock model access in AWS console"
echo "• Set up Stripe webhook endpoints"
echo "• Configure domain DNS to point to your load balancer"
echo ""
print_status "Setup script completed! Happy coding! 🎉"

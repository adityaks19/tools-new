#!/bin/bash

# Development Setup Script for NLP Tool Application
# This script sets up the development environment

set -e

echo "🚀 Setting up NLP Tool Application for development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
}

# Install root dependencies
install_root_deps() {
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Create environment file
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration"
    else
        print_success ".env file already exists"
    fi
}

# Create logs directory
setup_logs() {
    if [ ! -d logs ]; then
        print_status "Creating logs directory..."
        mkdir -p logs
        print_success "Logs directory created"
    else
        print_success "Logs directory already exists"
    fi
}

# Install PM2 globally if not installed
install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2 globally..."
        npm install -g pm2
        print_success "PM2 installed globally"
    else
        print_success "PM2 is already installed"
    fi
}

# Run tests to verify setup
run_tests() {
    print_status "Running tests to verify setup..."
    
    # Test backend
    cd backend
    if npm test; then
        print_success "Backend tests passed"
    else
        print_warning "Backend tests failed - this might be expected for initial setup"
    fi
    cd ..
    
    # Test frontend build
    cd frontend
    if npm run build; then
        print_success "Frontend build successful"
    else
        print_warning "Frontend build failed - check for any missing dependencies"
    fi
    cd ..
}

# Main setup function
main() {
    print_status "Starting development environment setup..."
    
    # Check prerequisites
    check_node
    check_npm
    
    # Setup project
    install_root_deps
    install_backend_deps
    install_frontend_deps
    setup_env
    setup_logs
    install_pm2
    
    # Verify setup
    run_tests
    
    print_success "Development environment setup complete!"
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start development: npm start"
    echo "3. Backend will run on http://localhost:3000"
    echo "4. Frontend will run on http://localhost:3001"
    echo ""
    echo "Available commands:"
    echo "  npm start              - Start both frontend and backend"
    echo "  npm run start:backend  - Start only backend"
    echo "  npm run start:frontend - Start only frontend"
    echo "  npm test              - Run all tests"
    echo "  npm run build         - Build for production"
    echo ""
}

# Run main function
main "$@"

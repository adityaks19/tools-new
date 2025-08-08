#!/bin/bash

# Project Structure Verification Script
# Verifies that the restructured project is properly organized

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if file exists
check_file() {
    if [ -f "$1" ]; then
        print_success "File exists: $1"
        return 0
    else
        print_error "Missing file: $1"
        return 1
    fi
}

# Check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        print_success "Directory exists: $1"
        return 0
    else
        print_error "Missing directory: $1"
        return 1
    fi
}

echo "🔍 Verifying Project Structure..."
echo "================================"

# Check root files
print_status "Checking root configuration files..."
check_file "package.json"
check_file "ecosystem.config.js"
check_file ".env.example"
check_file ".gitignore"
check_file "README.md"

# Check backend structure
print_status "Checking backend structure..."
check_dir "backend"
check_dir "backend/src"
check_file "backend/package.json"
check_file "backend/src/server.js"
check_dir "backend/src/routes"
check_dir "backend/src/services"
check_dir "backend/src/middleware"
check_dir "backend/src/config"
check_dir "backend/tests"

# Check frontend structure
print_status "Checking frontend structure..."
check_dir "frontend"
check_file "frontend/package.json"
check_dir "frontend/src"
check_dir "frontend/public"
check_file "frontend/src/App.js"
check_file "frontend/src/index.js"

# Check infrastructure
print_status "Checking infrastructure..."
check_dir "infrastructure"
check_dir "infrastructure/aws"
check_dir "infrastructure/docker"
check_file "infrastructure/docker/docker-compose.yml"
check_file "infrastructure/docker/nginx.conf"

# Check scripts
print_status "Checking scripts..."
check_dir "scripts"
check_dir "scripts/deployment"
check_dir "scripts/setup"
check_dir "scripts/monitoring"
check_file "scripts/dev-setup.sh"

# Check documentation
print_status "Checking documentation..."
check_dir "docs"
check_file "docs/MIGRATION-GUIDE.md"
check_file "docs/RESTRUCTURE-SUMMARY.md"

# Check logs directory
print_status "Checking logs directory..."
check_dir "logs"

# Verify package.json configurations
print_status "Verifying package.json configurations..."

# Check root package.json for workspaces
if grep -q '"workspaces"' package.json; then
    print_success "Root package.json has workspaces configuration"
else
    print_error "Root package.json missing workspaces configuration"
fi

# Check backend package.json
if [ -f "backend/package.json" ]; then
    if grep -q '"express"' backend/package.json; then
        print_success "Backend package.json has Express dependency"
    else
        print_error "Backend package.json missing Express dependency"
    fi
fi

# Check frontend package.json
if [ -f "frontend/package.json" ]; then
    if grep -q '"react"' frontend/package.json; then
        print_success "Frontend package.json has React dependency"
    else
        print_error "Frontend package.json missing React dependency"
    fi
fi

# Check ecosystem.config.js
if grep -q "backend/src/server.js" ecosystem.config.js; then
    print_success "PM2 config points to correct server file"
else
    print_error "PM2 config has incorrect server path"
fi

# Summary
echo ""
echo "🎉 Structure Verification Complete!"
echo "==================================="

# Count checks
total_checks=$(grep -c "print_success\|print_error" "$0")
echo "Verification completed with comprehensive checks."
echo ""
echo "If all checks passed, your project structure is properly organized!"
echo "If any checks failed, review the missing files/directories."
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/dev-setup.sh"
echo "2. Start development: npm start"
echo "3. Check README.md for detailed instructions"

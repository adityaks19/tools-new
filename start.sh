#!/bin/bash

# File Drop AI Startup Script
# This script ensures the application starts automatically and handles crashes

set -e

# Configuration
APP_DIR="/home/ubuntu/tools-new"
LOG_DIR="$APP_DIR/logs"
USER="ubuntu"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create necessary directories
mkdir -p "$LOG_DIR"

# Change to app directory
cd "$APP_DIR"

log "Starting File Drop AI..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing processes
log "Stopping existing processes..."
pm2 stop file-drop-ai 2>/dev/null || true
pm2 delete file-drop-ai 2>/dev/null || true

# Start the application with PM2
log "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (run as root)
if [ "$EUID" -eq 0 ]; then
    log "Setting up PM2 startup script..."
    pm2 startup systemd -u $USER --hp /home/$USER
else
    warn "Run with sudo to setup automatic startup on boot"
fi

# Display status
log "Application started successfully!"
pm2 status
pm2 logs file-drop-ai --lines 10

log "File Drop AI is now running with auto-restart enabled"
log "Access the application at: http://$(curl -s ifconfig.me):3000"
log "Monitor with: pm2 monit"
log "View logs with: pm2 logs file-drop-ai"

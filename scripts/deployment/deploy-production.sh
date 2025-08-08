#!/bin/bash

# Production Deployment Script for File Drop AI
# This script ensures zero-downtime deployment with health checks

set -e  # Exit on any error

# Configuration
APP_NAME="file-drop-ai"
APP_DIR="/home/ubuntu/tools-new"
BACKUP_DIR="/home/ubuntu/backups"
LOG_FILE="$APP_DIR/logs/deployment.log"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
    
    case $level in
        "ERROR")
            echo -e "${RED}${timestamp} [${level}] ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}${timestamp} [${level}] ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}${timestamp} [${level}] ${message}${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}${timestamp} [${level}] ${message}${NC}"
            ;;
    esac
}

# Error handler
error_handler() {
    local line_number=$1
    log "ERROR" "Deployment failed at line $line_number"
    log "ERROR" "Rolling back to previous version..."
    rollback
    exit 1
}

trap 'error_handler $LINENO' ERR

# Health check function
health_check() {
    local attempts=0
    local max_attempts=$1
    
    log "INFO" "Starting health check (max attempts: $max_attempts)"
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "SUCCESS" "Health check passed (attempt $((attempts + 1)))"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log "WARNING" "Health check failed (attempt $attempts/$max_attempts)"
        
        if [ $attempts -lt $max_attempts ]; then
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log "ERROR" "Health check failed after $max_attempts attempts"
    return 1
}

# Backup function
create_backup() {
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "INFO" "Creating backup: $backup_name"
    
    mkdir -p "$BACKUP_DIR"
    
    # Create backup excluding node_modules and logs
    tar -czf "$backup_path.tar.gz" \
        --exclude=node_modules \
        --exclude=logs \
        --exclude=.git \
        --exclude=coverage \
        -C "$(dirname $APP_DIR)" \
        "$(basename $APP_DIR)"
    
    log "SUCCESS" "Backup created: $backup_path.tar.gz"
    echo "$backup_path.tar.gz"
}

# Rollback function
rollback() {
    log "WARNING" "Starting rollback process"
    
    # Find the most recent backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | head -n1)
    
    if [ -z "$latest_backup" ]; then
        log "ERROR" "No backup found for rollback"
        return 1
    fi
    
    log "INFO" "Rolling back to: $latest_backup"
    
    # Stop the application
    pm2 stop "$APP_NAME" || true
    
    # Remove current version
    rm -rf "$APP_DIR.rollback"
    mv "$APP_DIR" "$APP_DIR.rollback"
    
    # Restore backup
    mkdir -p "$APP_DIR"
    tar -xzf "$latest_backup" -C "$(dirname $APP_DIR)"
    
    # Restore dependencies
    cd "$APP_DIR"
    npm ci --only=production
    
    # Restart application
    pm2 start ecosystem.config.js --env production
    
    # Health check
    if health_check 15; then
        log "SUCCESS" "Rollback completed successfully"
        rm -rf "$APP_DIR.rollback"
    else
        log "ERROR" "Rollback failed - manual intervention required"
        return 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "Running pre-deployment checks"
    
    # Check if PM2 is running
    if ! pm2 list > /dev/null 2>&1; then
        log "ERROR" "PM2 is not running"
        exit 1
    fi
    
    # Check if application is currently running
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        log "WARNING" "Application is not currently running in PM2"
    fi
    
    # Check disk space
    local available_space=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then  # Less than 1GB
        log "ERROR" "Insufficient disk space (less than 1GB available)"
        exit 1
    fi
    
    # Check if git repository is clean
    cd "$APP_DIR"
    if [ -d ".git" ] && ! git diff-index --quiet HEAD --; then
        log "WARNING" "Git repository has uncommitted changes"
    fi
    
    log "SUCCESS" "Pre-deployment checks passed"
}

# Install dependencies
install_dependencies() {
    log "INFO" "Installing dependencies"
    
    cd "$APP_DIR"
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm ci --only=production
    
    log "SUCCESS" "Dependencies installed"
}

# Run tests
run_tests() {
    log "INFO" "Running tests"
    
    cd "$APP_DIR"
    
    # Install dev dependencies for testing
    npm ci
    
    # Run linting
    if npm run lint; then
        log "SUCCESS" "Linting passed"
    else
        log "ERROR" "Linting failed"
        return 1
    fi
    
    # Run tests
    if npm test; then
        log "SUCCESS" "Tests passed"
    else
        log "ERROR" "Tests failed"
        return 1
    fi
    
    # Clean up dev dependencies
    npm ci --only=production
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying application"
    
    cd "$APP_DIR"
    
    # Reload PM2 with zero downtime
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        log "INFO" "Reloading existing PM2 process"
        pm2 reload ecosystem.config.js --env production
    else
        log "INFO" "Starting new PM2 process"
        pm2 start ecosystem.config.js --env production
    fi
    
    # Start health monitor if not running
    if ! pm2 describe "health-monitor" > /dev/null 2>&1; then
        log "INFO" "Starting health monitor"
        pm2 start health-monitor.js --name health-monitor
    else
        log "INFO" "Restarting health monitor"
        pm2 restart health-monitor
    fi
    
    # Start auto-scaler if not running
    if ! pm2 describe "auto-scaler" > /dev/null 2>&1; then
        log "INFO" "Starting auto-scaler"
        pm2 start auto-scaler.js --name auto-scaler
    else
        log "INFO" "Restarting auto-scaler"
        pm2 restart auto-scaler
    fi
    
    # Save PM2 configuration
    pm2 save
    
    log "SUCCESS" "Application deployed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "INFO" "Running post-deployment tasks"
    
    # Clean up old logs
    find "$APP_DIR/logs" -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
    
    # Clean up old backups (keep last 5)
    ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    
    # Update system packages (optional)
    if [ "$UPDATE_SYSTEM" = "true" ]; then
        log "INFO" "Updating system packages"
        sudo apt update && sudo apt upgrade -y
    fi
    
    # Restart nginx if configuration changed
    if [ -f "$APP_DIR/nginx.conf" ]; then
        log "INFO" "Checking nginx configuration"
        if sudo nginx -t; then
            sudo systemctl reload nginx
            log "SUCCESS" "Nginx reloaded"
        else
            log "WARNING" "Nginx configuration test failed"
        fi
    fi
    
    log "SUCCESS" "Post-deployment tasks completed"
}

# Main deployment function
main() {
    log "INFO" "Starting deployment of $APP_NAME"
    log "INFO" "Deployment started by: $(whoami)"
    log "INFO" "Git commit: $(cd $APP_DIR && git rev-parse HEAD 2>/dev/null || echo 'N/A')"
    
    # Create log directory
    mkdir -p "$(dirname $LOG_FILE)"
    
    # Run deployment steps
    pre_deployment_checks
    
    # Create backup before deployment
    local backup_file=$(create_backup)
    
    # Run tests (optional, set RUN_TESTS=true to enable)
    if [ "$RUN_TESTS" = "true" ]; then
        run_tests
    fi
    
    install_dependencies
    deploy_application
    
    # Health check after deployment
    if health_check $MAX_HEALTH_CHECK_ATTEMPTS; then
        log "SUCCESS" "Deployment completed successfully"
        post_deployment_tasks
        
        # Send success notification
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data '{"text":"🚀 Production deployment successful for '"$APP_NAME"'"}' \
                "$SLACK_WEBHOOK_URL" || true
        fi
        
        log "SUCCESS" "All deployment tasks completed"
    else
        log "ERROR" "Health check failed after deployment"
        rollback
        exit 1
    fi
}

# Script options
while [[ $# -gt 0 ]]; do
    case $1 in
        --run-tests)
            RUN_TESTS=true
            shift
            ;;
        --update-system)
            UPDATE_SYSTEM=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --run-tests      Run tests before deployment"
            echo "  --update-system  Update system packages after deployment"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main

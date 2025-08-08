#!/bin/bash

# Production Setup Script for File Drop AI
# This script sets up a complete production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/home/ubuntu/tools-new"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
DOMAIN_NAME="${DOMAIN_NAME:-your-domain.com}"

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log "ERROR" "This script should not be run as root"
        exit 1
    fi
}

# Update system packages
update_system() {
    log "INFO" "Updating system packages"
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git build-essential software-properties-common
    log "SUCCESS" "System packages updated"
}

# Install Node.js and npm
install_nodejs() {
    log "INFO" "Installing Node.js and npm"
    
    # Install NVM
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install and use Node.js 18
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    # Install PM2 globally
    npm install -g pm2
    
    log "SUCCESS" "Node.js and PM2 installed"
}

# Install and configure Nginx
install_nginx() {
    log "INFO" "Installing and configuring Nginx"
    
    sudo apt install -y nginx
    
    # Copy nginx configuration
    sudo cp "$APP_DIR/nginx.conf" "$NGINX_AVAILABLE/file-drop-ai"
    
    # Update domain name in configuration
    sudo sed -i "s/your-domain.com/$DOMAIN_NAME/g" "$NGINX_AVAILABLE/file-drop-ai"
    
    # Enable site
    sudo ln -sf "$NGINX_AVAILABLE/file-drop-ai" "$NGINX_ENABLED/"
    
    # Remove default site
    sudo rm -f "$NGINX_ENABLED/default"
    
    # Test configuration
    sudo nginx -t
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log "SUCCESS" "Nginx installed and configured"
}

# Install SSL certificate with Let's Encrypt
install_ssl() {
    log "INFO" "Installing SSL certificate"
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Get certificate (this will modify nginx config)
    if [ "$DOMAIN_NAME" != "your-domain.com" ]; then
        sudo certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --email "admin@$DOMAIN_NAME"
        log "SUCCESS" "SSL certificate installed"
    else
        log "WARNING" "Skipping SSL installation - please set DOMAIN_NAME environment variable"
    fi
}

# Setup firewall
setup_firewall() {
    log "INFO" "Setting up firewall"
    
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 'Nginx Full'
    
    # Allow custom ports if needed
    sudo ufw allow 3000  # Application port
    sudo ufw allow 8080  # Nginx status
    
    # Enable firewall
    sudo ufw --force enable
    
    log "SUCCESS" "Firewall configured"
}

# Setup log rotation
setup_log_rotation() {
    log "INFO" "Setting up log rotation"
    
    sudo tee /etc/logrotate.d/file-drop-ai > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    log "SUCCESS" "Log rotation configured"
}

# Setup monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring"
    
    # Install system monitoring tools
    sudo apt install -y htop iotop nethogs
    
    # Setup PM2 monitoring
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    
    log "SUCCESS" "Monitoring tools installed"
}

# Setup systemd service
setup_systemd_service() {
    log "INFO" "Setting up systemd service"
    
    # Update Node.js path in service file
    local node_path=$(which node)
    local pm2_path=$(which pm2)
    
    sed -i "s|/home/ubuntu/.nvm/versions/node/v18.17.0/bin/pm2|$pm2_path|g" "$APP_DIR/file-drop-ai.service"
    sed -i "s|/home/ubuntu/.nvm/versions/node/v18.17.0/bin|$(dirname $node_path)|g" "$APP_DIR/file-drop-ai.service"
    
    # Copy service file
    sudo cp "$APP_DIR/file-drop-ai.service" /etc/systemd/system/
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable file-drop-ai
    
    log "SUCCESS" "Systemd service configured"
}

# Setup backup system
setup_backup_system() {
    log "INFO" "Setting up backup system"
    
    mkdir -p /home/ubuntu/backups
    
    # Create backup script
    cat > /home/ubuntu/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/home/ubuntu/tools-new"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-$DATE"

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=.git \
    --exclude=coverage \
    -C "$(dirname $APP_DIR)" \
    "$(basename $APP_DIR)"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/backup-*.tar.gz | tail -n +11 | xargs -r rm -f

echo "Backup created: $BACKUP_NAME.tar.gz"
EOF
    
    chmod +x /home/ubuntu/backup-app.sh
    
    # Setup cron job for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-app.sh") | crontab -
    
    log "SUCCESS" "Backup system configured"
}

# Install application dependencies
install_app_dependencies() {
    log "INFO" "Installing application dependencies"
    
    cd "$APP_DIR"
    
    # Install dependencies
    npm ci --only=production
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p uploads
    
    # Set proper permissions
    chmod 755 logs uploads
    
    log "SUCCESS" "Application dependencies installed"
}

# Start application
start_application() {
    log "INFO" "Starting application"
    
    cd "$APP_DIR"
    
    # Start PM2 processes
    pm2 start ecosystem.config.js --env production
    pm2 start health-monitor.js --name health-monitor
    pm2 start auto-scaler.js --name auto-scaler
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    # Wait for application to start
    sleep 10
    
    # Health check
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "SUCCESS" "Application started successfully"
    else
        log "ERROR" "Application health check failed"
        exit 1
    fi
}

# Setup performance optimizations
setup_performance_optimizations() {
    log "INFO" "Setting up performance optimizations"
    
    # Increase file descriptor limits
    echo "ubuntu soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "ubuntu hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # Optimize kernel parameters
    sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# File Drop AI optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_max_orphans = 60000
net.core.netdev_max_backlog = 5000
vm.swappiness = 10
EOF
    
    sudo sysctl -p
    
    log "SUCCESS" "Performance optimizations applied"
}

# Main setup function
main() {
    log "INFO" "Starting production setup for File Drop AI"
    
    check_root
    update_system
    install_nodejs
    install_nginx
    setup_firewall
    setup_log_rotation
    setup_monitoring
    setup_systemd_service
    setup_backup_system
    install_app_dependencies
    setup_performance_optimizations
    start_application
    
    # Install SSL certificate (optional)
    if [ "$INSTALL_SSL" = "true" ]; then
        install_ssl
    fi
    
    log "SUCCESS" "Production setup completed!"
    log "INFO" "Application is running at: http://localhost:3000"
    
    if [ "$DOMAIN_NAME" != "your-domain.com" ]; then
        log "INFO" "Domain: https://$DOMAIN_NAME"
    fi
    
    log "INFO" "Health check: curl http://localhost:3000/health"
    log "INFO" "PM2 status: pm2 status"
    log "INFO" "Nginx status: sudo systemctl status nginx"
    log "INFO" "Application logs: pm2 logs file-drop-ai"
}

# Script options
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        --install-ssl)
            INSTALL_SSL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --domain DOMAIN    Set domain name for SSL certificate"
            echo "  --install-ssl      Install SSL certificate with Let's Encrypt"
            echo "  --help            Show this help message"
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

#!/bin/bash

# File Drop AI Health Monitor and Auto-Scaler
# Monitors application health and scales based on load

APP_DIR="/home/ubuntu/tools-new"
LOG_FILE="$APP_DIR/logs/monitor.log"
HEALTH_ENDPOINT="http://localhost:3000/api/health"
MAX_RESPONSE_TIME=5000  # 5 seconds
MAX_CPU_USAGE=80        # 80%
MAX_MEMORY_USAGE=80     # 80%
MIN_INSTANCES=1
MAX_INSTANCES=4

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check application health
check_health() {
    local response_time
    local http_status
    
    # Check HTTP response
    response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$HEALTH_ENDPOINT" | awk '{print int($1*1000)}')
    http_status=$(curl -o /dev/null -s -w '%{http_code}\n' "$HEALTH_ENDPOINT")
    
    if [ "$http_status" != "200" ]; then
        log "ERROR: Health check failed - HTTP $http_status"
        return 1
    fi
    
    if [ "$response_time" -gt "$MAX_RESPONSE_TIME" ]; then
        log "WARNING: Slow response time: ${response_time}ms"
        return 2
    fi
    
    log "Health check passed - ${response_time}ms"
    return 0
}

# Get system metrics
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'
}

get_memory_usage() {
    free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}'
}

get_active_connections() {
    netstat -an | grep :3000 | grep ESTABLISHED | wc -l
}

# Auto-scaling logic
auto_scale() {
    local cpu_usage=$(get_cpu_usage)
    local memory_usage=$(get_memory_usage)
    local connections=$(get_active_connections)
    local current_instances=$(pm2 list | grep file-drop-ai | grep online | wc -l)
    
    log "Metrics - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Connections: $connections, Instances: $current_instances"
    
    # Scale up conditions
    if (( $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l) )) || (( memory_usage > MAX_MEMORY_USAGE )) || (( connections > 50 )); then
        if [ "$current_instances" -lt "$MAX_INSTANCES" ]; then
            log "Scaling up - adding instance"
            pm2 scale file-drop-ai +1
            return 0
        else
            log "WARNING: At maximum instances ($MAX_INSTANCES) but high load detected"
        fi
    fi
    
    # Scale down conditions (conservative)
    if (( $(echo "$cpu_usage < 30" | bc -l) )) && (( memory_usage < 30 )) && (( connections < 10 )); then
        if [ "$current_instances" -gt "$MIN_INSTANCES" ]; then
            log "Scaling down - removing instance"
            pm2 scale file-drop-ai -1
            return 0
        fi
    fi
}

# Restart unhealthy instances
restart_if_unhealthy() {
    if ! check_health; then
        log "Restarting unhealthy application..."
        pm2 restart file-drop-ai
        sleep 10
        
        if check_health; then
            log "Application restarted successfully"
        else
            log "ERROR: Application still unhealthy after restart"
            # Could send alert here
        fi
    fi
}

# Cleanup old logs
cleanup_logs() {
    find "$APP_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    log "Log cleanup completed"
}

# Main monitoring loop
main() {
    log "Starting File Drop AI monitor..."
    
    while true; do
        restart_if_unhealthy
        auto_scale
        
        # Cleanup logs once per day
        if [ "$(date +%H:%M)" = "02:00" ]; then
            cleanup_logs
        fi
        
        # Wait 30 seconds before next check
        sleep 30
    done
}

# Handle script termination
trap 'log "Monitor stopped"; exit 0' SIGTERM SIGINT

# Start monitoring
main

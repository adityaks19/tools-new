#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class HealthMonitor {
    constructor() {
        this.config = {
            port: process.env.PORT || 3000,
            healthCheckInterval: 30000, // 30 seconds
            maxFailures: 3,
            restartDelay: 5000,
            logFile: path.join(__dirname, 'logs', 'health-monitor.log'),
            alertWebhook: process.env.ALERT_WEBHOOK_URL,
            maxLogSize: 10 * 1024 * 1024, // 10MB
        };
        
        this.failures = 0;
        this.isRestarting = false;
        this.lastHealthCheck = null;
        this.startTime = new Date();
        
        this.ensureLogDirectory();
        this.startMonitoring();
    }
    
    ensureLogDirectory() {
        const logDir = path.dirname(this.config.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            uptime: Date.now() - this.startTime.getTime(),
            failures: this.failures
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        
        // Console output
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
        
        // File output with rotation
        this.writeToLogFile(logLine);
        
        // Send alerts for critical issues
        if (level === 'error' || level === 'critical') {
            this.sendAlert(logEntry);
        }
    }
    
    writeToLogFile(logLine) {
        try {
            // Check file size and rotate if needed
            if (fs.existsSync(this.config.logFile)) {
                const stats = fs.statSync(this.config.logFile);
                if (stats.size > this.config.maxLogSize) {
                    const rotatedFile = `${this.config.logFile}.${Date.now()}`;
                    fs.renameSync(this.config.logFile, rotatedFile);
                    this.log('info', `Log file rotated to ${rotatedFile}`);
                }
            }
            
            fs.appendFileSync(this.config.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    async sendAlert(logEntry) {
        if (!this.config.alertWebhook) return;
        
        try {
            const payload = {
                text: `🚨 Health Monitor Alert`,
                attachments: [{
                    color: logEntry.level === 'critical' ? 'danger' : 'warning',
                    fields: [
                        { title: 'Level', value: logEntry.level, short: true },
                        { title: 'Message', value: logEntry.message, short: false },
                        { title: 'Failures', value: logEntry.failures, short: true },
                        { title: 'Uptime', value: `${Math.round(logEntry.uptime / 1000)}s`, short: true }
                    ],
                    timestamp: logEntry.timestamp
                }]
            };
            
            // Send webhook (implement based on your alerting system)
            this.log('info', 'Alert sent', { webhook: true });
        } catch (error) {
            console.error('Failed to send alert:', error);
        }
    }
    
    async checkHealth() {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const req = http.request({
                hostname: 'localhost',
                port: this.config.port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    if (res.statusCode === 200) {
                        try {
                            const healthData = JSON.parse(data);
                            resolve({
                                success: true,
                                responseTime,
                                data: healthData
                            });
                        } catch (error) {
                            resolve({
                                success: false,
                                error: 'Invalid JSON response',
                                responseTime
                            });
                        }
                    } else {
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}`,
                            responseTime
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout',
                    responseTime: Date.now() - startTime
                });
            });
            
            req.end();
        });
    }
    
    async restartApplication() {
        if (this.isRestarting) {
            this.log('warn', 'Restart already in progress, skipping');
            return;
        }
        
        this.isRestarting = true;
        this.log('critical', 'Attempting to restart application');
        
        try {
            // Try graceful restart first
            await this.executeCommand('pm2 reload file-drop-ai');
            
            // Wait for restart
            await this.sleep(this.config.restartDelay);
            
            // Verify restart was successful
            const healthCheck = await this.checkHealth();
            if (healthCheck.success) {
                this.log('info', 'Application restarted successfully');
                this.failures = 0;
            } else {
                // If graceful restart failed, try hard restart
                this.log('warn', 'Graceful restart failed, attempting hard restart');
                await this.executeCommand('pm2 restart file-drop-ai');
                await this.sleep(this.config.restartDelay);
            }
        } catch (error) {
            this.log('critical', 'Failed to restart application', { error: error.message });
        } finally {
            this.isRestarting = false;
        }
    }
    
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async performHealthCheck() {
        const result = await this.checkHealth();
        this.lastHealthCheck = new Date();
        
        if (result.success) {
            if (this.failures > 0) {
                this.log('info', 'Health check recovered', {
                    previousFailures: this.failures,
                    responseTime: result.responseTime
                });
            }
            this.failures = 0;
        } else {
            this.failures++;
            this.log('error', 'Health check failed', {
                error: result.error,
                failures: this.failures,
                responseTime: result.responseTime
            });
            
            if (this.failures >= this.config.maxFailures) {
                await this.restartApplication();
            }
        }
    }
    
    startMonitoring() {
        this.log('info', 'Health monitor started', {
            port: this.config.port,
            interval: this.config.healthCheckInterval,
            maxFailures: this.config.maxFailures
        });
        
        // Initial health check
        setTimeout(() => this.performHealthCheck(), 5000);
        
        // Regular health checks
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        // System metrics logging every 5 minutes
        setInterval(() => {
            this.logSystemMetrics();
        }, 5 * 60 * 1000);
        
        // Process cleanup on exit
        process.on('SIGINT', () => {
            this.log('info', 'Health monitor shutting down');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.log('info', 'Health monitor terminated');
            process.exit(0);
        });
    }
    
    async logSystemMetrics() {
        try {
            const { stdout: memInfo } = await this.executeCommand('free -m');
            const { stdout: diskInfo } = await this.executeCommand('df -h /');
            const { stdout: loadInfo } = await this.executeCommand('uptime');
            
            this.log('info', 'System metrics', {
                memory: memInfo.split('\n')[1],
                disk: diskInfo.split('\n')[1],
                load: loadInfo.trim(),
                uptime: Date.now() - this.startTime.getTime()
            });
        } catch (error) {
            this.log('warn', 'Failed to collect system metrics', { error: error.message });
        }
    }
    
    getStatus() {
        return {
            isRunning: true,
            failures: this.failures,
            lastHealthCheck: this.lastHealthCheck,
            uptime: Date.now() - this.startTime.getTime(),
            isRestarting: this.isRestarting
        };
    }
}

// Start the health monitor if this file is run directly
if (require.main === module) {
    new HealthMonitor();
}

module.exports = HealthMonitor;

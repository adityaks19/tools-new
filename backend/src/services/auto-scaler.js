#!/usr/bin/env node

const { exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

class AutoScaler {
    constructor() {
        this.config = {
            minInstances: 2,
            maxInstances: 8,
            targetCpuPercent: 70,
            targetMemoryPercent: 80,
            scaleUpThreshold: 80,
            scaleDownThreshold: 30,
            checkInterval: 30000, // 30 seconds
            cooldownPeriod: 300000, // 5 minutes
            healthCheckUrl: 'http://localhost:3000/health',
            logFile: path.join(__dirname, 'logs', 'autoscaler.log')
        };
        
        this.lastScaleAction = 0;
        this.currentInstances = 0;
        this.metrics = {
            cpu: [],
            memory: [],
            responseTime: [],
            errorRate: []
        };
        
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
            instances: this.currentInstances
        };
        
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
        
        try {
            fs.appendFileSync(this.config.logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
                }
            });
        });
    }
    
    async getCurrentInstances() {
        try {
            const { stdout } = await this.executeCommand('pm2 jlist');
            const processes = JSON.parse(stdout);
            const appProcesses = processes.filter(p => p.name === 'file-drop-ai');
            return appProcesses.length;
        } catch (error) {
            this.log('error', 'Failed to get current instances', { error: error.message });
            return 0;
        }
    }
    
    async getSystemMetrics() {
        try {
            // Get CPU usage
            const { stdout: cpuInfo } = await this.executeCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
            const cpuUsage = parseFloat(cpuInfo) || 0;
            
            // Get memory usage
            const { stdout: memInfo } = await this.executeCommand("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'");
            const memoryUsage = parseFloat(memInfo) || 0;
            
            // Get load average
            const { stdout: loadInfo } = await this.executeCommand("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
            const loadAverage = parseFloat(loadInfo) || 0;
            
            return {
                cpu: cpuUsage,
                memory: memoryUsage,
                load: loadAverage,
                timestamp: Date.now()
            };
        } catch (error) {
            this.log('error', 'Failed to get system metrics', { error: error.message });
            return { cpu: 0, memory: 0, load: 0, timestamp: Date.now() };
        }
    }
    
    async getApplicationMetrics() {
        try {
            const startTime = Date.now();
            
            const response = await new Promise((resolve, reject) => {
                const req = http.request(this.config.healthCheckUrl, { timeout: 5000 }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const healthData = JSON.parse(data);
                            resolve({
                                status: res.statusCode,
                                data: healthData,
                                responseTime: Date.now() - startTime
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
                
                req.end();
            });
            
            return {
                healthy: response.status === 200,
                responseTime: response.responseTime,
                errors: response.data.errors || 0,
                connections: response.data.connections || 0,
                memory: response.data.memory || {}
            };
        } catch (error) {
            this.log('warn', 'Health check failed', { error: error.message });
            return {
                healthy: false,
                responseTime: 5000,
                errors: 1,
                connections: 0,
                memory: {}
            };
        }
    }
    
    updateMetrics(systemMetrics, appMetrics) {
        const maxHistory = 10;
        
        // Update CPU metrics
        this.metrics.cpu.push(systemMetrics.cpu);
        if (this.metrics.cpu.length > maxHistory) {
            this.metrics.cpu.shift();
        }
        
        // Update memory metrics
        this.metrics.memory.push(systemMetrics.memory);
        if (this.metrics.memory.length > maxHistory) {
            this.metrics.memory.shift();
        }
        
        // Update response time metrics
        this.metrics.responseTime.push(appMetrics.responseTime);
        if (this.metrics.responseTime.length > maxHistory) {
            this.metrics.responseTime.shift();
        }
        
        // Update error rate metrics
        this.metrics.errorRate.push(appMetrics.errors);
        if (this.metrics.errorRate.length > maxHistory) {
            this.metrics.errorRate.shift();
        }
    }
    
    getAverageMetric(metricArray) {
        if (metricArray.length === 0) return 0;
        return metricArray.reduce((sum, val) => sum + val, 0) / metricArray.length;
    }
    
    shouldScaleUp() {
        const avgCpu = this.getAverageMetric(this.metrics.cpu);
        const avgMemory = this.getAverageMetric(this.metrics.memory);
        const avgResponseTime = this.getAverageMetric(this.metrics.responseTime);
        
        const conditions = [
            avgCpu > this.config.scaleUpThreshold,
            avgMemory > this.config.scaleUpThreshold,
            avgResponseTime > 2000, // 2 seconds
            this.currentInstances < this.config.maxInstances
        ];
        
        const shouldScale = conditions.filter(Boolean).length >= 2;
        
        if (shouldScale) {
            this.log('info', 'Scale up conditions met', {
                avgCpu,
                avgMemory,
                avgResponseTime,
                currentInstances: this.currentInstances
            });
        }
        
        return shouldScale;
    }
    
    shouldScaleDown() {
        const avgCpu = this.getAverageMetric(this.metrics.cpu);
        const avgMemory = this.getAverageMetric(this.metrics.memory);
        const avgResponseTime = this.getAverageMetric(this.metrics.responseTime);
        
        const conditions = [
            avgCpu < this.config.scaleDownThreshold,
            avgMemory < this.config.scaleDownThreshold,
            avgResponseTime < 500, // 500ms
            this.currentInstances > this.config.minInstances
        ];
        
        const shouldScale = conditions.every(Boolean);
        
        if (shouldScale) {
            this.log('info', 'Scale down conditions met', {
                avgCpu,
                avgMemory,
                avgResponseTime,
                currentInstances: this.currentInstances
            });
        }
        
        return shouldScale;
    }
    
    async scaleUp() {
        if (Date.now() - this.lastScaleAction < this.config.cooldownPeriod) {
            this.log('info', 'Scale up skipped due to cooldown period');
            return;
        }
        
        try {
            const newInstanceCount = Math.min(this.currentInstances + 1, this.config.maxInstances);
            
            this.log('info', 'Scaling up', {
                from: this.currentInstances,
                to: newInstanceCount
            });
            
            await this.executeCommand(`pm2 scale file-drop-ai ${newInstanceCount}`);
            
            this.currentInstances = newInstanceCount;
            this.lastScaleAction = Date.now();
            
            this.log('info', 'Scale up completed', { instances: newInstanceCount });
            
            // Update nginx upstream if needed
            await this.updateNginxUpstream();
            
        } catch (error) {
            this.log('error', 'Scale up failed', { error: error.message });
        }
    }
    
    async scaleDown() {
        if (Date.now() - this.lastScaleAction < this.config.cooldownPeriod) {
            this.log('info', 'Scale down skipped due to cooldown period');
            return;
        }
        
        try {
            const newInstanceCount = Math.max(this.currentInstances - 1, this.config.minInstances);
            
            this.log('info', 'Scaling down', {
                from: this.currentInstances,
                to: newInstanceCount
            });
            
            await this.executeCommand(`pm2 scale file-drop-ai ${newInstanceCount}`);
            
            this.currentInstances = newInstanceCount;
            this.lastScaleAction = Date.now();
            
            this.log('info', 'Scale down completed', { instances: newInstanceCount });
            
            // Update nginx upstream if needed
            await this.updateNginxUpstream();
            
        } catch (error) {
            this.log('error', 'Scale down failed', { error: error.message });
        }
    }
    
    async updateNginxUpstream() {
        // This would update nginx configuration with new upstream servers
        // Implementation depends on your nginx setup
        try {
            await this.executeCommand('nginx -s reload');
            this.log('info', 'Nginx configuration reloaded');
        } catch (error) {
            this.log('warn', 'Failed to reload nginx', { error: error.message });
        }
    }
    
    async performScalingCheck() {
        try {
            // Get current metrics
            const systemMetrics = await this.getSystemMetrics();
            const appMetrics = await getApplicationMetrics();
            
            // Update metrics history
            this.updateMetrics(systemMetrics, appMetrics);
            
            // Update current instance count
            this.currentInstances = await this.getCurrentInstances();
            
            // Log current status
            this.log('debug', 'Scaling check', {
                system: systemMetrics,
                app: appMetrics,
                instances: this.currentInstances,
                avgCpu: this.getAverageMetric(this.metrics.cpu),
                avgMemory: this.getAverageMetric(this.metrics.memory),
                avgResponseTime: this.getAverageMetric(this.metrics.responseTime)
            });
            
            // Make scaling decisions
            if (this.shouldScaleUp()) {
                await this.scaleUp();
            } else if (this.shouldScaleDown()) {
                await this.scaleDown();
            }
            
        } catch (error) {
            this.log('error', 'Scaling check failed', { error: error.message });
        }
    }
    
    startMonitoring() {
        this.log('info', 'Auto-scaler started', this.config);
        
        // Initial setup
        setTimeout(async () => {
            this.currentInstances = await this.getCurrentInstances();
            this.log('info', 'Initial instance count', { instances: this.currentInstances });
        }, 5000);
        
        // Regular scaling checks
        setInterval(() => {
            this.performScalingCheck();
        }, this.config.checkInterval);
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.log('info', 'Auto-scaler shutting down');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.log('info', 'Auto-scaler terminated');
            process.exit(0);
        });
    }
}

// Start the auto-scaler if this file is run directly
if (require.main === module) {
    new AutoScaler();
}

module.exports = AutoScaler;

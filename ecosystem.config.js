module.exports = {
  apps: [{
    name: 'file-drop-ai',
    script: './backend/src/server.js',
    cwd: '/home/ubuntu/tools-new',
    instances: 'max', // Use all CPU cores for maximum scalability
    exec_mode: 'cluster',
    
    // Enhanced Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      PM2_SERVE_PATH: '.',
      PM2_SERVE_PORT: 8080,
      PM2_SERVE_SPA: 'true',
      PM2_SERVE_HOMEPAGE: '/index.html'
    },
    
    // Enhanced Logging with rotation
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json',
    merge_logs: true,
    
    // Advanced PM2 features for crash resistance
    min_uptime: '10s',
    max_restarts: 15, // Increased restart attempts
    restart_delay: 2000, // Faster restart
    
    // Enhanced Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    
    // Performance monitoring
    pmx: true,
    
    // Cluster settings
    instance_var: 'INSTANCE_ID',
    
    // Advanced restart strategies with exponential backoff
    exp_backoff_restart_delay: 100,
    
    // Memory and CPU limits
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Process management
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true,
    
    // Error handling
    ignore_watch: ['node_modules', 'logs', 'frontend/build', '.git', 'coverage'],
    
    // Graceful shutdown
    shutdown_with_message: true,
    
    // Custom restart conditions - restart daily for memory cleanup
    restart_cron: '0 2 * * *',
    
    // Environment-specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      INSTANCES: 0, // 0 = max cores
      PM2_GRACEFUL_TIMEOUT: 3000,
      PM2_KILL_TIMEOUT: 5000
    },
    
    // Development environment
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      INSTANCES: 1
    },
    
    // Staging environment
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000,
      INSTANCES: 2
    }
  },
  {
    name: 'health-monitor',
    script: './backend/src/services/health-monitor.js',
    instances: 1,
    exec_mode: 'fork',
    cron_restart: '0 */6 * * *', // Restart every 6 hours
    env: {
      NODE_ENV: 'production'
    },
    log_file: './logs/health-monitor.log',
    out_file: './logs/health-monitor.log',
    error_file: './logs/health-monitor.log'
  },
  {
    name: 'auto-scaler',
    script: './backend/src/services/auto-scaler.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    log_file: './logs/autoscaler.log',
    out_file: './logs/autoscaler.log',
    error_file: './logs/autoscaler.log'
  }],
  
  // Deploy configuration for CI/CD
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/your-repo.git',
      path: '/home/ubuntu/tools-new',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};

# GitHub CI/CD Setup Instructions

This document provides step-by-step instructions to set up GitHub Actions CI/CD pipeline for your File Drop AI application.

## Prerequisites

1. GitHub repository created
2. Production server with SSH access
3. Domain name (optional, for SSL)

## 1. Repository Setup

### Initialize Git Repository (if not already done)

```bash
cd /home/ubuntu/tools-new
git init
git add .
git commit -m "Initial commit with production setup"
git branch -M main
git remote add origin https://github.com/yourusername/file-drop-ai.git
git push -u origin main
```

### Create Development Branch

```bash
git checkout -b develop
git push -u origin develop
```

## 2. GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Production Secrets

```
PRODUCTION_HOST=your-server-ip-or-domain
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=your-private-ssh-key-content
PRODUCTION_PORT=22
PRODUCTION_URL=https://your-domain.com
```

### Staging Secrets (Optional)

```
STAGING_HOST=your-staging-server-ip
STAGING_USER=ubuntu
STAGING_SSH_KEY=your-staging-private-ssh-key
STAGING_PORT=22
STAGING_URL=https://staging.your-domain.com
```

### Notification Secrets (Optional)

```
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

## 3. SSH Key Setup

### Generate SSH Key Pair

On your local machine:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com" -f ~/.ssh/github_actions_key
```

### Add Public Key to Server

Copy the public key to your server:

```bash
ssh-copy-id -i ~/.ssh/github_actions_key.pub ubuntu@your-server-ip
```

Or manually add it:

```bash
# On your server
mkdir -p ~/.ssh
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Add Private Key to GitHub Secrets

Copy the private key content:

```bash
cat ~/.ssh/github_actions_key
```

Add this content to the `PRODUCTION_SSH_KEY` secret in GitHub.

## 4. Server Preparation

### Run Production Setup

On your production server:

```bash
cd /home/ubuntu/tools-new
./setup-production.sh --domain your-domain.com --install-ssl
```

### Verify Setup

```bash
# Check application status
pm2 status

# Check health
curl http://localhost:3000/health

# Check nginx
sudo systemctl status nginx

# Check logs
pm2 logs file-drop-ai
```

## 5. Environment Configuration

### Create .env File

```bash
# On your server
cd /home/ubuntu/tools-new
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=your-table-name
# Add other environment variables as needed
```

## 6. Testing the CI/CD Pipeline

### Test Development Workflow

```bash
# Make a change
echo "# Test change" >> README.md
git add .
git commit -m "Test CI/CD pipeline"
git push origin develop
```

This will trigger the staging deployment.

### Test Production Deployment

```bash
# Merge to main for production deployment
git checkout main
git merge develop
git push origin main
```

This will trigger the production deployment.

## 7. Monitoring and Alerts

### Setup Slack Notifications (Optional)

1. Create a Slack webhook URL
2. Add it to GitHub secrets as `SLACK_WEBHOOK_URL`
3. The pipeline will send notifications on deployment success/failure

### Monitor Deployments

- Check GitHub Actions tab for pipeline status
- Monitor server logs: `pm2 logs file-drop-ai`
- Check health endpoint: `curl https://your-domain.com/health`

## 8. Branch Protection Rules

Set up branch protection for `main` branch:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

## 9. Workflow Customization

### Modify CI/CD Pipeline

Edit `.github/workflows/ci-cd.yml` to customize:

- Add more test environments
- Change deployment conditions
- Add additional security scans
- Modify notification settings

### Environment-Specific Configurations

The pipeline supports multiple environments:

- **Development**: Automatic deployment on `develop` branch
- **Staging**: Manual approval required
- **Production**: Automatic deployment on `main` branch with health checks

## 10. Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify SSH key is correct
   - Check server firewall settings
   - Ensure SSH service is running

2. **Health Check Failed**
   - Check application logs: `pm2 logs file-drop-ai`
   - Verify environment variables
   - Check database connectivity

3. **Nginx Configuration Error**
   - Test configuration: `sudo nginx -t`
   - Check error logs: `sudo tail -f /var/log/nginx/error.log`

4. **PM2 Process Not Starting**
   - Check PM2 logs: `pm2 logs`
   - Verify Node.js version
   - Check file permissions

### Debug Commands

```bash
# Check system status
systemctl status file-drop-ai
pm2 status
sudo systemctl status nginx

# View logs
pm2 logs file-drop-ai --lines 100
sudo tail -f /var/log/nginx/file-drop-ai.error.log
journalctl -u file-drop-ai -f

# Test connectivity
curl -v http://localhost:3000/health
curl -v https://your-domain.com/health

# Check processes
ps aux | grep node
netstat -tlnp | grep :3000
```

## 11. Security Considerations

1. **SSH Keys**: Use dedicated SSH keys for CI/CD
2. **Secrets**: Never commit secrets to repository
3. **Firewall**: Configure UFW properly
4. **SSL**: Always use HTTPS in production
5. **Updates**: Keep system and dependencies updated

## 12. Performance Optimization

The setup includes:

- **Auto-scaling**: Automatic instance scaling based on load
- **Load balancing**: Nginx with upstream servers
- **Health monitoring**: Continuous health checks
- **Log rotation**: Automatic log cleanup
- **Caching**: Nginx static file caching
- **Compression**: Gzip compression enabled

## 13. Backup and Recovery

- **Automatic backups**: Daily backups via cron
- **Rollback capability**: Automatic rollback on deployment failure
- **Database backups**: Configure based on your database setup

## Support

For issues or questions:

1. Check the logs first
2. Review this documentation
3. Check GitHub Actions logs
4. Contact your system administrator

---

**Note**: Replace `your-domain.com`, `your-server-ip`, and other placeholders with your actual values.

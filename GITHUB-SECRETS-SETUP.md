# 🔐 GitHub Secrets Configuration

## Required Secrets for CI/CD Pipeline

Add these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Production Server Secrets

```
PRODUCTION_HOST=44.205.255.158
PRODUCTION_USER=ubuntu
PRODUCTION_PORT=22
PRODUCTION_URL=http://44.205.255.158:3000
```

### SSH Key for Deployment

You need to add your SSH private key. Here's how:

1. **Generate SSH Key Pair** (if you don't have one):
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com" -f ~/.ssh/github_actions_key
```

2. **Add Public Key to Server** (already done for your current setup):
```bash
# Your current SSH key is already configured
```

3. **Get Private Key Content**:
```bash
cat ~/.ssh/id_rsa
# OR if you created a new key:
cat ~/.ssh/github_actions_key
```

4. **Add to GitHub Secrets**:
```
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
[Your private key content here]
-----END OPENSSH PRIVATE KEY-----
```

### Optional: Notification Secrets

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## Current Server Details

- **Server IP**: 44.205.255.158
- **User**: ubuntu
- **SSH Port**: 22
- **Application URL**: http://44.205.255.158:3000
- **Health Check**: http://44.205.255.158:3000/health

## Testing the Setup

After adding secrets, the CI/CD pipeline will:

1. **On push to `develop`**: Deploy to staging (if configured)
2. **On push to `master`**: Deploy to production
3. **Run tests** before deployment
4. **Perform health checks** after deployment
5. **Send notifications** on success/failure

## Security Notes

- Never commit SSH keys to the repository
- Use dedicated SSH keys for CI/CD
- Rotate keys regularly
- Monitor deployment logs for security issues

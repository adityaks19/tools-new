# 🚀 Complete GitHub CI/CD Setup Guide

## Your Repository: https://github.com/adityaks19/tools-new

## ✅ Step 1: Add GitHub Secrets

Go to: **https://github.com/adityaks19/tools-new/settings/secrets/actions**

Click **"New repository secret"** and add these **4 secrets**:

### Secret 1: PRODUCTION_HOST
```
Name: PRODUCTION_HOST
Value: 44.205.255.158
```

### Secret 2: PRODUCTION_USER
```
Name: PRODUCTION_USER
Value: ubuntu
```

### Secret 3: PRODUCTION_SSH_KEY
```
Name: PRODUCTION_SSH_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

### Secret 4: PRODUCTION_URL
```
Name: PRODUCTION_URL
Value: http://44.205.255.158:3000
```

## ✅ Step 2: Test the CI/CD Pipeline

### Option A: Test with Development Branch
```bash
# Make a small change
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin develop
```

### Option B: Test with Production Branch
```bash
# Switch to master and push
git checkout master
git merge develop
git push origin master
```

## 🎯 What Happens When You Push:

### Push to `develop` branch:
1. ✅ Runs tests and security scans
2. ✅ Deploys to staging (if configured)
3. ✅ Sends notifications

### Push to `master` branch:
1. ✅ Runs tests and security scans
2. ✅ Deploys to production server (44.205.255.158)
3. ✅ Performs health checks
4. ✅ Sends success/failure notifications
5. ✅ Automatic rollback if deployment fails

## 📊 Monitor Your Deployments

1. **GitHub Actions**: https://github.com/adityaks19/tools-new/actions
2. **Production Health**: http://44.205.255.158:3000/health
3. **Application**: http://44.205.255.158:3000/

## 🔧 Pipeline Features

✅ **Automated Testing** - Runs tests before deployment
✅ **Security Scanning** - Scans for vulnerabilities
✅ **Zero-Downtime Deployment** - Uses PM2 reload
✅ **Health Checks** - Verifies deployment success
✅ **Automatic Rollback** - Reverts on failure
✅ **Notifications** - Slack alerts (optional)
✅ **Multi-Environment** - Staging and production
✅ **Performance Testing** - Load tests after deployment

## 🚨 Troubleshooting

### If deployment fails:
1. Check GitHub Actions logs
2. Check server logs: `pm2 logs file-drop-ai`
3. Verify secrets are correct
4. Check server connectivity

### Common issues:
- **SSH connection failed**: Check PRODUCTION_SSH_KEY secret
- **Health check failed**: Check application logs
- **Permission denied**: Verify SSH key permissions

## 🎉 You're All Set!

Your CI/CD pipeline is now ready! Every time you push code:

1. **Tests run automatically**
2. **Code deploys to production**
3. **Health checks verify success**
4. **You get notified of results**

**Your application will always stay online with zero-downtime deployments!** 🚀

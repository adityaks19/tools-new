# Migration Guide: Project Restructure

This document explains the changes made to restructure the project for better organization and maintainability.

## 🔄 What Changed

### Old Structure → New Structure

```
OLD:                           NEW:
├── server.js                  ├── backend/src/server.js
├── routes/                    ├── backend/src/routes/
├── middleware/                ├── backend/src/middleware/
├── config/                    ├── backend/src/config/
├── src/                       ├── backend/src/
├── tests/                     ├── backend/tests/
├── client/                    ├── frontend/
├── infrastructure/            ├── infrastructure/aws/
├── scripts/                   ├── scripts/deployment/
├── *.sh files                 ├── scripts/setup/
├── docs files                 ├── docs/
└── package.json               └── package.json (monorepo)
```

## 📦 Package.json Changes

### Root Package.json
- Now serves as a monorepo coordinator
- Contains workspace configuration
- Includes scripts to manage both frontend and backend
- Uses `concurrently` to run both servers simultaneously

### Backend Package.json
- Contains only backend-specific dependencies
- Located at `backend/package.json`
- Scripts focused on backend operations

### Frontend Package.json
- Contains only frontend-specific dependencies
- Located at `frontend/package.json`
- Unchanged from original client package.json

## 🚀 Updated Commands

### Development Commands

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `npm start` | `npm start` | Now starts both frontend and backend |
| `npm run dev` | `npm run start:backend` | Start backend only |
| `node server.js` | `cd backend && npm start` | Direct backend start |
| `cd client && npm start` | `npm run start:frontend` | Start frontend only |

### Build Commands

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `cd client && npm run build` | `npm run build` | Build frontend |
| N/A | `npm run build:frontend` | Explicit frontend build |

### Test Commands

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `npm test` | `npm run test:backend` | Backend tests only |
| `cd client && npm test` | `npm run test:frontend` | Frontend tests only |
| N/A | `npm test` | Run all tests |

## 🔧 Configuration Updates

### PM2 Configuration (ecosystem.config.js)
- Updated script path: `./backend/src/server.js`
- Updated ignore patterns for new structure
- Added health monitor and auto-scaler services

### Environment Variables
- No changes to .env structure
- Same variables, same locations

### Docker Configuration
- Moved to `infrastructure/docker/`
- Updated paths in docker-compose.yml
- Dockerfile updated for new structure

## 📁 File Locations

### Moved Files

| File Type | Old Location | New Location |
|-----------|--------------|--------------|
| Server files | `./` | `backend/src/` |
| Routes | `routes/` | `backend/src/routes/` |
| Middleware | `middleware/` | `backend/src/middleware/` |
| Config | `config/` | `backend/src/config/` |
| Services | `src/services/` | `backend/src/services/` |
| Tests | `tests/` | `backend/tests/` |
| Client | `client/` | `frontend/` |
| Scripts | `*.sh` | `scripts/setup/` or `scripts/deployment/` |
| Docs | `*.md` | `docs/` |
| Infrastructure | `infrastructure/` | `infrastructure/aws/` |
| Docker | `docker-compose.yml` | `infrastructure/docker/` |

## 🛠️ Development Workflow

### Setting Up Development Environment

1. **Clone/Pull the updated repository**
   ```bash
   git pull origin main
   ```

2. **Run the setup script**
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Or manually install dependencies**
   ```bash
   npm run install:all
   ```

4. **Start development**
   ```bash
   npm start
   ```

### Working with the New Structure

#### Backend Development
```bash
cd backend
npm run dev        # Start backend in development mode
npm test          # Run backend tests
npm run lint      # Lint backend code
```

#### Frontend Development
```bash
cd frontend
npm start         # Start frontend development server
npm run build     # Build for production
npm test          # Run frontend tests
```

#### Full Stack Development
```bash
# From root directory
npm start         # Start both frontend and backend
npm test          # Run all tests
npm run build     # Build frontend for production
```

## 🔄 Migration Steps for Existing Developers

1. **Backup your current work**
   ```bash
   git stash  # Save any uncommitted changes
   ```

2. **Pull the new structure**
   ```bash
   git pull origin main
   ```

3. **Clean old dependencies**
   ```bash
   rm -rf node_modules client/node_modules
   rm package-lock.json client/package-lock.json
   ```

4. **Install new dependencies**
   ```bash
   npm run install:all
   ```

5. **Update your development workflow**
   - Use `npm start` instead of separate commands
   - Backend code is now in `backend/src/`
   - Frontend code is now in `frontend/src/`

6. **Restore your work**
   ```bash
   git stash pop  # Restore your changes
   ```

## 🚨 Breaking Changes

### Import Paths
If you have any custom scripts or configurations that reference file paths, update them:

- `./server.js` → `./backend/src/server.js`
- `./client/` → `./frontend/`
- `./routes/` → `./backend/src/routes/`
- `./config/` → `./backend/src/config/`

### PM2 Configuration
If you have custom PM2 configurations, update the script paths to point to the new backend location.

### Docker/CI Configuration
Update any Docker or CI configurations to use the new paths and build commands.

## ✅ Benefits of New Structure

1. **Clear Separation**: Frontend and backend are clearly separated
2. **Scalability**: Easier to scale and deploy independently
3. **Maintainability**: Better organization makes code easier to maintain
4. **Monorepo Benefits**: Single repository with multiple packages
5. **Development Experience**: Improved development workflow with unified commands
6. **Documentation**: Better organized documentation structure

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm run install:all` to reinstall all dependencies

2. **PM2 not starting**
   - Check that paths in `ecosystem.config.js` are correct
   - Ensure `backend/src/server.js` exists

3. **Frontend not loading**
   - Check that frontend is built: `npm run build`
   - Verify proxy configuration in `frontend/package.json`

4. **Tests failing**
   - Update test paths if you have custom tests
   - Run tests separately: `npm run test:backend` and `npm run test:frontend`

### Getting Help

If you encounter issues during migration:

1. Check this migration guide
2. Review the main README.md
3. Check the troubleshooting section in docs/
4. Create an issue on GitHub

## 📞 Support

For questions about the migration:
- Check the documentation in `docs/`
- Review the updated README.md
- Contact the development team

---

**The restructure improves project organization and development experience while maintaining all existing functionality.**

# Scripts Reference Guide

This document provides a quick reference for all available npm scripts in the SeedPlanner project.

## 🚀 Quick Start Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run setup` | Complete project setup (install + seed) | First time setup |
| `npm run setup:dev` | Setup and start development | Quick dev start |
| `npm run dev` | Start both API and frontend in development | Main development |

## 🧪 Testing Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run test` | Run all tests | Unit tests |
| `npm run test:coverage` | Run tests with coverage | Coverage reports |
| `npm run test:e2e` | Run end-to-end tests | E2E testing |
| `npm run test:e2e:open` | Open Cypress for E2E testing | Interactive E2E |

## 🎨 Code Quality Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run lint` | Run linting on all workspaces | Code quality |
| `npm run lint:fix` | Auto-fix linting issues | Fix code issues |
| `npm run format` | Format code with Prettier | Code formatting |
| `npm run format:check` | Check code formatting | CI/CD checks |
| `npm run precommit` | Pre-commit checks (lint + test + build) | Pre-commit |

## 🌱 Database Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run seed` | Run database seeding | Populate demo data |
| `npm run seed:clean` | Clean and seed database | Fresh start |
| `npm run seed:verify` | Verify seeded data | Check data integrity |
| `npm run db:reset` | Reset database completely | Reset everything |

## ☁️ Infrastructure Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run infra:deploy` | Deploy infrastructure | Deploy to AWS |
| `npm run infra:destroy` | Destroy infrastructure | Clean up AWS |
| `npm run infra:plan` | Plan infrastructure changes | Preview changes |
| `npm run infra:output` | Show infrastructure outputs | View outputs |

## 🏗️ Build & Development Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run build` | Build all workspaces | Production build |
| `npm run start` | Start in production mode | Production start |
| `npm run dev:api` | Start API in development | API only |
| `npm run dev:frontend` | Start frontend in development | Frontend only |

## 🧹 Cleanup Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run clean` | Clean workspaces | Basic cleanup |
| `npm run clean:all` | Deep clean all node_modules | Full cleanup |
| `npm run install:all` | Install all workspace dependencies | Dependency install |

## 📦 Workspace Management

| Script | Description | Usage |
|--------|-------------|-------|
| `npm run postinstall` | Auto-install workspace dependencies | After npm install |
| `npm run install:all` | Install all workspace dependencies | Manual install |

## 🔄 Common Workflows

### First Time Setup
```bash
npm run setup
```

### Daily Development
```bash
npm run dev
```

### Before Committing
```bash
npm run precommit
```

### Deploy to Production
```bash
npm run build
npm run infra:deploy
npm run start
```

### Reset Everything
```bash
npm run clean:all
npm run setup
```

### Run Tests
```bash
npm run test              # Unit tests
npm run test:coverage     # With coverage
npm run test:e2e          # End-to-end tests
```

## 📝 Notes

- All scripts are designed to work from the project root
- Infrastructure scripts require AWS credentials to be configured
- Database scripts require MongoDB to be running
- Some scripts may take a few minutes to complete (especially infrastructure operations)

## 🆘 Troubleshooting

If you encounter issues:

1. **Dependencies**: Run `npm run install:all`
2. **Clean Start**: Run `npm run clean:all && npm run setup`
3. **Database Issues**: Run `npm run db:reset`
4. **Infrastructure Issues**: Check AWS credentials and run `npm run infra:plan`

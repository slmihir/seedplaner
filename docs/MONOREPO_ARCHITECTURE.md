# Monorepo Architecture Guide

## Overview

SeedPlanner uses a **monorepo architecture** with npm workspaces to manage multiple applications in a single repository. This approach provides better organization, dependency management, and development workflow.

## Project Structure

```
seed-planner/
├── package.json                    # Root workspace coordinator
├── apps/
│   ├── frontend/
│   │   ├── package.json           # Frontend dependencies & scripts
│   │   ├── src/                   # React application
│   │   └── dist/                  # Built frontend assets
│   └── api/
│       ├── package.json           # Backend dependencies & scripts
│       ├── src/                   # Express API
│       └── tests/                 # API tests
├── scripts/
│   └── db/
│       └── seed.js                # Database seeding
└── infra/
    └── terraform/                 # Infrastructure as Code
```

## Package.json Files Explained

### 1. Root Package.json
**Purpose**: Workspace coordinator and shared project management

```json
{
  "name": "seed-planner",
  "version": "2.1.0",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:frontend\"",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "seed": "node scripts/db/seed.js"
  }
}
```

**Key Features**:
- Manages all workspace dependencies
- Provides unified scripts for development
- Coordinates infrastructure deployment
- Handles database seeding

### 2. Frontend Package.json
**Purpose**: React frontend application management

```json
{
  "name": "frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test:e2e": "cypress run"
  },
  "dependencies": {
    "react": "^19.1.1",
    "@mui/material": "^7.3.2",
    "axios": "^1.11.0"
  }
}
```

**Key Features**:
- React + Vite development setup
- Material-UI component library
- Cypress E2E testing
- TypeScript support
- ES modules configuration

### 3. API Package.json
**Purpose**: Node.js backend API management

```json
{
  "name": "@seed-planner/api",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^5.1.0",
    "mongoose": "^8.18.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

**Key Features**:
- Express.js server setup
- MongoDB with Mongoose
- JWT authentication
- Jest unit testing
- Nodemon for development

## How They Work Together

### 1. Dependency Management
- **Shared Dependencies**: Automatically hoisted to root `node_modules`
- **App-Specific Dependencies**: Installed in respective app folders
- **Version Resolution**: npm workspaces handles version conflicts

### 2. Script Coordination
```bash
# Root script delegates to workspace scripts
npm run dev
# ↓ Executes
concurrently "npm run dev:api" "npm run dev:frontend"
# ↓ Which runs
nodemon src/server.js (API) + vite (Frontend)
```

### 3. Development Workflow
- **Unified Development**: `npm run dev` starts both frontend and API
- **Independent Development**: Can run frontend or API separately
- **Shared Configuration**: Common tools like Prettier, ESLint

## Benefits

### ✅ Independent Versioning
- Frontend can update React/Material-UI independently
- API can update Express/MongoDB independently
- No dependency conflicts between apps

### ✅ Separate Deployments
- Frontend: Deploy to CDN/static hosting (Vercel, Netlify)
- API: Deploy to containers (AWS ECS, Docker)
- Independent scaling and updates

### ✅ Team Collaboration
- Frontend team works in `apps/frontend/`
- Backend team works in `apps/api/`
- Minimal merge conflicts
- Clear separation of concerns

### ✅ Technology Flexibility
- Frontend: React, TypeScript, Vite, Material-UI
- Backend: Node.js, Express, MongoDB, Jest
- Different tools for different purposes

### ✅ Unified Management
- Single repository for version control
- Shared configuration and scripts
- Consistent development environment
- Unified CI/CD pipeline

## Common Commands

### Development
```bash
# Start both frontend and API
npm run dev

# Start only frontend
npm run dev:frontend

# Start only API
npm run dev:api
```

### Building
```bash
# Build all applications
npm run build

# Build specific app
npm run build --workspace=apps/frontend
```

### Testing
```bash
# Run all tests
npm run test

# Run frontend E2E tests
npm run test:e2e

# Run API unit tests
npm run test --workspace=apps/api
```

### Database
```bash
# Seed database
npm run seed

# Reset database
npm run db:reset
```

### Infrastructure
```bash
# Deploy infrastructure
npm run infra:deploy

# Destroy infrastructure
npm run infra:destroy
```

## Best Practices

### 1. Dependency Management
- Keep shared dependencies in root `package.json`
- Keep app-specific dependencies in respective `package.json`
- Use exact versions for critical dependencies

### 2. Script Organization
- Use root scripts for cross-app operations
- Use app scripts for app-specific operations
- Maintain consistent naming conventions

### 3. Development Workflow
- Always run from project root
- Use workspace-specific commands when needed
- Keep dependencies up to date

### 4. Deployment Strategy
- Deploy frontend and API separately
- Use environment variables for configuration
- Implement proper CI/CD pipelines

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**
   ```bash
   npm run clean:all
   npm install
   ```

2. **Script Not Found**
   ```bash
   # Make sure you're in the root directory
   pwd
   # Should show: /path/to/seed-planner
   ```

3. **Workspace Issues**
   ```bash
   npm run install:all
   ```

4. **Build Failures**
   ```bash
   # Check individual app builds
   npm run build --workspace=apps/frontend
   npm run build --workspace=apps/api
   ```

This monorepo architecture provides the perfect balance between separation of concerns and unified project management, making SeedPlanner both maintainable and scalable.

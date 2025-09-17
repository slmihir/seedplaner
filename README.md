# SeedPlanner - Jira-like Project Management System

A comprehensive full-stack project management application built with Node.js, Express, MongoDB, and React. Features include project management, issue tracking, Kanban boards, sprint management, and user administration with AWS ECS + DocumentDB deployment.

## 📋 Table of Contents

- [Project Summary](#-project-summary)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [Windows Setup](#windows-setup)
  - [Mac Setup](#mac-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Demo Login Credentials](#-demo-login-credentials)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 Project Summary

SeedPlanner is a modern, full-stack project management application inspired by Jira. It provides a complete solution for teams to manage projects, track issues, organize sprints, and collaborate effectively. The application features a React frontend with Material-UI components and a Node.js/Express backend with MongoDB database, all deployed on AWS using ECS Fargate and DocumentDB.

### Key Highlights:
- **Monorepo Architecture**: Organized with npm workspaces for scalable development
- **Modern Tech Stack**: React 19, Node.js, Express, MongoDB, Material-UI
- **Cloud-Native**: AWS ECS Fargate + DocumentDB for serverless deployment
- **Role-Based Access**: Admin, Manager, Developer roles with different permissions
- **Real-time Updates**: Live data synchronization and optimistic UI updates
- **Comprehensive Testing**: E2E tests with Cypress and unit tests with Jest
- **Advanced Features**: Sprint boards, cost tracking, GitHub integration, automated reports
- **Innovative UI**: Hybrid board access, dynamic workflows, custom field management

## 🆕 Recent Updates

### Version 2.0 - Major Feature Additions
- **🎯 Sprint Board System**: Dedicated Kanban boards for individual sprints with drag-and-drop functionality
- **💰 Cost Tracking**: Complete budget management system with import/export capabilities
- **📊 Automated Reports**: Auto-generated sprint reports with velocity tracking and analytics
- **🔗 GitHub Integration**: Full GitHub webhook integration with automated status transitions
- **⚙️ Project Configuration**: Dynamic workflow configuration per project and issue type
- **📝 Custom Fields**: Advanced custom field system with date pickers and type-specific applicability
- **🎨 Enhanced UI**: Improved sprint dialogs, issue details views, and responsive design
- **📈 Analytics Dashboard**: Comprehensive sprint analytics with export options (PDF, Excel, CSV)

### Version 2.1 - Enhanced User Experience & Data Synchronization
- **🔄 Real-time Data Synchronization**: Custom event system for instant updates across all pages
- **🎯 Enhanced Project Navigation**: Multiple navigation options (Issues, Sprints, Board) with context menus
- **📊 Improved Board Experience**: Unified UI/UX between main Board and Sprint Board pages
- **🌍 All Projects View**: Board page now supports viewing all issues across projects
- **📤 Export Report Functionality**: Fixed and enhanced export options for sprint reports
- **🎨 Consistent UI Design**: Board page redesigned to match SprintBoard's beautiful interface
- **⚡ Performance Optimizations**: Better data loading and synchronization mechanisms

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation & Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd seed-planner
   npm run install:all
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start Development Servers**
   ```bash
   # Start both backend and frontend concurrently
   npm run dev
   
   # Or start separately:
   # Backend: npm run dev:api
   # Frontend: npm run dev:frontend
   ```

4. **Seed Demo Data (Optional)**
   ```bash
   npm run seed
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Health: http://localhost:4000/health

## 🔐 Demo Login Credentials

The application comes with pre-seeded demo accounts for testing:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@example.com` | `admin123` | Full system access, can manage all users and projects |
| **Manager** | `manager@example.com` | `manager123` | Project management access, can create and manage projects |
| **Developer** | `dev@example.com` | `dev12345` | Standard user access, can work on assigned issues |

> **Note**: These are demo credentials. In production, users should register their own accounts.

## ✨ Features

### 🎯 Project Management
- **Full CRUD Operations**: Create, read, update, and delete projects
- **Project Members**: Add/remove team members with role-based permissions
- **Project Keys**: Unique identifiers for easy project reference
- **Member Roles**: Admin, Editor, and Assignee roles with different permissions
- **Project Statistics**: Real-time project metrics and member activity
- **Enhanced Navigation**: Multiple navigation options (Issues, Sprints, Board) with context menus
- **Flexible Workflow**: Choose your preferred project view based on your role and needs

### 📋 Issue Tracking
- **Comprehensive Issue Management**: Create, assign, and track issues
- **Issue Types**: Bug, Feature, Task, Epic, Story with color-coded indicators
- **Priority Levels**: High, Medium, Low with visual priority indicators
- **Status Tracking**: Backlog → Analysis Ready → Analysis → Development → Acceptance → Released
- **Assignee Management**: Assign issues to project members
- **Real-time Updates**: Live updates when issues are created or modified
- **Bulk Operations**: Select and perform actions on multiple issues
- **Custom Fields**: Dynamic custom fields with configurable data types (text, number, date, select)
- **Issue Details Dialog**: Comprehensive issue view with all details and custom fields
- **Custom Field Applicability**: Configure which issue types custom fields apply to

### 📊 Kanban Board
- **Drag & Drop Interface**: Move issues between columns with smooth animations
- **Visual Status Tracking**: Color-coded columns for different workflow stages
- **Project-specific Boards**: Each project has its own Kanban board
- **All Projects View**: View all issues across projects in a unified board
- **Issue Cards**: Rich issue cards with type, priority, assignee, and status badges
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dynamic Workflows**: Customizable status columns per project and issue type
- **Sprint-specific Boards**: Dedicated Kanban boards for individual sprints
- **Hybrid Board Access**: Both dialog and full-page sprint board views
- **Unified UI/UX**: Consistent design between main Board and Sprint Board pages
- **Real-time Synchronization**: Instant updates across all board views

### 🏃 Sprint Management
- **Sprint Lifecycle**: Create, start, pause, and complete sprints
- **Issue Association**: Add/remove issues from sprints
- **Progress Tracking**: Real-time sprint progress and statistics
- **Sprint Planning**: Set start/end dates and sprint goals
- **Sprint Analytics**: Track velocity and completion rates
- **Sprint Board Integration**: Dedicated Kanban boards for each sprint
- **Sprint Dialog Enhancement**: Tabbed interface with Overview, Board, and Issues views
- **Automated Sprint Reports**: Auto-generated reports with velocity tracking
- **Sprint Navigation**: Direct links to full-screen sprint boards

### 👥 User & Member Management
- **Global Member Management**: Admin interface for managing all users
- **Project-specific Members**: Assign members to specific projects
- **Role-based Access Control**: Admin, Manager, Developer roles with different permissions
- **User Profiles**: Avatar support and user information management
- **Activity Logging**: Track user actions and system events

### 🎨 Modern UI/UX
- **Material-UI Design**: Clean, modern interface with consistent design language
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Theme support for user preference
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Network Status**: Real-time network connectivity monitoring

### 🔧 Admin Dashboard
- **System Overview**: Real-time statistics and system health
- **User Management**: Create, edit, and manage user accounts
- **Project Administration**: Oversee all projects and their members
- **System Settings**: Configure application settings and preferences
- **Activity Monitoring**: Track user activity and system events
- **Cache Management**: Built-in cache clearing functionality

### 📊 Sprint Reports & Analytics
- **Automated Report Generation**: Auto-create sprint reports upon completion
- **Velocity Tracking**: Track team velocity and performance trends
- **Sprint Health Metrics**: Monitor sprint completion rates and bottlenecks
- **Team Performance Analytics**: Individual and team productivity insights
- **Effort Analysis**: Story points and time tracking analysis
- **Enhanced Export Capabilities**: PDF, Excel, CSV, and Print export options
- **Interactive Dashboards**: Visual charts and graphs for data analysis
- **Historical Data**: Track performance over multiple sprints
- **Report Customization**: Customizable report templates and formats

### 💰 Cost Tracking & Budget Management
- **Cost Management**: Track project expenses and budgets
- **Budget Allocation**: Set and monitor project budgets
- **Cost Categories**: Organize costs by categories (development, infrastructure, etc.)
- **Import Functionality**: Import costs from CSV and Excel files
- **Cost Analytics**: Visual cost analysis and spending trends
- **Budget Alerts**: Notifications for budget overruns
- **Cost Reporting**: Generate detailed cost reports
- **Multi-project Cost Tracking**: Track costs across multiple projects

### 🔗 GitHub Integration
- **Repository Linking**: Connect projects to GitHub repositories
- **Webhook Automation**: Automatic status updates from GitHub
- **Issue Synchronization**: Sync GitHub issues with project issues
- **Pull Request Integration**: Link pull requests to project issues
- **Commit Tracking**: Track commits and their relationship to issues
- **Branch Management**: Monitor branch status and deployments
- **Automated Workflows**: Set up automated status transitions
- **Integration Dashboard**: Monitor all GitHub integrations

### ⚙️ Project Configuration
- **Dynamic Workflows**: Configure custom workflows per project
- **Custom Statuses**: Add/remove statuses for different issue types
- **Issue Type Configuration**: Customize issue types and their properties
- **Custom Fields Management**: Create and manage project-specific custom fields
- **Workflow per Issue Type**: Different workflows for different issue types
- **Status Transitions**: Define allowed status transitions
- **Default Configuration**: Initialize projects with default settings
- **Configuration Inheritance**: Inherit settings from project templates

### 🚀 Performance Features
- **Server-side Pagination**: Efficient handling of large datasets
- **Debounced Search**: Reduced API calls during typing
- **API Response Caching**: Cached API responses for better performance
- **Component Memoization**: Optimized re-rendering with React.memo
- **Lazy Loading**: Code splitting for faster initial load
- **Error Boundaries**: Graceful error handling and recovery
- **Database Indexing**: Optimized MongoDB queries
- **Query Optimization**: Minimized database calls

## 🛠 Tech Stack

### Frontend
- **React 19**: Modern React with latest features
- **Vite**: Fast build tool and development server
- **Material-UI**: Component library for consistent design
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **React Window**: Virtualization for large lists
- **Cypress**: End-to-end testing
- **@hello-pangea/dnd**: Drag and drop functionality for Kanban boards
- **@dnd-kit**: Modern drag and drop library for React components
- **@mui/x-date-pickers**: Advanced date picker components
- **recharts**: Interactive charts and graphs for analytics
- **html2canvas**: PDF generation for reports
- **jspdf**: PDF document creation
- **file-saver**: File download functionality
- **xlsx**: Excel file import/export capabilities

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **morgan**: HTTP request logger
- **multer**: File upload handling for cost imports
- **csv-parser**: CSV file parsing for data import
- **xlsx**: Excel file processing for reports and imports

### Infrastructure
- **AWS ECS Fargate**: Serverless container orchestration
- **AWS DocumentDB**: MongoDB-compatible database service
- **AWS ALB**: Application Load Balancer
- **AWS S3**: Static asset storage
- **Terraform**: Infrastructure as Code
- **Docker**: Containerization (removed for simplicity)

### Development Tools
- **ESLint**: Code linting
- **Jest**: Unit testing framework
- **Nodemon**: Development server with auto-restart
- **Concurrently**: Run multiple commands simultaneously

## 📁 Project Structure

```
seed-planner/
├── apps/                          # Monorepo applications
│   ├── api/                       # Backend API server
│   │   ├── src/
│   │   │   ├── app.js            # Express app configuration
│   │   │   ├── server.js         # Server entry point
│   │   │   ├── config/
│   │   │   │   └── db.js         # Database connection configuration
│   │   │   ├── controllers/      # API route controllers
│   │   │   │   ├── authController.js      # Authentication logic
│   │   │   │   ├── boardController.js     # Kanban board operations
│   │   │   │   ├── budgetController.js    # Budget management
│   │   │   │   ├── costController.js      # Cost tracking operations
│   │   │   │   ├── githubController.js    # GitHub integration management
│   │   │   │   ├── githubWebhookController.js # GitHub webhook processing
│   │   │   │   ├── globalMembersController.js  # Global user management
│   │   │   │   ├── issueController.js     # Issue CRUD operations
│   │   │   │   ├── projectConfigController.js # Project configuration
│   │   │   │   ├── projectController.js   # Project management
│   │   │   │   ├── roleController.js      # Role management
│   │   │   │   ├── sprintController.js    # Sprint management
│   │   │   │   ├── sprintReportController.js # Sprint reports and analytics
│   │   │   │   └── userController.js      # User management
│   │   │   ├── middleware/       # Express middleware
│   │   │   │   ├── auth.js       # JWT authentication middleware
│   │   │   │   └── error.js      # Error handling middleware
│   │   │   ├── models/           # Mongoose data models
│   │   │   │   ├── ActivityLog.js         # User activity logging
│   │   │   │   ├── Budget.js              # Budget data model
│   │   │   │   ├── Cost.js                # Cost tracking data model
│   │   │   │   ├── GitHubIntegration.js   # GitHub integration settings
│   │   │   │   ├── GitHubWebhook.js       # GitHub webhook events
│   │   │   │   ├── Issue.js               # Issue data model
│   │   │   │   ├── Notification.js        # Notification system
│   │   │   │   ├── Project.js             # Project data model
│   │   │   │   ├── ProjectConfig.js       # Project configuration model
│   │   │   │   ├── Role.js                # Role and permissions model
│   │   │   │   ├── Sprint.js              # Sprint data model
│   │   │   │   ├── SprintReport.js        # Sprint reports and analytics
│   │   │   │   └── User.js                # User data model
│   │   │   ├── routes/           # API route definitions
│   │   │   │   ├── auth.js       # Authentication routes
│   │   │   │   ├── boards.js     # Kanban board routes
│   │   │   │   ├── budgets.js    # Budget management routes
│   │   │   │   ├── costs.js      # Cost tracking routes
│   │   │   │   ├── github.js     # GitHub integration routes
│   │   │   │   ├── globalMembers.js       # Global member routes
│   │   │   │   ├── index.js      # Main router
│   │   │   │   ├── issues.js     # Issue management routes
│   │   │   │   ├── projectConfig.js # Project configuration routes
│   │   │   │   ├── projects.js   # Project management routes
│   │   │   │   ├── roles.js      # Role management routes
│   │   │   │   ├── sprintReports.js # Sprint reports routes
│   │   │   │   ├── sprints.js    # Sprint management routes
│   │   │   │   └── users.js      # User management routes
│   │   │   ├── services/         # Business logic services
│   │   │   │   ├── activityLogService.js  # Activity logging service
│   │   │   │   └── notificationService.js # Notification service
│   │   │   ├── utils/
│   │   │   │   └── asyncHandler.js        # Async error handling utility
│   │   │   └── seed/             # Database seeding
│   │   │       └── seed.js       # Seed script for demo data
│   │   └── package.json          # API dependencies and scripts
│   └── frontend/                 # React frontend application
│       ├── src/
│       │   ├── api/
│       │   │   └── client.js     # Axios API client configuration
│       │   ├── components/       # Reusable React components
│       │   │   ├── AdminErrorBoundary.jsx     # Admin-specific error boundary
│       │   │   ├── AdminRoute.jsx             # Admin route protection
│       │   │   ├── AppFallback.jsx            # App fallback component
│       │   │   ├── BoardColumn.jsx            # Kanban board column
│       │   │   ├── BulkActions.jsx            # Bulk action controls
│       │   │   ├── ConfirmDialog.jsx          # Confirmation dialogs
│       │   │   ├── ErrorBoundary.jsx          # Error boundary wrapper
│       │   │   ├── GroupedIssuesTable.jsx     # Grouped issues display
│       │   │   ├── GroupedProjectsTable.jsx   # Grouped projects display
│       │   │   ├── IssueCard.jsx              # Individual issue card
│       │   │   ├── IssuesBulkActions.jsx      # Issue bulk operations
│       │   │   ├── IssuesFilters.jsx          # Issue filtering controls
│       │   │   ├── IssuesTable.jsx            # Issues data table
│       │   │   ├── Layout.jsx                 # Main app layout
│       │   │   ├── LoadingScreen.jsx          # Loading state component
│       │   │   ├── NetworkStatus.jsx          # Network connectivity status
│       │   │   ├── Pagination.jsx             # Pagination controls
│       │   │   ├── ProjectForm.jsx            # Project creation/editing form
│       │   │   ├── ProjectMembersBar.jsx      # Project member management
│       │   │   ├── ProjectsFilters.jsx       # Project filtering controls
│       │   │   ├── ProjectsTable.jsx         # Projects data table
│       │   │   ├── ProtectedRoute.jsx        # Route protection wrapper
│       │   │   ├── ResponsiveTableWrapper.jsx # Responsive table container
│       │   │   └── VirtualizedIssuesTable.jsx # Virtualized issues table
│       │   ├── context/
│       │   │   └── AuthContext.jsx            # Authentication context
│       │   ├── hooks/             # Custom React hooks
│       │   │   ├── useApiCache.js             # API response caching
│       │   │   └── useDebounce.js             # Debounced input handling
│       │   ├── pages/             # Main application pages
│       │   │   ├── Admin.jsx                  # Admin dashboard
│       │   │   ├── Board.jsx                  # Kanban board view
│       │   │   ├── GlobalMembers.jsx          # Global member management
│       │   │   ├── Issues.jsx                 # Issues management page
│       │   │   ├── Login.jsx                  # Login page
│       │   │   ├── Members.jsx                # Project members page
│       │   │   ├── Projects.jsx               # Projects management page
│       │   │   ├── Signup.jsx                 # User registration page
│       │   │   └── Sprints.jsx                # Sprint management page
│       │   ├── utils/
│       │   │   └── cacheUtils.js              # Cache utility functions
│       │   ├── App.jsx            # Main App component
│       │   ├── App.css            # Global styles
│       │   ├── index.css          # Base styles
│       │   └── main.jsx           # Application entry point
│       ├── cypress/               # End-to-end tests
│       │   ├── e2e/               # Test specifications
│       │   │   ├── project_issues.cy.js       # Project and issues tests
│       │   │   ├── projects.cy.js             # Projects management tests
│       │   │   └── smoke_home.cy.js           # Basic functionality tests
│       │   └── support/           # Test support files
│       │       ├── commands.js                # Custom Cypress commands
│       │       └── e2e.js                     # E2E test configuration
│       ├── public/                # Static assets
│       │   └── vite.svg          # Vite logo
│       ├── cypress.config.js      # Cypress configuration
│       ├── eslint.config.js       # ESLint configuration
│       ├── index.html             # HTML template
│       ├── package.json           # Frontend dependencies and scripts
│       ├── server.js              # Production server
│       ├── vite.config.js         # Vite configuration
│       └── env.example            # Frontend environment template
├── infra/                         # Infrastructure as Code
│   ├── terraform/                 # Terraform configurations
│   │   ├── main.tf               # Main infrastructure definition
│   │   ├── variables.tf          # Terraform variables
│   │   ├── outputs.tf            # Terraform outputs
│   │   ├── versions.tf           # Provider versions
│   │   ├── terraform.tfvars.example  # Example variable values
│   │   └── modules/              # Terraform modules
│   │       └── ecs-service/      # ECS service module
│   │           ├── main.tf       # ECS service definition
│   │           ├── variables.tf  # Service variables
│   │           └── outputs.tf    # Service outputs
│   ├── scripts/                  # Deployment scripts
│   │   ├── deploy.sh             # Linux/Mac deployment script
│   │   └── deploy.bat            # Windows deployment script
│   ├── README.md                 # Infrastructure documentation
│   └── DEPLOYMENT.md             # Deployment guide
├── scripts/                      # Utility scripts
│   └── db/
│       └── seed.js               # Database seeding script
├── package.json                  # Root package.json with workspaces
├── env.example                   # Environment variables template
├── README.md                     # This file
├── SCHEMA.md                     # Database schema documentation
└── TROUBLESHOOTING.md            # Troubleshooting guide
```

## 📋 Prerequisites

### Required Software
- **Node.js**: v18 or higher
- **npm**: v8 or higher (comes with Node.js)
- **MongoDB**: v6 or higher (local or cloud instance)
- **Git**: For version control

### Optional Software
- **MongoDB Compass**: GUI for MongoDB management
- **Postman**: API testing tool
- **VS Code**: Recommended code editor

## 🚀 Installation & Setup

### Windows Setup

1. **Install Node.js**
   ```powershell
   # Download and install from https://nodejs.org/
   # Or use Chocolatey
   choco install nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

2. **Install MongoDB**
   ```powershell
   # Using Chocolatey
   choco install mongodb
   
   # Or download from https://www.mongodb.com/try/download/community
   # Start MongoDB service
   net start MongoDB
   
   # Or start manually
   mongod --dbpath C:\data\db
   ```

3. **Clone and Setup Project**
   ```powershell
   # Clone the repository
   git clone <repository-url>
   cd seed-planner
   
   # Install all dependencies
   npm run install:all
   
   # Copy environment file
   copy env.example .env
   
   # Edit .env with your configuration
   notepad .env
   ```

4. **Start Development Servers**
   ```powershell
   # Start both backend and frontend
   npm run dev
   
   # Or start separately in different terminals:
   # Terminal 1 - Backend
   npm run dev:api
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

5. **Seed Demo Data (Optional)**
   ```powershell
   npm run seed
   ```

### Mac Setup

1. **Install Node.js**
   ```bash
   # Using Homebrew
   brew install node
   
   # Or download from https://nodejs.org/
   # Verify installation
   node --version
   npm --version
   ```

2. **Install MongoDB**
   ```bash
   # Using Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB service
   brew services start mongodb/brew/mongodb-community
   
   # Or start manually
   mongod --config /usr/local/etc/mongod.conf
   ```

3. **Clone and Setup Project**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd seed-planner
   
   # Install all dependencies
   npm run install:all
   
   # Copy environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Start Development Servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start separately in different terminals:
   # Terminal 1 - Backend
   npm run dev:api
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

5. **Seed Demo Data (Optional)**
   ```bash
   npm run seed
   ```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/seedplanner

# JWT Configuration
JWT_SECRET=change_this_dev_secret

# API Configuration
NODE_ENV=development
PORT=4000

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:4000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/seedplanner` | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | `change_this_dev_secret` | Yes |
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | API server port | `4000` | No |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:4000` | No |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` | No |

## 🚀 Running the Application

### Development Mode

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start them separately:
npm run dev:api      # Backend only (port 4000)
npm run dev:frontend # Frontend only (port 5173)
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production servers
npm run start
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run dev:api` | Start only the backend API server |
| `npm run dev:frontend` | Start only the frontend development server |
| `npm run build` | Build all applications for production |
| `npm run start` | Start all applications in production mode |
| `npm run test` | Run all tests |
| `npm run seed` | Seed the database with demo data |
| `npm run install:all` | Install dependencies for all workspaces |
| `npm run lint` | Run linting for all workspaces |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Health Checks
- `GET /health` - API health status
- `GET /db-health` - Database health status

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users (admin/manager only)
- `PATCH /api/users/:id/role` - Update user role (admin only)

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Issues
- `POST /api/issues` - Create new issue
- `GET /api/issues` - Get all issues (with filtering)
- `GET /api/issues/:id` - Get issue by ID
- `PATCH /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `POST /api/issues/:id/move` - Move issue between statuses

### Sprints
- `POST /api/sprints` - Create new sprint
- `GET /api/sprints` - Get all sprints
- `GET /api/sprints/:id` - Get sprint by ID
- `PATCH /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint

### Boards
- `GET /api/boards/:projectId` - Get Kanban board for project
- `POST /api/boards/move/:issueId` - Move issue on board

### Global Members
- `GET /api/global-members` - Get all global members
- `POST /api/global-members` - Create new global member
- `PATCH /api/global-members/:id` - Update global member
- `DELETE /api/global-members/:id` - Delete global member

> **Note**: Include `Authorization: Bearer <token>` header for protected routes.

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Open Cypress test runner
npm run cy:open

# Run Cypress tests headlessly
npm run cy:run

# Run tests with development server
npm run cy:run:with-dev
```

### Test Coverage
- **Backend**: Jest with MongoDB Memory Server
- **Frontend**: Cypress for E2E testing
- **Coverage**: HTML reports generated in `coverage/` directory

## 🚀 Deployment

### AWS ECS + DocumentDB Deployment

The application is designed for deployment on AWS using ECS Fargate and DocumentDB. See the [Deployment Guide](infra/DEPLOYMENT.md) for detailed instructions.

### Quick Deployment Steps

1. **Prerequisites**
   - AWS CLI configured
   - Terraform installed
   - Docker installed (for building images)

2. **Deploy Infrastructure**
   ```bash
   cd infra/terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Build and Deploy Application**
   ```bash
   # Build frontend
   npm run build

   # Deploy using provided scripts
   ./infra/scripts/deploy.sh  # Linux/Mac
   # or
   infra\scripts\deploy.bat   # Windows
   ```

### Infrastructure Components

- **ECS Fargate**: Serverless container orchestration
- **DocumentDB**: MongoDB-compatible database
- **ALB**: Application Load Balancer
- **S3**: Static asset storage
- **EFS**: Shared file system for static assets
- **VPC**: Isolated network environment
- **CloudWatch**: Monitoring and logging

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Windows
   netstat -ano | findstr :4000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -i tcp:4000
   kill -9 <PID>
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check if MongoDB is running
   # Windows
   net start MongoDB
   
   # Mac/Linux
   brew services start mongodb/brew/mongodb-community
   ```

3. **JWT Secret Error**
   - Ensure `.env` file has `JWT_SECRET` set
   - Restart the backend server

4. **Frontend Cannot Reach Backend**
   - Check `VITE_API_BASE_URL` in `.env`
   - Verify backend is running on correct port
   - Check CORS configuration

5. **Blank Page Issues**
   - Clear browser cache and localStorage
   - Check browser console for errors
   - Verify all environment variables are set
   - Ensure both servers are running

### Health Checks
```bash
# Backend health
curl -i http://localhost:4000/health

# Database health
curl -i http://localhost:4000/db-health

# Frontend accessibility
curl -i http://localhost:5173
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm run dev:api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Material-UI for the component library
- React team for the amazing framework
- MongoDB for the database solution
- Express.js for the backend framework
- AWS for the cloud infrastructure
- All contributors and testers

---

**SeedPlanner** - Streamline your project management workflow with a modern, feature-rich application that scales with your team's needs.

For more detailed information, see:
- [Database Schema Documentation](SCHEMA.md)
- [Infrastructure Documentation](infra/README.md)
- [Deployment Guide](infra/DEPLOYMENT.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)



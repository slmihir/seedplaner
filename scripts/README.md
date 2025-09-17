# Scripts Directory

This directory contains utility scripts for the SeedPlanner project.

## Database Scripts

### `db/seed.js`

The comprehensive database seeding script that populates the database with complete demo data. This script incorporates functionality from all API seed utilities.

#### Features:
- **System Configuration**: Field types, cost categories, workflow templates
- **Role-Based Access Control**: Complete role system with proper permissions
- **User Management**: Demo users with proper role assignments
- **Project Management**: Multiple demo projects with different configurations
- **Issue Tracking**: Sample issues across different projects and types
- **Sprint Management**: Demo sprints with realistic data
- **Custom Fields**: Business value, estimated hours, target release dates
- **Role Migration**: Automatic migration of string-based roles to ObjectId-based roles
- **Permission Verification**: Built-in permission testing and verification

#### Usage:
```bash
# Run from project root
npm run seed
```

#### Demo Credentials:
- **Admin**: `admin@example.com` / `admin123`
- **Manager**: `manager@example.com` / `manager123`
- **Developer**: `dev1@example.com` / `dev123`
- **QA Tester**: `tester@example.com` / `tester123`

#### What Gets Seeded:
- 1 System Configuration record
- 5 Role records (admin, manager, developer, tester, viewer)
- 5 User records with proper role assignments
- 3 Project records with different board types
- 3 Project Configuration records
- 5 Issue records across different projects
- 2 Sprint records

#### Advanced Features:
- **Role.initializeDefaultRoles()**: Uses the Role model's built-in method for consistent role creation
- **Role Migration**: Automatically migrates existing users from string-based roles to ObjectId-based roles
- **Permission Verification**: Tests and verifies that admin user has correct permissions
- **Comprehensive Permissions**: Includes all permissions from updateAdminPermissions.js
- **Error Handling**: Robust error handling and cleanup

#### Database Cleanup:
The script automatically cleans all existing data before seeding to ensure a fresh start.

## Legacy API Utility Scripts

The following utility scripts were previously located in `apps/api/src/seed/` and have been **FULLY INCORPORATED** into the main seed script:

- **`roleSeed.js`** - ✅ **INCORPORATED**: Role initialization and user migration logic
- **`fixAdminRole.js`** - ✅ **INCORPORATED**: Admin role assignment and verification
- **`testPermissions.js`** - ✅ **INCORPORATED**: Permission testing and verification
- **`updateAdminPermissions.js`** - ✅ **INCORPORATED**: Comprehensive permission sets

**Note**: These files have been removed to eliminate duplication. All functionality is now available in the main seed script.

## Migration from API Seed Files

The root seed script now includes all functionality from the API seed files:

1. **Role Management**: Uses `Role.initializeDefaultRoles()` for consistent role creation
2. **User Migration**: Handles migration from string-based to ObjectId-based roles
3. **Permission Verification**: Tests key permissions after seeding
4. **Comprehensive Permissions**: Includes all permissions from the Role model
5. **Additional Roles**: Includes the "tester" role that was missing from the original seed

This consolidation eliminates duplication and ensures a single, comprehensive seeding solution.

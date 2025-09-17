'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Fallback MongoDB URI if env loading fails
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seedplanner';
const JWT_SECRET = process.env.JWT_SECRET || 'IXme7T2teGU0z+sjrWODNrChH6URp+qj3HA/dtlDj+g=';

console.log('Environment variables:');
console.log('MONGODB_URI:', MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Import models with corrected paths from root
const User = require('../../apps/api/src/models/User');
const Project = require('../../apps/api/src/models/Project');
const Issue = require('../../apps/api/src/models/Issue');
const Sprint = require('../../apps/api/src/models/Sprint');
const ProjectConfig = require('../../apps/api/src/models/ProjectConfig');
const SystemConfig = require('../../apps/api/src/models/SystemConfig');
const Role = require('../../apps/api/src/models/Role');

const cleanAndSeed = async () => {
  try {
    console.log('🚀 Starting database cleanup and seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean all collections
    console.log('🧹 Cleaning database...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Issue.deleteMany({}),
      Sprint.deleteMany({}),
      ProjectConfig.deleteMany({}),
      SystemConfig.deleteMany({}),
      Role.deleteMany({})
    ]);
    console.log('✅ Database cleaned');

    // 1. Seed System Configuration
    console.log('📋 Seeding System Configuration...');
    const systemConfig = new SystemConfig({
      fieldTypes: [
        { value: 'text', label: 'Text Input', description: 'Single line text input', inputType: 'text', isActive: true },
        { value: 'textarea', label: 'Text Area', description: 'Multi-line text input', inputType: 'textarea', isActive: true },
        { value: 'number', label: 'Number Input', description: 'Numeric input field', inputType: 'number', isActive: true },
        { value: 'date', label: 'Date Picker', description: 'Date selection input', inputType: 'date', isActive: true },
        { value: 'datetime', label: 'Date & Time Picker', description: 'Date and time selection', inputType: 'datetime', isActive: true },
        { value: 'select', label: 'Select Dropdown', description: 'Single selection dropdown', inputType: 'select', isActive: true },
        { value: 'multiselect', label: 'Multi-Select', description: 'Multiple selection dropdown', inputType: 'multiselect', isActive: true },
        { value: 'checkbox', label: 'Checkbox', description: 'Boolean checkbox input', inputType: 'checkbox', isActive: true },
        { value: 'radio', label: 'Radio Buttons', description: 'Single choice radio buttons', inputType: 'radio', isActive: true }
      ],
      costCategories: [
        { value: 'aws', label: 'AWS Services', description: 'Amazon Web Services costs', color: 'primary', isActive: true },
        { value: 'lucid', label: 'Lucidchart', description: 'Lucidchart subscription costs', color: 'info', isActive: true },
        { value: 'tools', label: 'Development Tools', description: 'Development software and tools', color: 'secondary', isActive: true },
        { value: 'infrastructure', label: 'Infrastructure', description: 'Infrastructure and hosting costs', color: 'warning', isActive: true },
        { value: 'software', label: 'Software Licenses', description: 'Software licensing costs', color: 'success', isActive: true },
        { value: 'hardware', label: 'Hardware', description: 'Hardware equipment costs', color: 'error', isActive: true },
        { value: 'services', label: 'Professional Services', description: 'Professional and consulting services', color: 'default', isActive: true },
        { value: 'other', label: 'Other', description: 'Miscellaneous costs', color: 'default', isActive: true }
      ],
      workflowTemplates: [
        {
          name: 'Subtask Workflow',
          description: 'Workflow for subtasks',
          issueTypes: ['subtask'],
          statuses: [
            { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
            { value: 'development', label: 'Development', color: '#FFF3E0', order: 2 },
            { value: 'code-review', label: 'Code Review', color: '#E8F5E9', order: 3 },
            { value: 'qa', label: 'QA', color: '#E3F2FD', order: 4 },
            { value: 'deployment', label: 'Deployment', color: '#F3E5F5', order: 5 },
            { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
          ],
          transitions: [
            { from: 'backlog', to: 'development' },
            { from: 'development', to: 'code-review' },
            { from: 'code-review', to: 'qa' },
            { from: 'qa', to: 'deployment' },
            { from: 'deployment', to: 'released' }
          ],
          isDefault: true,
          isActive: true
        },
        {
          name: 'Bug/Story/Task Workflow',
          description: 'Workflow for bugs, stories, and tasks',
          issueTypes: ['bug', 'story', 'task'],
          statuses: [
            { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
            { value: 'analysis-ready', label: 'Analysis Ready', color: '#E3F2FD', order: 2 },
            { value: 'analysis', label: 'Analysis', color: '#E8F5E9', order: 3 },
            { value: 'development', label: 'Development', color: '#FFF3E0', order: 4 },
            { value: 'acceptance', label: 'Acceptance', color: '#F3E5F5', order: 5 },
            { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
          ],
          transitions: [
            { from: 'backlog', to: 'analysis-ready' },
            { from: 'analysis-ready', to: 'analysis' },
            { from: 'analysis', to: 'development' },
            { from: 'development', to: 'acceptance' },
            { from: 'acceptance', to: 'released' }
          ],
          isDefault: true,
          isActive: true
        }
      ]
    });
    await systemConfig.save();
    console.log('✅ System Configuration seeded');

    // 2. Create a temporary ObjectId for seeding
    const tempObjectId = new mongoose.Types.ObjectId();
    console.log('🆔 Created temporary ObjectId for seeding');

    // 3. Create temporary role for seeding
    console.log('👥 Creating temporary role for seeding...');
    const tempRole = new Role({
      name: 'temp-admin',
      displayName: 'Temporary Admin',
      description: 'Temporary role for seeding',
      permissions: ['*'],
      isSystem: true,
      isActive: true,
      level: 100,
      createdBy: tempObjectId,
      lastModifiedBy: tempObjectId
    });
    await tempRole.save();
    console.log('✅ Temporary role created');

    // 4. Create temporary admin user for seeding
    console.log('👤 Creating temporary admin user for seeding...');
    const tempAdmin = new User({
      name: 'System Admin',
      email: 'system@seedplanner.com',
      passwordHash: await bcrypt.hash('temp123', 10),
      role: tempRole._id
    });
    await tempAdmin.save();
    console.log('✅ Temporary admin user created');

    // 5. Seed Roles using the Role model's initializeDefaultRoles method
    console.log('👥 Seeding Roles...');
    // Delete the temporary role first
    await Role.deleteOne({ name: 'temp-admin' });
    const savedRoles = await Role.initializeDefaultRoles(tempAdmin._id);
    console.log('✅ Roles seeded using initializeDefaultRoles method');
    console.log(`Created ${savedRoles.length} roles:`, savedRoles.map(r => r.name));

    // Update temp admin user with admin role
    const adminRoleForTempUser = savedRoles.find(role => role.name === 'admin');
    if (!adminRoleForTempUser) {
      throw new Error('Admin role not found in saved roles');
    }
    tempAdmin.role = adminRoleForTempUser._id;
    await tempAdmin.save();
    console.log('✅ Temporary admin user updated with admin role');

    // Handle role migration for any existing users with string-based roles
    console.log('🔄 Checking for users with string-based roles to migrate...');
    const usersWithStringRoles = await User.find({ 
      role: { $type: 'string' } 
    });
    
    if (usersWithStringRoles.length > 0) {
      console.log(`Found ${usersWithStringRoles.length} users with string-based roles, migrating...`);
      
      // Create role mapping
      const roleMap = {};
      for (const role of savedRoles) {
        roleMap[role.name] = role._id;
      }

      let migratedCount = 0;
      for (const user of usersWithStringRoles) {
        const newRoleId = roleMap[user.role] || roleMap['developer']; // Default to developer if role not found
        await User.findByIdAndUpdate(user._id, { role: newRoleId });
        migratedCount++;
        console.log(`  Migrated user ${user.email} from role '${user.role}' to ObjectId`);
      }
      console.log(`✅ Migrated ${migratedCount} users to ObjectId-based roles`);
    } else {
      console.log('✅ No users with string-based roles found');
    }

    // 6. Seed Users
    console.log('👤 Seeding Users...');
    const adminRole = savedRoles.find(role => role.name === 'admin');
    const developerRole = savedRoles.find(role => role.name === 'developer');
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: adminRole._id
      },
      {
        name: 'Developer One',
        email: 'dev1@example.com',
        passwordHash: await bcrypt.hash('dev123', 10),
        role: developerRole._id
      },
      {
        name: 'Developer Two',
        email: 'dev2@example.com',
        passwordHash: await bcrypt.hash('dev123', 10),
        role: developerRole._id
      }
    ];

    const savedUsers = await User.insertMany(users);
    console.log('✅ Users seeded');

    // 7. Seed Projects
    console.log('📁 Seeding Projects...');
    const projects = [
      {
        key: 'SPD',
        name: 'Seed Planner Development',
        description: 'Main development project for the Seed Planner application',
        owner: savedUsers[0]._id,
        members: [
          { user: savedUsers[0]._id, role: 'admin' },
          { user: savedUsers[1]._id, role: 'editor' },
          { user: savedUsers[2]._id, role: 'assignee' }
        ],
        boardType: 'scrum'
      },
      {
        key: 'IM',
        name: 'Infrastructure Migration',
        description: 'Migration to AWS ECS Fargate and DocumentDB',
        owner: savedUsers[0]._id,
        members: [
          { user: savedUsers[0]._id, role: 'admin' },
          { user: savedUsers[1]._id, role: 'editor' }
        ],
        boardType: 'kanban'
      }
    ];

    const savedProjects = await Project.insertMany(projects);
    console.log('✅ Projects seeded');

    // 8. Seed Project Configurations
    console.log('⚙️ Seeding Project Configurations...');
    const projectConfigs = [
      {
        project: savedProjects[0]._id,
        issueTypes: [
          {
            name: 'task',
            displayName: 'Task',
            description: 'A task that needs to be completed',
            icon: 'assignment',
            color: 'primary',
            workflow: ['Backlog', 'Analysis Ready', 'Analysis', 'Development', 'Acceptance', 'Released'],
            isDefault: true,
            isActive: true
          },
          {
            name: 'bug',
            displayName: 'Bug',
            description: 'A bug that needs to be fixed',
            icon: 'bug_report',
            color: 'error',
            workflow: ['Backlog', 'Analysis Ready', 'Analysis', 'Development', 'Acceptance', 'Released'],
            isDefault: false,
            isActive: true
          },
          {
            name: 'story',
            displayName: 'User Story',
            description: 'A user story for feature development',
            icon: 'book',
            color: 'success',
            workflow: ['Backlog', 'Analysis Ready', 'Analysis', 'Development', 'Acceptance', 'Released'],
            isDefault: false,
            isActive: true
          },
          {
            name: 'subtask',
            displayName: 'Subtask',
            description: 'A subtask of a larger issue',
            icon: 'list',
            color: 'info',
            workflow: ['Backlog', 'Development', 'Code Review', 'QA', 'Deployment', 'Released'],
            isDefault: false,
            isActive: true
          }
        ],
        statuses: [
          { name: 'backlog', displayName: 'Backlog', description: 'Issues waiting to be started', color: 'default', isDefault: true, isFinal: false, isActive: true, order: 1 },
          { name: 'analysis-ready', displayName: 'Analysis Ready', description: 'Ready for analysis', color: 'info', isDefault: false, isFinal: false, isActive: true, order: 2 },
          { name: 'analysis', displayName: 'Analysis', description: 'Under analysis', color: 'warning', isDefault: false, isFinal: false, isActive: true, order: 3 },
          { name: 'development', displayName: 'Development', description: 'In development', color: 'primary', isDefault: false, isFinal: false, isActive: true, order: 4 },
          { name: 'code-review', displayName: 'Code Review', description: 'Under code review', color: 'secondary', isDefault: false, isFinal: false, isActive: true, order: 5 },
          { name: 'qa', displayName: 'QA', description: 'Quality assurance testing', color: 'info', isDefault: false, isFinal: false, isActive: true, order: 6 },
          { name: 'acceptance', displayName: 'Acceptance', description: 'Waiting for acceptance', color: 'warning', isDefault: false, isFinal: false, isActive: true, order: 7 },
          { name: 'deployment', displayName: 'Deployment', description: 'Being deployed', color: 'secondary', isDefault: false, isFinal: false, isActive: true, order: 8 },
          { name: 'released', displayName: 'Released', description: 'Released to production', color: 'success', isDefault: true, isFinal: true, isActive: true, order: 9 }
        ],
        priorities: [
          { name: 'critical', displayName: 'Critical', description: 'Critical priority issues', color: 'error', order: 1, isActive: true },
          { name: 'high', displayName: 'High', description: 'High priority issues', color: 'warning', order: 2, isActive: true },
          { name: 'medium', displayName: 'Medium', description: 'Medium priority issues', color: 'info', order: 3, isActive: true },
          { name: 'low', displayName: 'Low', description: 'Low priority issues', color: 'success', order: 4, isActive: true }
        ],
        customFields: [
          {
            name: 'businessValue',
            displayName: 'Business Value',
            type: 'number',
            description: 'Business value score (1-10)',
            required: false,
            defaultValue: '5',
            options: [],
            validation: { min: 1, max: 10 },
            applicableTo: ['story', 'task'],
            isActive: true,
            order: 1
          },
          {
            name: 'estimatedHours',
            displayName: 'Estimated Hours',
            type: 'number',
            description: 'Estimated hours to complete',
            required: false,
            defaultValue: '8',
            options: [],
            validation: { min: 0 },
            applicableTo: ['task', 'bug', 'story'],
            isActive: true,
            order: 2
          },
          {
            name: 'targetRelease',
            displayName: 'Target Release',
            type: 'date',
            description: 'Target release date',
            required: false,
            defaultValue: '',
            options: [],
            validation: {},
            applicableTo: ['story', 'task'],
            isActive: true,
            order: 3
          }
        ]
      }
    ];

    // Create configs for all projects
    for (let i = 0; i < savedProjects.length; i++) {
      const config = { ...projectConfigs[0] };
      config.project = savedProjects[i]._id;
      await ProjectConfig.create(config);
    }
    console.log('✅ Project Configurations seeded');

    // 9. Seed Issues
    console.log('🎫 Seeding Issues...');
    const issues = [
      {
        key: 'SPD-1',
        title: 'Implement Dynamic Field Types Management',
        description: 'Create UI for managing custom field types in project configuration',
        type: 'task',
        priority: 'high',
        status: 'development',
        project: savedProjects[0]._id,
        assignee: savedUsers[1]._id,
        reporter: savedUsers[0]._id,
        customFields: {
          businessValue: 8,
          estimatedHours: 16,
          targetRelease: new Date('2024-03-15')
        }
      },
      {
        key: 'SPD-2',
        title: 'Fix Sprint Board Issue Type Display',
        description: 'Sprint board should show all issue types (bug, story, subtask) not just tasks',
        type: 'bug',
        priority: 'medium',
        status: 'development',
        project: savedProjects[0]._id,
        assignee: savedUsers[2]._id,
        reporter: savedUsers[0]._id,
        customFields: {
          estimatedHours: 4,
          targetRelease: new Date('2024-03-10')
        }
      },
      {
        key: 'SPD-3',
        title: 'Add Cost Categories Management',
        description: 'Implement UI for managing cost categories in cost tracking',
        type: 'story',
        priority: 'high',
        status: 'development',
        project: savedProjects[0]._id,
        assignee: savedUsers[1]._id,
        reporter: savedUsers[0]._id,
        customFields: {
          businessValue: 7,
          estimatedHours: 12,
          targetRelease: new Date('2024-03-20')
        }
      },
      {
        key: 'IM-1',
        title: 'Update Infrastructure to ECS Fargate',
        description: 'Migrate from current infrastructure to AWS ECS Fargate with DocumentDB',
        type: 'task',
        priority: 'critical',
        status: 'analysis',
        project: savedProjects[1]._id,
        assignee: savedUsers[0]._id,
        reporter: savedUsers[0]._id,
        customFields: {
          businessValue: 9,
          estimatedHours: 40,
          targetRelease: new Date('2024-04-30')
        }
      }
    ];

    await Issue.insertMany(issues);
    console.log('✅ Issues seeded');

    // 10. Seed Sprints
    console.log('🏃 Seeding Sprints...');
    const sprints = [
      {
        name: 'Sprint 1 - Dynamic Configuration',
        description: 'First sprint focusing on dynamic configuration features',
        project: savedProjects[0]._id,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-15'),
        status: 'active',
        goal: 'Implement dynamic field types and cost categories management'
      },
      {
        name: 'Sprint 2 - Infrastructure Migration',
        description: 'Second sprint for infrastructure improvements',
        project: savedProjects[1]._id,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-29'),
        status: 'planning',
        goal: 'Complete migration to AWS ECS Fargate'
      }
    ];

    await Sprint.insertMany(sprints);
    console.log('✅ Sprints seeded');

    console.log('🎉 Database cleanup and seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- System Config: 1 record`);
    console.log(`- Roles: ${savedRoles.length} records (admin, developer)`);
    console.log(`- Users: ${savedUsers.length} records (1 admin, 2 developers)`);
    console.log(`- Projects: ${savedProjects.length} records`);
    console.log(`- Project Configs: ${savedProjects.length} records`);
    console.log(`- Issues: ${issues.length} records`);
    console.log(`- Sprints: ${sprints.length} records`);
    
    // 11. Verify permissions and roles
    console.log('🔍 Verifying permissions and roles...');
    const adminUser = await User.findOne({ email: 'admin@example.com' }).populate('role');
    if (adminUser && adminUser.role) {
      console.log(`✅ Admin user: ${adminUser.email}`);
      console.log(`✅ Role: ${adminUser.role.name} - ${adminUser.role.displayName}`);
      console.log(`✅ Permissions (${adminUser.role.permissions.length}):`);
      
      // Test key permissions
      const keyPermissions = ['roles.read', 'roles.create', 'users.read', 'projects.read', 'system_config.read'];
      console.log('🔍 Testing key permissions:');
      keyPermissions.forEach(permission => {
        const hasPermission = adminUser.role.permissions.includes(permission);
        console.log(`  - ${permission}: ${hasPermission ? '✅' : '❌'}`);
      });
    }
    console.log('✅ Permission verification completed');

    console.log('\n🔑 Login Credentials:');
    console.log('Admin (Master Account): admin@example.com / admin123');
    console.log('Developer 1 (Restricted Access): dev1@example.com / dev123');
    console.log('Developer 2 (Restricted Access): dev2@example.com / dev123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run the seeding script
cleanAndSeed();

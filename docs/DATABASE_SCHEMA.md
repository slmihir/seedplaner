# Database Schema Documentation

This document provides a comprehensive overview of the SeedPlanner database schema, including all collections, fields, relationships, and constraints.

## 📊 Schema Overview

The database uses **MongoDB** with **Mongoose ODM** for schema definition and validation. All models are located in `apps/api/src/models/`.

## 🗄️ Collections

### 1. Users Collection

**File**: `apps/api/src/models/User.js`

Stores user authentication and profile information.

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  avatarUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `email` (unique)
- `role` (for role queries)

**Methods**:
- `comparePassword(candidatePassword)` - Compare password with hash
- `hashPassword(plain)` - Static method to hash passwords

---

### 2. Roles Collection

**File**: `apps/api/src/models/Role.js`

Manages role-based access control with dynamic permissions.

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `name` (unique)
- `isActive`
- `isSystem`

**Static Methods**:
- `getDefaultRoles()` - Returns default system roles
- `initializeDefaultRoles(createdBy)` - Initializes default roles

**Instance Methods**:
- `hasPermission(permission)` - Check if role has specific permission
- `addPermission(permission)` - Add permission to role
- `removePermission(permission)` - Remove permission from role

---

### 3. Projects Collection

**File**: `apps/api/src/models/Project.js`

Manages project information and member relationships.

```javascript
{
  key: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'assignee'],
      default: 'assignee'
    }
  }],
  boardType: {
    type: String,
    enum: ['scrum', 'kanban'],
    default: 'kanban'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `key` (unique)
- `owner` (for user queries)
- `createdAt` (for sorting)

**Subdocuments**:
- `members` - Array of project member objects with user references and roles

---

### 4. ProjectConfig Collection

**File**: `apps/api/src/models/ProjectConfig.js`

Stores project-specific configurations including issue types, statuses, priorities, and custom fields.

```javascript
{
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  
  // Customizable Issue Types
  issueTypes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      default: 'assignment'
    },
    color: {
      type: String,
      default: 'default'
    },
    workflow: [{
      type: String
    }],
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Customizable Custom Fields
  customFields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'url', 'email'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed
    },
    options: [{
      type: String
    }],
    validation: {
      min: { type: Number },
      max: { type: Number },
      minLength: { type: Number },
      maxLength: { type: Number },
      pattern: { type: String }
    },
    applicableTo: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Customizable Statuses
  statuses: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      default: '#1976d2'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isFinal: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Customizable Priorities
  priorities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      default: '#1976d2'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `project` (unique)

---

### 5. Issues Collection

**File**: `apps/api/src/models/Issue.js`

Tracks project issues with full lifecycle management and custom fields.

```javascript
{
  key: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    default: 'task'
  },
  status: {
    type: String,
    enum: [
      'backlog',
      'analysis_ready',
      'analysis',
      'analysis_requirements',
      'development',
      'code_review',
      'qa',
      'deployment',
      'acceptance',
      'released',
      // legacy statuses kept for backward compatibility
      'todo',
      'in_progress',
      'in_review',
      'done'
    ],
    default: 'backlog'
  },
  priority: {
    type: String,
    default: 'medium'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  storyPoints: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  
  // Parent-child relationships
  parentIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  childIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],
  
  // Custom fields
  acceptanceCriteria: {
    type: String
  },
  testPlan: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  estimate: {
    type: Number
  },
  actual: {
    type: Number
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `key` (unique)
- `project` (for project queries)
- `assignees` (for user assignment queries)
- `status` (for filtering)
- `type` (for filtering)
- `priority` (for filtering)
- `sprint` (for sprint queries)
- `reporter` (for user queries)

---

### 6. Sprints Collection

**File**: `apps/api/src/models/Sprint.js`

Manages sprint planning and execution.

```javascript
{
  name: {
    type: String,
    required: true
  },
  goal: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `project` (for project queries)
- `isActive` (for active sprint queries)
- `startDate` (for date range queries)
- `endDate` (for date range queries)

---

### 7. SystemConfig Collection

**File**: `apps/api/src/models/SystemConfig.js`

Global system configuration including field types, cost categories, and validation rules.

```javascript
{
  // Global field types that can be used across all projects
  fieldTypes: [{
    value: {
      type: String,
      required: true,
      unique: true
    },
    label: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    inputType: {
      type: String,
      enum: ['text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio'],
      default: 'text'
    },
    validation: {
      required: { type: Boolean, default: false },
      minLength: { type: Number },
      maxLength: { type: Number },
      min: { type: Number },
      max: { type: Number },
      pattern: { type: String },
      options: [{ type: String }]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Global cost categories
  costCategories: [{
    value: {
      type: String,
      required: true,
      unique: true
    },
    label: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    color: {
      type: String,
      default: '#1976d2'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Global user roles and permissions
  roles: [{
    name: {
      type: String,
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    permissions: [{
      type: String
    }],
    isSystemRole: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Global validation rules
  validationRules: {
    password: {
      minLength: { type: Number, default: 6 },
      requireUppercase: { type: Boolean, default: false },
      requireLowercase: { type: Boolean, default: false },
      requireNumbers: { type: Boolean, default: false },
      requireSpecialChars: { type: Boolean, default: false }
    },
    projectKey: {
      minLength: { type: Number, default: 2 },
      maxLength: { type: Number, default: 10 },
      pattern: { type: String, default: '^[A-Z][A-Z0-9]*$' }
    },
    issueKey: {
      pattern: { type: String, default: '^[A-Z][A-Z0-9]*-[0-9]+$' }
    }
  },

  // Workflow templates
  workflowTemplates: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    issueTypes: [{
      type: String
    }],
    statuses: [{
      value: { type: String, required: true },
      label: { type: String, required: true },
      color: { type: String, default: '#1976d2' },
      order: { type: Number, default: 0 }
    }],
    transitions: [{
      from: { type: String, required: true },
      to: { type: String, required: true }
    }],
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

### 8. Costs Collection

**File**: `apps/api/src/models/Cost.js`

Tracks project costs and expenses for budgeting and financial management.

```javascript
{
  // Basic Information
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: ['aws', 'lucid', 'tools', 'infrastructure', 'software', 'hardware', 'services', 'other'],
    lowercase: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  
  // Time Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  billingPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  
  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Metadata
  tags: [{
    type: String
  }],
  notes: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `project` (for project queries)
- `category` (for category filtering)
- `startDate` (for date range queries)
- `endDate` (for date range queries)
- `billingPeriod` (for billing queries)

---

### 9. Budgets Collection

**File**: `apps/api/src/models/Budget.js`

Manages project budgets and financial planning.

```javascript
{
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Budget Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  
  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Budget Amounts
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Category Breakdown
  categoryBudgets: [{
    category: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  actualSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBudget: {
    type: Number,
    default: 0
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `project` (for project queries)
- `status` (for status filtering)
- `startDate` (for date range queries)
- `endDate` (for date range queries)

---

### 10. Notifications Collection

**File**: `apps/api/src/models/Notification.js`

Stores user notifications and alerts.

```javascript
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['issue_assigned', 'comment', 'status_change', 'mention', 'sprint_started', 'sprint_completed', 'deadline_approaching'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object
  },
  readAt: {
    type: Date
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `user` (for user notification queries)
- `type` (for notification type filtering)
- `readAt` (for read/unread status)
- `createdAt` (for chronological ordering)

---

### 11. ActivityLog Collection

**File**: `apps/api/src/models/ActivityLog.js`

Tracks system activities and user actions.

```javascript
{
  action: {
    type: String,
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint'
  },
  details: {
    type: Object
  },
  metadata: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `actor` (for user activity queries)
- `project` (for project activity queries)
- `issue` (for issue activity queries)
- `action` (for action type filtering)
- `createdAt` (for chronological ordering)

---

### 12. SprintReport Collection

**File**: `apps/api/src/models/SprintReport.js`

Stores generated sprint reports and analytics.

```javascript
{
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reportType: {
    type: String,
    enum: ['burndown', 'velocity', 'summary', 'detailed'],
    required: true
  },
  reportData: {
    type: Object,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}
```

**Indexes**:
- `sprint` (for sprint queries)
- `project` (for project queries)
- `reportType` (for report type filtering)
- `generatedAt` (for chronological ordering)

---

### 13. GitHubIntegration Collection

**File**: `apps/api/src/models/GitHubIntegration.js`

Manages GitHub repository integrations.

```javascript
{
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  repositoryUrl: {
    type: String,
    required: true
  },
  repositoryName: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  webhookSecret: {
    type: String,
    required: true
  },
  webhookUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    autoTransition: {
      type: Boolean,
      default: false
    },
    linkCommits: {
      type: Boolean,
      default: true
    },
    linkPullRequests: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `project` (for project queries)
- `repositoryUrl` (unique)

---

### 14. GitHubWebhook Collection

**File**: `apps/api/src/models/GitHubWebhook.js`

Stores GitHub webhook events and processing status.

```javascript
{
  integration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GitHubIntegration',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  payload: {
    type: Object,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `integration` (for integration queries)
- `project` (for project queries)
- `eventType` (for event type filtering)
- `processed` (for processing status)
- `createdAt` (for chronological ordering)

---

## 🔗 Relationships

### One-to-Many Relationships

1. **User → Projects** (as Owner)
   - One user can own multiple projects
   - Reference: `Project.owner` → `User._id`

2. **User → Issues (as Reporter)**
   - One user can report multiple issues
   - Reference: `Issue.reporter` → `User._id`

3. **User → Issues (as Assignee)**
   - One user can be assigned to multiple issues
   - Reference: `Issue.assignees` → `User._id`

4. **Project → Issues**
   - One project can have multiple issues
   - Reference: `Issue.project` → `Project._id`

5. **Project → Sprints**
   - One project can have multiple sprints
   - Reference: `Sprint.project` → `Project._id`

6. **Project → ProjectConfig**
   - One project has one configuration
   - Reference: `ProjectConfig.project` → `Project._id`

7. **Sprint → Issues**
   - One sprint can contain multiple issues
   - Reference: `Issue.sprint` → `Sprint._id`

8. **User → Notifications**
   - One user can have multiple notifications
   - Reference: `Notification.user` → `User._id`

9. **User → ActivityLogs (as Actor)**
   - One user can perform multiple activities
   - Reference: `ActivityLog.actor` → `User._id`

10. **Project → Costs**
    - One project can have multiple costs
    - Reference: `Cost.project` → `Project._id`

11. **Project → Budgets**
    - One project can have multiple budgets
    - Reference: `Budget.project` → `Project._id`

### Many-to-Many Relationships

1. **Users ↔ Projects (via Members)**
   - Many users can be members of many projects
   - Implemented via `Project.members` array with embedded documents

2. **Users ↔ Issues (via Assignees)**
   - Many users can be assigned to many issues
   - Implemented via `Issue.assignees` array

### Self-Referencing Relationships

1. **Issues → Issues (Parent-Child)**
   - One issue can have multiple child issues
   - One issue can have one parent issue
   - References: `Issue.parentIssue` → `Issue._id` and `Issue.childIssues` → `Issue._id`

---

## 📋 Field Constraints & Validation

### String Fields
- **Required fields**: `name`, `email`, `passwordHash`, `key`, `title`, `reporter`, `project`
- **Unique fields**: `email`, `key` (for users and issues)
- **Trimmed fields**: All string fields are trimmed of whitespace
- **Lowercase fields**: `email` is automatically converted to lowercase

### Enum Fields
- **User roles**: Dynamic via Role collection
- **Project member roles**: `admin`, `editor`, `assignee`
- **Issue types**: Dynamic via ProjectConfig
- **Issue statuses**: Dynamic via ProjectConfig with legacy support
- **Issue priorities**: Dynamic via ProjectConfig
- **Board types**: `scrum`, `kanban`
- **Notification types**: `issue_assigned`, `comment`, `status_change`, `mention`, `sprint_started`, `sprint_completed`, `deadline_approaching`
- **Cost categories**: `aws`, `lucid`, `tools`, `infrastructure`, `software`, `hardware`, `services`, `other`
- **Budget periods**: `monthly`, `quarterly`, `yearly`, `custom`
- **Budget statuses**: `draft`, `active`, `completed`, `cancelled`

### Numeric Fields
- **Story Points**: Default 0, used for sprint planning
- **Costs**: Amount fields with minimum value of 0
- **Budgets**: Amount fields with minimum value of 0
- **Timestamps**: Auto-generated `createdAt` and `updatedAt`

### Boolean Fields
- **User Active Status**: `isActive` (default: true)
- **Sprint Active Status**: `isActive` (default: false)
- **System Role**: `isSystem` (default: false)
- **Recurring Costs**: `isRecurring` (default: false)

### ObjectId Fields
- All relationship fields use `mongoose.Schema.Types.ObjectId`
- Proper indexing on all foreign key references
- Population support for related documents

---

## 🔍 Query Patterns

### Common Queries

1. **Get user's projects**:
   ```javascript
   Project.find({ owner: userId })
   Project.find({ 'members.user': userId })
   ```

2. **Get project issues**:
   ```javascript
   Issue.find({ project: projectId })
   ```

3. **Get user's assigned issues**:
   ```javascript
   Issue.find({ assignees: userId })
   ```

4. **Get active sprint**:
   ```javascript
   Sprint.findOne({ project: projectId, isActive: true })
   ```

5. **Get unread notifications**:
   ```javascript
   Notification.find({ user: userId, readAt: { $exists: false } })
   ```

6. **Get project activity**:
   ```javascript
   ActivityLog.find({ project: projectId }).sort({ createdAt: -1 })
   ```

7. **Get project costs**:
   ```javascript
   Cost.find({ project: projectId, startDate: { $gte: startDate, $lte: endDate } })
   ```

8. **Get project budgets**:
   ```javascript
   Budget.find({ project: projectId, status: 'active' })
   ```

---

## 🚀 Performance Considerations

### Indexes
- All foreign key references are indexed
- Unique fields have unique indexes
- Frequently queried fields have regular indexes
- Compound indexes for complex queries
- Text indexes for search functionality

### Data Types
- ObjectId references for relationships (efficient and consistent)
- Embedded documents for simple one-to-many relationships
- Flexible Object type for extensible data structures
- Map type for dynamic custom fields

### Validation
- Mongoose schema validation at application level
- Database-level constraints for unique fields
- Type casting and sanitization
- Custom validation rules in SystemConfig

---

## 📝 Schema Evolution

### Versioning Strategy
- New fields are added with default values
- Legacy enum values are preserved for backward compatibility
- Deprecated fields are marked but not removed immediately
- Custom fields provide extensibility without schema changes

### Migration Considerations
- Schema changes should be backward compatible
- New indexes should be created during low-traffic periods
- Data migration scripts should be tested thoroughly
- SystemConfig allows for dynamic configuration changes

---

## 🔧 Maintenance

### Regular Tasks
- Monitor index usage and performance
- Clean up old activity logs and notifications
- Archive completed sprints and projects
- Update statistics and analytics
- Review and optimize custom fields usage

### Monitoring
- Query performance metrics
- Index hit rates
- Collection sizes and growth rates
- Error rates and validation failures
- Custom field usage patterns

---

This schema provides a robust, flexible foundation for the SeedPlanner application with proper relationships, validation, performance considerations, and extensibility through custom fields and dynamic configuration.

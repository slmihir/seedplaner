# Parent-Child Functionality for Issues

This directory contains enhanced components for managing parent-child relationships between issues in your project management system.

## 🎯 Features

- **Subtask Management**: Create, edit, and manage subtasks with automatic key generation
- **Issue Linking**: Link issues with various relationship types (blocks, relates to, duplicates, etc.)
- **Hierarchy Display**: Visual representation of parent-child relationships
- **Enhanced UI**: Modern, intuitive interface for managing relationships
- **Real-time Updates**: Automatic refresh of data when relationships change

## 📁 Components

### 1. SubtaskManager
Manages subtasks for a parent issue with full CRUD operations.

```jsx
import { SubtaskManager } from './components/parent-child';

<SubtaskManager
  open={subtaskDialog.open}
  onClose={() => setSubtaskDialog({ open: false, issue: null })}
  parentIssue={issue}
  onSubtaskUpdate={handleUpdate}
/>
```

**Features:**
- Create new subtasks with automatic key generation (e.g., PROJ-123-1, PROJ-123-2)
- Edit existing subtasks
- Delete subtasks with confirmation
- View subtask details and status
- Assign estimates and priorities

### 2. IssueHierarchy
Displays the complete hierarchy of an issue (parent, children, linked issues).

```jsx
import { IssueHierarchy } from './components/parent-child';

<IssueHierarchy 
  issue={issue}
  onIssueClick={handleIssueClick}
/>
```

**Features:**
- Shows parent issue if exists
- Lists all child issues (subtasks)
- Displays linked issues with relationship types
- Expandable/collapsible view
- Click to navigate to related issues

### 3. EnhancedIssueLinking
Advanced issue linking with tabbed interface and better UX.

```jsx
import { EnhancedIssueLinking } from './components/parent-child';

<EnhancedIssueLinking
  open={linkingDialog.open}
  onClose={() => setLinkingDialog({ open: false, issue: null })}
  issue={issue}
  onLinkUpdate={handleUpdate}
/>
```

**Features:**
- Tabbed interface (Link Issues, Current Relationships, Manage Subtasks)
- Advanced search with filters
- Multiple relationship types
- Parent-child relationship management
- Visual relationship display

### 4. ParentChildIndicator
Small visual indicators showing relationship status.

```jsx
import { ParentChildIndicator } from './components/parent-child';

<ParentChildIndicator 
  issue={issue} 
  size="small" 
  showLabels={true} 
/>
```

**Features:**
- Shows parent relationship indicator
- Shows children count
- Shows linked issues count
- Subtask indicator
- Customizable size and labels

### 5. EnhancedIssueCard
Enhanced version of issue cards with parent-child support.

```jsx
import EnhancedIssueCard from '../components/EnhancedIssueCard';

<EnhancedIssueCard
  issue={issue}
  showEditButton={true}
  showDeleteButton={true}
  showLinkButton={true}
  showHierarchy={true}
  onEditClick={handleEdit}
  onDeleteClick={handleDelete}
  onLinkClick={handleLink}
  onIssueClick={handleIssueClick}
  currentUserId={user._id}
  users={users}
  projects={projects}
/>
```

## 🔧 API Integration

### Enhanced API Client

```jsx
import { parentChildApi, parentChildUtils } from '../api/enhanced-client';

// Create a subtask
const subtask = await parentChildApi.createSubtask({
  title: 'Implement login form',
  description: 'Create the login form component',
  parentIssueId: 'parent-issue-id',
  estimate: 4,
  priority: 'high'
});

// Get issue hierarchy
const hierarchy = await parentChildApi.getIssueHierarchy(issueId);

// Link issues
await parentChildApi.linkIssues({
  issueId: 'issue-1',
  targetIssueId: 'issue-2',
  linkType: 'blocks',
  parentChild: 'parent'
});

// Get subtasks
const subtasks = await parentChildApi.getSubtasks(parentIssueId);
```

### Utility Functions

```jsx
import { parentChildUtils } from '../api/enhanced-client';

// Check if issue can have children
const canHaveChildren = parentChildUtils.canHaveChildren(issue);

// Check if issue is a subtask
const isSubtask = parentChildUtils.isSubtask(issue);

// Get relationship display name
const displayName = parentChildUtils.getRelationshipDisplayName('blocks'); // "Blocks"

// Validate relationship
const validation = parentChildUtils.validateRelationship(parentIssue, childIssue);
```

## 🚀 Quick Start

### 1. Basic Integration

Add parent-child indicators to your existing issue cards:

```jsx
import { ParentChildIndicator } from './components/parent-child';

// In your issue card component
<ParentChildIndicator issue={issue} size="small" />
```

### 2. Add Linking Functionality

```jsx
import { EnhancedIssueLinking } from './components/parent-child';

const [linkingDialog, setLinkingDialog] = useState({ open: false, issue: null });

// Add button to your issue card
<Button onClick={() => setLinkingDialog({ open: true, issue })}>
  Link Issues
</Button>

// Add dialog to your component
<EnhancedIssueLinking
  open={linkingDialog.open}
  onClose={() => setLinkingDialog({ open: false, issue: null })}
  issue={linkingDialog.issue}
  onLinkUpdate={handleDataUpdate}
/>
```

### 3. Add Subtask Management

```jsx
import { SubtaskManager } from './components/parent-child';

const [subtaskDialog, setSubtaskDialog] = useState({ open: false, issue: null });

// Add button to your issue card
<Button onClick={() => setSubtaskDialog({ open: true, issue })}>
  Manage Subtasks
</Button>

// Add dialog to your component
<SubtaskManager
  open={subtaskDialog.open}
  onClose={() => setSubtaskDialog({ open: false, issue: null })}
  parentIssue={subtaskDialog.issue}
  onSubtaskUpdate={handleDataUpdate}
/>
```

## 🎨 Customization

### Styling

All components use Material-UI theming and can be customized:

```jsx
// Custom colors for relationship types
const customColors = {
  'blocks': 'error',
  'relates_to': 'primary',
  'duplicates': 'warning'
};

// Custom chip styling
<ParentChildIndicator 
  issue={issue}
  sx={{ 
    '& .MuiChip-root': { 
      fontSize: '0.7rem',
      height: 20 
    } 
  }}
/>
```

### Configuration

```jsx
// Custom relationship types
const customLinkTypes = [
  { value: 'depends_on', label: 'Depends on', description: 'This issue depends on the target' },
  { value: 'implements', label: 'Implements', description: 'This issue implements the target' }
];

// Custom issue types
const customIssueTypes = [
  { value: 'epic', label: 'Epic' },
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' }
];
```

## 🔄 Data Flow

1. **User Action**: User clicks "Link Issues" or "Manage Subtasks"
2. **Dialog Opens**: Enhanced dialog opens with current data
3. **API Call**: User performs action (create, update, delete)
4. **Backend Update**: Server updates database with new relationships
5. **UI Refresh**: Frontend refreshes to show updated data
6. **Event Notification**: Other components are notified of changes

## 🐛 Troubleshooting

### Common Issues

1. **Subtasks not showing**: Ensure the parent issue has `childIssues` array populated
2. **Linking not working**: Check that both issues exist and are in the same project
3. **Hierarchy not loading**: Verify the API endpoint `/issues/:id/hierarchy` is working
4. **Styling issues**: Ensure Material-UI theme is properly configured

### Debug Mode

Enable debug logging:

```jsx
// In your component
console.log('Issue data:', issue);
console.log('Hierarchy data:', hierarchy);
```

## 📚 Examples

See `IntegrationExample.jsx` for a complete working example of how to integrate all components.

## 🔮 Future Enhancements

- Drag-and-drop for moving subtasks between parents
- Bulk operations for subtasks
- Advanced filtering and search
- Relationship visualization with graphs
- Export/import of relationships
- Real-time collaboration features

## 🤝 Contributing

When adding new features:

1. Follow the existing component structure
2. Use Material-UI components consistently
3. Add proper TypeScript types
4. Include error handling
5. Add tests for new functionality
6. Update this documentation

## 📄 License

This functionality is part of the main project and follows the same license terms.

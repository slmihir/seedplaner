# Parent-Child Integration Guide

This guide shows you how to integrate the new parent-child functionality into your existing SeedPlanner application.

## 🎯 What's New

I've created a comprehensive parent-child system for your issues that includes:

1. **Subtask Management** - Create, edit, and manage subtasks
2. **Issue Linking** - Link issues with various relationship types
3. **Hierarchy Display** - Visual representation of relationships
4. **Enhanced UI** - Modern, intuitive interface
5. **Real-time Updates** - Automatic data refresh

## 📁 New Files Created

### Components
- `apps/frontend/src/components/parent-child/SubtaskManager.jsx` - Full subtask management
- `apps/frontend/src/components/parent-child/IssueHierarchy.jsx` - Hierarchy display
- `apps/frontend/src/components/parent-child/EnhancedIssueLinking.jsx` - Advanced linking
- `apps/frontend/src/components/parent-child/ParentChildIndicator.jsx` - Visual indicators
- `apps/frontend/src/components/EnhancedIssueCard.jsx` - Enhanced issue card

### API
- `apps/frontend/src/api/enhanced-client.js` - Enhanced API client with parent-child methods

### Pages
- `apps/frontend/src/pages/EnhancedBoard.jsx` - Enhanced board with parent-child features

### Documentation
- `apps/frontend/src/components/parent-child/README.md` - Complete documentation
- `apps/frontend/src/components/parent-child/IntegrationExample.jsx` - Working example

## 🚀 Quick Integration Steps

### Step 1: Update Your Issue Cards

Replace your existing `IssueCard` imports with the enhanced version:

```jsx
// OLD
import IssueCard from '../components/IssueCard';

// NEW
import EnhancedIssueCard from '../components/EnhancedIssueCard';
// OR
import { ParentChildIndicator } from '../components/parent-child';
```

### Step 2: Add Parent-Child Indicators

Add visual indicators to show relationships:

```jsx
import { ParentChildIndicator } from '../components/parent-child';

// In your issue card component
<ParentChildIndicator issue={issue} size="small" showLabels={true} />
```

### Step 3: Add Linking Functionality

Add issue linking to your existing components:

```jsx
import { EnhancedIssueLinking } from '../components/parent-child';

const [linkingDialog, setLinkingDialog] = useState({ open: false, issue: null });

// Add button
<Button onClick={() => setLinkingDialog({ open: true, issue })}>
  Link Issues
</Button>

// Add dialog
<EnhancedIssueLinking
  open={linkingDialog.open}
  onClose={() => setLinkingDialog({ open: false, issue: null })}
  issue={linkingDialog.issue}
  onLinkUpdate={handleDataUpdate}
/>
```

### Step 4: Add Subtask Management

```jsx
import { SubtaskManager } from '../components/parent-child';

const [subtaskDialog, setSubtaskDialog] = useState({ open: false, issue: null });

// Add button
<Button onClick={() => setSubtaskDialog({ open: true, issue })}>
  Manage Subtasks
</Button>

// Add dialog
<SubtaskManager
  open={subtaskDialog.open}
  onClose={() => setSubtaskDialog({ open: false, issue: null })}
  parentIssue={subtaskDialog.issue}
  onSubtaskUpdate={handleDataUpdate}
/>
```

### Step 5: Use Enhanced API

```jsx
import { parentChildApi } from '../api/enhanced-client';

// Create subtask
const subtask = await parentChildApi.createSubtask({
  title: 'Implement login form',
  parentIssueId: issue._id,
  estimate: 4
});

// Get hierarchy
const hierarchy = await parentChildApi.getIssueHierarchy(issue._id);
```

## 🔄 Update Your Existing Components

### Board.jsx
Replace with `EnhancedBoard.jsx` or add parent-child features to your existing board:

```jsx
// Add to your existing Board component
import { ParentChildIndicator } from '../components/parent-child';

// In your issue card rendering
<ParentChildIndicator issue={issue} size="small" />
```

### IssuesTable.jsx
Add parent-child indicators to your table:

```jsx
import { ParentChildIndicator } from '../components/parent-child';

// In your table cell
<ParentChildIndicator issue={issue} size="small" />
```

### SprintBoard.jsx
Add subtask management to sprint boards:

```jsx
import { SubtaskManager } from '../components/parent-child';

// Add subtask management button
<Button onClick={() => setSubtaskDialog({ open: true, issue })}>
  Manage Subtasks
</Button>
```

## 🎨 Visual Features

### Parent-Child Indicators
- 🔗 **Parent Icon**: Shows when issue has a parent
- 📋 **Subtask Icon**: Shows when issue is a subtask
- 👶 **Children Count**: Shows number of child issues
- 🔗 **Links Count**: Shows number of linked issues

### Enhanced Dialogs
- **Tabbed Interface**: Organized into Link Issues, Relationships, and Subtasks
- **Advanced Search**: Filter by issue type and search by title
- **Visual Relationships**: Clear display of all relationships
- **Bulk Operations**: Manage multiple subtasks at once

## 🔧 Backend Requirements

Make sure your backend supports these endpoints:

```javascript
// Required API endpoints
POST /issues/subtask          // Create subtask
GET  /issues/:id/hierarchy    // Get issue hierarchy
POST /issues/link             // Link issues
POST /issues/unlink           // Unlink issues
PATCH /issues/:id             // Update issue
DELETE /issues/:id            // Delete issue
```

## 📊 Data Structure

Your issues should have these fields:

```javascript
{
  _id: "issue-id",
  key: "PROJ-123",
  title: "Issue title",
  type: "story|task|bug|subtask",
  parentIssue: "parent-issue-id", // or null
  childIssues: ["child-1", "child-2"], // array of child IDs
  linkedIssues: [
    {
      issue: "linked-issue-id",
      linkType: "blocks|relates_to|duplicates"
    }
  ]
}
```

## 🎯 Key Benefits

1. **Better Organization**: Break down large issues into manageable subtasks
2. **Clear Relationships**: Visual indicators show how issues relate to each other
3. **Improved Workflow**: Link related issues and track dependencies
4. **Enhanced UX**: Modern, intuitive interface for managing relationships
5. **Real-time Updates**: Changes are reflected immediately across all views

## 🔍 Testing

Test the integration by:

1. Creating a new issue
2. Adding subtasks to it
3. Linking it to other issues
4. Verifying the visual indicators appear
5. Checking that relationships persist after page refresh

## 🚨 Important Notes

- The parent-child functionality is **additive** - it won't break your existing features
- All new components are **optional** - you can integrate them gradually
- The enhanced API client is **backward compatible** with your existing API
- Visual indicators are **non-intrusive** - they only show when relationships exist

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your backend API endpoints are working
3. Ensure your issue data has the required fields
4. Check the component documentation in the README files

## 🎉 Next Steps

1. **Start Small**: Add `ParentChildIndicator` to your existing issue cards
2. **Add Linking**: Integrate `EnhancedIssueLinking` for issue relationships
3. **Manage Subtasks**: Use `SubtaskManager` for breaking down large issues
4. **Show Hierarchy**: Add `IssueHierarchy` to display relationships
5. **Go Full Enhanced**: Replace your board with `EnhancedBoard` for the complete experience

The parent-child system is designed to enhance your existing workflow without disrupting it. Start with the visual indicators and gradually add more features as needed!

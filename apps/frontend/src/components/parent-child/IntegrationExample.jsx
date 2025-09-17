/**
 * Integration Example Component
 * Shows how to integrate parent-child functionality into existing pages
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert
} from '@mui/material';
import {
  List as SubTaskIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { EnhancedIssueLinking, SubtaskManager, IssueHierarchy, ParentChildIndicator } from './index';
import { parentChildApi, parentChildUtils } from '../../api/enhanced-client';

const IntegrationExample = () => {
  const [linkingDialog, setLinkingDialog] = useState({ open: false, issue: null });
  const [subtaskDialog, setSubtaskDialog] = useState({ open: false, issue: null });
  const [hierarchyExpanded, setHierarchyExpanded] = useState(false);

  // Example issue data
  const exampleIssue = {
    _id: 'example-issue-1',
    key: 'PROJ-123',
    title: 'Implement user authentication',
    type: 'story',
    status: 'development',
    priority: 'high',
    description: 'Add secure user authentication with JWT tokens',
    parentIssue: null,
    childIssues: ['subtask-1', 'subtask-2'],
    linkedIssues: [
      { issue: 'issue-2', linkType: 'blocks' },
      { issue: 'issue-3', linkType: 'relates_to' }
    ]
  };

  const handleLinkClick = (issue) => {
    setLinkingDialog({ open: true, issue });
  };

  const handleSubtaskClick = (issue) => {
    setSubtaskDialog({ open: true, issue });
  };

  const handleLinkUpdate = () => {
    console.log('Relationships updated, refreshing data...');
    // In a real app, you would refresh your data here
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Parent-Child Integration Example
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This example shows how to integrate the parent-child functionality into your existing components.
      </Alert>

      {/* Example Issue Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Example Issue Card with Parent-Child Features
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {exampleIssue.key}: {exampleIssue.title}
            </Typography>
            
            {/* Parent-Child Indicators */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <ParentChildIndicator issue={exampleIssue} showLabels={true} />
            </Box>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={exampleIssue.type} color="primary" variant="outlined" />
              <Chip label={exampleIssue.status} color="secondary" variant="outlined" />
              <Chip label={exampleIssue.priority} color="error" variant="outlined" />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {exampleIssue.description}
            </Typography>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => handleLinkClick(exampleIssue)}
                size="small"
              >
                Link Issues
              </Button>
              <Button
                variant="outlined"
                startIcon={<SubTaskIcon />}
                onClick={() => handleSubtaskClick(exampleIssue)}
                size="small"
              >
                Manage Subtasks
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExpandMoreIcon />}
                onClick={() => setHierarchyExpanded(!hierarchyExpanded)}
                size="small"
              >
                {hierarchyExpanded ? 'Hide' : 'Show'} Hierarchy
              </Button>
            </Stack>
          </Box>

          {/* Issue Hierarchy */}
          {hierarchyExpanded && (
            <Box sx={{ mt: 2 }}>
              <IssueHierarchy 
                issue={exampleIssue}
                onIssueClick={(issue) => console.log('Issue clicked:', issue)}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Integration Instructions
          </Typography>
          
          <Typography variant="body2" paragraph>
            To integrate parent-child functionality into your existing components:
          </Typography>

          <Box component="ol" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2" paragraph>
                <strong>Import the components:</strong>
                <br />
                <code>
                  import {`{ EnhancedIssueLinking, SubtaskManager, IssueHierarchy, ParentChildIndicator }`} from './components/parent-child';
                </code>
              </Typography>
            </li>

            <li>
              <Typography variant="body2" paragraph>
                <strong>Add ParentChildIndicator to your issue cards:</strong>
                <br />
                <code>
                  {`<ParentChildIndicator issue={issue} size="small" showLabels={true} />`}
                </code>
              </Typography>
            </li>

            <li>
              <Typography variant="body2" paragraph>
                <strong>Add linking functionality:</strong>
                <br />
                <code>
                  {`<Button onClick={() => setLinkingDialog({ open: true, issue })}>
                    Link Issues
                  </Button>`}
                </code>
              </Typography>
            </li>

            <li>
              <Typography variant="body2" paragraph>
                <strong>Add subtask management:</strong>
                <br />
                <code>
                  {`<Button onClick={() => setSubtaskDialog({ open: true, issue })}>
                    Manage Subtasks
                  </Button>`}
                </code>
              </Typography>
            </li>

            <li>
              <Typography variant="body2" paragraph>
                <strong>Include the dialogs in your component:</strong>
                <br />
                <code>
                  {`<EnhancedIssueLinking
                    open={linkingDialog.open}
                    onClose={() => setLinkingDialog({ open: false, issue: null })}
                    issue={linkingDialog.issue}
                    onLinkUpdate={handleLinkUpdate}
                  />`}
                </code>
              </Typography>
            </li>

            <li>
              <Typography variant="body2" paragraph>
                <strong>Use the enhanced API client:</strong>
                <br />
                <code>
                  import {`{ parentChildApi }`} from '../api/enhanced-client';
                  <br />
                  const subtasks = await parentChildApi.getSubtasks(issueId);
                </code>
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Issue Linking Dialog */}
      <EnhancedIssueLinking
        open={linkingDialog.open}
        onClose={() => setLinkingDialog({ open: false, issue: null })}
        issue={linkingDialog.issue}
        onLinkUpdate={handleLinkUpdate}
      />

      {/* Subtask Manager Dialog */}
      <SubtaskManager
        open={subtaskDialog.open}
        onClose={() => setSubtaskDialog({ open: false, issue: null })}
        parentIssue={subtaskDialog.issue}
        onSubtaskUpdate={handleLinkUpdate}
      />
    </Box>
  );
};

export default IntegrationExample;

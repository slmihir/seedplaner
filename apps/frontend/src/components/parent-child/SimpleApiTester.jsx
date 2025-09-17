/**
 * Simple API Tester for Subtask Endpoints
 * Test real API endpoints without hardcoded data
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { parentChildApi } from '../../api/enhanced-client';
import api from '../../api/client';

const SimpleApiTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);

  // Form data
  const [testData, setTestData] = useState({
    issueId: '',
    parentIssueId: '',
    targetIssueId: '',
    title: 'Test Subtask',
    description: 'Test subtask description',
    linkType: 'relates_to',
    parentChild: '',
    assignees: ''
  });

  const loadIssues = async () => {
    try {
      const response = await api.get('/issues');
      setIssues(response.data.issues || []);
    } catch (err) {
      setError('Failed to load issues: ' + err.message);
    }
  };

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await testFunction();
      setResult({ test: testName, success: true, data: response });
    } catch (err) {
      setError({ test: testName, error: err.message, response: err.response?.data });
    } finally {
      setLoading(false);
    }
  };

  // Test Functions
  const testCreateSubtask = async () => {
    if (!testData.parentIssueId) throw new Error('Please select a parent issue');
    
    return await parentChildApi.createSubtask({
      title: testData.title,
      description: testData.description,
      parentIssueId: testData.parentIssueId,
      assignees: testData.assignees
    });
  };

  const testGetHierarchy = async () => {
    if (!testData.issueId) throw new Error('Please select an issue');
    return await parentChildApi.getIssueHierarchy(testData.issueId);
  };

  const testLinkIssues = async () => {
    if (!testData.issueId || !testData.targetIssueId) {
      throw new Error('Please select both source and target issues');
    }
    
    return await parentChildApi.linkIssues({
      issueId: testData.issueId,
      targetIssueId: testData.targetIssueId,
      linkType: testData.linkType,
      parentChild: testData.parentChild
    });
  };

  const testGetSubtasks = async () => {
    if (!testData.parentIssueId) throw new Error('Please select a parent issue');
    return await parentChildApi.getSubtasks(testData.parentIssueId);
  };

  const testUnlinkIssues = async () => {
    if (!testData.issueId || !testData.targetIssueId) {
      throw new Error('Please select both source and target issues');
    }
    
    return await parentChildApi.unlinkIssues({
      issueId: testData.issueId,
      targetIssueId: testData.targetIssueId
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Subtask API Endpoint Tester
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Test real API endpoints for subtask and parent-child functionality
      </Typography>

      <Button 
        variant="outlined" 
        onClick={loadIssues} 
        sx={{ mb: 2 }}
      >
        Load Issues
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{error.test} Failed</Typography>
          <Typography variant="body2">{error.error}</Typography>
          {error.response && (
            <pre style={{ fontSize: '0.8rem', marginTop: 8 }}>
              {JSON.stringify(error.response, null, 2)}
            </pre>
          )}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{result.test} Success</Typography>
          <pre style={{ fontSize: '0.8rem', marginTop: 8 }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Configuration
          </Typography>
          
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Select Issue (for hierarchy/linking tests)</InputLabel>
              <Select
                value={testData.issueId}
                onChange={(e) => setTestData({ ...testData, issueId: e.target.value })}
                label="Select Issue (for hierarchy/linking tests)"
              >
                {issues.map((issue) => (
                  <MenuItem key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Parent Issue (for subtask tests)</InputLabel>
              <Select
                value={testData.parentIssueId}
                onChange={(e) => setTestData({ ...testData, parentIssueId: e.target.value })}
                label="Select Parent Issue (for subtask tests)"
              >
                {issues.map((issue) => (
                  <MenuItem key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Target Issue (for linking tests)</InputLabel>
              <Select
                value={testData.targetIssueId}
                onChange={(e) => setTestData({ ...testData, targetIssueId: e.target.value })}
                label="Select Target Issue (for linking tests)"
              >
                {issues.filter(i => i._id !== testData.issueId).map((issue) => (
                  <MenuItem key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subtask Title"
              value={testData.title}
              onChange={(e) => setTestData({ ...testData, title: e.target.value })}
            />

            <TextField
              fullWidth
              label="Subtask Description"
              value={testData.description}
              onChange={(e) => setTestData({ ...testData, description: e.target.value })}
              multiline
              rows={2}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Link Type</InputLabel>
                <Select
                  value={testData.linkType}
                  onChange={(e) => setTestData({ ...testData, linkType: e.target.value })}
                  label="Link Type"
                >
                  <MenuItem value="relates_to">Relates to</MenuItem>
                  <MenuItem value="blocks">Blocks</MenuItem>
                  <MenuItem value="is_blocked_by">Is blocked by</MenuItem>
                  <MenuItem value="duplicates">Duplicates</MenuItem>
                  <MenuItem value="is_duplicated_by">Is duplicated by</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Parent-Child</InputLabel>
                <Select
                  value={testData.parentChild}
                  onChange={(e) => setTestData({ ...testData, parentChild: e.target.value })}
                  label="Parent-Child"
                >
                  <MenuItem value="">General Link</MenuItem>
                  <MenuItem value="parent">Make Parent</MenuItem>
                  <MenuItem value="child">Make Child</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Assignees (comma-separated user IDs)"
              value={testData.assignees}
              onChange={(e) => setTestData({ ...testData, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              helperText="Optional: only project members are allowed"
            />
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        API Endpoint Tests
      </Typography>

      <Stack spacing={2}>
        <Button
          variant="contained"
          onClick={() => runTest('Create Subtask', testCreateSubtask)}
          disabled={loading || !testData.parentIssueId}
          startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        >
          Test Create Subtask
        </Button>

        <Button
          variant="outlined"
          onClick={() => runTest('Get Issue Hierarchy', testGetHierarchy)}
          disabled={loading || !testData.issueId}
          startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        >
          Test Get Hierarchy
        </Button>

        <Button
          variant="outlined"
          onClick={() => runTest('Get Subtasks', testGetSubtasks)}
          disabled={loading || !testData.parentIssueId}
          startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        >
          Test Get Subtasks
        </Button>

        <Button
          variant="outlined"
          onClick={() => runTest('Link Issues', testLinkIssues)}
          disabled={loading || !testData.issueId || !testData.targetIssueId}
          startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        >
          Test Link Issues
        </Button>

        <Button
          variant="outlined"
          color="warning"
          onClick={() => runTest('Unlink Issues', testUnlinkIssues)}
          disabled={loading || !testData.issueId || !testData.targetIssueId}
          startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
        >
          Test Unlink Issues
        </Button>
      </Stack>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Available Endpoints:
        </Typography>
        <Stack spacing={1}>
          <Chip label="POST /issues/subtask" size="small" />
          <Chip label="GET /issues/:id/hierarchy" size="small" />
          <Chip label="POST /issues/link" size="small" />
          <Chip label="POST /issues/unlink" size="small" />
          <Chip label="GET /issues?parentIssue=:id" size="small" />
        </Stack>
      </Box>
    </Box>
  );
};

export default SimpleApiTester;

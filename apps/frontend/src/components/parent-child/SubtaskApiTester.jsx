/**
 * Subtask API Tester Component
 * Comprehensive testing interface for all subtask and parent-child API endpoints
 */

import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { parentChildApi, parentChildUtils } from '../../api/enhanced-client';
import api from '../../api/client';

const SubtaskApiTester = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form data for creating subtasks
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    description: '',
    estimate: '',
    priority: 'medium',
    status: 'backlog'
  });

  // Form data for linking issues
  const [linkForm, setLinkForm] = useState({
    targetIssueId: '',
    linkType: 'relates_to',
    parentChild: ''
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const response = await api.get('/issues');
      setIssues(response.data.issues || []);
    } catch (err) {
      setError('Failed to load issues: ' + err.message);
    }
  };

  const loadSubtasks = async (issueId) => {
    try {
      const response = await parentChildApi.getSubtasks(issueId);
      setSubtasks(response.issues || []);
    } catch (err) {
      setError('Failed to load subtasks: ' + err.message);
    }
  };

  const loadHierarchy = async (issueId) => {
    try {
      const response = await parentChildApi.getIssueHierarchy(issueId);
      setHierarchy(response.hierarchy);
    } catch (err) {
      setError('Failed to load hierarchy: ' + err.message);
    }
  };

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, result, timestamp: new Date().toISOString() }
      }));
      setSuccess(`${testName} completed successfully!`);
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: err.message, timestamp: new Date().toISOString() }
      }));
      setError(`${testName} failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test Functions
  const testCreateSubtask = async () => {
    if (!selectedIssue) throw new Error('Please select an issue first');
    if (!subtaskForm.title) throw new Error('Please enter a subtask title');

    const result = await parentChildApi.createSubtask({
      title: subtaskForm.title,
      description: subtaskForm.description,
      parentIssueId: selectedIssue._id,
      estimate: subtaskForm.estimate ? parseInt(subtaskForm.estimate) : undefined,
      priority: subtaskForm.priority,
      status: subtaskForm.status
    });

    // Refresh data
    await loadSubtasks(selectedIssue._id);
    await loadHierarchy(selectedIssue._id);
    
    return result;
  };

  const testGetHierarchy = async () => {
    if (!selectedIssue) throw new Error('Please select an issue first');
    return await parentChildApi.getIssueHierarchy(selectedIssue._id);
  };

  const testLinkIssues = async () => {
    if (!selectedIssue) throw new Error('Please select a source issue first');
    if (!linkForm.targetIssueId) throw new Error('Please select a target issue');

    const result = await parentChildApi.linkIssues({
      issueId: selectedIssue._id,
      targetIssueId: linkForm.targetIssueId,
      linkType: linkForm.linkType,
      parentChild: linkForm.parentChild
    });

    // Refresh data
    await loadHierarchy(selectedIssue._id);
    
    return result;
  };

  const testGetSubtasks = async () => {
    if (!selectedIssue) throw new Error('Please select an issue first');
    return await parentChildApi.getSubtasks(selectedIssue._id);
  };

  const testUpdateIssue = async () => {
    if (!selectedIssue) throw new Error('Please select an issue first');
    
    const result = await parentChildApi.updateIssue(selectedIssue._id, {
      title: selectedIssue.title + ' (Updated)',
      description: selectedIssue.description + ' - Updated via API test'
    });

    // Refresh data
    await loadIssues();
    
    return result;
  };

  const testDeleteSubtask = async (subtaskId) => {
    const result = await parentChildApi.deleteIssue(subtaskId);
    
    // Refresh data
    if (selectedIssue) {
      await loadSubtasks(selectedIssue._id);
      await loadHierarchy(selectedIssue._id);
    }
    
    return result;
  };

  const handleCreateSubtask = async () => {
    await runTest('Create Subtask', testCreateSubtask);
    setSubtaskForm({ title: '', description: '', estimate: '', priority: 'medium', status: 'backlog' });
  };

  const handleLinkIssues = async () => {
    await runTest('Link Issues', testLinkIssues);
  };

  const getTestResultIcon = (testName) => {
    const result = testResults[testName];
    if (!result) return null;
    return result.success ? <SuccessIcon color="success" /> : <ErrorIcon color="error" />;
  };

  const getTestResultColor = (testName) => {
    const result = testResults[testName];
    if (!result) return 'default';
    return result.success ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subtask API Tester
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test all subtask and parent-child API endpoints with real data
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Issue Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Issue
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Choose an Issue</InputLabel>
                <Select
                  value={selectedIssue?._id || ''}
                  onChange={(e) => {
                    const issue = issues.find(i => i._id === e.target.value);
                    setSelectedIssue(issue);
                    if (issue) {
                      loadSubtasks(issue._id);
                      loadHierarchy(issue._id);
                    }
                  }}
                  label="Choose an Issue"
                >
                  {issues.map((issue) => (
                    <MenuItem key={issue._id} value={issue._id}>
                      {issue.key} - {issue.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedIssue && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Issue Details:
                  </Typography>
                  <Stack spacing={1}>
                    <Chip label={`Key: ${selectedIssue.key}`} size="small" />
                    <Chip label={`Type: ${selectedIssue.type}`} size="small" />
                    <Chip label={`Status: ${selectedIssue.status}`} size="small" />
                    <Chip label={`Priority: ${selectedIssue.priority}`} size="small" />
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Test Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              <Stack spacing={1}>
                {Object.entries(testResults).map(([testName, result]) => (
                  <Box key={testName} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTestResultIcon(testName)}
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {testName}
                    </Typography>
                    <Chip 
                      label={result.success ? 'Success' : 'Failed'} 
                      size="small" 
                      color={getTestResultColor(testName)}
                    />
                  </Box>
                ))}
              </Stack>

              {Object.keys(testResults).length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No tests run yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Subtask Management */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Subtask Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Create Subtask
                    </Typography>
                    
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={subtaskForm.title}
                        onChange={(e) => setSubtaskForm({ ...subtaskForm, title: e.target.value })}
                        required
                      />
                      
                      <TextField
                        fullWidth
                        label="Description"
                        value={subtaskForm.description}
                        onChange={(e) => setSubtaskForm({ ...subtaskForm, description: e.target.value })}
                        multiline
                        rows={2}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Estimate (hours)"
                          type="number"
                          value={subtaskForm.estimate}
                          onChange={(e) => setSubtaskForm({ ...subtaskForm, estimate: e.target.value })}
                          sx={{ flex: 1 }}
                        />
                        
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={subtaskForm.priority}
                            onChange={(e) => setSubtaskForm({ ...subtaskForm, priority: e.target.value })}
                            label="Priority"
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="critical">Critical</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      
                      <Button
                        variant="contained"
                        onClick={handleCreateSubtask}
                        disabled={loading || !selectedIssue || !subtaskForm.title}
                        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                      >
                        Create Subtask
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Existing Subtasks
                    </Typography>
                    
                    {subtasks.length > 0 ? (
                      <List dense>
                        {subtasks.map((subtask) => (
                          <ListItem key={subtask._id} divider>
                            <ListItemText
                              primary={`${subtask.key} - ${subtask.title}`}
                              secondary={`${subtask.status} • ${subtask.priority}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => runTest('Delete Subtask', () => testDeleteSubtask(subtask._id))}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No subtasks found
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Issue Linking */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Issue Linking</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Link Issues
                    </Typography>
                    
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Target Issue</InputLabel>
                        <Select
                          value={linkForm.targetIssueId}
                          onChange={(e) => setLinkForm({ ...linkForm, targetIssueId: e.target.value })}
                          label="Target Issue"
                        >
                          {issues.filter(i => i._id !== selectedIssue?._id).map((issue) => (
                            <MenuItem key={issue._id} value={issue._id}>
                              {issue.key} - {issue.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Link Type</InputLabel>
                        <Select
                          value={linkForm.linkType}
                          onChange={(e) => setLinkForm({ ...linkForm, linkType: e.target.value })}
                          label="Link Type"
                        >
                          <MenuItem value="relates_to">Relates to</MenuItem>
                          <MenuItem value="blocks">Blocks</MenuItem>
                          <MenuItem value="is_blocked_by">Is blocked by</MenuItem>
                          <MenuItem value="duplicates">Duplicates</MenuItem>
                          <MenuItem value="is_duplicated_by">Is duplicated by</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Relationship</InputLabel>
                        <Select
                          value={linkForm.parentChild}
                          onChange={(e) => setLinkForm({ ...linkForm, parentChild: e.target.value })}
                          label="Relationship"
                        >
                          <MenuItem value="">General Link</MenuItem>
                          <MenuItem value="parent">Make Parent</MenuItem>
                          <MenuItem value="child">Make Child</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Button
                        variant="contained"
                        onClick={handleLinkIssues}
                        disabled={loading || !selectedIssue || !linkForm.targetIssueId}
                        startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
                      >
                        Link Issues
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Issue Hierarchy
                    </Typography>
                    
                    {hierarchy ? (
                      <Box>
                        {hierarchy.parent && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary">
                              Parent: {hierarchy.parent.key} - {hierarchy.parent.title}
                            </Typography>
                          </Box>
                        )}
                        
                        {hierarchy.children && hierarchy.children.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="secondary">
                              Children ({hierarchy.children.length}):
                            </Typography>
                            {hierarchy.children.map((child) => (
                              <Chip
                                key={child._id}
                                label={`${child.key} - ${child.title}`}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                        
                        {hierarchy.linked && hierarchy.linked.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2">
                              Linked Issues ({hierarchy.linked.length}):
                            </Typography>
                            {hierarchy.linked.map((link) => (
                              <Chip
                                key={link.issue._id}
                                label={`${link.issue.key} (${link.linkType})`}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                        
                        {!hierarchy.parent && (!hierarchy.children || hierarchy.children.length === 0) && (!hierarchy.linked || hierarchy.linked.length === 0) && (
                          <Typography variant="body2" color="text.secondary">
                            No relationships found
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Select an issue to view hierarchy
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* API Tests */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">API Endpoint Tests</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => runTest('Get Hierarchy', testGetHierarchy)}
                  disabled={loading || !selectedIssue}
                  startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  Test Get Hierarchy
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => runTest('Get Subtasks', testGetSubtasks)}
                  disabled={loading || !selectedIssue}
                  startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  Test Get Subtasks
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => runTest('Update Issue', testUpdateIssue)}
                  disabled={loading || !selectedIssue}
                  startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
                >
                  Test Update Issue
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={loadIssues}
                  startIcon={<RefreshIcon />}
                >
                  Refresh Issues
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubtaskApiTester;

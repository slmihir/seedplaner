import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  GitHub,
  Settings,
  Webhook,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  Assessment,
  Link,
  Code,
  Merge,
  BugReport,
  Assignment,
  TaskAlt
} from '@mui/icons-material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import api from '../api/client';

const GitHubIntegration = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [integration, setIntegration] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);
  
  // Dialog states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  
  // Form states
  const [configForm, setConfigForm] = useState({
    repository: {
      owner: '',
      name: '',
      fullName: ''
    },
    accessToken: '',
    workflowMappings: [
      {
        issueType: 'bug',
        githubStatusMappings: [
          { githubEvent: 'pull_request', githubStatus: 'opened', projectStatus: 'in_progress' },
          { githubEvent: 'pull_request', githubStatus: 'merged', projectStatus: 'done' }
        ],
        branchMappings: [
          { branchPattern: 'bugfix/*', issueType: 'bug' }
        ]
      }
    ],
    autoTransition: {
      enabled: true,
      onPullRequestOpen: true,
      onPullRequestMerged: true,
      onIssueClosed: true,
      onReviewApproved: false
    }
  });

  const issueTypeIcons = {
    bug: <BugReport />,
    story: <Assignment />,
    task: <Assignment />,
    subtask: <TaskAlt />
  };

  useEffect(() => {
    if (projectId) {
      loadIntegration();
      loadWebhooks();
      loadStats();
    }
  }, [projectId]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/github/integration/${projectId}`);
      setIntegration(response.data.integration);
    } catch (error) {
      if (error.response?.status !== 404) {
        setError(error.response?.data?.message || 'Failed to load GitHub integration');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await api.get(`/github/webhooks/${projectId}?limit=20`);
      setWebhooks(response.data.webhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/github/stats/${projectId}`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleConfigSubmit = async () => {
    try {
      setError(null);
      
      if (!configForm.repository.owner || !configForm.repository.name) {
        setError('Repository owner and name are required');
        return;
      }

      if (!configForm.accessToken) {
        setError('GitHub access token is required');
        return;
      }

      const response = await api.post(`/github/integration/${projectId}`, configForm);
      setIntegration(response.data.integration);
      setConfigDialogOpen(false);
      loadStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to configure GitHub integration');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      
      const response = await api.post(`/github/test-connection/${projectId}`);
      
      if (response.data.repository) {
        setError(null);
        // Connection successful
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteIntegration = async () => {
    if (window.confirm('Are you sure you want to delete the GitHub integration?')) {
      try {
        await api.delete(`/github/integration/${projectId}`);
        setIntegration(null);
        setWebhooks([]);
        setStats(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete integration');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'warning';
      case 'ignored': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'processing': return <CircularProgress size={16} />;
      case 'ignored': return <Warning />;
      default: return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading GitHub integration...</Typography>
      </Box>
    );
  }

  if (!integration) {
    return (
      <Box textAlign="center" py={4}>
        <GitHub sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          GitHub Integration Not Configured
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Connect your GitHub repository to enable automated workflow transitions and issue synchronization.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setConfigDialogOpen(true)}
          startIcon={<GitHub />}
          sx={{ mt: 2 }}
        >
          Configure GitHub Integration
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GitHub sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              GitHub Integration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {integration.repository.fullName}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={testing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleTestConnection}
            disabled={testing}
          >
            Test Connection
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Configure
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteIntegration}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={integration.isActive ? 'Active' : 'Inactive'}
                  color={integration.isActive ? 'success' : 'default'}
                  icon={<CheckCircle />}
                />
                <Typography variant="h6">
                  {integration.syncStatus || 'Unknown'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats?.webhooks?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Webhooks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {stats?.webhooks?.successful || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {stats?.webhooks?.failed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Configuration" />
          <Tab label="Workflow Mappings" />
          <Tab label="Webhook Events" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Repository Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Repository</Typography>
                    <Typography variant="body1">{integration.repository.fullName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Webhook URL</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {integration.webhookUrl}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Last Sync</Typography>
                    <Typography variant="body1">
                      {integration.lastSyncAt ? formatDate(integration.lastSyncAt) : 'Never'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Automation Settings
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={<Switch checked={integration.autoTransition.enabled} disabled />}
                    label="Enable Auto-Transition"
                  />
                  <FormControlLabel
                    control={<Switch checked={integration.autoTransition.onPullRequestOpen} disabled />}
                    label="On Pull Request Open"
                  />
                  <FormControlLabel
                    control={<Switch checked={integration.autoTransition.onPullRequestMerged} disabled />}
                    label="On Pull Request Merged"
                  />
                  <FormControlLabel
                    control={<Switch checked={integration.autoTransition.onIssueClosed} disabled />}
                    label="On Issue Closed"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Mappings
            </Typography>
            {integration.workflowMappings.map((mapping, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    {issueTypeIcons[mapping.issueType]}
                    <Typography variant="subtitle1">
                      {mapping.issueType.charAt(0).toUpperCase() + mapping.issueType.slice(1)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" gutterBottom>
                    GitHub Status Mappings:
                  </Typography>
                  <List dense>
                    {mapping.githubStatusMappings.map((statusMapping, statusIndex) => (
                      <ListItem key={statusIndex}>
                        <ListItemText
                          primary={`${statusMapping.githubEvent} → ${statusMapping.githubStatus}`}
                          secondary={`Project Status: ${statusMapping.projectStatus}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Recent Webhook Events
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadWebhooks}
              >
                Refresh
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Repository</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook._id}>
                      <TableCell>
                        <Chip
                          label={webhook.eventType}
                          size="small"
                          icon={getStatusIcon(webhook.status)}
                        />
                      </TableCell>
                      <TableCell>{webhook.action}</TableCell>
                      <TableCell>{webhook.repository?.fullName}</TableCell>
                      <TableCell>
                        <Chip
                          label={webhook.status}
                          color={getStatusColor(webhook.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(webhook.receivedAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Webhook Statistics
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Total Events:</Typography>
                    <Typography variant="h6">{stats.webhooks.total}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Successful:</Typography>
                    <Typography variant="h6" color="success.main">
                      {stats.webhooks.successful}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Failed:</Typography>
                    <Typography variant="h6" color="error.main">
                      {stats.webhooks.failed}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Success Rate:</Typography>
                    <Typography variant="h6" color="primary.main">
                      {stats.webhooks.successRate}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List dense>
                  {stats.recentActivity.map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${activity.eventType}:${activity.action}`}
                        secondary={formatDate(activity.receivedAt)}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={activity.status}
                          color={getStatusColor(activity.status)}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure GitHub Integration</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Repository Owner"
                value={configForm.repository.owner}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  repository: { ...configForm.repository, owner: e.target.value }
                })}
                placeholder="e.g., microsoft"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Repository Name"
                value={configForm.repository.name}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  repository: { ...configForm.repository, name: e.target.value }
                })}
                placeholder="e.g., vscode"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GitHub Access Token"
                type="password"
                value={configForm.accessToken}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  accessToken: e.target.value
                })}
                helperText="Personal access token with repo permissions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfigSubmit} variant="contained">
            Configure
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GitHubIntegration;

/**
 * Enhanced Issue Linking Component
 * Improved version of the existing IssueLinking with better UX
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Add as AddIcon,
  List as SubTaskIcon,
  BugReport as BugReportIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  List as ListIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import SubtaskManager from './SubtaskManager';

const EnhancedIssueLinking = ({ open, onClose, issue, onLinkUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkType, setLinkType] = useState('relates_to');
  const [parentChild, setParentChild] = useState('');
  const [hierarchy, setHierarchy] = useState(null);
  const [error, setError] = useState(null);
  const [subtaskManagerOpen, setSubtaskManagerOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  // Debounce search term for better UX
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const linkTypes = [
    { value: 'relates_to', label: 'Relates to', description: 'General relationship' },
    { value: 'blocks', label: 'Blocks', description: 'This issue blocks the target' },
    { value: 'is_blocked_by', label: 'Is blocked by', description: 'This issue is blocked by the target' },
    { value: 'duplicates', label: 'Duplicates', description: 'This issue duplicates the target' },
    { value: 'is_duplicated_by', label: 'Is duplicated by', description: 'This issue is duplicated by the target' }
  ];

  const issueTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'bug', label: 'Bugs' },
    { value: 'story', label: 'Stories' },
    { value: 'task', label: 'Tasks' },
    { value: 'subtask', label: 'Subtasks' }
  ];

  useEffect(() => {
    if (open && issue) {
      loadHierarchy();
    }
  }, [open, issue]);

  // Auto-search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim() && open && issue) {
      searchIssues();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, open, issue, filterType]);

  const loadHierarchy = async () => {
    try {
      const response = await api.get(`/issues/${issue._id}/hierarchy`);
      setHierarchy(response.data.hierarchy);
      setError(null);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      setHierarchy({
        parent: null,
        children: [],
        linked: []
      });
    }
  };

  const searchIssues = async () => {
    if (!debouncedSearchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const projectId = typeof issue.project === 'string' ? issue.project : issue.project._id;
      let searchUrl = `/issues?q=${debouncedSearchTerm}&project=${projectId}`;
      
      if (filterType !== 'all') {
        searchUrl += `&type=${filterType}`;
      }
      
      const response = await api.get(searchUrl);
      setSearchResults(response.data.issues.filter(i => i._id !== issue._id));
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to search issues: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const linkIssue = async (targetIssueId) => {
    try {
      await api.post('/issues/link', {
        issueId: issue._id,
        targetIssueId,
        linkType,
        parentChild
      });
      await loadHierarchy();
      onLinkUpdate?.();
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link issues');
    }
  };

  const unlinkIssue = async (targetIssueId) => {
    try {
      await api.post('/issues/unlink', {
        issueId: issue._id,
        targetIssueId
      });
      await loadHierarchy();
      onLinkUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlink issues');
    }
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'bug': return <BugReportIcon />;
      case 'story': return <BookIcon />;
      case 'task': return <AssignmentIcon />;
      case 'subtask': return <SubTaskIcon />;
      default: return <ListIcon />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'backlog': 'default',
      'development': 'primary',
      'code_review': 'warning',
      'qa': 'info',
      'deployment': 'secondary',
      'released': 'success',
      'done': 'success',
      'in_progress': 'primary',
      'todo': 'default'
    };
    return colors[status] || 'default';
  };

  if (!issue) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="primary" />
            <Typography variant="h6">
              Issue Relationships - {issue.key}: {issue.title}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Link Issues" />
              <Tab label="Current Relationships" />
              <Tab label="Manage Subtasks" />
            </Tabs>
          </Box>

          {/* Tab 1: Link Issues */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Link to Another Issue</Typography>
              
              {/* Search Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Search issues"
                    placeholder="Type to search issues by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchIssues()}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={searchIssues}
                    disabled={loading || !searchTerm.trim()}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <SearchIcon />
                  </Button>
                </Box>

                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Issue Type</InputLabel>
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      label="Issue Type"
                    >
                      {issueTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Link Type</InputLabel>
                    <Select
                      value={linkType}
                      onChange={(e) => setLinkType(e.target.value)}
                      label="Link Type"
                    >
                      {linkTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box>
                            <Typography variant="body2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={parentChild}
                      onChange={(e) => setParentChild(e.target.value)}
                      label="Relationship"
                    >
                      <MenuItem value="">General Link</MenuItem>
                      <MenuItem value="parent">Make Parent</MenuItem>
                      <MenuItem value="child">Make Child</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Searching...
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Search Results ({searchResults.length})
                  </Typography>
                  <List sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    {searchResults.map((searchIssue) => (
                      <ListItem key={searchIssue._id} divider>
                        <ListItemIcon>
                          {getIssueIcon(searchIssue.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {searchIssue.key}
                              </Typography>
                              <Chip
                                label={searchIssue.status}
                                size="small"
                                color={getStatusColor(searchIssue.status)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={searchIssue.title}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Link this issue">
                            <IconButton
                              edge="end"
                              onClick={() => linkIssue(searchIssue._id)}
                              color="primary"
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {searchTerm.trim() && !loading && searchResults.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No issues found matching "{searchTerm}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Current Relationships */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Current Relationships</Typography>
              
              {hierarchy && (
                <Stack spacing={3}>
                  {/* Parent Issue */}
                  {hierarchy.parent && (
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SubTaskIcon color="primary" />
                            <Typography variant="subtitle1" color="primary">
                              Parent Issue
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => unlinkIssue(hierarchy.parent._id)}
                          >
                            <UnlinkIcon />
                          </IconButton>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {hierarchy.parent.key} - {hierarchy.parent.title}
                          </Typography>
                          <Chip
                            label={hierarchy.parent.status}
                            size="small"
                            color={getStatusColor(hierarchy.parent.status)}
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Child Issues */}
                  {hierarchy.children && hierarchy.children.length > 0 && (
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <SubTaskIcon color="secondary" />
                          <Typography variant="subtitle1" color="secondary">
                            Child Issues ({hierarchy.children.length})
                          </Typography>
                        </Box>
                        <Stack spacing={1}>
                          {hierarchy.children.map((child) => (
                            <Box key={child._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {child.key} - {child.title}
                                </Typography>
                                <Chip
                                  label={child.status}
                                  size="small"
                                  color={getStatusColor(child.status)}
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => unlinkIssue(child._id)}
                              >
                                <UnlinkIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Linked Issues */}
                  {hierarchy.linked && hierarchy.linked.length > 0 && (
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <LinkIcon />
                          <Typography variant="subtitle1">
                            Linked Issues ({hierarchy.linked.length})
                          </Typography>
                        </Box>
                        <Stack spacing={1}>
                          {hierarchy.linked.map((link) => (
                            <Box key={link.issue._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {link.issue.key} - {link.issue.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={link.issue.status}
                                    size="small"
                                    color={getStatusColor(link.issue.status)}
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={link.linkType.replace('_', ' ')}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => unlinkIssue(link.issue._id)}
                              >
                                <UnlinkIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!hierarchy.parent && (!hierarchy.children || hierarchy.children.length === 0) && (!hierarchy.linked || hierarchy.linked.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No relationships yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Link this issue to other issues or create subtasks to establish relationships
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {/* Tab 3: Manage Subtasks */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Manage Subtasks</Typography>
                <Button
                  variant="contained"
                  startIcon={<SubTaskIcon />}
                  onClick={() => setSubtaskManagerOpen(true)}
                >
                  Open Subtask Manager
                </Button>
              </Box>
              
              {hierarchy && hierarchy.children && hierarchy.children.length > 0 ? (
                <Stack spacing={2}>
                  {hierarchy.children.map((child) => (
                    <Card key={child._id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <SubTaskIcon color="secondary" />
                          <Typography variant="subtitle1" fontWeight="medium">
                            {child.key}
                          </Typography>
                          <Chip
                            label={child.status}
                            size="small"
                            color={getStatusColor(child.status)}
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2">
                          {child.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SubTaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No subtasks yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create subtasks to break down this issue into smaller, manageable tasks
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SubTaskIcon />}
                    onClick={() => setSubtaskManagerOpen(true)}
                  >
                    Create First Subtask
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Subtask Manager Dialog */}
      <SubtaskManager
        open={subtaskManagerOpen}
        onClose={() => setSubtaskManagerOpen(false)}
        parentIssue={issue}
        onSubtaskUpdate={() => {
          loadHierarchy();
          onLinkUpdate?.();
        }}
      />
    </>
  );
};

export default EnhancedIssueLinking;

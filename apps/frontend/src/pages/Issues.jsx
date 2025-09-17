import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert, 
  Stack,
  Paper,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import IssuesTable from '../components/IssuesTable';
import GroupedIssuesTable from '../components/GroupedIssuesTable';
import IssuesFilters from '../components/IssuesFilters';
import IssuesBulkActions from '../components/IssuesBulkActions';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import CustomFields from '../components/CustomFields';
import { useDebounce, useDebouncedCallback } from '../hooks/useDebounce';
import { useApiCache, clearCacheByPattern } from '../hooks/useApiCache';
import { useAuth } from '../context/AuthContext';

export default function Issues() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backgroundUpdating, setBackgroundUpdating] = useState(false);
   
  // Table state
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState('none');
  const [selectedProject, setSelectedProject] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Performance optimization state
  
  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingIssue, setViewingIssue] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, issue: null });
  
  // Form state
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    project: '', 
    type: 'task', 
    priority: 'medium',
    assignees: [],
    // Custom fields
    sprint: '',
    acceptanceCriteria: '',
    testPlan: '',
    startDate: '',
    endDate: '',
    estimate: '',
    actual: {
      date: '',
      hours: ''
    }
  });
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const projectParam = searchParams.get('project');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy || 'createdAt',
        sortOrder: sortDirection
      });
      
      // Add search term if provided
      if (debouncedSearchTerm) {
        queryParams.append('q', debouncedSearchTerm);
      }
      
      // Add project filter
      if (selectedProject !== 'all') {
        queryParams.append('project', selectedProject);
      }
      
      // Add other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      const [issuesRes, projectsRes, usersRes] = await Promise.all([
        api.get(`/issues?${queryParams.toString()}`),
        api.get('/projects'),
        api.get('/users')
      ]);
      
      setIssues(issuesRes.data.issues || []);
      setPagination(issuesRes.data.pagination || {
        page: 1,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
      
      // Set default project if specified in URL
      if (projectParam) {
        // Check if user has access to the specified project
        const hasAccessToProject = projectsRes.data.projects.some(p => p._id === projectParam);
        if (hasAccessToProject) {
          setForm(prev => ({ ...prev, project: projectParam }));
          setSelectedProject(projectParam);
        } else {
          // User doesn't have access to the specified project, fall back to 'all'
          console.warn(`Access denied to project ${projectParam}. Showing all projects instead.`);
          setForm(prev => ({ ...prev, project: '' }));
          setSelectedProject('all');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortDirection, debouncedSearchTerm, selectedProject, filters, searchParams, form.project]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Background polling for real-time updates (only when page is visible)
  useEffect(() => {
    let interval;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        // Page is visible, start polling
        if (!interval) {
          interval = setInterval(async () => {
            try {
              setBackgroundUpdating(true);
              
              // Background fetch without showing loading state
              const [issuesRes, projectsRes, usersRes] = await Promise.all([
                api.get(`/issues?page=${currentPage}&limit=${itemsPerPage}&sortBy=${sortBy}&sortOrder=${sortDirection}&search=${debouncedSearchTerm}&project=${selectedProject}`),
                api.get('/projects'),
                api.get('/users?limit=100')
              ]);
              
              // Only update state if data has actually changed
              const newIssues = issuesRes.data.issues || [];
              const newProjects = projectsRes.data.projects || [];
              const newUsers = usersRes.data.users || [];
              
              // Check if issues data has changed
              const issuesChanged = JSON.stringify(issues) !== JSON.stringify(newIssues);
              const projectsChanged = JSON.stringify(projects) !== JSON.stringify(newProjects);
              const usersChanged = JSON.stringify(users) !== JSON.stringify(newUsers);
              
              if (issuesChanged || projectsChanged || usersChanged) {
                console.log('🔄 Background data update detected');
                setIssues(newIssues);
                setProjects(newProjects);
                setUsers(newUsers);
                setPagination(issuesRes.data.pagination || {
                  page: 1,
                  limit: itemsPerPage,
                  totalPages: 1,
                  total: 0,
                  hasNextPage: false,
                  hasPrevPage: false
                });
              }
            } catch (err) {
              console.warn('Background polling error:', err);
              // Don't show error for background polling failures
            } finally {
              setBackgroundUpdating(false);
            }
          }, 30000); // Poll every 30 seconds (reduced frequency)
        }
      }
    };
    
    // Start polling if page is visible
    if (!document.hidden) {
      handleVisibilityChange();
    }
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, itemsPerPage, sortBy, sortDirection, debouncedSearchTerm, selectedProject, issues, projects, users]);

  // Listen for custom events from other components (like Sprint dialog)
  useEffect(() => {
    const handleIssuesDataChanged = (event) => {
      const { action, projectId } = event.detail;
      console.log(`🔄 Issues data changed: ${action} in project ${projectId}`);
      
      // Only refresh if we're viewing all projects or the specific project
      if (selectedProject === 'all' || selectedProject === projectId) {
        console.log('🔄 Refreshing Issues page due to external data change');
        fetchData();
      }
    };

    window.addEventListener('issuesDataChanged', handleIssuesDataChanged);
    
    return () => {
      window.removeEventListener('issuesDataChanged', handleIssuesDataChanged);
    };
  }, [fetchData, selectedProject]);

  // Event handlers
  const handleCreateIssue = async () => {
    try {
      // Extract custom fields dynamically
      const { title, description, project, type, priority, storyPoints, ...customFields } = form;
      
      const response = await api.post('/issues', {
        title,
        description,
        project,
        type,
        priority,
        status: 'backlog',
        storyPoints,
        // Include all custom fields dynamically
        ...customFields
      });
      
      // Add the new issue to the list immediately if it matches the current view
      const newIssue = response.data.issue;
      if (selectedProject === 'all' || newIssue.project === selectedProject) {
        setIssues(prevIssues => [newIssue, ...prevIssues]);
      }
      
      setCreateDialogOpen(false);
      setForm({ 
        title: '', 
        description: '', 
        project: '', 
        type: 'task', 
        priority: 'medium',
        sprint: '',
        acceptanceCriteria: '',
        testPlan: '',
        startDate: '',
        endDate: '',
        estimate: '',
        actual: { date: '', hours: '' }
      });
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'create', 
          projectId: newIssue.project,
          issueId: newIssue._id
        } 
      }));
      
      showSnackbar('Issue created successfully', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    }
  };

  const handleEditIssue = async () => {
    if (!editingIssue) return;
    try {
      // Extract custom fields dynamically
      const { title, description, type, priority, storyPoints, ...customFields } = form;
      
      // Optimistic update
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue._id === editingIssue._id 
            ? { 
                ...issue, 
                title,
                description,
                type,
                priority,
                ...customFields,
                updatedAt: new Date().toISOString()
              }
            : issue
        )
      );
      
      await api.patch(`/issues/${editingIssue._id}`, {
        title,
        description,
        type,
        priority,
        storyPoints,
        // Include all custom fields dynamically
        ...customFields
      });
      
      setEditDialogOpen(false);
      setEditingIssue(null);
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'update', 
          projectId: editingIssue.project,
          issueId: editingIssue._id
        } 
      }));
      
      showSnackbar('Issue updated successfully', 'success');
    } catch (err) {
      // Revert optimistic update on error
      fetchData();
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm.issue) return;
    try {
      await api.delete(`/issues/${confirm.issue._id}`);
      setConfirm({ open: false, issue: null });
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'delete', 
          projectId: confirm.issue.project,
          issueId: confirm.issue._id
        } 
      }));
      
      showSnackbar('Issue deleted successfully', 'success');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const handleUpdateStatus = async (issueId, updates) => {
    try {
      // Optimistic update - update UI immediately
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue._id === issueId 
            ? { ...issue, ...updates, updatedAt: new Date().toISOString() }
            : issue
        )
      );
      
      await api.patch(`/issues/${issueId}`, updates);
      
      // Find the issue to get its project ID
      const issue = issues.find(i => i._id === issueId);
      
      // Notify other components that issues data has changed
      if (issue) {
        window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
          detail: { 
            action: 'update', 
            projectId: issue.project,
            issueId: issueId
          } 
        }));
      }
      
      showSnackbar('Issue updated successfully', 'success');
      
      // Refresh data to ensure consistency
      fetchData();
    } catch (err) {
      // Revert optimistic update on error
      fetchData();
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleBulkAction = async (action, items, data) => {
    try {
      switch (action) {
        case 'delete':
          for (const item of items) {
            await api.delete(`/issues/${item._id}`);
          }
          showSnackbar(`${items.length} issues deleted successfully`, 'success');
          break;
        case 'assign':
          for (const item of items) {
            await api.patch(`/issues/${item._id}`, { assignee: data.userId });
          }
          showSnackbar(`${items.length} issues assigned to ${data.userName}`, 'success');
          break;
        case 'status':
          for (const item of items) {
            await api.patch(`/issues/${item._id}`, { status: data.status });
          }
          showSnackbar(`${items.length} issues status changed to ${data.statusLabel}`, 'success');
          break;
        case 'priority':
          for (const item of items) {
            await api.patch(`/issues/${item._id}`, { priority: data.priority });
          }
          showSnackbar(`${items.length} issues priority set to ${data.priorityLabel}`, 'success');
          break;
        case 'export':
          showSnackbar(`Exporting ${items.length} issues...`, 'info');
          break;
        default:
          showSnackbar(`Bulk action "${action}" not implemented yet`, 'warning');
      }
      setSelectedItems([]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper functions for the View Issue Dialog
  const getTypeColor = (type) => {
    const colors = {
      task: 'default',
      bug: 'error',
      story: 'primary',
      epic: 'secondary'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      backlog: 'default',
      'analysis_ready': 'info',
      'analysis_requirements': 'warning',
      development: 'primary',
      acceptance: 'secondary',
      released: 'success'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[priority] || 'default';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unassigned';
  };

  const getUserInitials = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openCreateDialog = () => {
    // If viewing a specific project, default to that project
    // If viewing all projects, leave project empty for user to select
    const defaultProject = selectedProject !== 'all' ? selectedProject : '';
    
    setForm({ 
      title: '', 
      description: '', 
      project: defaultProject, 
      type: 'task', 
      priority: 'medium',
      storyPoints: 0
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (issue) => {
    setEditingIssue(issue);
    setForm({
      title: issue.title || '',
      description: issue.description || '',
      project: issue.project || '',
      type: issue.type || 'task',
      priority: issue.priority || 'medium',
      storyPoints: issue.storyPoints || 0,
      assignees: issue.assignees ? issue.assignees.map(a => a._id || a) : [],
      // Custom fields will be handled by CustomFields component
      sprint: issue.sprint || '',
      // Include all other custom fields from the issue
      ...Object.keys(issue).reduce((acc, key) => {
        if (!['_id', 'title', 'description', 'project', 'type', 'priority', 'status', 'assignees', 'createdAt', 'updatedAt', 'key', 'storyPoints', 'sprint'].includes(key)) {
          acc[key] = issue[key] || '';
        }
        return acc;
      }, {})
    });
    setEditDialogOpen(true);
  };

  const confirmDelete = (issue) => setConfirm({ open: true, issue });
  const cancelDelete = () => setConfirm({ open: false, issue: null });

  const handleViewIssue = (issue) => {
    setViewingIssue(issue);
    setViewDialogOpen(true);
  };

  const handleAssignIssue = (issue) => {
    // Open assignment dialog
    console.log('Assign issue:', issue);
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    // Clear selection when switching projects
    setSelectedItems([]);
    // Reset to first page when changing projects
    setCurrentPage(1);
  };

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleSortChange = useCallback((field, direction) => {
    setSortBy(field);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Issues
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage all issues across your projects
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          {backgroundUpdating && (
            <Chip 
              size="small" 
              label="Updating..." 
              color="primary" 
              variant="outlined"
              icon={<CircularProgress size={12} />}
            />
          )}
          <Typography variant="body2" color="text.secondary">
            {pagination.total} issues
          </Typography>
        </Stack>
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <IssuesFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        groupBy={groupBy}
        onGroupChange={setGroupBy}
        users={users}
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
        onClearFilters={() => {
          setSearchTerm('');
          setFilters({});
          setSortBy('');
          setSortDirection('asc');
          setGroupBy('none');
          setCurrentPage(1);
        }}
        onExport={() => handleBulkAction('export', selectedItems)}
        onCreateIssue={openCreateDialog}
        selectedCount={selectedItems.length}
      />

      {/* Bulk Actions */}
      <IssuesBulkActions
        selectedItems={selectedItems}
        onBulkAction={handleBulkAction}
        onClearSelection={() => setSelectedItems([])}
        users={users}
        disabled={loading}
      />

      {/* Main Table */}
      {groupBy === 'none' ? (
        <IssuesTable
          issues={issues}
          users={users}
          projects={projects}
          loading={loading}
          error={error}
          onEditIssue={openEditDialog}
          onDeleteIssue={confirmDelete}
          onViewIssue={handleViewIssue}
          onAssignIssue={handleAssignIssue}
          onUpdateStatus={handleUpdateStatus}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          sortBy={sortBy}
          sortDirection={sortDirection}
          currentUserId={user?._id}
          onSort={handleSortChange}
          onFilter={handleFilterChange}
          onSearch={handleSearchChange}
          searchTerm={searchTerm}
          filterOptions={filters}
        />
      ) : (
        <GroupedIssuesTable
          issues={issues}
          users={users}
          projects={projects}
          groupBy={groupBy}
          currentUserId={user?.id}
          loading={loading}
          error={error}
          onEditIssue={openEditDialog}
          onDeleteIssue={confirmDelete}
          onViewIssue={handleViewIssue}
          onAssignIssue={handleAssignIssue}
          onUpdateStatus={handleUpdateStatus}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSortChange}
          onFilter={handleFilterChange}
          onSearch={handleSearchChange}
          searchTerm={searchTerm}
          filterOptions={filters}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Create Issue Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Issue</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={form.project}
                label="Project"
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                required
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.key} — {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <MenuItem key="task" value="task">Task</MenuItem>
                  <MenuItem key="bug" value="bug">Bug</MenuItem>
                  <MenuItem key="story" value="story">Story</MenuItem>
                  <MenuItem key="epic" value="epic">Epic</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  label="Priority"
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <MenuItem key="low" value="low">Low</MenuItem>
                  <MenuItem key="medium" value="medium">Medium</MenuItem>
                  <MenuItem key="high" value="high">High</MenuItem>
                  <MenuItem key="critical" value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Story Points</InputLabel>
                <Select
                  value={form.storyPoints || ''}
                  label="Story Points"
                  onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                >
                  <MenuItem key="0" value={0}>0 - No effort</MenuItem>
                  <MenuItem key="1" value={1}>1 - Very small</MenuItem>
                  <MenuItem key="2" value={2}>2 - Small</MenuItem>
                  <MenuItem key="3" value={3}>3 - Medium</MenuItem>
                  <MenuItem key="5" value={5}>5 - Large</MenuItem>
                  <MenuItem key="8" value={8}>8 - Very large</MenuItem>
                  <MenuItem key="13" value={13}>13 - Extra large</MenuItem>
                  <MenuItem key="21" value={21}>21 - Epic</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            {/* Assignees Field */}
            <FormControl fullWidth>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={Array.isArray(form.assignees) ? form.assignees : []}
                label="Assignees"
                onChange={(e) => setForm({ ...form, assignees: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find(u => u._id === userId);
                      return user ? (
                        <Chip
                          key={userId}
                          size="small"
                          avatar={<Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>{user.name.charAt(0).toUpperCase()}</Avatar>}
                          label={user.name}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      {user.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Custom Fields */}
            <CustomFields 
              issue={useMemo(() => ({ type: form.type, project: form.project }), [form.type, form.project])}
              onChange={useCallback((customFields) => {
                console.log('🔧 CustomFields onChange called with:', customFields);
                setForm(prev => ({ ...prev, ...customFields }));
              }, [])}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateIssue} variant="contained">Create Issue</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Issue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Issue</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <MenuItem key="task" value="task">Task</MenuItem>
                  <MenuItem key="bug" value="bug">Bug</MenuItem>
                  <MenuItem key="story" value="story">Story</MenuItem>
                  <MenuItem key="epic" value="epic">Epic</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  label="Priority"
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <MenuItem key="low" value="low">Low</MenuItem>
                  <MenuItem key="medium" value="medium">Medium</MenuItem>
                  <MenuItem key="high" value="high">High</MenuItem>
                  <MenuItem key="critical" value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Story Points</InputLabel>
                <Select
                  value={form.storyPoints || ''}
                  label="Story Points"
                  onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                >
                  <MenuItem key="0" value={0}>0 - No effort</MenuItem>
                  <MenuItem key="1" value={1}>1 - Very small</MenuItem>
                  <MenuItem key="2" value={2}>2 - Small</MenuItem>
                  <MenuItem key="3" value={3}>3 - Medium</MenuItem>
                  <MenuItem key="5" value={5}>5 - Large</MenuItem>
                  <MenuItem key="8" value={8}>8 - Very large</MenuItem>
                  <MenuItem key="13" value={13}>13 - Extra large</MenuItem>
                  <MenuItem key="21" value={21}>21 - Epic</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            {/* Assignees Field */}
            <FormControl fullWidth>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={Array.isArray(form.assignees) ? form.assignees : []}
                label="Assignees"
                onChange={(e) => setForm({ ...form, assignees: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find(u => u._id === userId);
                      return user ? (
                        <Chip
                          key={userId}
                          size="small"
                          avatar={<Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>{user.name.charAt(0).toUpperCase()}</Avatar>}
                          label={user.name}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      {user.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Custom Fields */}
            <CustomFields 
              issue={{ 
                type: form.type, 
                project: editingIssue?.project,
                sprint: form.sprint,
                acceptanceCriteria: form.acceptanceCriteria,
                testPlan: form.testPlan,
                startDate: form.startDate,
                endDate: form.endDate,
                estimate: form.estimate,
                actual: form.actual
              }}
              onChange={(customFields) => setForm({ ...form, ...customFields })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditIssue} variant="contained">Update Issue</Button>
        </DialogActions>
      </Dialog>

      {/* View Issue Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={viewingIssue?.type || 'Task'} 
              color={getTypeColor(viewingIssue?.type)} 
              variant="outlined" 
              size="small"
            />
            <Typography variant="h6" sx={{ flex: 1 }}>
              {viewingIssue?.key} - {viewingIssue?.title}
            </Typography>
            <Chip 
              label={viewingIssue?.status?.replace('_', ' ') || 'Backlog'} 
              color={getStatusColor(viewingIssue?.status)} 
              variant="filled" 
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingIssue && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Basic Information */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {viewingIssue.description || 'No description provided'}
                </Typography>
              </Box>

              {/* Issue Details Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Priority
                  </Typography>
                  <Chip 
                    label={viewingIssue.priority || 'Medium'} 
                    color={getPriorityColor(viewingIssue.priority)} 
                    size="small"
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getProjectName(viewingIssue.project)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Assignee
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {viewingIssue.assignee ? (
                      <>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {getUserInitials(viewingIssue.assignee)}
                        </Avatar>
                        <Typography variant="body2">
                          {getUserName(viewingIssue.assignee)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(viewingIssue.createdAt)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(viewingIssue.updatedAt)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Issue ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {viewingIssue._id}
                  </Typography>
                </Box>
              </Box>

              {/* Custom Fields */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Custom Fields
                </Typography>
                <CustomFields 
                  issue={viewingIssue}
                  disabled={true}
                  showLabels={false}
                  compact={false}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => {
              setViewDialogOpen(false);
              openEditDialog(viewingIssue);
            }} 
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        open={confirm.open} 
        title="Delete Issue" 
        message={`Are you sure you want to delete "${confirm.issue?.title}"? This action cannot be undone.`} 
        onCancel={cancelDelete} 
        onConfirm={handleDeleteIssue} 
        confirmText="Delete" 
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
}


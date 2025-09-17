import { useEffect, useState, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Alert, 
  Stack,
  Paper,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import api from '../api/client';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ProjectsTable from '../components/ProjectsTable';
import GroupedProjectsTable from '../components/GroupedProjectsTable';
import ProjectsFilters from '../components/ProjectsFilters';
import ProjectMembersBar from '../components/ProjectMembersBar';
import BulkActions from '../components/BulkActions';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [users, setUsers] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, project: null });
  
  // Table state
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState('none');
  
  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, issuesRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/issues'),
        api.get('/users')
      ]);
      // Ensure projects data is properly structured
      const projects = projectsRes.data.projects || [];
      const processedProjects = projects.map(project => ({
        ...project,
        members: (project.members || []).filter(member => member && member.user)
      }));
      
      setProjects(processedProjects);
      setIssues(issuesRes.data.issues || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for issues data changes from other tabs
  useEffect(() => {
    const handleIssuesDataChanged = (event) => {
      const { action, projectId } = event.detail;
      // Reload data when issues are updated
      if (action === 'update' || action === 'create' || action === 'delete') {
        fetchData();
      }
    };

    window.addEventListener('issuesDataChanged', handleIssuesDataChanged);
    
    return () => {
      window.removeEventListener('issuesDataChanged', handleIssuesDataChanged);
    };
  }, []);

  // Event handlers
  const openCreateModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditing(item.project || item);
    setModalOpen(true);
  };

  const handleSaveProject = async (data) => {
    try {
      if (editing) {
        await api.patch(`/projects/${editing._id}`, { 
          name: data.name, 
          description: data.description, 
          members: data.members,
          status: data.status
        });
        showSnackbar('Project updated successfully', 'success');
      } else {
        await api.post('/projects', { 
          key: data.key, 
          name: data.name, 
          description: data.description, 
          members: data.members,
          status: data.status
        });
        showSnackbar('Project created successfully', 'success');
      }
      setModalOpen(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const confirmDelete = (item) => setConfirm({ open: true, project: item.project || item });
  const cancelDelete = () => setConfirm({ open: false, project: null });
  const doDelete = async () => {
    if (!confirm.project) return;
    try {
      await api.delete(`/projects/${confirm.project._id}`);
      setConfirm({ open: false, project: null });
      showSnackbar('Project deleted successfully', 'success');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleViewProject = (item) => {
    if (item.type === 'project') {
      // Navigate to project details or issues
      window.location.href = `/issues?project=${item.project._id}`;
    } else {
      // Navigate to issue details
      window.location.href = `/issues?project=${item.project._id}&issue=${item.issue._id}`;
    }
  };

  const handleViewProjectIssues = (item) => {
    if (item.type === 'project') {
      window.location.href = `/issues?project=${item.project._id}`;
    } else {
      window.location.href = `/issues?project=${item.project._id}&issue=${item.issue._id}`;
    }
  };

  const handleViewProjectSprints = (item) => {
    if (item.type === 'project') {
      window.location.href = `/sprints?project=${item.project._id}`;
    }
  };

  const handleViewProjectBoard = (item) => {
    if (item.type === 'project') {
      window.location.href = `/board?project=${item.project._id}`;
    }
  };

  const handleConfigureProject = (item) => {
    if (item.type === 'project') {
      window.location.href = `/project-config?project=${item.project._id}`;
    }
  };

  const handleAssignMember = (item) => {
    // Open member management dialog
    setEditing(item.project || item);
    setModalOpen(true);
  };

  const handleBulkAction = async (action, items, data) => {
    try {
      switch (action) {
        case 'delete':
          // Handle bulk delete
          for (const item of items) {
            if (item.type === 'project') {
              await api.delete(`/projects/${item.project._id}`);
            }
          }
          showSnackbar(`${items.length} items deleted successfully`, 'success');
          break;
        case 'assign':
          // Handle bulk assignment
          for (const item of items) {
            if (item.type === 'issue' && item.issue) {
              await api.patch(`/issues/${item.issue._id}`, { assignee: data.userId });
            }
          }
          showSnackbar(`${items.length} items assigned to ${data.userName}`, 'success');
          break;
        case 'export':
          // Handle export
          showSnackbar(`Exporting ${items.length} items...`, 'info');
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

  // Get all project members for display
  const allProjectMembers = useMemo(() => {
    const members = [];
    projects.forEach(project => {
      if (project && project.members && Array.isArray(project.members)) {
        project.members.forEach(member => {
          // Only add members that have valid user data
          if (member && member.user && member.user._id && !members.find(m => m && m.user && m.user._id === member.user._id)) {
            members.push(member);
          }
        });
      }
    });
    return members;
  }, [projects]);

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your projects
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          size="large"
        >
          New Project
        </Button>
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Project Members Bar */}
      {allProjectMembers.length > 0 && (
        <ProjectMembersBar
          members={allProjectMembers}
          users={users}
          onManageMembers={() => setModalOpen(true)}
        />
      )}

      {/* Filters */}
      <ProjectsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortBy(field);
          setSortDirection(direction);
        }}
        groupBy={groupBy}
        onGroupChange={setGroupBy}
        users={users}
        onClearFilters={() => {
          setSearchTerm('');
          setFilters({});
          setSortBy('');
          setSortDirection('asc');
          setGroupBy('none');
        }}
        onExport={() => handleBulkAction('export', selectedItems)}
        selectedCount={selectedItems.length}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedItems}
        onBulkAction={handleBulkAction}
        onClearSelection={() => setSelectedItems([])}
        users={users}
        disabled={loading}
      />

      {/* Main Table */}
      <GroupedProjectsTable
        projects={projects}
        issues={issues}
        users={users}
        groupBy={groupBy}
        loading={loading}
        error={error}
        onEditProject={openEditModal}
        onDeleteProject={confirmDelete}
        onViewProject={handleViewProject}
        onViewProjectIssues={handleViewProjectIssues}
        onViewProjectSprints={handleViewProjectSprints}
        onViewProjectBoard={handleViewProjectBoard}
        onConfigureProject={handleConfigureProject}
        onAssignMember={handleAssignMember}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(field) => {
          if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(field);
            setSortDirection('asc');
          }
        }}
        onFilter={setFilters}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        filterOptions={filters}
      />

      {/* Modals */}
      <ProjectForm 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleSaveProject} 
        initial={editing} 
        users={users} 
      />
      
      <ConfirmDialog 
        open={confirm.open} 
        title="Delete Project" 
        message={`Are you sure you want to delete ${confirm.project?.name}? This action cannot be undone.`} 
        onCancel={cancelDelete} 
        onConfirm={doDelete} 
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


import { useEffect, useState } from 'react';
import { Container, Typography, Grid, CircularProgress, Alert, Paper, Box, Button, Stack, Select, MenuItem, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Snackbar, Card, CardContent, Avatar, Chip, Tooltip, Badge, IconButton } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, DragOverlay, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { useSearchParams } from 'react-router-dom';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import BugReportIcon from '@mui/icons-material/BugReport';
import BookIcon from '@mui/icons-material/Book';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListIcon from '@mui/icons-material/List';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';
import IssueCard from '../components/IssueCard';
import IssueLinking from '../components/IssueLinking';
import CustomFields from '../components/CustomFields';
import DailyStatusIndicator from '../components/DailyStatusIndicator';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDynamicConfig } from '../hooks/useDynamicConfig';
import { useAuth } from '../context/AuthContext';

// Helper function to create workflow from system config
const createWorkflowFromTemplate = (template, issueType) => {
  return {
    name: `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} Workflow`,
    statuses: template.statuses.map(s => s.value),
    colors: template.statuses.reduce((acc, status) => {
      acc[status.value] = status.color;
      return acc;
    }, {})
  };
};

export default function Board() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({});
  const [activeIssue, setActiveIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [boardType, setBoardType] = useState('all'); // Default to all issues
  const [availableBoardTypes, setAvailableBoardTypes] = useState(['all', 'bug', 'story', 'task', 'subtask']); // Default board types
  const [linkingDialog, setLinkingDialog] = useState({ open: false, issue: null });
  const [projectConfig, setProjectConfig] = useState(null);
  const [workflows, setWorkflows] = useState({});
  
  // CRUD Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, issue: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    type: 'task', 
    priority: 'medium',
    assignees: [],
    sprint: '',
    acceptanceCriteria: '',
    testPlan: '',
    startDate: '',
    endDate: '',
    estimate: '',
    actual: { date: '', hours: '' }
  });
  
  // Get dynamic configuration
  const { config: systemConfig, loading: configLoading, error: configError } = useDynamicConfig();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load project configuration and build dynamic workflows
  const loadProjectConfig = async (projectId) => {
    try {
      console.log('🔍 Loading project configuration for:', projectId);
      const response = await api.get(`/project-config/${projectId}`);
      const config = response.data.config;
      console.log('✅ Project configuration loaded:', config);
      setProjectConfig(config);
      
      // Build dynamic workflows from project configuration
      const dynamicWorkflows = {};
      const dynamicBoardTypes = [];
      
      // Create workflows for each issue type
      config.issueTypes.forEach(issueType => {
        if (issueType.isActive) {
          dynamicWorkflows[issueType.name] = {
            name: `${issueType.displayName} Workflow`,
            statuses: issueType.workflow || ['backlog', 'development', 'released'],
            colors: buildStatusColors(config.statuses),
            icon: issueType.icon,
            color: issueType.color
          };
          dynamicBoardTypes.push(issueType.name);
        }
      });
      
      // Always add 'all' option for project-specific views
      dynamicBoardTypes.unshift('all');
      
      // Create 'all' workflow for project-specific view
      const allStatuses = [...new Set(config.statuses.map(s => s.name))];
      dynamicWorkflows['all'] = {
        name: 'All Issues',
        statuses: allStatuses,
        colors: buildStatusColors(config.statuses)
      };
      
      console.log('🎯 Dynamic workflows created:', dynamicWorkflows);
      setWorkflows(dynamicWorkflows);
      setAvailableBoardTypes(dynamicBoardTypes);
      
      // Update boardType to 'all' for project-specific views, or first available type
      if (dynamicBoardTypes.length > 0 && !dynamicBoardTypes.includes(boardType)) {
        setBoardType('all');
      }
    } catch (err) {
      console.warn('❌ Could not load project configuration, using system defaults:', err);
      
      // Fallback to system configuration workflow templates
      const fallbackWorkflows = {};
      const fallbackBoardTypes = [];
      if (systemConfig && systemConfig.workflowTemplates) {
        systemConfig.workflowTemplates.forEach(template => {
          template.issueTypes.forEach(issueType => {
            fallbackWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
            fallbackBoardTypes.push(issueType);
          });
        });
      }
      
      console.log('🔄 Falling back to system workflow templates:', fallbackWorkflows);
      setWorkflows(fallbackWorkflows);
      setAvailableBoardTypes(fallbackBoardTypes.length > 0 ? fallbackBoardTypes : ['bug', 'story', 'task', 'subtask']);
    }
  };

  // Build status colors from project configuration
  const buildStatusColors = (statuses) => {
    const colors = {};
    const colorMap = {
      'default': '#ECEFF1',
      'primary': '#E3F2FD',
      'secondary': '#E8F5E9',
      'error': '#FFEBEE',
      'warning': '#FFF3E0',
      'info': '#E1F5FE',
      'success': '#E0F7FA'
    };
    
    statuses.forEach(status => {
      colors[status.name] = colorMap[status.color] || '#ECEFF1';
    });
    
    return colors;
  };

  const loadBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const projects = await api.get('/projects');
      const list = projects.data.projects;
      setAllProjects(list);
      let proj = null;
      const projectParam = searchParams.get('project');
      if (projectParam) {
        proj = list.find((p) => p._id === projectParam) || null;
      }
      
      setProject(proj); // Set project (can be null for "All Projects")
      
      // Load project configuration only if a specific project is selected
      if (proj && proj._id) {
        await loadProjectConfig(proj._id);
      } else {
        // For "All Projects" view, use system defaults
        console.log('🌍 Loading all projects view - using system defaults');
        setProjectConfig(null);
        
        // Use system configuration workflow templates
        const fallbackWorkflows = {};
        const fallbackBoardTypes = ['all', 'bug', 'story', 'task', 'subtask'];
        
        if (systemConfig && systemConfig.workflowTemplates) {
          systemConfig.workflowTemplates.forEach(template => {
            template.issueTypes.forEach(issueType => {
              fallbackWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
            });
          });
        }
        
        // Add 'all' workflow for showing all issue types
        fallbackWorkflows['all'] = {
          name: 'All Issues',
          statuses: ['backlog', 'analysis_ready', 'analysis_requirements', 'development', 'acceptance', 'released'],
          colors: {
            'backlog': '#ECEFF1',
            'analysis_ready': '#E1F5FE',
            'analysis_requirements': '#FFF3E0',
            'development': '#E3F2FD',
            'acceptance': '#E8F5E9',
            'released': '#E0F7FA'
          }
        };
        
        setWorkflows(fallbackWorkflows);
        setAvailableBoardTypes(fallbackBoardTypes);
      }
      
      // Get all issues for the project (or all issues if no specific project)
      let issuesResponse;
      if (proj && proj._id) {
        issuesResponse = await api.get(`/issues?project=${proj._id}`);
      } else {
        // If no project selected, get all issues from all projects
        issuesResponse = await api.get('/issues');
      }
      const allIssues = issuesResponse.data.issues;
      
      // Filter issues by board type
      const filteredIssues = allIssues.filter(issue => {
        if (boardType === 'all') {
          return true; // Show all issues
        }
        if (boardType === 'subtask') {
          return issue.type === 'subtask' || issue.parentIssue; // Include subtasks and issues with parent
        }
        return issue.type === boardType;
      });
      
      // Group filtered issues by status using dynamic workflow
      const normalizeStatus = (value) => String(value || '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');
      const groupedColumns = {};
      let currentWorkflow = workflows[boardType];
      
      // For 'all' board type, create a workflow from all available statuses
      if (boardType === 'all') {
        const allStatuses = [...new Set(allIssues.map(issue => issue.status))];
        currentWorkflow = {
          name: 'All Issues',
          statuses: allStatuses
        };
      }
      
      if (currentWorkflow && currentWorkflow.statuses) {
        currentWorkflow.statuses.forEach((status) => {
          const normalizedTarget = normalizeStatus(status);
          groupedColumns[status] = filteredIssues.filter((issue) => normalizeStatus(issue.status) === normalizedTarget);
        });
      } else {
        // Fallback: use all available statuses from issues
        const allStatuses = [...new Set(allIssues.map(issue => issue.status))];
        allStatuses.forEach((status) => {
          const normalizedTarget = normalizeStatus(status);
          groupedColumns[status] = filteredIssues.filter((issue) => normalizeStatus(issue.status) === normalizedTarget);
        });
      }
      
      setColumns(groupedColumns);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  // Initialize workflows when system config is loaded
  useEffect(() => {
    if (systemConfig && systemConfig.workflowTemplates && Object.keys(workflows).length === 0) {
      const initialWorkflows = {};
      systemConfig.workflowTemplates.forEach(template => {
        template.issueTypes.forEach(issueType => {
          initialWorkflows[issueType] = createWorkflowFromTemplate(template, issueType);
        });
      });
      setWorkflows(initialWorkflows);
    }
  }, [systemConfig]);

  useEffect(() => {
    loadBoard();
    const interval = setInterval(() => {
      loadBoard();
    }, 15000);
    return () => clearInterval(interval);
  }, [searchParams, boardType]);

  // Listen for custom events from other components (like Sprint dialog)
  useEffect(() => {
    const handleIssuesDataChanged = (event) => {
      const { action, projectId } = event.detail;
      console.log(`🔄 Board data changed: ${action} in project ${projectId}`);
      
      // Only refresh if we're viewing the specific project or all projects
      if (!project || project._id === projectId) {
        console.log('🔄 Refreshing Board page due to external data change');
        loadBoard();
      }
    };

    window.addEventListener('issuesDataChanged', handleIssuesDataChanged);
    
    return () => {
      window.removeEventListener('issuesDataChanged', handleIssuesDataChanged);
    };
  }, [project]);

  const onDragStart = (event) => {
    const issue = event?.active?.data?.current?.issue;
    setActiveIssue(issue || null);
  };

  const onDragEnd = async (event) => {
    const issue = event?.active?.data?.current?.issue;
    const overId = event?.over?.id;
    setActiveIssue(null);
    
    const currentWorkflow = workflows[boardType];
    if (!issue || !overId || !currentWorkflow?.statuses?.includes(String(overId))) return;
    
    try {
      await api.post(`/boards/move/${issue._id}`, { status: String(overId) });
      // Optimistic update
      setColumns((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter((c) => c._id !== issue._id);
        }
        next[String(overId)] = [issue, ...(next[String(overId)] || [])];
        return next;
      });
      
      // Notify other components that issues data has changed
      window.dispatchEvent(new CustomEvent('issuesDataChanged', { 
        detail: { 
          action: 'update', 
          projectId: issue.project,
          issueId: issue._id
        } 
      }));
      
      // Background refresh
      loadBoard();
    } catch (_) {}
  };

  const columnTitle = (s) => s.replace('_', ' ');
  const getHeaderBg = (status) => {
    const currentWorkflow = workflows[boardType];
    return currentWorkflow?.colors?.[status] || '#ECEFF1';
  };

  const handleLinkClick = (issue) => {
    setLinkingDialog({ open: true, issue });
  };

  const handleLinkUpdate = () => {
    loadBoard(); // Refresh the board to show updated linking information
  };

  // CRUD Handler functions
  const handleCreateIssue = async () => {
    if (!project) return;
    
    try {
      // Extract custom fields dynamically
      const { title, description, type, priority, ...customFields } = form;
      
      const response = await api.post('/issues', {
        title,
        description,
        project: project._id,
        type,
        priority,
        status: 'backlog',
        // Include all custom fields dynamically
        ...customFields
      });
      
      setCreateDialogOpen(false);
      setForm({ 
        title: '', 
        description: '', 
        type: boardType, 
        priority: 'medium',
        assignees: [],
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
          projectId: project._id,
          issueId: response.data.issue._id
        } 
      }));
      
      showSnackbar('Issue created successfully', 'success');
      loadBoard(); // Refresh the board
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    }
  };

  const handleEditIssue = async () => {
    if (!editingIssue) return;
    
    try {
      // Extract custom fields dynamically
      const { title, description, type, priority, ...customFields } = form;
      
      await api.patch(`/issues/${editingIssue._id}`, {
        title,
        description,
        type,
        priority,
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
      loadBoard(); // Refresh the board
    } catch (err) {
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
      loadBoard(); // Refresh the board
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const openCreateDialog = () => {
    setForm({ 
      title: '', 
      description: '', 
      project: project?._id || '', // Set project if available
      type: boardType, 
      priority: 'medium',
      assignees: [],
      sprint: '',
      acceptanceCriteria: '',
      testPlan: '',
      startDate: '',
      endDate: '',
      estimate: '',
      actual: { date: '', hours: '' }
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (issue) => {
    setEditingIssue(issue);
    setForm({
      title: issue.title || '',
      description: issue.description || '',
      type: issue.type || 'task',
      priority: issue.priority || 'medium',
      assignees: issue.assignees || [],
      sprint: issue.sprint || '',
      acceptanceCriteria: issue.acceptanceCriteria || '',
      testPlan: issue.testPlan || '',
      startDate: issue.startDate || '',
      endDate: issue.endDate || '',
      estimate: issue.estimate || '',
      actual: issue.actual || { date: '', hours: '' }
    });
    setEditDialogOpen(true);
  };

  const confirmDelete = (issue) => {
    setConfirm({ open: true, issue });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get icon component for issue types
  const getIconComponent = (iconName) => {
    const icons = {
      assignment: AssignmentIcon,
      bug_report: BugReportIcon,
      book: BookIcon,
      list: ListIcon
    };
    return icons[iconName] || AssignmentIcon;
  };

  function DroppableColumn({ id, children }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <Box
        ref={setNodeRef}
        sx={{
          minHeight: '60vh',
          p: 1,
          borderRadius: 1,
          bgcolor: isOver ? 'action.hover' : 'transparent',
          transition: 'background-color 0.2s',
          border: isOver ? '2px dashed' : '2px solid transparent',
          borderColor: isOver ? 'primary.main' : 'transparent'
        }}
      >
        {children}
      </Box>
    );
  }

  function DraggableIssue({ issue }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: issue._id, data: { issue } });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          cursor: 'grab',
          transform: transform ? 'rotate(2deg)' : 'none',
          transition: 'transform 0.2s',
          '&:hover': {
            boxShadow: 3
          },
          '&:active': {
            cursor: 'grabbing'
          }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Issue Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                {issue.key?.charAt(0) || '?'}
              </Avatar>
              <Typography variant="body2" fontWeight="bold" noWrap>
                {issue.key}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={issue.type} 
                size="small" 
                color={issue.type === 'bug' ? 'error' : issue.type === 'story' ? 'primary' : 'default'}
                variant="outlined"
              />
            </Box>
          </Box>
          
          {/* Issue Title */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {issue.title}
          </Typography>
          
          {/* Issue Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Chip 
              label={issue.priority} 
              size="small" 
              color={issue.priority === 'high' ? 'error' : issue.priority === 'medium' ? 'warning' : 'default'}
              variant="outlined"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {issue.assignee && (
                <Tooltip title={issue.assignee.name || 'Unassigned'}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                    {(issue.assignee.name || '?').charAt(0)}
                  </Avatar>
                </Tooltip>
              )}
              {user && (
                <DailyStatusIndicator 
                  issueId={issue._id} 
                  userId={user._id} 
                  issue={issue}
                />
              )}
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(issue);
                }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(issue);
                }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
      </Box>
        </CardContent>
      </Card>
    );
  }

  const currentWorkflow = workflows[boardType] || { name: 'Default', statuses: [] };

  return (
    <Box sx={{ p: 2 }}>
      {/* Board Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {project ? `${project.key} — ${project.name}` : 'All Projects'} - Kanban View
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project ? `Project Board` : 'All Projects Board - showing issues from all projects'}
            </Typography>
          </Box>
        <Stack direction="row" spacing={1}>
          {allProjects.length > 0 && (
            <Select
              size="small"
              value={project?._id || 'all'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setSearchParams({}); // Remove project parameter
                } else {
                  setSearchParams({ project: e.target.value });
                }
              }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem key="all-projects-board" value="all">All Projects</MenuItem>
              {allProjects.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
              ))}
            </Select>
          )}
          <Button size="small" onClick={loadBoard}>Refresh</Button>
        </Stack>
        </Box>

        {/* Board Type Selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {availableBoardTypes.map((type) => (
            <Button
              key={type}
              variant={type === boardType ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setBoardType(type)}
            >
              {type === 'all' ? 'All Issues' :
               type === 'bug' ? 'Bug' : 
               type === 'story' ? 'Story' :
               type === 'task' ? 'Task' :
               type === 'subtask' ? 'Subtask' :
               type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Kanban Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto',
            pb: 2,
            minHeight: '70vh'
          }}>
            {(currentWorkflow.statuses || []).map((status) => (
              <Box key={status} sx={{ minWidth: 300, flex: '0 0 300px' }}>
                {/* Column Header */}
                <Paper 
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {columnTitle(status)}
                      </Typography>
                      {/* Show which issue types can use this status */}
                      {projectConfig?.issueTypes && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {projectConfig.issueTypes
                            .filter(issueType => issueType.workflow?.includes(status))
                            .map(issueType => (
                              <Chip
                                key={issueType.name}
                                label={issueType.displayName || issueType.name}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))
                          }
                        </Box>
                      )}
                    </Box>
                    <Badge 
                      badgeContent={columns[status]?.length || 0} 
                      color="primary"
                      showZero
                    />
                  </Box>
                </Paper>

                {/* Droppable Column */}
                <DroppableColumn id={status}>
                  {/* Issues in this column */}
                  {(columns[status] || []).map((issue) => (
                    <DraggableIssue key={issue._id} issue={issue} />
                  ))}

                  {/* Empty state */}
                  {(!columns[status] || columns[status].length === 0) && (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      color: 'text.secondary',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2">
                        No {boardType}s in {columnTitle(status).toLowerCase()}
                    </Typography>
                    </Box>
                  )}
                </DroppableColumn>
              </Box>
            ))}
          </Box>
          <DragOverlay>
            {activeIssue ? <IssueCard issue={activeIssue} /> : null}
          </DragOverlay>
        </DndContext>
        </>
      )}
      
      {/* Issue Linking Dialog */}
      <IssueLinking
        open={linkingDialog.open}
        onClose={() => setLinkingDialog({ open: false, issue: null })}
        issue={linkingDialog.issue}
        onLinkUpdate={handleLinkUpdate}
      />

      {/* Create Issue Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              required
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
              <InputLabel>Project *</InputLabel>
              <Select
                value={form.project || ''}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                label="Project *"
                required
              >
                {allProjects.map((p) => (
                  <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem key="task-board" value="task">Task</MenuItem>
                  <MenuItem key="bug-board" value="bug">Bug</MenuItem>
                  <MenuItem key="story-board" value="story">Story</MenuItem>
                  <MenuItem key="subtask-board" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem key="low-board" value="low">Low</MenuItem>
                  <MenuItem key="medium-board" value="medium">Medium</MenuItem>
                  <MenuItem key="high-board" value="high">High</MenuItem>
                  <MenuItem key="critical-board" value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <CustomFields
              fields={form}
              onFieldChange={(field, value) => setForm({ ...form, [field]: value })}
              projectId={project?._id}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateIssue} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Issue Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              required
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
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem key="task-board" value="task">Task</MenuItem>
                  <MenuItem key="bug-board" value="bug">Bug</MenuItem>
                  <MenuItem key="story-board" value="story">Story</MenuItem>
                  <MenuItem key="subtask-board" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem key="low-board" value="low">Low</MenuItem>
                  <MenuItem key="medium-board" value="medium">Medium</MenuItem>
                  <MenuItem key="high-board" value="high">High</MenuItem>
                  <MenuItem key="critical-board" value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <CustomFields
              fields={form}
              onFieldChange={(field, value) => setForm({ ...form, [field]: value })}
              projectId={project?._id}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditIssue} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title="Delete Issue"
        message={`Are you sure you want to delete "${confirm.issue?.title}"? This action cannot be undone.`}
        onCancel={() => setConfirm({ open: false, issue: null })}
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
    </Box>
  );
}

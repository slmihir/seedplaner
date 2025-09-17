import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Badge,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  BugReport as BugReportIcon,
  Assignment as TaskIcon,
  AutoStories as StoryIcon,
  TaskAlt as SubTaskIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../api/client';
import DailyStatusIndicator from './DailyStatusIndicator';

// Default status workflow (fallback)
const DEFAULT_STATUSES = [
  { id: 'backlog', label: 'Backlog', color: 'default' },
  { id: 'analysis_ready', label: 'Analysis Ready', color: 'info' },
  { id: 'development', label: 'Development', color: 'warning' },
  { id: 'acceptance', label: 'Acceptance', color: 'primary' },
  { id: 'released', label: 'Released', color: 'success' }
];

const SprintBoard = ({ sprintId, sprint, onIssueUpdate, currentUserId }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);
  const [selectedBoardType, setSelectedBoardType] = useState('all');
  const [users, setUsers] = useState([]);
  
  // CRUD Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [viewingIssue, setViewingIssue] = useState(null);
  const [issueMenuAnchor, setIssueMenuAnchor] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    assignees: [],
    storyPoints: ''
  });

  // Load sprint issues and project configuration
  useEffect(() => {
    if (sprintId && sprint?.project) {
      loadSprintIssues();
      loadProjectConfig();
      loadUsers();
    }
  }, [sprintId, sprint?.project]);

  const loadSprintIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/sprints/${sprintId}/summary`);
      const sprintSummary = response.data;
      
      // Flatten all issues from groups
      const allIssues = Object.values(sprintSummary.groups || {}).flat();
      
      setIssues(allIssues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sprint issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectConfig = async () => {
    try {
      const response = await api.get(`/project-config/${sprint.project}`);
      setProjectConfig(response.data);
    } catch (err) {
      console.warn('Failed to load project configuration:', err);
      setProjectConfig(null);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.warn('Failed to load users:', err);
      setUsers([]);
    }
  };

  // Get workflow for a specific issue type
  const getWorkflowForIssueType = (issueType) => {
    if (!projectConfig?.issueTypes) {
      return DEFAULT_STATUSES;
    }
    
    const issueTypeConfig = projectConfig.issueTypes.find(type => type.name === issueType);
    if (!issueTypeConfig?.workflow) {
      return DEFAULT_STATUSES;
    }
    
    // Convert workflow status names to status objects
    return issueTypeConfig.workflow.map(statusName => {
      const statusConfig = projectConfig.statuses?.find(s => s.name === statusName);
      return {
        id: statusName,
        label: statusConfig?.displayName || statusName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: statusConfig?.color || 'default'
      };
    });
  };

  // Get all unique statuses across all issue types in the sprint
  const getAllStatuses = useMemo(() => {
    const allStatuses = new Set();
    
    // Add default statuses
    DEFAULT_STATUSES.forEach(status => allStatuses.add(status.id));
    
    // Add statuses from project configuration
    if (projectConfig?.statuses) {
      projectConfig.statuses.forEach(status => allStatuses.add(status.name));
    }
    
    // Convert to status objects
    return Array.from(allStatuses).map(statusId => {
      const statusConfig = projectConfig?.statuses?.find(s => s.name === statusId);
      return {
        id: statusId,
        label: statusConfig?.displayName || statusId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: statusConfig?.color || 'default'
      };
    });
  }, [projectConfig]);

  // Filter issues by board type
  const filteredIssues = useMemo(() => {
    if (selectedBoardType === 'all') {
      return issues;
    }
    return issues.filter(issue => issue.type === selectedBoardType);
  }, [issues, selectedBoardType]);

  // Organize issues by status
  const issuesByStatus = useMemo(() => {
    const organized = {};
    getAllStatuses.forEach(status => {
      organized[status.id] = filteredIssues.filter(issue => issue.status === status.id);
    });
    return organized;
  }, [filteredIssues, getAllStatuses]);

  // Get available board types
  const availableBoardTypes = useMemo(() => {
    const types = ['all'];
    const issueTypes = new Set(issues.map(issue => issue.type));
    issueTypes.forEach(type => types.push(type));
    return types;
  }, [issues]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handle drag and drop
  const handleDragEnd = async (event) => {
    console.log('🔄 Drag and drop triggered:', event);
    
    const { active, over } = event;

    if (!over) {
      console.log('❌ No destination - drag cancelled');
      return;
    }

    const issueId = active.id;
    
    // Find the issue being moved
    const issue = filteredIssues.find(i => i._id === issueId);
    if (!issue) {
      console.log('❌ Issue not found:', issueId);
      setError('Issue not found');
      return;
    }
    
    console.log('📋 Issue found:', issue.key, issue.type, 'Current status:', issue.status);
    
    // Determine the new status based on where the issue was dropped
    let newStatus;
    
    // Check if dropped on another issue (reorder within same column)
    if (over.id === issueId) {
      console.log('❌ Dropped on same issue - no change needed');
      return;
    }
    
    // Check if dropped on a status column
    const statusColumn = getAllStatuses.find(status => status.id === over.id);
    if (statusColumn) {
      newStatus = statusColumn.id;
      console.log(`🎯 Dropped on status column: ${statusColumn.label} (${newStatus})`);
    } else {
      // Check if dropped on another issue - find which column it's in
      const targetIssue = filteredIssues.find(i => i._id === over.id);
      if (targetIssue) {
        newStatus = targetIssue.status;
        console.log(`🎯 Dropped on issue in ${targetIssue.status} column`);
      } else {
        console.log('❌ Could not determine target status');
        setError('Could not determine target status');
        return;
      }
    }
    
    console.log(`🎯 Moving issue ${issueId} from ${issue.status} to ${newStatus}`);
    
    // Check if status is actually changing
    if (issue.status === newStatus) {
      console.log('❌ Same status - no change needed');
      return;
    }
    
    // Validate that the new status is valid for this issue type
    const validStatuses = getWorkflowForIssueType(issue.type);
    const isValidStatus = validStatuses.some(status => status.id === newStatus);
    
    console.log('✅ Valid statuses for', issue.type, ':', validStatuses.map(s => s.id));
    console.log('🎯 New status valid?', isValidStatus);
    
    if (!isValidStatus) {
      const errorMsg = `Cannot move ${issue.type} to ${newStatus}. Valid statuses for ${issue.type} are: ${validStatuses.map(s => s.label).join(', ')}`;
      console.log('❌ Invalid status:', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      console.log('🚀 Starting API update...');
      
      // Optimistic update
      const updatedIssues = issues.map(issue => 
        issue._id === issueId ? { ...issue, status: newStatus } : issue
      );
      setIssues(updatedIssues);
      console.log('✨ Optimistic update applied');

      // API call to update issue status
      const response = await api.patch(`/issues/${issueId}`, { status: newStatus });
      console.log('✅ API update successful:', response.status);
      
      // Clear any previous errors
      setError(null);
      
      // Notify parent component
      if (onIssueUpdate) {
        onIssueUpdate();
      }
    } catch (err) {
      console.error('❌ API update failed:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update issue status';
      setError(errorMsg);
      // Revert optimistic update
      await loadSprintIssues();
    }
  };

  // Droppable Column Component
  const DroppableColumn = ({ status, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status.id,
    });

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
  };

  // Sortable Issue Component
  const SortableIssue = ({ issue }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: issue._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          cursor: 'grab',
          transform: isDragging ? 'rotate(5deg)' : 'none',
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
                {getIssueTypeIcon(issue.type)}
              </Avatar>
              <Typography variant="body2" fontWeight="bold" noWrap>
                {issue.key}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={issue.priority} 
                size="small" 
                color={getPriorityColor(issue.priority)}
                variant="outlined"
              />
              {currentUserId && (
                <DailyStatusIndicator 
                  issueId={issue._id} 
                  userId={currentUserId} 
                  issue={issue}
                />
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIssueMenuOpen(e, issue);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Issue Title */}
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {issue.title}
          </Typography>

          {/* Issue Meta */}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip 
              label={issue.type} 
              size="small" 
              variant="outlined"
            />
            {issue.assignees && issue.assignees.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {issue.assignees.slice(0, 2).map((assignee, index) => (
                  <Chip 
                    key={index}
                    label={typeof assignee === 'string' ? assignee : assignee.name}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
                {issue.assignees.length > 2 && (
                  <Chip 
                    label={`+${issue.assignees.length - 2}`}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                )}
              </Box>
            )}
          </Stack>

          {/* Story Points (if available) */}
          {issue.storyPoints && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Chip 
                label={`${issue.storyPoints} pts`}
                size="small"
                color="info"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Get issue type icon
  const getIssueTypeIcon = (type) => {
    switch (type) {
      case 'story': return <StoryIcon />;
      case 'task': return <TaskIcon />;
      case 'bug': return <BugReportIcon />;
      case 'subtask': return <SubTaskIcon />;
      default: return <TaskIcon />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get status color
  const getStatusColor = (statusId) => {
    const status = getAllStatuses.find(s => s.id === statusId);
    return status?.color || 'default';
  };

  // Check if a status is valid for an issue type
  const isStatusValidForIssueType = (statusId, issueType) => {
    const validStatuses = getWorkflowForIssueType(issueType);
    return validStatuses.some(status => status.id === statusId);
  };

  // CRUD Operations
  const handleCreateIssue = async () => {
    try {
      const response = await api.post('/issues', {
        ...form,
        project: sprint.project,
        sprint: sprintId
      });
      
      setCreateDialogOpen(false);
      setForm({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assignees: [],
        storyPoints: ''
      });
      
      await loadSprintIssues();
      if (onIssueUpdate) onIssueUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    }
  };

  const handleEditIssue = async () => {
    if (!editingIssue) return;
    
    try {
      await api.patch(`/issues/${editingIssue._id}`, form);
      
      setEditDialogOpen(false);
      setEditingIssue(null);
      setForm({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assignees: [],
        storyPoints: ''
      });
      
      await loadSprintIssues();
      if (onIssueUpdate) onIssueUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update issue');
    }
  };

  const handleDeleteIssue = async (issue) => {
    if (!window.confirm(`Are you sure you want to delete ${issue.key}?`)) return;
    
    try {
      await api.delete(`/issues/${issue._id}`);
      await loadSprintIssues();
      if (onIssueUpdate) onIssueUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const openEditDialog = (issue) => {
    setEditingIssue(issue);
    setForm({
      title: issue.title || '',
      description: issue.description || '',
      type: issue.type || 'task',
      priority: issue.priority || 'medium',
      assignees: issue.assignees ? issue.assignees.map(a => a._id || a) : [],
      storyPoints: issue.storyPoints || ''
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (issue) => {
    setViewingIssue(issue);
    setViewDialogOpen(true);
  };

  const handleIssueMenuOpen = (event, issue) => {
    setIssueMenuAnchor(event.currentTarget);
    setSelectedIssue(issue);
  };

  const handleIssueMenuClose = () => {
    setIssueMenuAnchor(null);
    setSelectedIssue(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading sprint board...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Sprint Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {sprint?.name} - Sprint Board
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sprint?.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Not started'} → {sprint?.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'No end date'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Issue
          </Button>
        </Box>

        {/* Board Type Selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {availableBoardTypes.map((boardType) => (
            <Button
              key={boardType}
              variant={selectedBoardType === boardType ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSelectedBoardType(boardType)}
            >
              {boardType === 'all' ? 'All Issues' : boardType.charAt(0).toUpperCase() + boardType.slice(1)}
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

      {/* Kanban Board */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          console.log('🚀 Drag started:', event);
          console.log('📋 Drag start details:', {
            activeId: event.active.id,
            active: event.active
          });
        }}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 2,
          minHeight: '70vh'
        }}>
          {getAllStatuses.map((status) => (
            <Box key={status.id} sx={{ minWidth: 300, flex: '0 0 300px' }}>
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
                      {status.label}
                    </Typography>
                    {/* Show which issue types can use this status */}
                    {projectConfig?.issueTypes && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {projectConfig.issueTypes
                          .filter(issueType => issueType.workflow?.includes(status.id))
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
                    badgeContent={issuesByStatus[status.id]?.length || 0} 
                    color={status.color}
                    showZero
                  />
                </Box>
              </Paper>

              {/* Droppable Column */}
              <DroppableColumn status={status}>
                <SortableContext items={issuesByStatus[status.id]?.map(issue => issue._id) || []} strategy={verticalListSortingStrategy}>
                  {/* Issues in this column */}
                  {issuesByStatus[status.id]?.map((issue) => (
                    <SortableIssue key={issue._id} issue={issue} />
                  ))}

                  {/* Empty state */}
                  {(!issuesByStatus[status.id] || issuesByStatus[status.id].length === 0) && (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      color: 'text.secondary',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2">
                        No issues in {status.label.toLowerCase()}
                      </Typography>
                    </Box>
                  )}
                </SortableContext>
              </DroppableColumn>
            </Box>
          ))}
        </Box>
      </DndContext>

      {/* Issue Action Menu */}
      <Menu
        anchorEl={issueMenuAnchor}
        open={Boolean(issueMenuAnchor)}
        onClose={handleIssueMenuClose}
      >
        <MenuItem onClick={() => { openViewDialog(selectedIssue); handleIssueMenuClose(); }}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { openEditDialog(selectedIssue); handleIssueMenuClose(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteIssue(selectedIssue); handleIssueMenuClose(); }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <MenuItem key="task-sprintboard" value="task">Task</MenuItem>
                  <MenuItem key="bug-sprintboard" value="bug">Bug</MenuItem>
                  <MenuItem key="story-sprintboard" value="story">Story</MenuItem>
                  <MenuItem key="subtask-sprintboard" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  label="Priority"
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <MenuItem key="low-sprintboard" value="low">Low</MenuItem>
                  <MenuItem key="medium-sprintboard" value="medium">Medium</MenuItem>
                  <MenuItem key="high-sprintboard" value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={form.assignees}
                label="Assignees"
                onChange={(e) => setForm({ ...form, assignees: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find(u => u._id === userId);
                      return user ? (
                        <Chip key={userId} size="small" label={user.name} />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Story Points"
              type="number"
              value={form.storyPoints}
              onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
              sx={{ maxWidth: 120 }}
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <MenuItem key="task-sprintboard" value="task">Task</MenuItem>
                  <MenuItem key="bug-sprintboard" value="bug">Bug</MenuItem>
                  <MenuItem key="story-sprintboard" value="story">Story</MenuItem>
                  <MenuItem key="subtask-sprintboard" value="subtask">Subtask</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={form.priority}
                  label="Priority"
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <MenuItem key="low-sprintboard" value="low">Low</MenuItem>
                  <MenuItem key="medium-sprintboard" value="medium">Medium</MenuItem>
                  <MenuItem key="high-sprintboard" value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={form.assignees}
                label="Assignees"
                onChange={(e) => setForm({ ...form, assignees: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((userId) => {
                      const user = users.find(u => u._id === userId);
                      return user ? (
                        <Chip key={userId} size="small" label={user.name} />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Story Points"
              type="number"
              value={form.storyPoints}
              onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
              sx={{ maxWidth: 120 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditIssue} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Issue Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewingIssue?.key} - {viewingIssue?.title}
        </DialogTitle>
        <DialogContent>
          {viewingIssue && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">{viewingIssue.description}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Type: ${viewingIssue.type}`} variant="outlined" />
                <Chip label={`Priority: ${viewingIssue.priority}`} variant="outlined" />
                <Chip label={`Status: ${viewingIssue.status}`} variant="outlined" />
                {viewingIssue.storyPoints && (
                  <Chip label={`${viewingIssue.storyPoints} points`} variant="outlined" />
                )}
              </Box>
              {viewingIssue.assignees && viewingIssue.assignees.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Assignees:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingIssue.assignees.map((assignee, index) => (
                      <Chip
                        key={index}
                        label={typeof assignee === 'object' ? assignee.name : assignee}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SprintBoard;

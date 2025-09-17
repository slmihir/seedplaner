/**
 * Enhanced Subtask Manager Component
 * Handles creation, editing, and management of subtasks
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
  Divider,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  List as SubTaskIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../api/client';

const SubtaskManager = ({ open, onClose, parentIssue, onSubtaskUpdate }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, subtask: null });
  const [projectMembers, setProjectMembers] = useState([]);

  // Form state for creating/editing subtasks
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [],
    estimate: '',
    priority: 'medium',
    status: 'backlog'
  });

  useEffect(() => {
    if (open && parentIssue) {
      loadSubtasks();
      loadProjectMembers();
    }
  }, [open, parentIssue]);

  const loadSubtasks = async () => {
    if (!parentIssue) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/issues/${parentIssue._id}/hierarchy`);
      setSubtasks(response.data.hierarchy.children || []);
    } catch (err) {
      console.error('Failed to load subtasks:', err);
      setError('Failed to load subtasks');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    try {
      // parentIssue.project can be populated or id; normalize
      const projectId = parentIssue.project?._id || parentIssue.project;
      if (!projectId) return;
      const resp = await api.get(`/projects/${projectId}/members`);
      const members = (resp.data.members || [])
        .filter((m) => m && m.user)
        .map((m) => ({ _id: m.user._id || m.user, name: m.user.name, email: m.user.email }));
      setProjectMembers(members);
    } catch (_) {
      // Non-fatal for UI; leave members empty
      setProjectMembers([]);
    }
  };

  const handleCreateSubtask = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/issues/subtask', {
        title: formData.title,
        description: formData.description,
        parentIssueId: parentIssue._id,
        assignees: formData.assignees,
        estimate: formData.estimate ? parseInt(formData.estimate) : undefined,
        priority: formData.priority,
        status: formData.status
      });

      await loadSubtasks();
      onSubtaskUpdate?.();
      setCreateDialog(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subtask');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubtask = async () => {
    if (!editDialog.subtask || !formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.patch(`/issues/${editDialog.subtask._id}`, {
        title: formData.title,
        description: formData.description,
        assignees: formData.assignees,
        estimate: formData.estimate ? parseInt(formData.estimate) : undefined,
        priority: formData.priority,
        status: formData.status
      });

      await loadSubtasks();
      onSubtaskUpdate?.();
      setEditDialog({ open: false, subtask: null });
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subtask');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/issues/${subtaskId}`);
      await loadSubtasks();
      onSubtaskUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subtask');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignees: [],
      estimate: '',
      priority: 'medium',
      status: 'backlog'
    });
  };

  const openEditDialog = (subtask) => {
    setFormData({
      title: subtask.title,
      description: subtask.description || '',
      assignees: (subtask.assignees || []).map((a) => a?._id || a),
      estimate: subtask.estimate || '',
      priority: subtask.priority || 'medium',
      status: subtask.status || 'backlog'
    });
    setEditDialog({ open: true, subtask });
  };

  const toggleSubtaskExpansion = (subtaskId) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(subtaskId)) {
      newExpanded.delete(subtaskId);
    } else {
      newExpanded.add(subtaskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const getStatusColor = (status) => {
    const colors = {
      'backlog': 'default',
      'development': 'primary',
      'code_review': 'warning',
      'qa': 'info',
      'deployment': 'secondary',
      'released': 'success'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error',
      'critical': 'error'
    };
    return colors[priority] || 'default';
  };

  if (!parentIssue) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SubTaskIcon color="primary" />
            <Typography variant="h6">
              Subtasks for {parentIssue.key}: {parentIssue.title}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Create Subtask Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
              disabled={loading}
            >
              Create New Subtask
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Subtasks List */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && subtasks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SubTaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No subtasks yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first subtask to break down this issue into smaller tasks
              </Typography>
            </Box>
          )}

          {!loading && subtasks.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Subtasks ({subtasks.length})
              </Typography>
              <List>
                {subtasks.map((subtask, index) => (
                  <Card key={subtask._id} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {subtask.key}
                            </Typography>
                            <Chip
                              label={subtask.status}
                              size="small"
                              color={getStatusColor(subtask.status)}
                              variant="outlined"
                            />
                            <Chip
                              label={subtask.priority}
                              size="small"
                              color={getPriorityColor(subtask.priority)}
                              variant="outlined"
                            />
                            {subtask.estimate && (
                              <Chip
                                label={`${subtask.estimate}h`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body1" gutterBottom>
                            {subtask.title}
                          </Typography>
                          
                          {subtask.description && (
                            <Typography variant="body2" color="text.secondary">
                              {subtask.description}
                            </Typography>
                          )}

                          {subtask.assignees && subtask.assignees.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {(() => {
                                  const labels = subtask.assignees
                                    .map((a) => {
                                      const id = a?._id || a;
                                      const nameOrEmail = a?.name || a?.email;
                                      if (nameOrEmail) return nameOrEmail;
                                      const m = projectMembers.find((u) => String(u._id) === String(id));
                                      return m ? (m.name || m.email) : undefined;
                                    })
                                    .filter(Boolean)
                                    .join(', ');
                                  return labels ? `Assigned to: ${labels}` : '';
                                })()}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Subtask">
                            <IconButton 
                              size="small" 
                              onClick={() => openEditDialog(subtask)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Subtask">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteSubtask(subtask._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Subtask Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Subtask</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={formData.assignees}
                onChange={(e) => setFormData({ ...formData, assignees: e.target.value })}
                label="Assignees"
                renderValue={(selected) => {
                  const labels = selected
                    .map((id) => projectMembers.find((u) => String(u._id) === String(id)))
                    .filter(Boolean)
                    .map((u) => u.name || u.email);
                  return labels.join(', ');
                }}
              >
                {projectMembers.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name || u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="backlog">Backlog</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="code_review">Code Review</MenuItem>
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="deployment">Deployment</MenuItem>
                  <MenuItem value="released">Released</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Estimate (hours)"
              type="number"
              value={formData.estimate}
              onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSubtask} 
            variant="contained"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Subtask'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subtask Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, subtask: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subtask</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assignees</InputLabel>
              <Select
                multiple
                value={formData.assignees}
                onChange={(e) => setFormData({ ...formData, assignees: e.target.value })}
                label="Assignees"
                renderValue={(selected) => {
                  const labels = selected
                    .map((id) => projectMembers.find((u) => String(u._id) === String(id)))
                    .filter(Boolean)
                    .map((u) => u.name || u.email);
                  return labels.join(', ');
                }}
              >
                {projectMembers.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name || u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="backlog">Backlog</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="code_review">Code Review</MenuItem>
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="deployment">Deployment</MenuItem>
                  <MenuItem value="released">Released</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Estimate (hours)"
              type="number"
              value={formData.estimate}
              onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, subtask: null })}>Cancel</Button>
          <Button 
            onClick={handleUpdateSubtask} 
            variant="contained"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Subtask'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubtaskManager;

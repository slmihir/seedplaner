import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
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
  IconButton
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SystemConfiguration() {
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingFieldType, setEditingFieldType] = useState(null);
  const [editingCostCategory, setEditingCostCategory] = useState(null);
  const [editingWorkflowTemplate, setEditingWorkflowTemplate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [formData, setFormData] = useState({});
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('🔍 SystemConfiguration useEffect - loading system config...');
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Loading system configuration...');
      console.log('🔍 SystemConfiguration - user:', user);
      console.log('🔍 SystemConfiguration - authLoading:', authLoading);
      
      const response = await api.get('/system-config');
      console.log('✅ System config response:', response.data);
      
      setSystemConfig(response.data.config);
    } catch (err) {
      console.error('❌ Failed to load system configuration:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load system configuration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFieldType = (fieldType) => {
    setEditingFieldType(fieldType);
    setFormData({
      name: fieldType.name,
      displayName: fieldType.displayName,
      inputType: fieldType.inputType,
      isRequired: fieldType.isRequired,
      description: fieldType.description || ''
    });
    setDialogType('fieldType');
    setDialogOpen(true);
  };

  const handleEditCostCategory = (category) => {
    setEditingCostCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    setDialogType('costCategory');
    setDialogOpen(true);
  };

  const handleEditWorkflowTemplate = (template) => {
    setEditingWorkflowTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      statuses: template.statuses || []
    });
    setDialogType('workflowTemplate');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (dialogType === 'fieldType') {
        // Update field type
        await api.put('/system-config/field-types', {
          fieldType: formData,
          isEditing: !!editingFieldType
        });
        setSuccess('Field type saved successfully');
      } else if (dialogType === 'costCategory') {
        // Update cost category
        await api.put('/system-config/cost-categories', {
          category: formData,
          isEditing: !!editingCostCategory
        });
        setSuccess('Cost category saved successfully');
      } else if (dialogType === 'workflowTemplate') {
        // Update workflow template - merge with existing templates
        const currentConfig = await api.get('/system-config');
        const existingTemplates = currentConfig.data.config.workflowTemplates || [];
        
        let updatedTemplates;
        if (editingWorkflowTemplate) {
          // Update existing template
          updatedTemplates = existingTemplates.map(template => 
            template.name === editingWorkflowTemplate.name 
              ? { ...template, ...formData, lastUpdated: new Date().toISOString() }
              : template
          );
        } else {
          // Add new template
          updatedTemplates = [...existingTemplates, { ...formData, isDefault: false, isActive: true }];
        }
        
        await api.put('/system-config', {
          workflowTemplates: updatedTemplates
        });
        setSuccess('Workflow template saved successfully');
      }
      
      setDialogOpen(false);
      setEditingFieldType(null);
      setEditingCostCategory(null);
      setFormData({});
      await loadSystemConfig();
    } catch (err) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.message || 'Failed to save changes');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFieldType(null);
    setEditingCostCategory(null);
    setEditingWorkflowTemplate(null);
    setFormData({});
    setDialogType('');
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading authentication...</Typography>
      </Box>
    );
  }

  // Check if user has admin access
  const userRoleName = user?.role?.name || user?.role;
  if (!user || (userRoleName !== 'admin' && userRoleName !== 'manager')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
          {user && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">
                User: {user.name} | Role: {JSON.stringify(user.role)}
              </Typography>
            </Box>
          )}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading system configuration...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadSystemConfig} variant="outlined">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage global system settings, field types, cost categories, and workflow templates.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {systemConfig && (
        <Grid container spacing={3}>
          {/* Field Types */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Field Types</Typography>
                  <Chip 
                    label={systemConfig.fieldTypes?.length || 0} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {systemConfig.fieldTypes?.length > 0 ? (
                  <Box>
                    {systemConfig.fieldTypes.map((fieldType, index) => (
                      <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2">
                            <strong>{fieldType.name}</strong> - {fieldType.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Type: {fieldType.inputType} | Required: {fieldType.isRequired ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleEditFieldType(fieldType)}>
                          <EditIcon />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No field types configured
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Categories */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Cost Categories</Typography>
                  <Chip 
                    label={systemConfig.costCategories?.length || 0} 
                    color="secondary" 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {systemConfig.costCategories?.length > 0 ? (
                  <Box>
                    {systemConfig.costCategories.map((category, index) => (
                      <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2">
                            <strong>{category.name}</strong> - {category.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Active: {category.isActive ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleEditCostCategory(category)}>
                          <EditIcon />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No cost categories configured
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Workflow Templates */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Workflow Templates</Typography>
                  <Chip 
                    label={systemConfig.workflowTemplates?.length || 0} 
                    color="success" 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                {systemConfig.workflowTemplates?.length > 0 ? (
                  <Box>
                    {systemConfig.workflowTemplates.map((template, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>{template.name}</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Statuses:</strong> {template.statuses?.map(s => s.label || s).join(' → ')}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleEditWorkflowTemplate(template)}>
                          <EditIcon />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No workflow templates configured
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Raw Data for Debugging */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Raw System Configuration Data
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontSize: '0.75rem', 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(systemConfig, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'fieldType' ? 'Edit Field Type' : 
           dialogType === 'costCategory' ? 'Edit Cost Category' : 
           'Edit Workflow Template'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'fieldType' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Input Type</InputLabel>
                  <Select
                    value={formData.inputType || ''}
                    onChange={(e) => setFormData({ ...formData, inputType: e.target.value })}
                    label="Input Type"
                  >
                    <MenuItem key="text" value="text">Text</MenuItem>
                    <MenuItem key="number" value="number">Number</MenuItem>
                    <MenuItem key="email" value="email">Email</MenuItem>
                    <MenuItem key="date" value="date">Date</MenuItem>
                    <MenuItem key="select" value="select">Select</MenuItem>
                    <MenuItem key="textarea" value="textarea">Textarea</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRequired || false}
                      onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    />
                  }
                  label="Required"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'costCategory' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
          
          {dialogType === 'workflowTemplate' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Statuses (comma-separated)
                </Typography>
                <TextField
                  fullWidth
                  value={formData.statuses?.map(s => s.label || s).join(', ') || ''}
                  onChange={(e) => {
                    const statusStrings = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    const statuses = statusStrings.map((status, index) => ({
                      value: status.toLowerCase().replace(/\s+/g, '_'),
                      label: status,
                      color: 'primary',
                      order: index
                    }));
                    setFormData({ ...formData, statuses });
                  }}
                  placeholder="e.g., Backlog, In Progress, Review, Done"
                  multiline
                  rows={2}
                />
                <Typography variant="caption" color="text.secondary">
                  Enter status names separated by commas. They will be automatically formatted.
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

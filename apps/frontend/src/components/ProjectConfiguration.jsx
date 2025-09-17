import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as TaskIcon,
  BugReport as BugIcon,
  Book as StoryIcon,
  List as SubtaskIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';
import api from '../api/client';

const ProjectConfiguration = ({ projectId, onClose }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [editingFieldType, setEditingFieldType] = useState(null);
  const [fieldTypeDialog, setFieldTypeDialog] = useState({
    open: false,
    fieldType: null,
    isEdit: false
  });

  // Form states
  const [newIssueType, setNewIssueType] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: 'assignment',
    color: 'default',
    workflow: [],
    isDefault: false,
    isActive: true
  });

  const [newCustomField, setNewCustomField] = useState({
    name: '',
    displayName: '',
    type: 'text',
    description: '',
    required: false,
    defaultValue: '',
    options: [],
    validation: {},
    applicableTo: [],
    isActive: true,
    order: 0
  });

  const [newStatus, setNewStatus] = useState({
    name: '',
    displayName: '',
    description: '',
    color: 'default',
    isDefault: false,
    isFinal: false,
    isActive: true,
    order: 0
  });

  const [newFieldType, setNewFieldType] = useState({
    value: '',
    label: '',
    description: '',
    inputType: 'text',
    validation: {},
    isActive: true
  });

  const [workflowDialog, setWorkflowDialog] = useState({
    open: false,
    issueTypeIndex: null,
    issueType: null
  });

  const [editFieldDialog, setEditFieldDialog] = useState({
    open: false,
    fieldIndex: null,
    field: null
  });

  useEffect(() => {
    console.log('🔍 ProjectConfiguration useEffect - projectId:', projectId);
    if (projectId) {
      fetchConfig();
      fetchFieldTypes();
    }
  }, [projectId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching project config for projectId:', projectId);
      const response = await api.get(`/project-config/${projectId}`);
      console.log('✅ Project config response:', response.data);
      setConfig(response.data.config);
    } catch (err) {
      console.error('❌ Error fetching project config:', err);
      if (err.response?.status === 404 || err.response?.status === 401) {
        // No config exists or unauthorized, show initialization option
        console.log('No configuration found or unauthorized, showing initialization option');
        setConfig(null); // This will trigger the "No Configuration Found" alert
      } else {
        setError('Failed to load project configuration');
        console.error('Error fetching config:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldTypes = async () => {
    try {
      const response = await api.get('/system-config/field-types');
      setFieldTypes(response.data.fieldTypes);
    } catch (err) {
      console.error('Error fetching field types:', err);
    }
  };

  const initializeDefaultConfig = async () => {
    try {
      console.log('🔧 Initializing default configuration for project:', projectId);
      const response = await api.post(`/project-config/${projectId}/initialize`);
      console.log('✅ Configuration initialized:', response.data);
      setConfig(response.data.config);
      setSuccess('Default configuration created successfully');
    } catch (err) {
      console.error('❌ Error initializing config:', err);
      setError(`Failed to initialize default configuration: ${err.response?.data?.message || err.message}`);
    }
  };

  const updateConfig = async () => {
    try {
      const response = await api.patch(`/project-config/${projectId}`, config);
      setConfig(response.data.config);
      setSuccess('Configuration updated successfully');
    } catch (err) {
      setError('Failed to update configuration');
      console.error('Error updating config:', err);
    }
  };

  const addIssueType = () => {
    const updatedConfig = {
      ...config,
      issueTypes: [...config.issueTypes, { ...newIssueType }]
    };
    setConfig(updatedConfig);
    setNewIssueType({
      name: '',
      displayName: '',
      description: '',
      icon: 'assignment',
      color: 'default',
      workflow: [],
      isDefault: false,
      isActive: true
    });
  };

  const addCustomField = () => {
    const updatedConfig = {
      ...config,
      customFields: [...config.customFields, { ...newCustomField }]
    };
    setConfig(updatedConfig);
    setNewCustomField({
      name: '',
      displayName: '',
      type: 'text',
      description: '',
      required: false,
      defaultValue: '',
      options: [],
      validation: {},
      applicableTo: [],
      isActive: true,
      order: 0
    });
  };

  const removeIssueType = (index) => {
    const updatedConfig = {
      ...config,
      issueTypes: config.issueTypes.filter((_, i) => i !== index)
    };
    setConfig(updatedConfig);
  };

  const addStatus = () => {
    const updatedConfig = {
      ...config,
      statuses: [...(config.statuses || []), { ...newStatus }]
    };
    setConfig(updatedConfig);
    setNewStatus({
      name: '',
      displayName: '',
      description: '',
      color: 'default',
      isDefault: false,
      isFinal: false,
      isActive: true,
      order: 0
    });
  };

  const removeStatus = (index) => {
    const updatedConfig = {
      ...config,
      statuses: config.statuses.filter((_, i) => i !== index)
    };
    setConfig(updatedConfig);
  };

  const openWorkflowDialog = (issueTypeIndex) => {
    const issueType = config.issueTypes[issueTypeIndex];
    setWorkflowDialog({
      open: true,
      issueTypeIndex,
      issueType: { ...issueType }
    });
  };

  const closeWorkflowDialog = () => {
    setWorkflowDialog({
      open: false,
      issueTypeIndex: null,
      issueType: null
    });
  };

  const updateIssueTypeWorkflow = () => {
    const updatedConfig = { ...config };
    updatedConfig.issueTypes[workflowDialog.issueTypeIndex] = workflowDialog.issueType;
    setConfig(updatedConfig);
    closeWorkflowDialog();
  };

  const openEditFieldDialog = (fieldIndex) => {
    const field = config.customFields[fieldIndex];
    setEditFieldDialog({
      open: true,
      fieldIndex,
      field: { ...field }
    });
  };

  const closeEditFieldDialog = () => {
    setEditFieldDialog({
      open: false,
      fieldIndex: null,
      field: null
    });
  };

  const updateCustomField = () => {
    const updatedConfig = { ...config };
    updatedConfig.customFields[editFieldDialog.fieldIndex] = editFieldDialog.field;
    setConfig(updatedConfig);
    closeEditFieldDialog();
  };

  const addStatusToWorkflow = (statusName) => {
    if (!workflowDialog.issueType.workflow.includes(statusName)) {
      setWorkflowDialog({
        ...workflowDialog,
        issueType: {
          ...workflowDialog.issueType,
          workflow: [...workflowDialog.issueType.workflow, statusName]
        }
      });
    }
  };

  const removeStatusFromWorkflow = (statusName) => {
    setWorkflowDialog({
      ...workflowDialog,
      issueType: {
        ...workflowDialog.issueType,
        workflow: workflowDialog.issueType.workflow.filter(s => s !== statusName)
      }
    });
  };

  const handleWorkflowDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newWorkflow = Array.from(workflowDialog.issueType.workflow);
    const [reorderedItem] = newWorkflow.splice(source.index, 1);
    newWorkflow.splice(destination.index, 0, reorderedItem);

    setWorkflowDialog({
      ...workflowDialog,
      issueType: {
        ...workflowDialog.issueType,
        workflow: newWorkflow
      }
    });
  };

  const removeCustomField = (index) => {
    const updatedConfig = {
      ...config,
      customFields: config.customFields.filter((_, i) => i !== index)
    };
    setConfig(updatedConfig);
  };

  // Field Type Management Functions
  const openFieldTypeDialog = (fieldType = null, isEdit = false) => {
    setFieldTypeDialog({
      open: true,
      fieldType: fieldType ? { ...fieldType } : { ...newFieldType },
      isEdit
    });
  };

  const closeFieldTypeDialog = () => {
    setFieldTypeDialog({
      open: false,
      fieldType: null,
      isEdit: false
    });
  };

  const addFieldType = async () => {
    try {
      const response = await api.post('/system-config/field-types', fieldTypeDialog.fieldType);
      setFieldTypes(response.data.fieldTypes);
      closeFieldTypeDialog();
      setSuccess('Field type added successfully');
    } catch (err) {
      setError('Failed to add field type');
      console.error('Error adding field type:', err);
    }
  };

  const updateFieldType = async () => {
    try {
      const response = await api.put(`/system-config/field-types/${fieldTypeDialog.fieldType.value}`, fieldTypeDialog.fieldType);
      setFieldTypes(response.data.fieldTypes);
      closeFieldTypeDialog();
      setSuccess('Field type updated successfully');
    } catch (err) {
      setError('Failed to update field type');
      console.error('Error updating field type:', err);
    }
  };

  const deleteFieldType = async (fieldTypeValue) => {
    try {
      const response = await api.delete(`/system-config/field-types/${fieldTypeValue}`);
      setFieldTypes(response.data.fieldTypes);
      setSuccess('Field type deleted successfully');
    } catch (err) {
      setError('Failed to delete field type');
      console.error('Error deleting field type:', err);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      assignment: TaskIcon,
      bug_report: BugIcon,
      book: StoryIcon,
      list: SubtaskIcon
    };
    return icons[iconName] || TaskIcon;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project configuration...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchConfig} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Project Configuration
        </Typography>
        <Box>
          <Button onClick={updateConfig} variant="contained" startIcon={<SaveIcon />} sx={{ mr: 1 }}>
            Save Changes
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!config && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No Configuration Found
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This project doesn't have a configuration yet. Click the button below to initialize with default settings.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Debug: Project ID: {projectId}
          </Typography>
          <Button 
            onClick={initializeDefaultConfig} 
            variant="contained" 
            startIcon={<SettingsIcon />}
            size="large"
          >
            Initialize Default Configuration
          </Button>
        </Alert>
      )}

      {config && (
        <>
          {/* Issue Types Configuration */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Issue Types ({config.issueTypes.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {config.issueTypes.map((type, index) => {
                  const IconComponent = getIconComponent(type.icon);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <IconComponent sx={{ mr: 1 }} />
                            <Typography variant="h6">{type.displayName}</Typography>
                            {type.isDefault && (
                              <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {type.description}
                          </Typography>
                          <Chip label={type.name} size="small" sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={type.isActive}
                                  onChange={(e) => {
                                    const updatedConfig = { ...config };
                                    updatedConfig.issueTypes[index].isActive = e.target.checked;
                                    setConfig(updatedConfig);
                                  }}
                                />
                              }
                              label="Active"
                            />
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => openWorkflowDialog(index)}
                                color="primary"
                                title="Configure Workflow"
                              >
                                <SettingsIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => removeIssueType(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Add New Issue Type */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Add New Issue Type
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={newIssueType.name}
                    onChange={(e) => setNewIssueType({ ...newIssueType, name: e.target.value })}
                    placeholder="e.g., epic"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={newIssueType.displayName}
                    onChange={(e) => setNewIssueType({ ...newIssueType, displayName: e.target.value })}
                    placeholder="e.g., Epic"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={newIssueType.description}
                    onChange={(e) => setNewIssueType({ ...newIssueType, description: e.target.value })}
                    placeholder="Describe this issue type"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Icon</InputLabel>
                    <Select
                      value={newIssueType.icon}
                      onChange={(e) => setNewIssueType({ ...newIssueType, icon: e.target.value })}
                    >
                      <MenuItem key="assignment" value="assignment">Task</MenuItem>
                      <MenuItem key="bug_report" value="bug_report">Bug</MenuItem>
                      <MenuItem key="book" value="book">Story</MenuItem>
                      <MenuItem key="list" value="list">Subtask</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={newIssueType.color}
                      onChange={(e) => setNewIssueType({ ...newIssueType, color: e.target.value })}
                    >
                      <MenuItem key="default-config" value="default">Default</MenuItem>
                      <MenuItem key="primary-config" value="primary">Primary</MenuItem>
                      <MenuItem key="secondary-config" value="secondary">Secondary</MenuItem>
                      <MenuItem key="error-config" value="error">Error</MenuItem>
                      <MenuItem key="warning-config" value="warning">Warning</MenuItem>
                      <MenuItem key="info-config" value="info">Info</MenuItem>
                      <MenuItem key="success-config" value="success">Success</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={addIssueType}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newIssueType.name || !newIssueType.displayName}
                  >
                    Add Issue Type
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Statuses Configuration */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Statuses ({config.statuses?.length || 0})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {config.statuses?.map((status, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              bgcolor: status.color || '#ECEFF1',
                              mr: 1 
                            }} 
                          />
                          <Typography variant="h6">{status.displayName}</Typography>
                          {status.isDefault && (
                            <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                          {status.isFinal && (
                            <Chip label="Final" size="small" color="success" sx={{ ml: 1 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {status.description}
                        </Typography>
                        <Chip label={status.name} size="small" sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={status.isActive !== false}
                                onChange={(e) => {
                                  const updatedConfig = { ...config };
                                  updatedConfig.statuses[index].isActive = e.target.checked;
                                  setConfig(updatedConfig);
                                }}
                              />
                            }
                            label="Active"
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeStatus(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Add New Status */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Add New Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Status Name"
                    value={newStatus.name}
                    onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                    placeholder="e.g., planning"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={newStatus.displayName}
                    onChange={(e) => setNewStatus({ ...newStatus, displayName: e.target.value })}
                    placeholder="e.g., Planning"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={newStatus.color}
                      onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                    >
                      <MenuItem key="default-config" value="default">Default</MenuItem>
                      <MenuItem key="primary-config" value="primary">Primary</MenuItem>
                      <MenuItem key="secondary-config" value="secondary">Secondary</MenuItem>
                      <MenuItem key="error-config" value="error">Error</MenuItem>
                      <MenuItem key="warning-config" value="warning">Warning</MenuItem>
                      <MenuItem key="info-config" value="info">Info</MenuItem>
                      <MenuItem key="success-config" value="success">Success</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={newStatus.order}
                    onChange={(e) => setNewStatus({ ...newStatus, order: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={newStatus.description}
                    onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                    placeholder="Describe this status"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newStatus.isDefault}
                        onChange={(e) => setNewStatus({ ...newStatus, isDefault: e.target.checked })}
                      />
                    }
                    label="Default Status"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newStatus.isFinal}
                        onChange={(e) => setNewStatus({ ...newStatus, isFinal: e.target.checked })}
                      />
                    }
                    label="Final Status (Done)"
                    sx={{ ml: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={addStatus}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newStatus.name || !newStatus.displayName}
                  >
                    Add Status
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Field Types Management */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Field Types ({fieldTypes.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage available field types that can be used in custom fields across all projects.
              </Typography>
              
              <Grid container spacing={2}>
                {fieldTypes.map((fieldType, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {fieldType.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {fieldType.description}
                        </Typography>
                        <Chip label={fieldType.value} size="small" sx={{ mb: 1 }} />
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                          Input Type: {fieldType.inputType}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={fieldType.isActive !== false}
                                onChange={(e) => {
                                  const updatedFieldTypes = [...fieldTypes];
                                  updatedFieldTypes[index].isActive = e.target.checked;
                                  setFieldTypes(updatedFieldTypes);
                                  // Note: This would need an API call to persist the change
                                }}
                              />
                            }
                            label="Active"
                          />
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => openFieldTypeDialog(fieldType, true)}
                              color="primary"
                              title="Edit Field Type"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteFieldType(fieldType.value)}
                              color="error"
                              title="Delete Field Type"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Add New Field Type */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Add New Field Type
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Field Type Value"
                    value={newFieldType.value}
                    onChange={(e) => setNewFieldType({ ...newFieldType, value: e.target.value })}
                    placeholder="e.g., currency"
                    helperText="Unique identifier for the field type"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Label"
                    value={newFieldType.label}
                    onChange={(e) => setNewFieldType({ ...newFieldType, label: e.target.value })}
                    placeholder="e.g., Currency"
                    helperText="Human-readable name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Input Type</InputLabel>
                    <Select
                      value={newFieldType.inputType}
                      onChange={(e) => setNewFieldType({ ...newFieldType, inputType: e.target.value })}
                    >
                      <MenuItem key="text-input" value="text">Text Input</MenuItem>
                      <MenuItem key="number-input" value="number">Number Input</MenuItem>
                      <MenuItem key="email-input" value="email">Email Input</MenuItem>
                      <MenuItem key="url-input" value="url">URL Input</MenuItem>
                      <MenuItem key="date-picker" value="date">Date Picker</MenuItem>
                      <MenuItem key="datetime-picker" value="datetime">Date & Time Picker</MenuItem>
                      <MenuItem key="time-picker" value="time">Time Picker</MenuItem>
                      <MenuItem key="textarea" value="textarea">Text Area</MenuItem>
                      <MenuItem key="select-dropdown" value="select">Select Dropdown</MenuItem>
                      <MenuItem key="multiselect" value="multiselect">Multi-Select</MenuItem>
                      <MenuItem key="checkbox" value="checkbox">Checkbox</MenuItem>
                      <MenuItem key="radio" value="radio">Radio Buttons</MenuItem>
                      <MenuItem key="file-upload" value="file">File Upload</MenuItem>
                      <MenuItem key="image-upload" value="image">Image Upload</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newFieldType.isActive}
                        onChange={(e) => setNewFieldType({ ...newFieldType, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={newFieldType.description}
                    onChange={(e) => setNewFieldType({ ...newFieldType, description: e.target.value })}
                    placeholder="Describe this field type and its use cases"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={() => openFieldTypeDialog(newFieldType, false)}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newFieldType.value || !newFieldType.label}
                  >
                    Add Field Type
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Custom Fields Configuration */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Custom Fields ({config.customFields.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {config.customFields.map((field, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {field.displayName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {field.description}
                        </Typography>
                        <Chip label={field.type} size="small" sx={{ mb: 1 }} />
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption">
                            Applies to: {field.applicableTo.join(', ') || 'All types'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.isActive}
                                onChange={(e) => {
                                  const updatedConfig = { ...config };
                                  updatedConfig.customFields[index].isActive = e.target.checked;
                                  setConfig(updatedConfig);
                                }}
                              />
                            }
                            label="Active"
                          />
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => openEditFieldDialog(index)}
                              color="primary"
                              title="Edit Field"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeCustomField(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Add New Custom Field */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Add New Custom Field
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Field Name"
                    value={newCustomField.name}
                    onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                    placeholder="e.g., businessValue"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={newCustomField.displayName}
                    onChange={(e) => setNewCustomField({ ...newCustomField, displayName: e.target.value })}
                    placeholder="e.g., Business Value"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Field Type</InputLabel>
                    <Select
                      value={newCustomField.type}
                      onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value })}
                    >
                      {fieldTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={newCustomField.order}
                    onChange={(e) => setNewCustomField({ ...newCustomField, order: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={newCustomField.description}
                    onChange={(e) => setNewCustomField({ ...newCustomField, description: e.target.value })}
                    placeholder="Describe this custom field"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Applies To (Issue Types)</InputLabel>
                    <Select
                      multiple
                      value={newCustomField.applicableTo}
                      onChange={(e) => setNewCustomField({ ...newCustomField, applicableTo: e.target.value })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem key="task-config" value="task">Task</MenuItem>
                      <MenuItem key="bug-config" value="bug">Bug</MenuItem>
                      <MenuItem key="story-config" value="story">Story</MenuItem>
                      <MenuItem key="subtask-config" value="subtask">Subtask</MenuItem>
                      <MenuItem key="epic-config" value="epic">Epic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newCustomField.required}
                        onChange={(e) => setNewCustomField({ ...newCustomField, required: e.target.checked })}
                      />
                    }
                    label="Required Field"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={addCustomField}
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newCustomField.name || !newCustomField.displayName}
                  >
                    Add Custom Field
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* Edit Custom Field Dialog */}
      <Dialog 
        open={editFieldDialog.open} 
        onClose={closeEditFieldDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Custom Field</DialogTitle>
        <DialogContent>
          {editFieldDialog.field && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Field Name"
                value={editFieldDialog.field.name}
                onChange={(e) => setEditFieldDialog({
                  ...editFieldDialog,
                  field: { ...editFieldDialog.field, name: e.target.value }
                })}
              />
              <TextField
                fullWidth
                label="Display Name"
                value={editFieldDialog.field.displayName}
                onChange={(e) => setEditFieldDialog({
                  ...editFieldDialog,
                  field: { ...editFieldDialog.field, displayName: e.target.value }
                })}
              />
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={editFieldDialog.field.type}
                  onChange={(e) => setEditFieldDialog({
                    ...editFieldDialog,
                    field: { ...editFieldDialog.field, type: e.target.value }
                  })}
                >
                  {fieldTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Applies To (Issue Types)</InputLabel>
                <Select
                  multiple
                  value={editFieldDialog.field.applicableTo || []}
                  onChange={(e) => setEditFieldDialog({
                    ...editFieldDialog,
                    field: { ...editFieldDialog.field, applicableTo: e.target.value }
                  })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem key="task-config" value="task">Task</MenuItem>
                  <MenuItem key="bug-config" value="bug">Bug</MenuItem>
                  <MenuItem key="story-config" value="story">Story</MenuItem>
                  <MenuItem key="subtask-config" value="subtask">Subtask</MenuItem>
                  <MenuItem key="epic-config" value="epic">Epic</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={editFieldDialog.field.description}
                onChange={(e) => setEditFieldDialog({
                  ...editFieldDialog,
                  field: { ...editFieldDialog.field, description: e.target.value }
                })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editFieldDialog.field.required || false}
                    onChange={(e) => setEditFieldDialog({
                      ...editFieldDialog,
                      field: { ...editFieldDialog.field, required: e.target.checked }
                    })}
                  />
                }
                label="Required Field"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editFieldDialog.field.isActive !== false}
                    onChange={(e) => setEditFieldDialog({
                      ...editFieldDialog,
                      field: { ...editFieldDialog.field, isActive: e.target.checked }
                    })}
                  />
                }
                label="Active"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditFieldDialog}>Cancel</Button>
          <Button onClick={updateCustomField} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Configuration Dialog */}
      <Dialog 
        open={workflowDialog.open} 
        onClose={closeWorkflowDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure Workflow for {workflowDialog.issueType?.displayName}
        </DialogTitle>
        <DialogContent>
          {workflowDialog.issueType && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Workflow (Drag to reorder)
              </Typography>
              <Box sx={{ mb: 3 }}>
                {workflowDialog.issueType.workflow.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No statuses in workflow
                  </Typography>
                ) : (
                  <DragDropContext onDragEnd={handleWorkflowDragEnd}>
                    <Droppable droppableId="workflow-statuses">
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: 60,
                            bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                            borderRadius: 1,
                            p: 1,
                            border: '1px dashed',
                            borderColor: 'divider'
                          }}
                        >
                          {workflowDialog.issueType.workflow.map((statusName, index) => {
                            const status = config?.statuses?.find(s => s.name === statusName);
                            return (
                              <Draggable key={statusName} draggableId={statusName} index={index}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    sx={{
                                      mb: 1,
                                      transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
                                      transition: 'transform 0.2s'
                                    }}
                                  >
                                    <Chip
                                      label={`${index + 1}. ${status?.displayName || statusName}`}
                                      onDelete={() => removeStatusFromWorkflow(statusName)}
                                      sx={{ 
                                        mr: 1,
                                        cursor: 'grab',
                                        '&:hover': {
                                          boxShadow: 2
                                        }
                                      }}
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </Box>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Available Statuses
              </Typography>
              <Box>
                {config?.statuses?.map((status) => {
                  const isInWorkflow = workflowDialog.issueType.workflow.includes(status.name);
                  return (
                    <Chip
                      key={status.name}
                      label={status.displayName}
                      onClick={() => !isInWorkflow && addStatusToWorkflow(status.name)}
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        cursor: isInWorkflow ? 'default' : 'pointer',
                        opacity: isInWorkflow ? 0.5 : 1
                      }}
                      color={isInWorkflow ? 'default' : 'secondary'}
                      icon={isInWorkflow ? <CancelIcon /> : <AddIcon />}
                    />
                  );
                })}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Click on available statuses to add them to the workflow. Click on workflow statuses to remove them. Drag workflow statuses to reorder them.
              </Typography>

              {/* Workflow Visualization */}
              {workflowDialog.issueType.workflow.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Workflow Flow
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    {workflowDialog.issueType.workflow.map((statusName, index) => {
                      const status = config?.statuses?.find(s => s.name === statusName);
                      return (
                        <React.Fragment key={statusName}>
                          <Chip
                            label={status?.displayName || statusName}
                            color="primary"
                            variant="filled"
                            sx={{ fontWeight: 'bold' }}
                          />
                          {index < workflowDialog.issueType.workflow.length - 1 && (
                            <Typography variant="body2" color="text.secondary">
                              →
                            </Typography>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWorkflowDialog}>Cancel</Button>
          <Button onClick={updateIssueTypeWorkflow} variant="contained">
            Save Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Field Type Management Dialog */}
      <Dialog 
        open={fieldTypeDialog.open} 
        onClose={closeFieldTypeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {fieldTypeDialog.isEdit ? 'Edit Field Type' : 'Add New Field Type'}
        </DialogTitle>
        <DialogContent>
          {fieldTypeDialog.fieldType && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Field Type Value"
                value={fieldTypeDialog.fieldType.value}
                onChange={(e) => setFieldTypeDialog({
                  ...fieldTypeDialog,
                  fieldType: { ...fieldTypeDialog.fieldType, value: e.target.value }
                })}
                disabled={fieldTypeDialog.isEdit}
                helperText={fieldTypeDialog.isEdit ? "Cannot change field type value after creation" : "Unique identifier for the field type"}
              />
              <TextField
                fullWidth
                label="Display Label"
                value={fieldTypeDialog.fieldType.label}
                onChange={(e) => setFieldTypeDialog({
                  ...fieldTypeDialog,
                  fieldType: { ...fieldTypeDialog.fieldType, label: e.target.value }
                })}
              />
              <FormControl fullWidth>
                <InputLabel>Input Type</InputLabel>
                <Select
                  value={fieldTypeDialog.fieldType.inputType}
                  onChange={(e) => setFieldTypeDialog({
                    ...fieldTypeDialog,
                    fieldType: { ...fieldTypeDialog.fieldType, inputType: e.target.value }
                  })}
                >
                  <MenuItem key="text-input" value="text">Text Input</MenuItem>
                  <MenuItem key="number-input" value="number">Number Input</MenuItem>
                  <MenuItem key="email-input" value="email">Email Input</MenuItem>
                  <MenuItem key="url-input" value="url">URL Input</MenuItem>
                  <MenuItem key="date-picker" value="date">Date Picker</MenuItem>
                  <MenuItem key="datetime-picker" value="datetime">Date & Time Picker</MenuItem>
                  <MenuItem key="time-picker" value="time">Time Picker</MenuItem>
                  <MenuItem key="textarea" value="textarea">Text Area</MenuItem>
                  <MenuItem key="select-dropdown" value="select">Select Dropdown</MenuItem>
                  <MenuItem key="multiselect" value="multiselect">Multi-Select</MenuItem>
                  <MenuItem key="checkbox" value="checkbox">Checkbox</MenuItem>
                  <MenuItem key="radio" value="radio">Radio Buttons</MenuItem>
                  <MenuItem key="file-upload" value="file">File Upload</MenuItem>
                  <MenuItem key="image-upload" value="image">Image Upload</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={fieldTypeDialog.fieldType.description}
                onChange={(e) => setFieldTypeDialog({
                  ...fieldTypeDialog,
                  fieldType: { ...fieldTypeDialog.fieldType, description: e.target.value }
                })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldTypeDialog.fieldType.isActive !== false}
                    onChange={(e) => setFieldTypeDialog({
                      ...fieldTypeDialog,
                      fieldType: { ...fieldTypeDialog.fieldType, isActive: e.target.checked }
                    })}
                  />
                }
                label="Active"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFieldTypeDialog}>Cancel</Button>
          <Button 
            onClick={fieldTypeDialog.isEdit ? updateFieldType : addFieldType} 
            variant="contained"
            disabled={!fieldTypeDialog.fieldType?.value || !fieldTypeDialog.fieldType?.label}
          >
            {fieldTypeDialog.isEdit ? 'Update Field Type' : 'Add Field Type'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectConfiguration;

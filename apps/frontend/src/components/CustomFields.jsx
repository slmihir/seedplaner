import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BugReportIcon from '@mui/icons-material/BugReport';
import BookIcon from '@mui/icons-material/Book';
import ListIcon from '@mui/icons-material/List';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../api/client';

const CustomFields = ({ 
  issue, 
  onChange, 
  disabled = false,
  showLabels = true,
  compact = false 
}) => {
  const [fields, setFields] = useState({});

  const [availableSprints, setAvailableSprints] = useState([]);
  const [projectConfig, setProjectConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (issue) {
      // Initialize fields with all custom field values from the issue
      const initialFields = {};
      
      // Handle sprint field (still needed as it's not a custom field)
      if (issue.sprint !== undefined) initialFields.sprint = issue.sprint || '';
      
      // Add any other custom fields that might be in the issue
      Object.keys(issue).forEach(key => {
        if (!['_id', 'title', 'description', 'project', 'type', 'priority', 'status', 'assignee', 'createdAt', 'updatedAt', 'key', 'actual'].includes(key)) {
          initialFields[key] = issue[key] || '';
        }
      });
      
      setFields(initialFields);
    }
  }, [issue]);

  useEffect(() => {
    // Load available sprints and project configuration for the project
    const projectId = typeof issue?.project === 'string' ? issue.project : issue?.project?._id;
    if (projectId && projectId.trim() !== '' && projectId !== 'all') {
      console.log('CustomFields Debug - Project changed, reloading config:', projectId);
      loadSprints();
      loadProjectConfig();
    } else {
      console.log('CustomFields Debug - No project selected, project is empty, or project is "all":', issue?.project);
      // Clear config when no project is selected or project is "all"
      setProjectConfig(null);
      setAvailableSprints([]);
    }
  }, [issue?.project, issue?.type]);

  // Initialize fields for new custom fields when project config is loaded (only once)
  useEffect(() => {
    if (projectConfig?.customFields && !issue && Object.keys(fields).length === 0) {
      // This is for creating new issues - initialize fields with empty values for all custom fields
      const newFields = {};
      projectConfig.customFields.forEach(field => {
        if (field.isActive !== false) {
          newFields[field.name] = field.defaultValue || '';
        }
      });
      setFields(newFields);
    }
  }, [projectConfig]); // Removed 'issue' from dependencies

  const loadSprints = async () => {
    try {
      const projectId = typeof issue.project === 'string' ? issue.project : issue.project?._id;
      if (!projectId || projectId === 'all') return;
      
      const response = await api.get(`/sprints?project=${projectId}`);
      setAvailableSprints(response.data.sprints || []);
    } catch (error) {
      console.error('Failed to load sprints:', error);
      setAvailableSprints([]);
    }
  };

  const loadProjectConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectId = typeof issue.project === 'string' ? issue.project : issue.project?._id;
      console.log('CustomFields Debug - Loading project config for projectId:', projectId);
      
      if (!projectId || projectId.trim() === '' || projectId === 'all') {
        console.log('CustomFields Debug - No projectId, empty projectId, or projectId is "all", skipping config load');
        setProjectConfig(null);
        return;
      }
      
      const response = await api.get(`/project-config/${projectId}`);
      console.log('CustomFields Debug - Project config loaded:', response.data.config);
      setProjectConfig(response.data.config);
    } catch (error) {
      console.error('Failed to load project configuration:', error);
      setError('Failed to load project configuration');
      // Fallback to default configuration if config doesn't exist
          const fallbackConfig = {
            customFields: []
          };
      console.log('CustomFields Debug - Using fallback config:', fallbackConfig);
      setProjectConfig(fallbackConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    console.log(`🔧 Field ${field} changed to:`, value);
    console.log('🔧 Current fields state:', fields);
    const newFields = { ...fields, [field]: value };
    setFields(newFields);
    console.log('🔧 New fields state:', newFields);
    
    // Pass all custom fields directly to onChange (no hardcoded conversion)
    console.log('🔧 Custom fields being passed to onChange:', newFields);
    onChange?.(newFields);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return <BugReportIcon sx={{ fontSize: 16 }} />;
      case 'story': return <BookIcon sx={{ fontSize: 16 }} />;
      case 'subtask': return <ListIcon sx={{ fontSize: 16 }} />;
      default: return <AssignmentIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'bug': return 'error';
      case 'story': return 'primary';
      case 'subtask': return 'info';
      default: return 'default';
    }
  };

  // Get custom fields that apply to the current issue type
  const getApplicableFields = useMemo(() => {
    if (!projectConfig?.customFields || !issue?.type) {
      return [];
    }
    
    const filteredFields = projectConfig.customFields.filter(field => {
      if (field.isActive === false) {
        return false;
      }
      
      // Handle both string and array formats for applicableTo
      let applicableTypes = field.applicableTo;
      
      if (typeof applicableTypes === 'string') {
        // Convert space-separated string to array
        applicableTypes = applicableTypes.trim() ? applicableTypes.split(/\s+/) : [];
      }
      
      // If no applicable types specified, field applies to all types
      if (!applicableTypes || applicableTypes.length === 0) {
        return true;
      }
      
      // Check if current issue type is in applicable types
      return applicableTypes.includes(issue.type);
    });
    return filteredFields.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [projectConfig?.customFields, issue?.type]);

  // Render a custom field based on its type
  const renderCustomField = (field) => {
    const value = fields[field.name] || field.defaultValue || '';
    const required = field.required;
    
    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.displayName}
            value={value}
            onChange={(e) => {
              console.log(`🔧 TextField onChange triggered for ${field.name}:`, e.target.value);
              handleFieldChange(field.name, e.target.value);
            }}
            disabled={disabled}
            required={required}
            placeholder={field.description}
          />
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.displayName}
            multiline
            rows={3}
            value={value}
            onChange={(e) => {
              console.log(`🔧 TextArea onChange triggered for ${field.name}:`, e.target.value);
              handleFieldChange(field.name, e.target.value);
            }}
            disabled={disabled}
            required={required}
            placeholder={field.description}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={field.displayName}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={disabled}
            required={required}
            inputProps={field.validation}
          />
        );
      
      case 'date':
        return (
          <DatePicker
            label={field.displayName}
            value={value ? new Date(value) : null}
            onChange={(newValue) => {
              console.log(`🔧 DatePicker onChange triggered for ${field.name}:`, newValue);
              const dateValue = newValue ? newValue.toISOString().split('T')[0] : '';
              handleFieldChange(field.name, dateValue);
            }}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                required: required,
                placeholder: field.description
              }
            }}
          />
        );
      
      case 'select':
        if (field.name === 'sprint') {
          return (
            <FormControl fullWidth disabled={disabled}>
              <InputLabel>{field.displayName}</InputLabel>
              <Select
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                label={field.displayName}
                required={required}
              >
                <MenuItem value="">
                  <em>No Sprint</em>
                </MenuItem>
                {availableSprints.map((sprint) => (
                  <MenuItem key={sprint._id} value={sprint._id}>
                    {sprint.name}
                    {sprint.isActive && (
                      <Chip 
                        size="small" 
                        label="Active" 
                        color="success" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        return (
          <FormControl fullWidth disabled={disabled}>
            <InputLabel>{field.displayName}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              label={field.displayName}
              required={required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value === true || value === 'true'}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                disabled={disabled}
              />
            }
            label={field.displayName}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={field.displayName}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={disabled}
            required={required}
            placeholder={field.description}
          />
        );
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {fields.sprint && (
          <Chip 
            size="small" 
            label={`Sprint: ${fields.sprint}`} 
            color="secondary" 
            variant="outlined"
          />
        )}
        {/* Dynamic custom fields will be shown based on project configuration */}
        {Object.keys(fields).filter(key => key !== 'sprint').map(key => {
          const field = getApplicableFields.find(f => f.name === key);
          if (!field || !fields[key]) return null;
          
          return (
            <Chip 
              key={key}
              size="small" 
              label={field.displayName} 
              color="info" 
              variant="outlined"
            />
          );
        })}
      </Box>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading custom fields...</Typography>
        </Box>
      </LocalizationProvider>
    );
  }

  // Show error state
  if (error && !projectConfig) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </LocalizationProvider>
    );
  }

  const applicableFields = getApplicableFields;

  // If no project selected or project is "all", show message
  const projectId = typeof issue?.project === 'string' ? issue.project : issue?.project?._id;
  if (!projectId || projectId.trim() === '' || projectId === 'all') {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box>
          {showLabels && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getTypeIcon(issue?.type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Custom Fields
              </Typography>
              <Chip 
                size="small" 
                label={issue?.type || 'task'} 
                color={getTypeColor(issue?.type)} 
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Box>
          )}
          <Alert severity="info">
            Please select a project to see custom fields. Custom fields are project-specific and will appear once you choose a project.
          </Alert>
        </Box>
      </LocalizationProvider>
    );
  }

  // If no applicable fields, show message
  if (applicableFields.length === 0) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box>
          {showLabels && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getTypeIcon(issue?.type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Custom Fields
              </Typography>
              <Chip 
                size="small" 
                label={issue?.type || 'task'} 
                color={getTypeColor(issue?.type)} 
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Box>
          )}
          <Alert severity="info">
            No custom fields are configured for {issue?.type || 'this issue type'}.
            <Tooltip title="Configure custom fields in Project Configuration">
              <IconButton size="small" sx={{ ml: 1 }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Alert>
        </Box>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {showLabels && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getTypeIcon(issue?.type)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Custom Fields
            </Typography>
            <Chip 
              size="small" 
              label={issue?.type || 'task'} 
              color={getTypeColor(issue?.type)} 
              variant="outlined"
              sx={{ ml: 2 }}
            />
            <Chip 
              size="small" 
              label={`${applicableFields.length} field${applicableFields.length !== 1 ? 's' : ''}`}
              color="info" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Box>
        )}

        <Grid container spacing={2}>
          {applicableFields.map((field, index) => (
            <Grid 
              key={field.name} 
              size={{ xs: 12, sm: field.type === 'textarea' ? 12 : 6 }}
            >
              {renderCustomField(field)}
            </Grid>
          ))}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default CustomFields;

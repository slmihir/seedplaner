import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

// Custom hook for fetching dynamic configuration data
export const useDynamicConfig = () => {
  const [config, setConfig] = useState({
    statuses: [],
    issueTypes: [],
    priorities: [],
    fieldTypes: [],
    costCategories: [],
    roles: [],
    workflowTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system configuration
      const systemConfigResponse = await api.get('/system-config');
      const systemConfig = systemConfigResponse.data.config;

      // Fetch project-specific configuration if we have a project context
      // This will be enhanced when we implement project-specific configs
      
      setConfig({
        statuses: systemConfig.workflowTemplates
          .filter(t => t.isActive)
          .flatMap(t => t.statuses)
          .filter((status, index, self) => 
            index === self.findIndex(s => s.value === status.value)
          ),
        issueTypes: ['task', 'bug', 'story', 'subtask'], // Will be made dynamic later
        priorities: ['low', 'medium', 'high', 'critical'], // Will be made dynamic later
        fieldTypes: systemConfig.fieldTypes.filter(ft => ft.isActive),
        costCategories: systemConfig.costCategories.filter(cc => cc.isActive),
        roles: systemConfig.roles.filter(r => r.isActive),
        workflowTemplates: systemConfig.workflowTemplates.filter(wt => wt.isActive)
      });
    } catch (err) {
      console.error('Error fetching dynamic config:', err);
      setError(err.response?.data?.message || 'Failed to load configuration');
      
      // Fallback to hardcoded values if API fails
      setConfig({
        statuses: [
          { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
          { value: 'analysis_ready', label: 'Analysis Ready', color: '#E3F2FD', order: 2 },
          { value: 'analysis', label: 'Analysis', color: '#E8F5E9', order: 3 },
          { value: 'development', label: 'Development', color: '#FFF3E0', order: 4 },
          { value: 'acceptance', label: 'Acceptance', color: '#F3E5F5', order: 5 },
          { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
        ],
        issueTypes: ['task', 'bug', 'story', 'subtask'],
        priorities: ['low', 'medium', 'high', 'critical'],
        fieldTypes: [
          { value: 'text', label: 'Text', description: 'Single line text input' },
          { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
          { value: 'number', label: 'Number', description: 'Numeric input' },
          { value: 'date', label: 'Date', description: 'Date picker' },
          { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
          { value: 'select', label: 'Select', description: 'Single selection dropdown' },
          { value: 'multiselect', label: 'Multi Select', description: 'Multiple selection dropdown' },
          { value: 'checkbox', label: 'Checkbox', description: 'Boolean checkbox' }
        ],
        costCategories: [
          { value: 'aws', label: 'AWS Services', description: 'Amazon Web Services costs' },
          { value: 'lucid', label: 'Lucidchart', description: 'Lucidchart subscription and usage' },
          { value: 'tools', label: 'Development Tools', description: 'Software development tools' },
          { value: 'infrastructure', label: 'Infrastructure', description: 'Server and hosting costs' },
          { value: 'software', label: 'Software Licenses', description: 'Software licensing costs' },
          { value: 'other', label: 'Other', description: 'Miscellaneous costs' }
        ],
        roles: [
          { name: 'admin', displayName: 'Administrator', description: 'Full system access' },
          { name: 'manager', displayName: 'Manager', description: 'Project and team management' },
          { name: 'developer', displayName: 'Developer', description: 'Development team member' },
          { name: 'viewer', displayName: 'Viewer', description: 'Read-only access' }
        ],
        workflowTemplates: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const refreshConfig = useCallback(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refreshConfig
  };
};

// Hook for fetching project-specific configuration
export const useProjectConfig = (projectId) => {
  const [projectConfig, setProjectConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectConfig = useCallback(async () => {
    if (!projectId) {
      setProjectConfig(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/project-config/${projectId}`);
      setProjectConfig(response.data.config);
    } catch (err) {
      console.error('Error fetching project config:', err);
      setError(err.response?.data?.message || 'Failed to load project configuration');
      setProjectConfig(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectConfig();
  }, [fetchProjectConfig]);

  return {
    projectConfig,
    loading,
    error,
    refreshProjectConfig: fetchProjectConfig
  };
};

// Hook for fetching project-specific issue types
export const useProjectIssueTypes = (projectId) => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIssueTypes = useCallback(async () => {
    if (!projectId) {
      setIssueTypes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/project-config/${projectId}/issue-types`);
      setIssueTypes(response.data.issueTypes);
    } catch (err) {
      console.error('Error fetching issue types:', err);
      setError(err.response?.data?.message || 'Failed to load issue types');
      // Fallback to default issue types
      setIssueTypes([
        { name: 'task', displayName: 'Task', description: 'A general task or work item', icon: 'assignment', color: 'default', isDefault: true, isActive: true },
        { name: 'bug', displayName: 'Bug', description: 'A defect or issue that needs to be fixed', icon: 'bug_report', color: 'error', isActive: true },
        { name: 'story', displayName: 'Story', description: 'A user story or feature request', icon: 'book', color: 'primary', isActive: true },
        { name: 'subtask', displayName: 'Subtask', description: 'A subtask or child issue', icon: 'list', color: 'secondary', isActive: true }
      ]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIssueTypes();
  }, [fetchIssueTypes]);

  return {
    issueTypes,
    loading,
    error,
    refreshIssueTypes: fetchIssueTypes
  };
};

// Hook for fetching project-specific priorities
export const useProjectPriorities = (projectId) => {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPriorities = useCallback(async () => {
    if (!projectId) {
      setPriorities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/project-config/${projectId}/priorities`);
      setPriorities(response.data.priorities);
    } catch (err) {
      console.error('Error fetching priorities:', err);
      setError(err.response?.data?.message || 'Failed to load priorities');
      // Fallback to default priorities
      setPriorities([
        { name: 'low', displayName: 'Low', color: 'success', level: 1, isActive: true },
        { name: 'medium', displayName: 'Medium', color: 'warning', level: 2, isDefault: true, isActive: true },
        { name: 'high', displayName: 'High', color: 'error', level: 3, isActive: true },
        { name: 'critical', displayName: 'Critical', color: 'error', level: 4, isActive: true }
      ]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  return {
    priorities,
    loading,
    error,
    refreshPriorities: fetchPriorities
  };
};

// Utility functions for working with dynamic config
export const getStatusOptions = (config) => {
  return config.statuses.map(status => ({
    value: status.value,
    label: status.label
  }));
};

export const getTypeOptions = (issueTypes) => {
  return issueTypes.map(type => ({
    value: type.name,
    label: type.displayName,
    description: type.description,
    icon: type.icon,
    color: type.color
  }));
};

export const getPriorityOptions = (priorities) => {
  return priorities.map(priority => ({
    value: priority.name,
    label: priority.displayName,
    color: priority.color,
    level: priority.level
  }));
};

export const getFieldTypeOptions = (config) => {
  return config.fieldTypes.map(fieldType => ({
    value: fieldType.value,
    label: fieldType.label,
    description: fieldType.description
  }));
};

export const getCostCategoryOptions = (config) => {
  return config.costCategories.map(category => ({
    value: category.value,
    label: category.label,
    description: category.description
  }));
};

export const getRoleOptions = (config) => {
  return config.roles.map(role => ({
    value: role.name,
    label: role.displayName,
    description: role.description
  }));
};

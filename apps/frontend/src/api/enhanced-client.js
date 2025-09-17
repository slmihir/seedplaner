/**
 * Enhanced API Client with Parent-Child functionality
 * Extended version of the existing API client with parent-child endpoints
 */

import { api } from './client';

// Parent-Child API methods
export const parentChildApi = {
  // Create a subtask
  createSubtask: async (data) => {
    const response = await api.post('/issues/subtask', data);
    return response.data;
  },

  // Get issue hierarchy (parent, children, linked issues)
  getIssueHierarchy: async (issueId) => {
    const response = await api.get(`/issues/${issueId}/hierarchy`);
    return response.data;
  },

  // Link issues (parent-child or general linking)
  linkIssues: async (data) => {
    const response = await api.post('/issues/link', data);
    return response.data;
  },

  // Unlink issues
  unlinkIssues: async (data) => {
    const response = await api.post('/issues/unlink', data);
    return response.data;
  },

  // Get subtasks for a parent issue
  getSubtasks: async (parentIssueId) => {
    const response = await api.get(`/issues?parentIssue=${parentIssueId}`);
    return response.data;
  },

  // Update issue with parent-child relationships
  updateIssue: async (issueId, data) => {
    const response = await api.patch(`/issues/${issueId}`, data);
    return response.data;
  },

  // Delete issue (handles parent-child cleanup)
  deleteIssue: async (issueId) => {
    const response = await api.delete(`/issues/${issueId}`);
    return response.data;
  },

  // Search issues with parent-child filters
  searchIssues: async (params) => {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get issues by type with parent-child information
  getIssuesByType: async (type, projectId = null) => {
    const params = { type };
    if (projectId) {
      params.project = projectId;
    }
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get parent issues (issues that can have children)
  getParentIssues: async (projectId = null) => {
    const params = { parentCapable: true };
    if (projectId) {
      params.project = projectId;
    }
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get child issues for a specific parent
  getChildIssues: async (parentIssueId) => {
    const response = await api.get(`/issues?parentIssue=${parentIssueId}`);
    return response.data;
  },

  // Bulk operations for parent-child relationships
  bulkUpdateSubtasks: async (subtaskIds, updateData) => {
    const response = await api.patch('/issues/bulk', {
      issueIds: subtaskIds,
      updateData
    });
    return response.data;
  },

  // Move subtask to different parent
  moveSubtask: async (subtaskId, newParentId) => {
    const response = await api.patch(`/issues/${subtaskId}/move`, {
      newParentId
    });
    return response.data;
  },

  // Get issue statistics including parent-child counts
  getIssueStats: async (projectId = null) => {
    const params = {};
    if (projectId) {
      params.project = projectId;
    }
    const response = await api.get('/issues/stats', { params });
    return response.data;
  }
};

// Enhanced issue operations
export const enhancedIssueApi = {
  // Create issue with automatic parent-child handling
  createIssue: async (issueData) => {
    const response = await api.post('/issues', issueData);
    return response.data;
  },

  // Update issue with relationship validation
  updateIssue: async (issueId, updateData) => {
    const response = await api.patch(`/issues/${issueId}`, updateData);
    return response.data;
  },

  // Get issue with full hierarchy information
  getIssueWithHierarchy: async (issueId) => {
    const [issueResponse, hierarchyResponse] = await Promise.all([
      api.get(`/issues/${issueId}`),
      api.get(`/issues/${issueId}/hierarchy`)
    ]);
    
    return {
      issue: issueResponse.data.issue,
      hierarchy: hierarchyResponse.data.hierarchy
    };
  },

  // Get issues with parent-child information
  getIssuesWithRelationships: async (params = {}) => {
    const response = await api.get('/issues', { 
      params: { ...params, includeRelationships: true }
    });
    return response.data;
  }
};

// Utility functions for parent-child operations
export const parentChildUtils = {
  // Check if an issue can have children
  canHaveChildren: (issue) => {
    return issue.type !== 'subtask';
  },

  // Check if an issue is a subtask
  isSubtask: (issue) => {
    return issue.type === 'subtask' || issue.parentIssue;
  },

  // Get display name for relationship type
  getRelationshipDisplayName: (linkType) => {
    const displayNames = {
      'relates_to': 'Relates to',
      'blocks': 'Blocks',
      'is_blocked_by': 'Is blocked by',
      'duplicates': 'Duplicates',
      'is_duplicated_by': 'Is duplicated by'
    };
    return displayNames[linkType] || linkType;
  },

  // Get relationship color
  getRelationshipColor: (linkType) => {
    const colors = {
      'relates_to': 'default',
      'blocks': 'error',
      'is_blocked_by': 'warning',
      'duplicates': 'info',
      'is_duplicated_by': 'info'
    };
    return colors[linkType] || 'default';
  },

  // Format hierarchy data for display
  formatHierarchyData: (hierarchy) => {
    return {
      parent: hierarchy.parent ? {
        ...hierarchy.parent,
        displayName: `${hierarchy.parent.key} - ${hierarchy.parent.title}`
      } : null,
      children: hierarchy.children?.map(child => ({
        ...child,
        displayName: `${child.key} - ${child.title}`
      })) || [],
      linked: hierarchy.linked?.map(link => ({
        ...link,
        displayName: `${link.issue.key} - ${link.issue.title}`,
        relationshipDisplay: parentChildUtils.getRelationshipDisplayName(link.linkType)
      })) || []
    };
  },

  // Validate parent-child relationship
  validateRelationship: (parentIssue, childIssue) => {
    if (!parentIssue || !childIssue) {
      return { valid: false, error: 'Both issues must be specified' };
    }

    if (parentIssue._id === childIssue._id) {
      return { valid: false, error: 'An issue cannot be its own parent' };
    }

    if (parentIssue.type === 'subtask') {
      return { valid: false, error: 'Subtasks cannot have children' };
    }

    if (childIssue.parentIssue && childIssue.parentIssue !== parentIssue._id) {
      return { valid: false, error: 'Issue already has a different parent' };
    }

    return { valid: true };
  }
};

// Export the enhanced API
export default {
  ...parentChildApi,
  ...enhancedIssueApi,
  utils: parentChildUtils
};

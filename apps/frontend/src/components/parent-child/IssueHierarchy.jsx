/**
 * Issue Hierarchy Component
 * Displays parent-child relationships in a tree-like structure
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Divider,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  List as SubTaskIcon,
  Link as LinkIcon,
  BugReport as BugReportIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  List as ListIcon,
  ArrowUpward as ParentIcon,
  ArrowDownward as ChildIcon
} from '@mui/icons-material';
import api from '../../api/client';

const IssueHierarchy = ({ issue, onIssueClick, showActions = true }) => {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (issue) {
      loadHierarchy();
    }
  }, [issue]);

  const loadHierarchy = async () => {
    if (!issue) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/issues/${issue._id}/hierarchy`);
      setHierarchy(response.data.hierarchy);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
      setError('Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'bug': return <BugReportIcon />;
      case 'story': return <BookIcon />;
      case 'task': return <AssignmentIcon />;
      case 'subtask': return <SubTaskIcon />;
      default: return <ListIcon />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'backlog': 'default',
      'development': 'primary',
      'code_review': 'warning',
      'qa': 'info',
      'deployment': 'secondary',
      'released': 'success',
      'done': 'success',
      'in_progress': 'primary',
      'todo': 'default'
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

  const handleIssueClick = (clickedIssue) => {
    if (onIssueClick) {
      onIssueClick(clickedIssue);
    }
  };

  const hasRelationships = () => {
    return hierarchy && (
      hierarchy.parent || 
      (hierarchy.children && hierarchy.children.length > 0) ||
      (hierarchy.linked && hierarchy.linked.length > 0)
    );
  };

  if (!issue || !hierarchy) {
    return null;
  }

  if (!hasRelationships()) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No relationships found
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Issue Relationships
          </Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2}>
            {/* Parent Issue */}
            {hierarchy.parent && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ParentIcon color="primary" />
                  <Typography variant="subtitle2" color="primary">
                    Parent Issue
                  </Typography>
                </Box>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleIssueClick(hierarchy.parent)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getIssueIcon(hierarchy.parent.type)}
                      <Typography variant="subtitle1" fontWeight="medium">
                        {hierarchy.parent.key}
                      </Typography>
                      <Chip
                        label={hierarchy.parent.status}
                        size="small"
                        color={getStatusColor(hierarchy.parent.status)}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2">
                      {hierarchy.parent.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Child Issues */}
            {hierarchy.children && hierarchy.children.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ChildIcon color="secondary" />
                  <Typography variant="subtitle2" color="secondary">
                    Child Issues ({hierarchy.children.length})
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {hierarchy.children.map((child) => (
                    <Card 
                      key={child._id}
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleIssueClick(child)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <SubTaskIcon color="secondary" />
                          <Typography variant="subtitle1" fontWeight="medium">
                            {child.key}
                          </Typography>
                          <Chip
                            label={child.status}
                            size="small"
                            color={getStatusColor(child.status)}
                            variant="outlined"
                          />
                          {child.priority && (
                            <Chip
                              label={child.priority}
                              size="small"
                              color={getPriorityColor(child.priority)}
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2">
                          {child.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Linked Issues */}
            {hierarchy.linked && hierarchy.linked.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LinkIcon color="default" />
                  <Typography variant="subtitle2">
                    Linked Issues ({hierarchy.linked.length})
                  </Typography>
                </Box>
                <List dense>
                  {hierarchy.linked.map((link) => (
                    <ListItem 
                      key={link.issue._id}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1
                      }}
                      onClick={() => handleIssueClick(link.issue)}
                    >
                      <ListItemIcon>
                        {getIssueIcon(link.issue.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {link.issue.key}
                            </Typography>
                            <Chip
                              label={link.issue.status}
                              size="small"
                              color={getStatusColor(link.issue.status)}
                              variant="outlined"
                            />
                            <Chip
                              label={link.linkType.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={link.issue.title}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default IssueHierarchy;

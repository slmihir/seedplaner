/**
 * Enhanced Issue Card with Parent-Child functionality
 * Updated version of IssueCard with better parent-child support
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  IconButton,
  Box,
  Collapse,
  Divider
} from '@mui/material';
import {
  Link as LinkIcon,
  List as SubTaskIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  Book as BookIcon,
  List as ListIcon
} from '@mui/icons-material';
import CustomFields from './CustomFields';
import DailyStatusIndicator from './DailyStatusIndicator';
import { ParentChildIndicator, IssueHierarchy } from './parent-child';

const typeColor = {
  task: 'default',
  bug: 'error',
  story: 'primary',
  epic: 'secondary',
  subtask: 'info'
};

const typeIcon = {
  task: <AssignmentIcon />,
  bug: <BugReportIcon />,
  story: <BookIcon />,
  subtask: <SubTaskIcon />,
  epic: <ListIcon />
};

const statusColor = {
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

const priorityColor = {
  'low': 'success',
  'medium': 'warning',
  'high': 'error',
  'critical': 'error'
};

const EnhancedIssueCard = ({ 
  issue, 
  showEditButton = false, 
  showDeleteButton = false, 
  showLinkButton = false,
  showHierarchy = false,
  onEditClick, 
  onDeleteClick, 
  onLinkClick,
  onIssueClick,
  currentUserId,
  users = [],
  projects = []
}) => {
  const [expanded, setExpanded] = useState(false);
  const [hierarchyExpanded, setHierarchyExpanded] = useState(false);

  const getAssigneeName = (assigneeId) => {
    const user = users.find(u => u._id === assigneeId);
    return user ? user.name : 'Unknown';
  };

  const getAssigneeInitials = (assigneeId) => {
    const user = users.find(u => u._id === assigneeId);
    return user ? user.name.charAt(0).toUpperCase() : '?';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const handleCardClick = () => {
    if (onIssueClick) {
      onIssueClick(issue);
    }
  };

  const hasRelationships = issue.parentIssue || 
    (issue.childIssues && issue.childIssues.length > 0) ||
    (issue.linkedIssues && issue.linkedIssues.length > 0);

  return (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: onIssueClick ? 'pointer' : 'default',
        '&:hover': onIssueClick ? { 
          boxShadow: 2,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        } : {},
        border: issue.type === 'subtask' ? '1px solid' : 'none',
        borderColor: issue.type === 'subtask' ? 'primary.main' : 'transparent'
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Issue Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                {issue.key}
              </Typography>
              
              {/* Parent-Child Indicators */}
              <ParentChildIndicator issue={issue} size="small" />
              
              {/* Type and Status Chips */}
              <Chip
                icon={typeIcon[issue.type] || <AssignmentIcon />}
                label={issue.type}
                size="small"
                color={typeColor[issue.type] || 'default'}
                variant="outlined"
              />
              <Chip
                label={issue.status}
                size="small"
                color={statusColor[issue.status] || 'default'}
                variant="filled"
              />
              {issue.priority && (
                <Chip
                  label={issue.priority}
                  size="small"
                  color={priorityColor[issue.priority] || 'default'}
                  variant="outlined"
                />
              )}
            </Stack>
            
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              {issue.title}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0.5}>
            {showLinkButton && onLinkClick && (
              <Tooltip title="Link Issues">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkClick(issue);
                  }}
                >
                  <LinkIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {showEditButton && onEditClick && (
              <Tooltip title="Edit Issue">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(issue);
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {showDeleteButton && onDeleteClick && (
              <Tooltip title="Delete Issue">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(issue);
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {showHierarchy && hasRelationships && (
              <Tooltip title="Show Relationships">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setHierarchyExpanded(!hierarchyExpanded);
                  }}
                >
                  {hierarchyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Issue Description */}
        {issue.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {issue.description.length > 100 
              ? `${issue.description.substring(0, 100)}...` 
              : issue.description
            }
          </Typography>
        )}

        {/* Issue Metadata */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          {/* Assignees */}
          {issue.assignees && issue.assignees.length > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Assigned:
              </Typography>
              {issue.assignees.slice(0, 3).map((assigneeId) => (
                <Tooltip key={assigneeId} title={getAssigneeName(assigneeId)}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                    {getAssigneeInitials(assigneeId)}
                  </Avatar>
                </Tooltip>
              ))}
              {issue.assignees.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{issue.assignees.length - 3}
                </Typography>
              )}
            </Stack>
          )}

          {/* Story Points */}
          {issue.storyPoints && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <CheckCircleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {issue.storyPoints} pts
              </Typography>
            </Stack>
          )}

          {/* Estimate */}
          {issue.estimate && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {issue.estimate}h
              </Typography>
            </Stack>
          )}

          {/* Due Date */}
          {issue.endDate && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(issue.endDate)}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Custom Fields */}
        {issue.acceptanceCriteria && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Acceptance Criteria:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {issue.acceptanceCriteria.length > 80 
                ? `${issue.acceptanceCriteria.substring(0, 80)}...` 
                : issue.acceptanceCriteria
              }
            </Typography>
          </Box>
        )}

        {/* Daily Status Indicator */}
        {currentUserId && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <DailyStatusIndicator
              issueId={issue._id}
              userId={currentUserId}
              issue={issue}
              size="small"
            />
          </Box>
        )}

        {/* Expandable Content */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 1 }} />
          <Box>
            {/* Full Description */}
            {issue.description && issue.description.length > 100 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Full Description:
                </Typography>
                <Typography variant="body2">
                  {issue.description}
                </Typography>
              </Box>
            )}

            {/* Custom Fields */}
            <CustomFields issue={issue} />
          </Box>
        </Collapse>

        {/* Issue Hierarchy */}
        {showHierarchy && hasRelationships && (
          <Collapse in={hierarchyExpanded}>
            <Divider sx={{ my: 1 }} />
            <IssueHierarchy 
              issue={issue} 
              onIssueClick={onIssueClick}
            />
          </Collapse>
        )}

        {/* Expand/Collapse Button */}
        {(issue.description && issue.description.length > 100) || 
         (issue.acceptanceCriteria && issue.acceptanceCriteria.length > 80) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default EnhancedIssueCard;

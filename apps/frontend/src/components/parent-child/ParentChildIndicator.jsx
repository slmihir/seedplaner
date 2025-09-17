/**
 * Parent-Child Indicator Component
 * Shows visual indicators for parent-child relationships in issue cards
 */

import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Stack,
  Typography
} from '@mui/material';
import {
  List as SubTaskIcon,
  ArrowUpward as ParentIcon,
  ArrowDownward as ChildIcon,
  Link as LinkIcon
} from '@mui/icons-material';

const ParentChildIndicator = ({ issue, size = 'small', showLabels = false }) => {
  const hasParent = issue.parentIssue;
  const hasChildren = issue.childIssues && issue.childIssues.length > 0;
  const hasLinks = issue.linkedIssues && issue.linkedIssues.length > 0;
  const isSubtask = issue.type === 'subtask' || hasParent;

  if (!hasParent && !hasChildren && !hasLinks && !isSubtask) {
    return null;
  }

  const getChipProps = (color, icon) => ({
    size,
    color,
    icon,
    variant: 'outlined',
    sx: { 
      height: size === 'small' ? 20 : 24,
      fontSize: size === 'small' ? '0.7rem' : '0.75rem'
    }
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* Parent Indicator */}
      {hasParent && (
        <Tooltip title={`Parent: ${issue.parentIssue?.key || 'Unknown'}`}>
          <Chip
            {...getChipProps('primary', <ParentIcon />)}
            label={showLabels ? 'Parent' : ''}
          />
        </Tooltip>
      )}

      {/* Subtask Indicator */}
      {isSubtask && !hasParent && (
        <Tooltip title="This is a subtask">
          <Chip
            {...getChipProps('secondary', <SubTaskIcon />)}
            label={showLabels ? 'Subtask' : ''}
          />
        </Tooltip>
      )}

      {/* Children Indicator */}
      {hasChildren && (
        <Tooltip title={`${issue.childIssues.length} child issue${issue.childIssues.length > 1 ? 's' : ''}`}>
          <Chip
            {...getChipProps('info', <ChildIcon />)}
            label={showLabels ? `${issue.childIssues.length}` : ''}
          />
        </Tooltip>
      )}

      {/* Links Indicator */}
      {hasLinks && (
        <Tooltip title={`${issue.linkedIssues.length} linked issue${issue.linkedIssues.length > 1 ? 's' : ''}`}>
          <Chip
            {...getChipProps('default', <LinkIcon />)}
            label={showLabels ? `${issue.linkedIssues.length}` : ''}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default ParentChildIndicator;

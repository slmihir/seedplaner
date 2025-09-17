import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  Task as TaskIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Folder as FolderIcon,
  Flag as PriorityIcon
} from '@mui/icons-material';
import IssuesTable from './IssuesTable';

const GROUP_ICONS = {
  status: <TaskIcon />,
  assignees: <PersonIcon />,
  type: <BugIcon />,
  project: <FolderIcon />,
  priority: <PriorityIcon />
};

const GROUP_COLORS = {
  status: 'primary',
  assignees: 'secondary',
  type: 'info',
  project: 'success',
  priority: 'warning'
};

export default function GroupedIssuesTable({
  issues = [],
  users = [],
  projects = [],
  groupBy = 'none',
  currentUserId = null,
  ...tableProps
}) {
  // Group data based on groupBy
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Issues': issues };
    }

    const groups = {};
    
    issues.forEach(issue => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'status':
          groupKey = issue.status || 'No Status';
          break;
        case 'assignees':
          if (issue.assignees && issue.assignees.length > 0) {
            const userNames = issue.assignees.map(assignee => {
              // Handle both user ID (string) and populated user object
              if (typeof assignee === 'object' && assignee.name) {
                return assignee.name;
              }
              const user = users.find(u => u._id === assignee);
              return user ? user.name : 'Unknown User';
            });
            groupKey = userNames.join(', ');
          } else {
            groupKey = 'Unassigned';
          }
          break;
        case 'type':
          groupKey = issue.type || 'Task';
          break;
        case 'project':
          const project = projects.find(p => p._id === issue.project);
          groupKey = project ? project.name : 'Unknown Project';
          break;
        case 'priority':
          groupKey = issue.priority || 'No Priority';
          break;
        default:
          groupKey = 'All Issues';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(issue);
    });

    return groups;
  }, [issues, groupBy, users, projects]);

  const getGroupIcon = (groupKey) => {
    if (groupBy === 'status') return <TaskIcon />;
    if (groupBy === 'assignees') return <PersonIcon />;
    if (groupBy === 'type') return <BugIcon />;
    if (groupBy === 'project') return <FolderIcon />;
    if (groupBy === 'priority') return <PriorityIcon />;
    return <StarIcon />;
  };

  const getGroupColor = (groupKey) => {
    if (groupBy === 'status') {
      const statusColors = {
        'backlog': 'default',
        'analysis_ready': 'info',
        'analysis_requirements': 'warning',
        'development': 'primary',
        'acceptance': 'secondary',
        'released': 'success'
      };
      return statusColors[groupKey] || 'default';
    }
    if (groupBy === 'assignees') return 'secondary';
    if (groupBy === 'type') return 'info';
    if (groupBy === 'project') return 'success';
    if (groupBy === 'priority') return 'warning';
    return 'primary';
  };

  if (groupBy === 'none') {
    return (
      <IssuesTable
        issues={issues}
        users={users}
        projects={projects}
        currentUserId={currentUserId}
        {...tableProps}
      />
    );
  }

  return (
    <Box>
      {Object.entries(groupedData).map(([groupKey, groupIssues]) => (
        <Accordion key={groupKey} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              {getGroupIcon(groupKey)}
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {groupKey}
              </Typography>
              <Chip
                label={groupIssues.length}
                size="small"
                color={getGroupColor(groupKey)}
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
              <IssuesTable
                issues={[]}
                users={users}
                projects={projects}
                customData={groupIssues}
                currentUserId={currentUserId}
                {...tableProps}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

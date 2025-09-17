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
  Folder as FolderIcon,
  Person as PersonIcon,
  BugReport as BugIcon,
  Task as TaskIcon,
  Star as StarIcon
} from '@mui/icons-material';
import ProjectsTable from './ProjectsTable';

const GROUP_ICONS = {
  status: <TaskIcon />,
  assignee: <PersonIcon />,
  type: <BugIcon />,
  project: <FolderIcon />
};

const GROUP_COLORS = {
  status: 'primary',
  assignee: 'secondary',
  type: 'info',
  project: 'success'
};

export default function GroupedProjectsTable({
  projects = [],
  issues = [],
  users = [],
  groupBy = 'none',
  ...tableProps
}) {
  // Combine projects with their issues for grouping
  const tableData = useMemo(() => {
    const combined = [];
    
    projects.forEach(project => {
      // Add project row
      combined.push({
        id: project._id,
        type: 'project',
        key: project.key,
        name: project.name,
        description: project.description,
        status: project.status || 'active',
        assignee: project.members?.length || 0,
        storyPoints: null,
        members: project.members || [],
        project: project,
        issue: null
      });

      // Add issues for this project
      const projectIssues = issues.filter(issue => issue.project === project._id);
      projectIssues.forEach(issue => {
        combined.push({
          id: issue._id,
          type: 'issue',
          key: issue.key,
          name: issue.title,
          description: issue.description,
          status: issue.status,
          assignee: issue.assignee,
          storyPoints: issue.storyPoints,
          members: [],
          project: project,
          issue: issue
        });
      });
    });

    return combined;
  }, [projects, issues]);

  // Group data based on groupBy
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Items': tableData };
    }

    const groups = {};
    
    tableData.forEach(item => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'status':
          groupKey = item.status || 'No Status';
          break;
        case 'assignee':
          if (item.assignee) {
            const user = users.find(u => u._id === item.assignee);
            groupKey = user ? user.name : 'Unknown User';
          } else {
            groupKey = 'Unassigned';
          }
          break;
        case 'type':
          groupKey = item.type === 'project' ? 'Projects' : (item.issue?.type || 'Task');
          break;
        case 'project':
          groupKey = item.project.name;
          break;
        default:
          groupKey = 'All Items';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [tableData, groupBy, users]);

  const getGroupIcon = (groupKey) => {
    if (groupBy === 'status') return <TaskIcon />;
    if (groupBy === 'assignee') return <PersonIcon />;
    if (groupBy === 'type') return <BugIcon />;
    if (groupBy === 'project') return <FolderIcon />;
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
        'released': 'success',
        'active': 'success'
      };
      return statusColors[groupKey] || 'default';
    }
    if (groupBy === 'assignee') return 'secondary';
    if (groupBy === 'type') return 'info';
    if (groupBy === 'project') return 'success';
    return 'primary';
  };

  if (groupBy === 'none') {
    return (
      <ProjectsTable
        projects={projects}
        issues={issues}
        users={users}
        {...tableProps}
      />
    );
  }

  return (
    <Box>
      {Object.entries(groupedData).map(([groupKey, items]) => (
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
                label={items.length}
                size="small"
                color={getGroupColor(groupKey)}
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
              <ProjectsTable
                projects={[]}
                issues={[]}
                users={users}
                customData={items}
                {...tableProps}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

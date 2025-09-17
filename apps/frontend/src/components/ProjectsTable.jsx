import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  List as ListIcon,
  ViewKanban as ViewKanbanIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ResponsiveTableWrapper from './ResponsiveTableWrapper';

const STATUS_COLORS = {
  // Issue statuses
  backlog: 'default',
  'analysis_ready': 'info',
  'analysis_requirements': 'warning',
  development: 'primary',
  acceptance: 'secondary',
  released: 'success',
  // Project statuses
  active: 'success',
  on_hold: 'warning',
  completed: 'info',
  cancelled: 'error'
};

const TYPE_COLORS = {
  task: 'default',
  bug: 'error',
  story: 'primary',
  epic: 'secondary'
};

const PRIORITY_COLORS = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error'
};

export default function ProjectsTable({
  projects = [],
  issues = [],
  users = [],
  customData = null,
  loading = false,
  error = null,
  onEditProject,
  onDeleteProject,
  onViewProject,
  onViewProjectIssues,
  onViewProjectSprints,
  onViewProjectBoard,
  onConfigureProject,
  onAssignMember,
  selectedItems = [],
  onSelectionChange,
  sortBy = '',
  sortDirection = 'asc',
  onSort,
  onFilter,
  onSearch,
  searchTerm = '',
  filterOptions = {}
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [membersDialog, setMembersDialog] = useState({ open: false, project: null });

  // Combine projects with their issues for table display
  const tableData = useMemo(() => {
    // If custom data is provided (for grouping), use it directly
    if (customData) {
      return customData;
    }

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
  }, [projects, issues, customData]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = tableData;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.key.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filterOptions.status) {
      filtered = filtered.filter(item => item.status === filterOptions.status);
    }
    if (filterOptions.type) {
      filtered = filtered.filter(item => item.type === filterOptions.type);
    }
    if (filterOptions.assignee) {
      filtered = filtered.filter(item => item.assignee === filterOptions.assignee);
    }

    return filtered;
  }, [tableData, searchTerm, filterOptions]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle nested objects
      if (sortBy === 'assignee') {
        aVal = users.find(u => u._id === a.assignee)?.name || '';
        bVal = users.find(u => u._id === b.assignee)?.name || '';
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [filteredData, sortBy, sortDirection, users]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      onSelectionChange(sortedData.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (event, id) => {
    const selectedIndex = selectedItems.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedItems, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedItems.slice(1));
    } else if (selectedIndex === selectedItems.length - 1) {
      newSelected = newSelected.concat(selectedItems.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedItems.slice(0, selectedIndex),
        selectedItems.slice(selectedIndex + 1)
      );
    }

    onSelectionChange(newSelected);
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleShowMembers = (project) => {
    setMembersDialog({ open: true, project });
  };

  const handleCloseMembersDialog = () => {
    setMembersDialog({ open: false, project: null });
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    // Handle case where userId might be a populated user object
    if (typeof userId === 'object' && userId.name) {
      return userId.name;
    }
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown';
  };

  const getUserInitials = (userId) => {
    if (!userId) return '?';
    // Handle case where userId might be a populated user object
    if (typeof userId === 'object' && userId.name) {
      return userId.name.charAt(0).toUpperCase();
    }
    const user = users.find(u => u._id === userId);
    return user ? user.name.charAt(0).toUpperCase() : '?';
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'default';
  };

  const getTypeColor = (type) => {
    return TYPE_COLORS[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <ResponsiveTableWrapper>
      <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
        <Table stickyHeader>
          <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedItems.length > 0 && selectedItems.length < sortedData.length}
                checked={sortedData.length > 0 && selectedItems.length === sortedData.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'type'}
                direction={sortBy === 'type' ? sortDirection : 'asc'}
                onClick={() => onSort('type')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'key'}
                direction={sortBy === 'key' ? sortDirection : 'asc'}
                onClick={() => onSort('key')}
              >
                Key
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortDirection : 'asc'}
                onClick={() => onSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'status'}
                direction={sortBy === 'status' ? sortDirection : 'asc'}
                onClick={() => onSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy === 'assignee'}
                direction={sortBy === 'assignee' ? sortDirection : 'asc'}
                onClick={() => onSort('assignee')}
              >
                Assignee
              </TableSortLabel>
            </TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row) => {
            const isSelected = selectedItems.indexOf(row.id) !== -1;
            const isProject = row.type === 'project';

            return (
              <TableRow
                key={row.id}
                hover
                selected={isSelected}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  '&.Mui-selected': { backgroundColor: 'primary.light' },
                  cursor: 'pointer'
                }}
                onClick={() => onViewProject(row)}
                title="Click to view project details, or use menu (⋮) for more options"
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected}
                    onChange={(event) => handleSelectRow(event, row.id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={isProject ? 'Project' : row.issue?.type || 'Task'}
                    size="small"
                    color={isProject ? 'primary' : getTypeColor(row.issue?.type)}
                    variant={isProject ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {row.key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={isProject ? 'bold' : 'normal'}>
                      {row.name}
                    </Typography>
                    {row.description && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.status?.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(row.status)}
                  />
                </TableCell>
                <TableCell>
                  {isProject ? (
                    <Box
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover', borderRadius: 1 }
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleShowMembers(row.project);
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {row.members?.length || 0}
                        </Avatar>
                        <Typography variant="body2">
                          {row.members?.length || 0} member{(row.members?.length || 0) !== 1 ? 's' : ''}
                        </Typography>
                      </Stack>
                    </Box>
                  ) : (
                    row.assignee ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {getUserInitials(row.assignee)}
                        </Avatar>
                        <Typography variant="body2">
                          {getUserName(row.assignee)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMenuOpen(event, row);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedRow && [
          selectedRow.type === 'project' && (
            <MenuItem key="view-issues" onClick={() => { onViewProjectIssues && onViewProjectIssues(selectedRow); handleMenuClose(); }}>
              <ListItemIcon>
                <ListIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Issues</ListItemText>
            </MenuItem>
          ),
          selectedRow.type === 'project' && (
            <MenuItem key="view-sprints" onClick={() => { onViewProjectSprints && onViewProjectSprints(selectedRow); handleMenuClose(); }}>
              <ListItemIcon>
                <ScheduleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Sprints</ListItemText>
            </MenuItem>
          ),
          selectedRow.type === 'project' && (
            <MenuItem key="view-board" onClick={() => { onViewProjectBoard && onViewProjectBoard(selectedRow); handleMenuClose(); }}>
              <ListItemIcon>
                <ViewKanbanIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Board</ListItemText>
            </MenuItem>
          ),
          selectedRow.type === 'project' && <Divider key="nav-divider" />,
          <MenuItem key="configure" onClick={() => { onConfigureProject && onConfigureProject(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configure</ListItemText>
          </MenuItem>,
          <MenuItem key="edit" onClick={() => { onEditProject(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>,
          selectedRow.type === 'project' && (
            <MenuItem key="assign" onClick={() => { onAssignMember(selectedRow); handleMenuClose(); }}>
              <ListItemIcon>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Members</ListItemText>
            </MenuItem>
          ),
          <Divider key="divider" />,
          <MenuItem 
            key="delete"
            onClick={() => { onDeleteProject(selectedRow); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        ].filter(Boolean)}
      </Menu>

      {/* Members Dialog */}
      <Dialog open={membersDialog.open} onClose={handleCloseMembersDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Project Members - {membersDialog.project?.name}
        </DialogTitle>
        <DialogContent>
          <List>
            {membersDialog.project?.members?.filter(member => member.user).map((member, index) => (
              <ListItem key={member.user._id || index}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {member.user.name ? member.user.name.charAt(0).toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.user.name || 'Unknown User'}
                  secondary={`${member.user.email} • ${member.role || 'assignee'}`}
                />
              </ListItem>
            ))}
            {(!membersDialog.project?.members || membersDialog.project.members.length === 0) && (
              <ListItem>
                <ListItemText
                  primary="No members assigned"
                  secondary="This project doesn't have any members yet."
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMembersDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </ResponsiveTableWrapper>
  );
}

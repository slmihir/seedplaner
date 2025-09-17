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
  TextField,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import ResponsiveTableWrapper from './ResponsiveTableWrapper';
import DailyStatusIndicator from './DailyStatusIndicator';

const STATUS_COLORS = {
  backlog: 'default',
  'analysis_ready': 'info',
  'analysis_requirements': 'warning',
  development: 'primary',
  acceptance: 'secondary',
  released: 'success'
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

export default function IssuesTable({
  issues = [],
  users = [],
  projects = [],
  customData = null,
  loading = false,
  error = null,
  onEditIssue,
  onDeleteIssue,
  onViewIssue,
  onAssignIssue,
  onUpdateStatus,
  selectedItems = [],
  onSelectionChange,
  sortBy = '',
  sortDirection = 'asc',
  onSort,
  onFilter,
  onSearch,
  searchTerm = '',
  filterOptions = {},
  currentUserId = null
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Filter and search data
  const filteredData = useMemo(() => {
    // If custom data is provided (for grouping), use it directly
    const dataSource = customData || issues;
    let filtered = dataSource;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(term) ||
        issue.key?.toLowerCase().includes(term) ||
        issue.description?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filterOptions.status) {
      filtered = filtered.filter(issue => issue.status === filterOptions.status);
    }
    if (filterOptions.type) {
      filtered = filtered.filter(issue => issue.type === filterOptions.type);
    }
    if (filterOptions.assignee) {
      filtered = filtered.filter(issue => issue.assignee === filterOptions.assignee);
    }
    if (filterOptions.project) {
      filtered = filtered.filter(issue => issue.project === filterOptions.project);
    }
    if (filterOptions.priority) {
      filtered = filtered.filter(issue => issue.priority === filterOptions.priority);
    }

    return filtered;
  }, [issues, customData, searchTerm, filterOptions]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle nested objects and special cases
      if (sortBy === 'assignees') {
        aVal = a.assignees && a.assignees.length > 0 ? 
          a.assignees.map(assignee => {
            // Handle both user ID (string) and populated user object
            if (typeof assignee === 'object' && assignee.name) {
              return assignee.name;
            }
            return users.find(u => u._id === assignee)?.name || 'Unknown';
          }).join(', ') : 'Unassigned';
        bVal = b.assignees && b.assignees.length > 0 ? 
          b.assignees.map(assignee => {
            // Handle both user ID (string) and populated user object
            if (typeof assignee === 'object' && assignee.name) {
              return assignee.name;
            }
            return users.find(u => u._id === assignee)?.name || 'Unknown';
          }).join(', ') : 'Unassigned';
      } else if (sortBy === 'project') {
        aVal = projects.find(p => p._id === a.project)?.name || '';
        bVal = projects.find(p => p._id === b.project)?.name || '';
      } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
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
  }, [filteredData, sortBy, sortDirection, users, projects]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      onSelectionChange(sortedData.map(issue => issue._id));
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

  const handleMenuOpen = (event, issue) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(issue);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleInlineEdit = (issue, field, value) => {
    setEditingCell(null);
    setEditValue('');
    onUpdateStatus(issue._id, { [field]: value });
  };

  const startInlineEdit = (issue, field) => {
    setEditingCell(`${issue._id}-${field}`);
    if (field === 'assignees') {
      setEditValue(issue.assignees ? issue.assignees.map(a => a._id || a) : []);
    } else {
      setEditValue(issue[field] || '');
    }
  };

  const getUserName = (userIdOrUser) => {
    // Handle both user ID (string) and populated user object
    if (typeof userIdOrUser === 'object' && userIdOrUser.name) {
      return userIdOrUser.name;
    }
    const user = users.find(u => u._id === userIdOrUser);
    return user ? user.name : 'Unassigned';
  };

  const getUserInitials = (userIdOrUser) => {
    // Handle both user ID (string) and populated user object
    if (typeof userIdOrUser === 'object' && userIdOrUser.name) {
      return userIdOrUser.name.charAt(0).toUpperCase();
    }
    const user = users.find(u => u._id === userIdOrUser);
    return user ? user.name.charAt(0).toUpperCase() : '?';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getProjectKey = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.key : 'UNK';
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'default';
  };

  const getTypeColor = (type) => {
    return TYPE_COLORS[type] || 'default';
  };

  const getPriorityColor = (priority) => {
    return PRIORITY_COLORS[priority] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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
                  active={sortBy === 'title'}
                  direction={sortBy === 'title' ? sortDirection : 'asc'}
                  onClick={() => onSort('title')}
                >
                  Summary
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
                  active={sortBy === 'assignees'}
                  direction={sortBy === 'assignees' ? sortDirection : 'asc'}
                  onClick={() => onSort('assignees')}
                >
                  Assignees
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'priority'}
                  direction={sortBy === 'priority' ? sortDirection : 'asc'}
                  onClick={() => onSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'storyPoints'}
                  direction={sortBy === 'storyPoints' ? sortDirection : 'asc'}
                  onClick={() => onSort('storyPoints')}
                >
                  Story Points
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'createdAt'}
                  direction={sortBy === 'createdAt' ? sortDirection : 'asc'}
                  onClick={() => onSort('createdAt')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'updatedAt'}
                  direction={sortBy === 'updatedAt' ? sortDirection : 'asc'}
                  onClick={() => onSort('updatedAt')}
                >
                  Updated
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((issue) => {
              const isSelected = selectedItems.indexOf(issue._id) !== -1;
              const issueKey = issue.key;

              return (
                <TableRow
                  key={issue._id}
                  hover
                  selected={isSelected}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    '&.Mui-selected': { backgroundColor: 'primary.light' },
                    cursor: 'pointer'
                  }}
                  onClick={() => onViewIssue(issue)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => handleSelectRow(event, issue._id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.type || 'Task'}
                      size="small"
                      color={getTypeColor(issue.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {issueKey}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {issue.title}
                      </Typography>
                      {issue.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {issue.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {editingCell === `${issue._id}-status` ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editValue}
                          onChange={(e) => handleInlineEdit(issue, 'status', e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                        >
                          <MenuItem key="backlog-table" value="backlog">Backlog</MenuItem>
                          <MenuItem key="analysis_ready-table" value="analysis_ready">Analysis Ready</MenuItem>
                          <MenuItem key="analysis_requirements-table" value="analysis_requirements">Analysis Requirements</MenuItem>
                          <MenuItem key="development-table" value="development">Development</MenuItem>
                          <MenuItem key="acceptance-table" value="acceptance">Acceptance</MenuItem>
                          <MenuItem key="released-table" value="released">Released</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={issue.status?.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(issue.status)}
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(issue, 'status');
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCell === `${issue._id}-assignees` ? (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                          multiple
                          value={editValue}
                          onChange={(e) => handleInlineEdit(issue, 'assignees', e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((userId) => {
                                const user = users.find(u => u._id === userId);
                                return user ? (
                                  <Chip
                                    key={userId}
                                    size="small"
                                    avatar={<Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>{getUserInitials(user)}</Avatar>}
                                    label={user.name}
                                  />
                                ) : null;
                              })}
                            </Box>
                          )}
                        >
                          {users.map(user => (
                            <MenuItem key={user._id} value={user._id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                                  {getUserInitials(user)}
                                </Avatar>
                                {user.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(issue, 'assignees');
                        }}
                        sx={{ cursor: 'pointer', flexWrap: 'wrap', gap: 0.5 }}
                      >
                        {issue.assignees && issue.assignees.length > 0 ? (
                          issue.assignees.map((assignee, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {getUserInitials(assignee)}
                              </Avatar>
                              <Typography variant="body2">
                                {getUserName(assignee)}
                              </Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCell === `${issue._id}-priority` ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={editValue}
                          onChange={(e) => handleInlineEdit(issue, 'priority', e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                        >
                          <MenuItem key="low-table" value="low">Low</MenuItem>
                          <MenuItem key="medium-table" value="medium">Medium</MenuItem>
                          <MenuItem key="high-table" value="high">High</MenuItem>
                          <MenuItem key="critical-table" value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={issue.priority || 'Medium'}
                        size="small"
                        color={getPriorityColor(issue.priority)}
                        onClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(issue, 'priority');
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Chip
                        label={issue.storyPoints || 0}
                        size="small"
                        variant="outlined"
                        color={issue.storyPoints > 0 ? 'primary' : 'default'}
                        sx={{ 
                          minWidth: 40,
                          fontWeight: 'bold',
                          backgroundColor: issue.storyPoints > 0 ? 'primary.50' : 'transparent'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(issue.createdAt)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(issue.updatedAt)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {currentUserId && (
                        <DailyStatusIndicator 
                          issueId={issue._id} 
                          userId={currentUserId} 
                          issue={issue}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleMenuOpen(event, issue);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
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
          <MenuItem key="view" onClick={() => { onViewIssue(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>,
          <MenuItem key="edit" onClick={() => { onEditIssue(selectedRow); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Issue</ListItemText>
          </MenuItem>,
          <Divider key="divider" />,
          <MenuItem 
            key="delete"
            onClick={() => { onDeleteIssue(selectedRow); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Issue</ListItemText>
          </MenuItem>
        ]}
      </Menu>
    </ResponsiveTableWrapper>
  );
}

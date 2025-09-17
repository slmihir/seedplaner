import React, { useState, useMemo, useCallback, memo } from 'react';
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
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { List } from 'react-window';
import ResponsiveTableWrapper from './ResponsiveTableWrapper';

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

// Memoized row component for better performance
const IssueRow = memo(({ index, style, data }) => {
  const { 
    issues, 
    users, 
    projects, 
    selectedItems, 
    onSelectionChange, 
    onEditIssue, 
    onDeleteIssue, 
    onViewIssue, 
    onAssignIssue, 
    onUpdateStatus,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue
  } = data;

  const issue = issues[index];
  const isSelected = selectedItems.indexOf(issue._id) !== -1;
  const issueKey = issue.key;

  const handleSelect = (event) => {
    event.stopPropagation();
    const newSelectedItems = isSelected
      ? selectedItems.filter(id => id !== issue._id)
      : [...selectedItems, issue._id];
    onSelectionChange(newSelectedItems);
  };

  const handleInlineEdit = (issue, field, value) => {
    setEditingCell(null);
    setEditValue('');
    onUpdateStatus(issue._id, { [field]: value });
  };

  const startInlineEdit = (issue, field) => {
    setEditingCell(`${issue._id}-${field}`);
    setEditValue(issue[field] || '');
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

  return (
    <div style={style}>
      <TableRow
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
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
        <TableCell>
          <Chip
            label={issue.type}
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
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {issue.title}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={issue.status}
            size="small"
            color={getStatusColor(issue.status)}
            variant="filled"
          />
        </TableCell>
        <TableCell>
          {issue.assignees && issue.assignees.length > 0 ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {issue.assignees.map((assignee, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {getUserInitials(assignee)}
                  </Avatar>
                  <Typography variant="body2">
                    {getUserName(assignee)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unassigned
            </Typography>
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
                <MenuItem key="low-virtual" value="low">Low</MenuItem>
                <MenuItem key="medium-virtual" value="medium">Medium</MenuItem>
                <MenuItem key="high-virtual" value="high">High</MenuItem>
                <MenuItem key="critical-virtual" value="critical">Critical</MenuItem>
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
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Handle actions
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    </div>
  );
});

IssueRow.displayName = 'IssueRow';

export default function VirtualizedIssuesTable({
  issues = [],
  users = [],
  projects = [],
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
  filterOptions = {}
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Memoized data for the virtualized list
  const listData = useMemo(() => ({
    issues,
    users,
    projects,
    selectedItems,
    onSelectionChange,
    onEditIssue,
    onDeleteIssue,
    onViewIssue,
    onAssignIssue,
    onUpdateStatus,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue
  }), [
    issues,
    users,
    projects,
    selectedItems,
    onSelectionChange,
    onEditIssue,
    onDeleteIssue,
    onViewIssue,
    onAssignIssue,
    onUpdateStatus,
    editingCell,
    editValue
  ]);

  const handleSelectAll = useCallback((event) => {
    if (event.target.checked) {
      const newSelectedItems = issues.map(issue => issue._id);
      onSelectionChange(newSelectedItems);
    } else {
      onSelectionChange([]);
    }
  }, [issues, onSelectionChange]);

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
                  indeterminate={selectedItems.length > 0 && selectedItems.length < issues.length}
                  checked={issues.length > 0 && selectedItems.length === issues.length}
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
        </Table>
        <Box sx={{ height: '60vh', width: '100%' }}>
          <List
            height={600}
            itemCount={issues.length}
            itemSize={60}
            itemData={listData}
          >
            {IssueRow}
          </List>
        </Box>
      </TableContainer>
    </ResponsiveTableWrapper>
  );
}

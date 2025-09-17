import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  FileDownload as ExportIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  Flag as PriorityIcon,
  PlayArrow as StatusIcon
} from '@mui/icons-material';
import { useDynamicConfig, useProjectPriorities, getStatusOptions, getPriorityOptions } from '../hooks/useDynamicConfig';

const BULK_ACTIONS = [
  {
    id: 'assign',
    label: 'Assign to User',
    icon: <AssignmentIcon />,
    color: 'primary'
  },
  {
    id: 'status',
    label: 'Change Status',
    icon: <StatusIcon />,
    color: 'info'
  },
  {
    id: 'priority',
    label: 'Set Priority',
    icon: <PriorityIcon />,
    color: 'warning'
  },
  {
    id: 'edit',
    label: 'Edit Selected',
    icon: <EditIcon />,
    color: 'secondary'
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: <ExportIcon />,
    color: 'success'
  },
  {
    id: 'archive',
    label: 'Archive Selected',
    icon: <ArchiveIcon />,
    color: 'warning'
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: <DeleteIcon />,
    color: 'error'
  }
];

export default function IssuesBulkActions({
  selectedItems = [],
  onBulkAction,
  onClearSelection,
  users = [],
  disabled = false,
  projectId = null
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { config, loading: configLoading, error: configError } = useDynamicConfig();
  const { priorities, loading: prioritiesLoading, error: prioritiesError } = useProjectPriorities(projectId);

  // Get dynamic options
  const STATUS_OPTIONS = getStatusOptions(config);
  const PRIORITY_OPTIONS = getPriorityOptions(priorities);
  
  // Combined loading state
  const loading = configLoading || prioritiesLoading;
  const error = configError || prioritiesError;
  const [assignMenuAnchor, setAssignMenuAnchor] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAssignMenuOpen = (event) => {
    setAssignMenuAnchor(event.currentTarget);
  };

  const handleAssignMenuClose = () => {
    setAssignMenuAnchor(null);
  };

  const handleStatusMenuOpen = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handlePriorityMenuOpen = (event) => {
    setPriorityMenuAnchor(event.currentTarget);
  };

  const handlePriorityMenuClose = () => {
    setPriorityMenuAnchor(null);
  };

  const handleBulkAction = (actionId, data = null) => {
    onBulkAction(actionId, selectedItems, data);
    handleMenuClose();
    handleAssignMenuClose();
    handleStatusMenuClose();
    handlePriorityMenuClose();
  };

  const getSelectedTypes = () => {
    const types = new Set();
    selectedItems.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types);
  };

  const getSelectedStatuses = () => {
    const statuses = new Set();
    selectedItems.forEach(item => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses);
  };

  const selectedTypes = getSelectedTypes();
  const selectedStatuses = getSelectedStatuses();
  const isMixedSelection = selectedTypes.length > 1 || selectedStatuses.length > 1;

  if (selectedItems.length === 0) {
    return null;
  }

  // Show loading state while fetching configuration
  if (loading) {
    return (
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading configuration...
        </Typography>
      </Box>
    );
  }

  // Show error state if configuration failed to load
  if (error) {
    return (
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        p: 2
      }}>
        <Typography variant="body2" color="error">
          Failed to load configuration: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 10, 
      bgcolor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider',
      p: 2
    }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="subtitle1" color="primary">
          {selectedItems.length} issue{selectedItems.length !== 1 ? 's' : ''} selected
        </Typography>

        {selectedTypes.length > 0 && (
          <Stack direction="row" spacing={1}>
            {selectedTypes.map(type => (
              <Chip
                key={type}
                label={type}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        {selectedStatuses.length > 0 && (
          <Stack direction="row" spacing={1}>
            {selectedStatuses.map(status => (
              <Chip
                key={status}
                label={status.replace('_', ' ')}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleMenuOpen}
            disabled={disabled}
          >
            Bulk Actions
          </Button>

          <Tooltip title="Clear selection">
            <IconButton
              size="small"
              onClick={onClearSelection}
              disabled={disabled}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {BULK_ACTIONS
          .filter((action) => !(action.id === 'assign' && users.length === 0))
          .map((action) => (
            <MenuItem
              key={action.id}
              onClick={() => {
                if (action.id === 'assign') {
                  handleAssignMenuOpen(null);
                } else if (action.id === 'status') {
                  handleStatusMenuOpen(null);
                } else if (action.id === 'priority') {
                  handlePriorityMenuOpen(null);
                } else {
                  handleBulkAction(action.id);
                }
              }}
              disabled={disabled}
            >
              <ListItemIcon>
                {action.icon}
              </ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
      </Menu>

      {/* Assign to User Submenu */}
      <Menu
        anchorEl={assignMenuAnchor}
        open={Boolean(assignMenuAnchor)}
        onClose={handleAssignMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem disabled>
          <ListItemText>
            <Typography variant="subtitle2">Assign to User</Typography>
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('assign', { userId: '', userName: 'Unassigned' })}>
          <ListItemText>Unassigned</ListItemText>
        </MenuItem>
        {users.map((user) => (
          <MenuItem
            key={user._id}
            onClick={() => handleBulkAction('assign', { userId: user._id, userName: user.name })}
          >
            <ListItemText>{user.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Change Status Submenu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem disabled>
          <ListItemText>
            <Typography variant="subtitle2">Change Status</Typography>
          </ListItemText>
        </MenuItem>
        <Divider />
        {STATUS_OPTIONS.map((status) => (
          <MenuItem
            key={status.value}
            onClick={() => handleBulkAction('status', { status: status.value, statusLabel: status.label })}
          >
            <ListItemText>{status.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Set Priority Submenu */}
      <Menu
        anchorEl={priorityMenuAnchor}
        open={Boolean(priorityMenuAnchor)}
        onClose={handlePriorityMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem disabled>
          <ListItemText>
            <Typography variant="subtitle2">Set Priority</Typography>
          </ListItemText>
        </MenuItem>
        <Divider />
        {PRIORITY_OPTIONS.map((priority) => (
          <MenuItem
            key={priority.value}
            onClick={() => handleBulkAction('priority', { priority: priority.value, priorityLabel: priority.label })}
          >
            <ListItemText>{priority.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

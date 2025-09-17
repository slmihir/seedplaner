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
  Tooltip
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
  Close as CloseIcon
} from '@mui/icons-material';

const BULK_ACTIONS = [
  {
    id: 'assign',
    label: 'Assign to User',
    icon: <AssignmentIcon />,
    color: 'primary'
  },
  {
    id: 'edit',
    label: 'Edit Selected',
    icon: <EditIcon />,
    color: 'info'
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: <ExportIcon />,
    color: 'success'
  },
  {
    id: 'share',
    label: 'Share Selected',
    icon: <ShareIcon />,
    color: 'secondary'
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

export default function BulkActions({
  selectedItems = [],
  onBulkAction,
  onClearSelection,
  users = [],
  disabled = false
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [assignMenuAnchor, setAssignMenuAnchor] = useState(null);

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

  const handleBulkAction = (actionId, data = null) => {
    onBulkAction(actionId, selectedItems, data);
    handleMenuClose();
    handleAssignMenuClose();
  };

  const getSelectedTypes = () => {
    const types = new Set();
    selectedItems.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types);
  };

  const selectedTypes = getSelectedTypes();
  const isMixedSelection = selectedTypes.length > 1;

  if (selectedItems.length === 0) {
    return null;
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
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </Typography>

        {selectedTypes.length > 0 && (
          <Stack direction="row" spacing={1}>
            {selectedTypes.map(type => (
              <Chip
                key={type}
                label={type}
                size="small"
                color={type === 'project' ? 'primary' : 'secondary'}
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
        {BULK_ACTIONS.map((action) => {
          if (action.id === 'assign' && users.length === 0) {
            return null; // Don't show assign if no users available
          }

          return (
            <MenuItem
              key={action.id}
              onClick={() => {
                if (action.id === 'assign') {
                  handleAssignMenuOpen(null);
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
          );
        })}
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
        {users.map((user) => (
          <MenuItem
            key={user._id}
            onClick={() => handleBulkAction('assign', { userId: user._id, userName: user.name })}
          >
            <ListItemText>{user.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

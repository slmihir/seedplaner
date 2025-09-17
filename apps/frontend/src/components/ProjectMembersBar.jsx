import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Edit as EditIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

const ROLE_COLORS = {
  admin: 'error',
  editor: 'warning',
  assignee: 'info'
};

const ROLE_ICONS = {
  admin: <AdminIcon />,
  editor: <EditIcon />,
  assignee: <PersonIcon />
};

export default function ProjectMembersBar({
  members = [],
  users = [],
  currentUser = null,
  onAddMember,
  onEditMember,
  onRemoveMember,
  onManageMembers,
  maxDisplay = 8
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const getUserById = (userId) => {
    return users.find(user => user._id === userId);
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    return user.name ? user.name.charAt(0).toUpperCase() : '?';
  };

  const canManageMembers = () => {
    if (!currentUser) return false;
    const currentUserMember = members.find(m => m.user._id === currentUser.id);
    return currentUserMember?.role === 'admin' || currentUser.role === 'admin';
  };

  const displayedMembers = members.slice(0, maxDisplay);
  const hiddenCount = members.length - maxDisplay;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" component="h2">
          Project Members ({members.length})
        </Typography>
        {canManageMembers() && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onManageMembers}
          >
            Manage Members
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        {displayedMembers.filter(member => member.user).map((member) => {
          const user = getUserById(member.user._id || member.user);
          if (!user) return null;

          return (
            <Tooltip
              key={member.user._id || member.user}
              title={
                <Box>
                  <Typography variant="subtitle2">{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                  <br />
                  <Chip
                    label={member.role}
                    size="small"
                    color={ROLE_COLORS[member.role]}
                    icon={ROLE_ICONS[member.role]}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  position: 'relative',
                  cursor: canManageMembers() ? 'pointer' : 'default'
                }}
                onClick={() => canManageMembers() && handleMenuOpen(null, member)}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    border: 2,
                    borderColor: ROLE_COLORS[member.role] === 'error' ? 'error.main' : 
                                 ROLE_COLORS[member.role] === 'warning' ? 'warning.main' : 'info.main',
                    bgcolor: ROLE_COLORS[member.role] === 'error' ? 'error.light' : 
                             ROLE_COLORS[member.role] === 'warning' ? 'warning.light' : 'info.light',
                    color: ROLE_COLORS[member.role] === 'error' ? 'error.contrastText' : 
                           ROLE_COLORS[member.role] === 'warning' ? 'warning.contrastText' : 'info.contrastText'
                  }}
                >
                  {getUserInitials(user)}
                </Avatar>
                
                {/* Role indicator */}
                <Chip
                  label={member.role}
                  size="small"
                  color={ROLE_COLORS[member.role]}
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    fontSize: '0.6rem',
                    height: 16,
                    minWidth: 16
                  }}
                />

                {canManageMembers() && (
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, member);
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                )}
              </Box>
            </Tooltip>
          );
        })}

        {hiddenCount > 0 && (
          <Tooltip title={`${hiddenCount} more members`}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'grey.300',
                color: 'grey.600',
                fontSize: '0.875rem'
              }}
            >
              +{hiddenCount}
            </Avatar>
          </Tooltip>
        )}

        {members.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No members assigned to this project
          </Typography>
        )}
      </Stack>

      {/* Member Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedMember && (
          <>
            <MenuItem onClick={() => { onEditMember(selectedMember); handleMenuClose(); }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Role</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => { onRemoveMember(selectedMember); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <RemoveIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Remove Member</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
}

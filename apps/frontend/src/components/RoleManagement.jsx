import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Tooltip,
  Badge,
  Checkbox
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  DeveloperMode as DeveloperIcon,
  Visibility as ViewerIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  admin: 'error',
  manager: 'warning', 
  developer: 'primary',
  viewer: 'default'
};

const ROLE_ICONS = {
  admin: <AdminIcon />,
  manager: <ManagerIcon />,
  developer: <DeveloperIcon />,
  viewer: <ViewerIcon />
};

const PERMISSION_CATEGORIES = {
  'User Management': ['users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles', 'users.activate_deactivate'],
  'Project Management': ['projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.manage_members', 'projects.manage_settings'],
  'Issue Management': ['issues.create', 'issues.read', 'issues.update', 'issues.delete', 'issues.assign', 'issues.change_status', 'issues.manage_links'],
  'Sprint Management': ['sprints.create', 'sprints.read', 'sprints.update', 'sprints.delete', 'sprints.start', 'sprints.complete', 'sprints.manage_issues'],
  'Board Management': ['boards.read', 'boards.move_cards', 'boards.manage_columns'],
  'Global Members': ['global_members.create', 'global_members.read', 'global_members.update', 'global_members.delete'],
  'Reports & Analytics': ['reports.view', 'reports.export', 'analytics.view'],
  'System Administration': ['system.settings', 'system.backup', 'system.logs']
};

const RoleManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [deleteRoleDialogOpen, setDeleteRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [tabValue, setTabValue] = useState(0);
  
  // Role form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    level: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchAvailablePermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      console.log('Fetching available permissions...');
      const response = await api.get('/roles/permissions');
      console.log('Permissions response:', response.data);
      
      // Convert array of permissions to categorized object
      const permissionsArray = response.data.permissions || [];
      const categorizedPermissions = {};
      
      // Group permissions by category
      permissionsArray.forEach(permission => {
        const category = permission.name.split('.')[0];
        const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1) + ' Management';
        
        if (!categorizedPermissions[formattedCategory]) {
          categorizedPermissions[formattedCategory] = [];
        }
        categorizedPermissions[formattedCategory].push(permission.name);
      });
      
      setAvailablePermissions(categorizedPermissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions. Please refresh the page.');
      // Fallback to static permissions
      setAvailablePermissions(PERMISSION_CATEGORIES);
    }
  };

  const handleCreateRole = async () => {
    try {
      await api.post('/roles', roleForm);
      setSuccess('Role created successfully');
      setCreateRoleDialogOpen(false);
      resetRoleForm();
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async () => {
    try {
      await api.delete(`/roles/${selectedRole.name}`);
      setSuccess('Role deleted successfully');
      setDeleteRoleDialogOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
      level: 0
    });
  };

  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setRoleForm({
        ...roleForm,
        permissions: [...roleForm.permissions, permission]
      });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: roleForm.permissions.filter(p => p !== permission)
      });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const { _id, ...updateData } = editingUser;
      await api.patch(`/users/${_id}`, updateData);
      
      setUsers(users.map(u => u._id === _id ? editingUser : u));
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleRoleChange = (role) => {
    setEditingUser({ ...editingUser, role });
  };

  const handleStatusToggle = (isActive) => {
    setEditingUser({ ...editingUser, isActive });
  };

  const handleViewPermissions = (role) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  const getRolePermissions = (role) => {
    // This would normally come from the API, but for now we'll use the same mapping
    const rolePermissions = {
      admin: Object.values(PERMISSION_CATEGORIES).flat(),
      manager: [
        'users.read', 'users.update',
        'projects.create', 'projects.read', 'projects.update', 'projects.manage_members', 'projects.manage_settings',
        'issues.create', 'issues.read', 'issues.update', 'issues.delete', 'issues.assign', 'issues.change_status', 'issues.manage_links',
        'sprints.create', 'sprints.read', 'sprints.update', 'sprints.delete', 'sprints.start', 'sprints.complete', 'sprints.manage_issues',
        'boards.read', 'boards.move_cards', 'boards.manage_columns',
        'global_members.read', 'global_members.update',
        'reports.view', 'reports.export', 'analytics.view'
      ],
      developer: [
        'issues.create', 'issues.read', 'issues.update', 'issues.assign_self', 'issues.change_status_own',
        'sprints.read', 'sprints.view_issues',
        'boards.read', 'boards.move_cards_own',
        'global_members.read'
      ],
      viewer: [
        'issues.read', 'sprints.read', 'boards.read', 'global_members.read'
      ]
    };
    return rolePermissions[role] || [];
  };

  const userRoleName = currentUser?.role?.name || currentUser?.role; // Handle both object and string formats
  const canManageUsers = userRoleName === 'admin' || userRoleName === 'manager';

  if (!canManageUsers) {
    return (
      <Alert severity="error">
        You don't have permission to manage users. Admin or Manager role required.
      </Alert>
    );
  }

  if (loading) return <Typography>Loading users...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateRoleDialogOpen(true)}
        >
          Create Role
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: ROLE_COLORS[user.role?.name || user.role] + '.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={ROLE_ICONS[user.role?.name || user.role]}
                        label={user.role?.name || user.role}
                        color={ROLE_COLORS[user.role?.name || user.role]}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`${getRolePermissions(user.role?.name || user.role).length} permissions`}>
                        <Badge badgeContent={getRolePermissions(user.role?.name || user.role).length} color="primary">
                          <Button
                            size="small"
                            onClick={() => handleViewPermissions(user.role?.name || user.role)}
                            startIcon={<SecurityIcon />}
                          >
                            View
                          </Button>
                        </Badge>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditUser(user)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editingUser?.name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editingUser?.role?.name || editingUser?.role || 'developer'}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  label="Role"
                >
                  <MenuItem key="admin-role" value="admin">Admin</MenuItem>
                  <MenuItem key="manager-role" value="manager">Manager</MenuItem>
                  <MenuItem key="developer-role" value="developer">Developer</MenuItem>
                  <MenuItem key="viewer-role" value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingUser?.isActive || false}
                    onChange={(e) => handleStatusToggle(e.target.checked)}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" startIcon={<SaveIcon />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {ROLE_ICONS[selectedRole]}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Permissions
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            {Object.keys(PERMISSION_CATEGORIES).map((category, index) => (
              <Tab key={category} label={category} />
            ))}
          </Tabs>
          
          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions], categoryIndex) => (
            <Box key={category} sx={{ display: tabValue === categoryIndex ? 'block' : 'none' }}>
              <Typography variant="h6" gutterBottom>
                {category}
              </Typography>
              <Grid container spacing={1}>
                {permissions.map((permission) => {
                  const hasPermission = getRolePermissions(selectedRole).includes(permission);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={permission}>
                      <Chip
                        label={permission}
                        color={hasPermission ? 'success' : 'default'}
                        variant={hasPermission ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ width: '100%', justifyContent: 'flex-start' }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialogOpen} onClose={() => setCreateRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toLowerCase() })}
                helperText="Lowercase, no spaces (e.g., 'qa_tester')"
                placeholder="e.g., qa_tester"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={roleForm.displayName}
                onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                placeholder="e.g., QA Tester"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Describe the role's purpose and responsibilities"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Privilege Level"
                type="number"
                value={roleForm.level}
                onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) || 0 })}
                helperText="0-24: Basic, 25-49: Limited, 50-74: Standard, 75-99: Management, 100: Admin"
                inputProps={{ min: 0, max: 100 }}
                placeholder="e.g., 40 for Designer"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Permissions ({roleForm.permissions.length} selected)
              </Typography>
              {Object.keys(availablePermissions).length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Loading permissions... If this persists, please refresh the page.
                </Alert>
              )}
            </Grid>

            {Object.keys(availablePermissions).length > 0 ? Object.entries(availablePermissions).map(([category, permissions]) => (
              <Grid item xs={12} key={category}>
                <Typography variant="subtitle1" gutterBottom>
                  {category}
                </Typography>
                <Grid container spacing={1}>
                  {permissions.map((permission) => (
                    <Grid item xs={12} sm={6} md={4} key={permission}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={roleForm.permissions.includes(permission)}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          />
                        }
                        label={permission}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No permissions available. Please check your connection and refresh the page.
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" startIcon={<SaveIcon />}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={deleteRoleDialogOpen} onClose={() => setDeleteRoleDialogOpen(false)}>
        <DialogTitle>
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Delete Role
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "{selectedRole?.displayName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRole} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;

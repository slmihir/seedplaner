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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Divider,
  Stack
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
  ExpandMore as ExpandMoreIcon,
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

const AdvancedRoleManagement = () => {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    level: 0
  });

  useEffect(() => {
    fetchRoles();
    fetchAvailablePermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.roles);
    } catch (err) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await api.get('/roles/permissions');
      setAvailablePermissions(response.data.permissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleCreateRole = async () => {
    try {
      await api.post('/roles', roleForm);
      setSuccess('Role created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    try {
      await api.patch(`/roles/${selectedRole.name}`, roleForm);
      setSuccess('Role updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async () => {
    try {
      await api.delete(`/roles/${selectedRole.name}`);
      setSuccess('Role deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: [...role.permissions],
      level: role.level
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
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

  const handleCategoryPermissionChange = (categoryPermissions, checked) => {
    if (checked) {
      const newPermissions = [...roleForm.permissions];
      categoryPermissions.forEach(permission => {
        if (!newPermissions.includes(permission)) {
          newPermissions.push(permission);
        }
      });
      setRoleForm({ ...roleForm, permissions: newPermissions });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: roleForm.permissions.filter(p => !categoryPermissions.includes(p))
      });
    }
  };

  const canManageRoles = currentUser?.permissions?.includes('users.manage_roles');

  if (!canManageRoles) {
    return (
      <Alert severity="error">
        You don't have permission to manage roles. Admin role required.
      </Alert>
    );
  }

  if (loading) return <Typography>Loading roles...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Advanced Role Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
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
                  <TableCell>Role</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: ROLE_COLORS[role.name] + '.main' }}>
                          {ROLE_ICONS[role.name] || <SecurityIcon />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{role.displayName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{role.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Level ${role.level}`}
                        color={role.level >= 75 ? 'error' : role.level >= 50 ? 'warning' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`${role.permissions.length} permissions`}>
                        <Badge badgeContent={role.permissions.length} color="primary">
                          <Button
                            size="small"
                            onClick={() => handleEditRole(role)}
                            startIcon={<SecurityIcon />}
                          >
                            View
                          </Button>
                        </Badge>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isSystem ? 'System' : 'Custom'}
                        color={role.isSystem ? 'error' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditRole(role)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      {!role.isSystem && (
                        <IconButton
                          onClick={() => handleDeleteClick(role)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <RoleForm 
            formData={roleForm}
            setFormData={setRoleForm}
            availablePermissions={availablePermissions}
            onPermissionChange={handlePermissionChange}
            onCategoryPermissionChange={handleCategoryPermissionChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" startIcon={<SaveIcon />}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Role: {selectedRole?.displayName}</DialogTitle>
        <DialogContent>
          <RoleForm 
            formData={roleForm}
            setFormData={setRoleForm}
            availablePermissions={availablePermissions}
            onPermissionChange={handlePermissionChange}
            onCategoryPermissionChange={handleCategoryPermissionChange}
            isEdit={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" startIcon={<SaveIcon />}>
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRole} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Role Form Component
const RoleForm = ({ 
  formData, 
  setFormData, 
  availablePermissions, 
  onPermissionChange, 
  onCategoryPermissionChange,
  isEdit = false 
}) => {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Role Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
          disabled={isEdit}
          helperText={isEdit ? "Role name cannot be changed" : "Lowercase, no spaces (e.g., 'qa_tester')"}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="e.g., QA Tester"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the role's purpose and responsibilities"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Level"
          type="number"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
          helperText="Higher number = higher privilege level"
          inputProps={{ min: 0, max: 100 }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }}>
          <Typography variant="h6">Permissions</Typography>
        </Divider>
      </Grid>

      {Object.entries(availablePermissions).map(([category, permissions]) => {
        const categorySelected = permissions.every(p => formData.permissions.includes(p));
        const categoryIndeterminate = permissions.some(p => formData.permissions.includes(p)) && !categorySelected;
        
        return (
          <Grid item xs={12} key={category}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Checkbox
                    checked={categorySelected}
                    indeterminate={categoryIndeterminate}
                    onChange={(e) => onCategoryPermissionChange(permissions, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {category}
                  </Typography>
                  <Chip
                    label={`${permissions.filter(p => formData.permissions.includes(p)).length}/${permissions.length}`}
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <Grid container spacing={1}>
                    {permissions.map((permission) => (
                      <Grid item xs={12} sm={6} md={4} key={permission}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.permissions.includes(permission)}
                              onChange={(e) => onPermissionChange(permission, e.target.checked)}
                            />
                          }
                          label={permission}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default AdvancedRoleManagement;

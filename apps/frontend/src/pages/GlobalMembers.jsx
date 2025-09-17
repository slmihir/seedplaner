import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// We'll fetch roles from the backend instead of hardcoding

export default function GlobalMembers() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [stats, setStats] = useState({});
  const { user: currentUser } = useAuth();

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
      // Set default role to developer if available
      if (response.data.roles && response.data.roles.length > 0) {
        const developerRole = response.data.roles.find(r => r.name === 'developer');
        if (developerRole && !formData.role) {
          setFormData(prev => ({ ...prev, role: developerRole._id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchMembers = async (pageNum = 1, search = '', role = '') => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        ...(search && { search }),
        ...(role && { role })
      });

      const [membersRes, statsRes] = await Promise.all([
        api.get(`/global-members?${params}`),
        api.get('/global-members/stats')
      ]);

      setMembers(membersRes.data.members || []);
      setTotalPages(membersRes.data.pagination?.pages || 1);
      setTotalMembers(membersRes.data.pagination?.total || 0);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Check permissions - only admin can manage users
  const userRoleName = currentUser?.role?.name || currentUser?.role; // Handle both object and string formats
  if (!currentUser || userRoleName !== 'admin') {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  useEffect(() => {
    fetchRoles();
    fetchMembers(page, searchTerm, roleFilter);
  }, [page, searchTerm, roleFilter]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleRoleFilter = (value) => {
    setRoleFilter(value);
    setPage(1); // Reset to first page when filtering
  };

  const handleOpenDialog = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name || '',
        email: member.email || '',
        password: '',
        role: member.role?._id || member.role || ''
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'developer'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'developer'
    });
  };

  const handleSaveMember = async () => {
    try {
      setError('');
      
      if (editingMember) {
        // Update existing member
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await api.patch(`/global-members/${editingMember._id}`, updateData);
      } else {
        // Create new member
        await api.post('/global-members', formData);
      }
      
      handleCloseDialog();
      fetchMembers(page, searchTerm, roleFilter);
    } catch (err) {
      console.error('Failed to save member:', err);
      setError(err.response?.data?.message || 'Failed to save member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await api.delete(`/global-members/${memberId}`);
      fetchMembers(page, searchTerm, roleFilter);
    } catch (err) {
      console.error('Failed to delete member:', err);
      setError(err.response?.data?.message || 'Failed to delete member');
    }
  };

  const canManageMembers = useMemo(() => {
    const userRoleName = currentUser?.role?.name || currentUser?.role;
    return userRoleName === 'admin' || userRoleName === 'manager';
  }, [currentUser]);

  const canDeleteMembers = useMemo(() => {
    const userRoleName = currentUser?.role?.name || currentUser?.role;
    return userRoleName === 'admin';
  }, [currentUser]);

  if (loading && members.length === 0) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Global Members
        </Typography>
        {canManageMembers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Member
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{totalMembers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Members
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.activeMembers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Members
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.membersByRole?.admin || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{stats.membersByRole?.developer || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Developers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              label="Role"
            >
              <MenuItem key="all-roles" value="">All Roles</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role._id} value={role._id}>
                  {role.displayName || role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Members Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Projects</TableCell>
              <TableCell>Created</TableCell>
              {canManageMembers && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canManageMembers ? 6 : 5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageMembers ? 6 : 5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No members found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {member.name || 'No name'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={member.role}
                      color={
                        member.role === 'admin' ? 'error' :
                        member.role === 'manager' ? 'warning' :
                        member.role === 'developer' ? 'primary' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {member.projectMemberships?.length > 0 ? (
                        <Stack spacing={0.5}>
                          {member.projectMemberships.slice(0, 2).map((project) => (
                            <Chip
                              key={project.projectId}
                              label={`${project.projectKey} (${project.role})`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {member.projectMemberships.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{member.projectMemberships.length - 2} more
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No projects
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManageMembers && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(member)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {canDeleteMembers && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMember(member._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Member Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMember ? 'Edit Member' : 'Add New Member'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={editingMember ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required={!editingMember}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role._id} value={role._id}>
                    {role.displayName || role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveMember}
            disabled={!formData.name || !formData.email || (!editingMember && !formData.password)}
          >
            {editingMember ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}


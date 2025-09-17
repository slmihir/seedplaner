import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, Avatar, IconButton, Alert, CircularProgress, Skeleton, Paper, Divider } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import api from '../api/client';

export default function Members() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [role, setRole] = useState('assignee');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [projectsRes, usersRes] = await Promise.all([
          api.get('/projects'),
          api.get('/users')
        ]);
        
        setProjects(projectsRes.data.projects || []);
        setUsers(usersRes.data.users || []);
        
        if (projectsRes.data.projects?.length) {
          setProjectId(projectsRes.data.projects[0]._id);
        }
      } catch (e) {
        console.error('Failed to load initial data:', e);
        setError(e.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const loadMembers = async (pid) => {
    if (!pid) return;
    try {
      setMembersLoading(true);
      setError('');
      const res = await api.get(`/projects/${pid}/members`);
      
      // Handle malformed member data from backend
      const membersData = res.data.members || [];
      
      const processedMembers = membersData
        .filter(member => member && typeof member === 'object') // Filter out null/undefined members
        .map(member => {
          // If member has buffer field instead of user, try to find the user
          if (member.buffer && !member.user) {
            // Extract user ID from buffer data if possible
            const userId = member.buffer.data ? Buffer.from(member.buffer.data).toString('hex') : null;
            return {
              ...member,
              user: userId ? { _id: userId } : { _id: 'unknown' }
            };
          }
          // Ensure member has valid user data
          if (!member.user) {
            return {
              ...member,
              user: { _id: 'unknown' }
            };
          }
          return member;
        });
      
      setMembers(processedMembers);
    } catch (e) {
      console.error('Failed to load members:', e);
      setError(e.response?.data?.message || 'Failed to load members');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => { loadMembers(projectId); }, [projectId]);

  const openAdd = () => { 
    setEditingUserId(''); 
    setUserId(''); 
    setRole('assignee'); 
    setDialogOpen(true); 
  };
  
  const openEdit = (m) => { 
    const userId = m.user?._id || m.user || 'unknown';
    setEditingUserId(userId); 
    setUserId(userId); 
    setRole(m.role || 'assignee'); 
    setDialogOpen(true); 
  };

  const saveMember = async () => {
    try {
      if (!userId) return;
      setError('');
      
      if (editingUserId) {
        await api.patch(`/projects/${projectId}/members/${editingUserId}`, { role });
      } else {
        await api.post(`/projects/${projectId}/members`, { userId, role });
      }
      setDialogOpen(false);
      await loadMembers(projectId);
    } catch (e) {
      console.error('Failed to save member:', e);
      setError(e.response?.data?.message || 'Failed to save member');
    }
  };

  const removeMember = async (uid) => {
    if (!uid || uid === 'unknown') {
      setError('Cannot remove member with invalid ID');
      return;
    }
    
    try {
      setError('');
      await api.delete(`/projects/${projectId}/members/${uid}`);
      await loadMembers(projectId);
    } catch (e) {
      console.error('Failed to remove member:', e);
      setError(e.response?.data?.message || 'Failed to remove member');
    }
  };

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u._id, u])), [users]);

  const availableUsersToAdd = useMemo(() => {
    const currentMemberIds = new Set(members.map(m => m.user._id));
    return availableUsers.filter(u => !currentMemberIds.has(u._id));
  }, [members, availableUsers]);

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get('/global-members?limit=100');
      const users = res.data.members || [];
      // Filter out any invalid users
      const validUsers = users.filter(user => user && user._id && user.name);
      setAvailableUsers(validUsers);
    } catch (err) {
      console.error('Failed to fetch available users:', err);
      setError('Failed to load available users');
      setAvailableUsers([]);
    }
  };

  const handleOpenAssignDialog = () => {
    fetchAvailableUsers();
    setAssignDialogOpen(true);
  };

  const handleAssignUser = async () => {
    try {
      setError('');
      
      // Validate required fields
      if (!userId) {
        setError('Please select a user to assign');
        return;
      }
      
      if (!projectId) {
        setError('No project selected');
        return;
      }
      
      // Validate that the selected user exists in available users
      const selectedUser = availableUsers.find(u => u._id === userId);
      if (!selectedUser) {
        setError('Selected user is not available');
        return;
      }
      
      await api.post(`/projects/${projectId}/members`, { userId, role });
      setAssignDialogOpen(false);
      setUserId('');
      setRole('assignee');
      await loadMembers(projectId);
    } catch (err) {
      console.error('Failed to assign user:', err);
      setError(err.response?.data?.message || 'Failed to assign user to project');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" gutterBottom>Members</Typography>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={72} />
          <Skeleton variant="rectangular" height={72} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GroupIcon sx={{ mr: 1 }} />
        <Typography variant="h5">Project Members</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="project-select">Select Project</InputLabel>
            <Select 
              labelId="project-select" 
              label="Select Project" 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loading}
            >
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {projectId && (
            <Button 
              variant="contained" 
              startIcon={<PersonAddIcon />} 
              onClick={handleOpenAssignDialog}
              disabled={loading}
            >
              Assign Member
            </Button>
          )}
        </Stack>
      </Paper>

      {membersLoading ? (
        <Stack spacing={1}>
          <Skeleton variant="rectangular" height={72} />
          <Skeleton variant="rectangular" height={72} />
        </Stack>
      ) : (
        <Stack spacing={1}>
          {members.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No members found for this project.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add member" to invite users to this project.
              </Typography>
            </Box>
          ) : (
            members.map((m, index) => {
              const userId = m.user?._id || m.user || `unknown-${index}`;
              const user = m.user?._id ? m.user : userById[userId];
              
              return (
                <Stack 
                  key={userId} 
                  direction="row" 
                  alignItems="center" 
                  spacing={2} 
                  sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Avatar src={user?.avatarUrl}>
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">
                      {user?.name || user?.email || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email || 'No email available'}
                    </Typography>
                  </Box>
                  <Chip 
                    label={m.role || 'assignee'} 
                    color={m.role === 'admin' ? 'primary' : m.role === 'editor' ? 'secondary' : 'default'} 
                  />
                  <IconButton 
                    aria-label="edit" 
                    onClick={() => openEdit(m)}
                    disabled={userId === 'unknown'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    aria-label="remove" 
                    color="error" 
                    onClick={() => removeMember(userId)}
                    disabled={userId === 'unknown'}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              );
            })
          )}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingUserId ? 'Edit member' : 'Add member'}</DialogTitle>
        <DialogContent>
          {!editingUserId && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="user-select">User</InputLabel>
              <Select 
                labelId="user-select" 
                label="User" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                disabled={users.length === 0}
              >
                {users.length === 0 ? (
                  <MenuItem disabled>No users available</MenuItem>
                ) : (
                  users.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name || u.email} — {u.email}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-select">Role</InputLabel>
            <Select 
              labelId="role-select" 
              label="Role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem key="admin" value="admin">Admin</MenuItem>
              <MenuItem key="editor" value="editor">Editor</MenuItem>
              <MenuItem key="assignee" value="assignee">Assignee</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveMember}
            disabled={!userId || (!editingUserId && users.length === 0)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Member Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Member to Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="assign-user-select">Select User</InputLabel>
              <Select 
                labelId="assign-user-select" 
                label="Select User" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
              >
                {availableUsersToAdd.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name || u.email} — {u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="assign-role-select">Project Role</InputLabel>
              <Select 
                labelId="assign-role-select" 
                label="Project Role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem key="admin-edit" value="admin">Admin</MenuItem>
                <MenuItem key="editor-edit" value="editor">Editor</MenuItem>
                <MenuItem key="assignee-edit" value="assignee">Assignee</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignUser}
            disabled={!userId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}




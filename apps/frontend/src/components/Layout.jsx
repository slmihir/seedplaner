import { useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar, Tooltip, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Select, FormControl, InputLabel } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GitHub from '@mui/icons-material/GitHub';
import api from '../api/client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

export default function Layout({ children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then((res) => {
      setProjects(res.data.projects);
      if (res.data.projects.length && !selectedProject) setSelectedProject(res.data.projects[0]._id);
    }).catch(() => {});
  }, []);

  const open = Boolean(anchorEl);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); };

  const drawer = (
    <Box role="navigation" aria-label="Main navigation">
      <Toolbar />
      <Divider />
      <List>
        <ListItemButton component={Link} to="/" selected={location.pathname === '/'}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Projects" />
        </ListItemButton>
        <ListItemButton component={Link} to="/issues" selected={location.pathname === '/issues'}>
          <ListItemIcon><ListAltIcon /></ListItemIcon>
          <ListItemText primary="Issues" />
        </ListItemButton>
        <ListItemButton component={Link} to="/board" selected={location.pathname === '/board'}>
          <ListItemIcon><ViewKanbanIcon /></ListItemIcon>
          <ListItemText primary="Board" />
        </ListItemButton>
        <ListItemButton component={Link} to="/sprints" selected={location.pathname === '/sprints'}>
          <ListItemIcon><TimelineIcon /></ListItemIcon>
          <ListItemText primary="Sprints" />
        </ListItemButton>
        <ListItemButton component={Link} to="/members" selected={location.pathname === '/members'}>
          <ListItemIcon><GroupIcon /></ListItemIcon>
          <ListItemText primary="Project Members" />
        </ListItemButton>
        <ListItemButton component={Link} to="/global-members" selected={location.pathname === '/global-members'}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Global Members" />
        </ListItemButton>
        {((user?.role?.name || user?.role) === 'admin' || (user?.role?.name || user?.role) === 'manager') && (
          <>
            <ListItemButton component={Link} to="/admin" selected={location.pathname === '/admin'}>
              <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
              <ListItemText primary="Admin" />
            </ListItemButton>
            <ListItemButton component={Link} to="/role-management" selected={location.pathname === '/role-management'}>
              <ListItemIcon><SecurityIcon /></ListItemIcon>
              <ListItemText primary="Role Management" />
            </ListItemButton>
            <ListItemButton component={Link} to="/project-config" selected={location.pathname === '/project-config'}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Project Configuration" />
            </ListItemButton>
            <ListItemButton component={Link} to="/system-config" selected={location.pathname === '/system-config'}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="System Configuration" />
            </ListItemButton>
            <ListItemButton component={Link} to="/sprint-reports" selected={location.pathname === '/sprint-reports'}>
              <ListItemIcon><AssessmentIcon /></ListItemIcon>
              <ListItemText primary="Sprint Reports" />
            </ListItemButton>
            <ListItemButton component={Link} to="/cost-tracking" selected={location.pathname === '/cost-tracking'}>
              <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
              <ListItemText primary="Cost Tracking" />
            </ListItemButton>
            <ListItemButton component={Link} to="/github-integration" selected={location.pathname === '/github-integration'}>
              <ListItemIcon><GitHub /></ListItemIcon>
              <ListItemText primary="GitHub Integration" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" aria-label="open sidebar" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ mr: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>SeedPlanner</Typography>
          <FormControl size="small" sx={{ minWidth: 220, display: { xs: 'none', sm: 'block' } }}>
            <InputLabel id="project-select-label">Project</InputLabel>
            <Select labelId="project-select-label" label="Project" value={selectedProject} onChange={(e) => { setSelectedProject(e.target.value); navigate(`/board?project=${e.target.value}`); }}>
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.key} — {p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={user?.email || ''}>
            <IconButton color="inherit" onClick={handleMenu} aria-label="user menu" aria-controls={open ? 'user-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
              <Avatar sx={{ width: 32, height: 32 }}>{(user?.name || 'U').charAt(0)}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu id="user-menu" anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem disabled>{user?.name}</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="sidebar">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}



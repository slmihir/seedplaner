import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  Group as GroupIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { clearBrowserCache, getCacheInfo } from '../utils/cacheUtils';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});
  const [systemConfig, setSystemConfig] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 Admin page useEffect - user:', user);
    if (user) {
      loadAdminData();
    }
    // Set debug info
    setDebugInfo({
      user: user,
      cacheInfo: getCacheInfo(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Loading admin data...');

      // Load admin statistics and system configuration
      const [statsRes, membersRes, systemConfigRes] = await Promise.all([
        api.get('/global-members/stats'),
        api.get('/global-members?limit=5'),
        api.get('/system-config')
      ]);

      console.log('✅ API responses received:');
      console.log('  - Stats:', statsRes.data);
      console.log('  - Members:', membersRes.data);
      console.log('  - System Config:', systemConfigRes.data);

      setStats(statsRes.data || {});
      setRecentActivity(membersRes.data?.members || []);
      setSystemConfig(systemConfigRes.data?.config || null);
      
      console.log('✅ State updated - systemConfig:', systemConfigRes.data?.config);
    } catch (err) {
      console.error('❌ Failed to load admin data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load admin data';
      setError(errorMessage);
      
      // Set default stats if API fails
      setStats({
        totalMembers: 0,
        activeMembers: 0,
        totalProjects: 0,
        adminCount: 0
      });
      setRecentActivity([]);
      setSystemConfig(null);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading authentication...</Typography>
        </Box>
      </Container>
    );
  }

  // Check if user has admin access
  const userRoleName = user?.role?.name || user?.role; // Handle both object and string formats
  console.log('🔍 Admin page - user:', user);
  console.log('🔍 Admin page - userRoleName:', userRoleName);
  console.log('🔍 Admin page - authLoading:', authLoading);
  
  if (!user || (userRoleName !== 'admin' && userRoleName !== 'manager')) {
    console.log('🔍 Admin page - Access denied, user:', user, 'role:', userRoleName);
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. Admin privileges required.
          {user && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">
                User: {user.name} | Role: {JSON.stringify(user.role)}
              </Typography>
            </Box>
          )}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error but still allow access to admin functions
  const showError = error && (
    <Alert severity="warning" sx={{ mb: 3 }}>
      {error}
      <Button onClick={loadAdminData} sx={{ ml: 2 }} size="small">
        Retry
      </Button>
    </Alert>
  );

  const adminActions = [
    {
      title: 'Global Members',
      description: 'Manage all users and their roles',
      icon: <PeopleIcon />,
      action: () => navigate('/global-members'),
      color: 'primary'
    },
    {
      title: 'Project Members',
      description: 'Manage project-specific memberships',
      icon: <GroupIcon />,
      action: () => navigate('/members'),
      color: 'secondary'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: <SettingsIcon />,
      action: () => navigate('/system-config'),
      color: 'info'
    },
    {
      title: 'Security & Permissions',
      description: 'Manage user permissions and security',
      icon: <SecurityIcon />,
      action: () => {
        // Placeholder for future security page
        alert('Security settings coming soon!');
      },
      color: 'warning'
    }
  ];

  return (
    <Container maxWidth="lg">
      {showError}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome, {user.name}. Manage your Jira-like application from here.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={() => {
            if (window.confirm('This will clear all browser cache and reload the page. Continue?')) {
              clearBrowserCache();
            }
          }}
          size="small"
        >
          Clear Cache & Reload
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalMembers || 0}</Typography>
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
                <GroupIcon color="secondary" sx={{ mr: 2 }} />
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
                <DashboardIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalProjects || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Projects
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
                <AnalyticsIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.adminCount || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Configuration */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Configuration
                {systemConfig && (
                  <Chip 
                    label="Loaded" 
                    color="success" 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                )}
                {!systemConfig && (
                  <Chip 
                    label="Loading..." 
                    color="warning" 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                )}
              </Typography>
              
              {/* Debug Info */}
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Debug: systemConfig = {systemConfig ? 'Loaded' : 'null/undefined'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h4">{systemConfig?.fieldTypes?.length || 0}</Typography>
                    <Typography variant="body2">Field Types</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    <Typography variant="h4">{systemConfig?.costCategories?.length || 0}</Typography>
                    <Typography variant="body2">Cost Categories</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h4">{systemConfig?.workflowTemplates?.length || 0}</Typography>
                    <Typography variant="body2">Workflow Templates</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography variant="h4">{systemConfig?.roles?.length || 0}</Typography>
                    <Typography variant="body2">System Roles</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Show system config data if available */}
              {systemConfig && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    System Configuration Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {JSON.stringify(systemConfig, null, 2)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Admin Actions
              </Typography>
              <Grid container spacing={2}>
                {adminActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        border: 1,
                        borderColor: 'divider'
                      }}
                      onClick={action.action}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {action.icon}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Members
              </Typography>
              {recentActivity.length > 0 ? (
                <List>
                  {recentActivity.slice(0, 5).map((member, index) => (
                    <React.Fragment key={member._id}>
                      <ListItem>
                        <ListItemIcon>
                          <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={member.name}
                          secondary={`${member.email} • ${member.role}`}
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Box component="pre" sx={{ 
              bgcolor: 'grey.100', 
              p: 2, 
              borderRadius: 1, 
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

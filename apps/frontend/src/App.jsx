import './App.css'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Container, Box, CircularProgress, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Suspense, useState, useEffect } from 'react';
import api from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import Layout from './components/Layout';
import NetworkStatus from './components/NetworkStatus';
import AppFallback from './components/AppFallback';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import Board from './pages/Board';
import Sprints from './pages/Sprints';
import SprintBoardPage from './pages/SprintBoardPage';
import Members from './pages/Members';
import GlobalMembers from './pages/GlobalMembers';
import Admin from './pages/Admin';
import RoleManagement from './components/RoleManagement';
import ProjectConfiguration from './components/ProjectConfiguration';
import SystemConfiguration from './components/SystemConfiguration';
import SprintReports from './components/SprintReports';
import CostTracking from './components/CostTracking';
import GitHubIntegration from './components/GitHubIntegration';
import ErrorBoundary from './components/ErrorBoundary';

// Wrapper component to get project ID dynamically
function ProjectConfigurationWrapper() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/projects');
        setProjects(res.data.projects);
        
        // Check for project query parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const projectParam = urlParams.get('project');
        
        if (projectParam && res.data.projects.find(p => p._id === projectParam)) {
          setSelectedProject(projectParam);
        } else if (res.data.projects.length && !selectedProject) {
          setSelectedProject(res.data.projects[0]._id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, [selectedProject]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading projects...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (projects.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No projects found. Please create a project first.</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Project Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ maxWidth: 400 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProject}
            onChange={(e) => {
              const newProjectId = e.target.value;
              setSelectedProject(newProjectId);
              // Update URL without page reload
              const url = new URL(window.location);
              url.searchParams.set('project', newProjectId);
              window.history.replaceState({}, '', url);
            }}
            label="Select Project"
          >
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({project.key})
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Project Configuration */}
      {selectedProject ? (
        <ProjectConfiguration 
          projectId={selectedProject} 
          onClose={() => window.history.back()} 
        />
      ) : (
        <Alert severity="info">
          Please select a project to configure its settings.
        </Alert>
      )}
    </Box>
  );
}

function GitHubIntegrationWrapper() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  useEffect(() => {
    api.get('/projects').then((res) => {
      setProjects(res.data.projects);
      if (res.data.projects.length && !selectedProject) {
        setSelectedProject(res.data.projects[0]._id);
      }
    }).catch(() => {});
  }, []);
  
  if (!selectedProject) {
    return <div>Loading...</div>;
  }
  
  return (
    <GitHubIntegration 
      projectId={selectedProject}
    />
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<AppFallback message="Loading application..." />}>
      <Routes>
        <Route element={<ProtectedRoute />}> 
          <Route
            element={
              <Layout>
                <Container maxWidth="lg">
                  <Outlet />
                </Container>
              </Layout>
            }
          >
            <Route path="/" element={<Projects />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/board" element={<Board />} />
            <Route path="/sprints" element={<Sprints />} />
            <Route path="/sprints/:sprintId/board" element={<SprintBoardPage />} />
            <Route path="/members" element={<Members />} />
            <Route path="/global-members" element={<GlobalMembers />} />
            <Route path="/admin" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/role-management" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <RoleManagement />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/project-config" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <ProjectConfigurationWrapper />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/system-config" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <SystemConfiguration />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/sprint-reports" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <SprintReports />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/cost-tracking" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <CostTracking />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
            <Route path="/github-integration" element={
              <AdminErrorBoundary>
                <AdminRoute>
                  <GitHubIntegrationWrapper />
                </AdminRoute>
              </AdminErrorBoundary>
            } />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <NetworkStatus />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

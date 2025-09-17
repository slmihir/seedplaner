import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Stack,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import api from '../api/client';
import SprintBoard from '../components/SprintBoard';

export default function SprintBoardPage() {
  const { sprintId } = useParams();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sprintId) {
      loadSprint();
    }
  }, [sprintId]);

  const loadSprint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/sprints/${sprintId}`);
      setSprint(response.data.sprint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueUpdate = () => {
    // Optionally refresh sprint data when issues are updated
    loadSprint();
  };

  const handleBackClick = () => {
    navigate('/sprints');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sprint board...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={handleBackClick} startIcon={<ArrowBackIcon />}>
          Back to Sprints
        </Button>
      </Container>
    );
  }

  if (!sprint) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Sprint not found</Alert>
        <Button onClick={handleBackClick} startIcon={<ArrowBackIcon />}>
          Back to Sprints
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBackClick}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/')}
                sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Home
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/sprints')}
                sx={{ textDecoration: 'none' }}
              >
                Sprints
              </Link>
              <Typography variant="body2" color="text.primary">
                {sprint.name}
              </Typography>
            </Breadcrumbs>

            {/* Sprint Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: sprint.isActive ? 'success.main' : sprint.completedAt ? 'info.main' : 'grey.400'
              }}>
                {sprint.isActive ? <PlayArrowIcon /> : sprint.completedAt ? <CheckCircleIcon /> : <ScheduleIcon />}
              </Avatar>
              <Box>
                <Typography variant="h5" component="div">
                  {sprint.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'Not started'} → {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'No end date'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {sprint.isActive && (
                  <Chip 
                    label="Currently Active" 
                    color="success" 
                    icon={<PlayArrowIcon />}
                    variant="filled"
                  />
                )}
                {sprint.completedAt && (
                  <Chip 
                    label={`Completed on ${new Date(sprint.completedAt).toLocaleDateString()}`} 
                    color="info" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                  />
                )}
                {!sprint.isActive && !sprint.completedAt && (
                  <Chip 
                    label="Not Started" 
                    color="default" 
                    icon={<ScheduleIcon />}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate('/sprints')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Sprints
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sprint Board Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <SprintBoard 
          sprintId={sprintId} 
          sprint={sprint}
          onIssueUpdate={handleIssueUpdate}
        />
      </Box>
    </Box>
  );
}

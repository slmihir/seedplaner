import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stack,
  CircularProgress,
  Paper
} from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

export default function AppFallback({ 
  error = null, 
  onRetry = null, 
  onGoHome = null,
  message = 'Loading application...',
  showRetry = true 
}) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear cache:', e);
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center'
        }}
      >
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Application Error
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {error.message || 'Something went wrong while loading the application.'}
              </Typography>
            </Alert>

            <Stack spacing={2} sx={{ mb: 3 }}>
              {showRetry && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  fullWidth
                >
                  Try Again
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                fullWidth
              >
                Go to Home
              </Button>
              
              <Button
                variant="text"
                onClick={handleClearCache}
                fullWidth
              >
                Clear Cache & Reload
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              If the problem persists, try:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • Refreshing the page (F5 or Cmd+R)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Clearing your browser cache
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Checking your internet connection
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please wait while the application loads...
            </Typography>
            
            <Button
              variant="outlined"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

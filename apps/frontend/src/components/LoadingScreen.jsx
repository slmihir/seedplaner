import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Stack,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

export default function LoadingScreen({ 
  message = 'Loading...', 
  error = null, 
  onRetry = null,
  showProgress = false,
  progress = 0,
  timeout = 30000 // 30 seconds timeout
}) {
  const [showTimeout, setShowTimeout] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [timeout]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (!isOnline) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <WifiOffIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No Internet Connection
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please check your internet connection and try again.
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRetry}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Failed to Load
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error.message || error.toString()}
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 3,
      textAlign: 'center'
    }}>
      <CircularProgress size={60} sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        {message}
      </Typography>
      
      {showProgress && (
        <Box sx={{ width: '100%', maxWidth: 300, mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      {showTimeout && (
        <Alert severity="warning" sx={{ mt: 3, maxWidth: 500 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Loading is taking longer than expected. This might indicate a network issue.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
            >
              Retry
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </Button>
          </Stack>
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Chip 
          label={isOnline ? 'Online' : 'Offline'} 
          color={isOnline ? 'success' : 'error'} 
          size="small" 
        />
        <Chip 
          label={`Timeout: ${Math.round(timeout / 1000)}s`} 
          variant="outlined" 
          size="small" 
        />
      </Stack>
    </Box>
  );
}

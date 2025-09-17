import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, Typography, Box } from '@mui/material';
import { WifiOff as WifiOffIcon, Wifi as WifiIcon } from '@mui/icons-material';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowAlert(true);
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'error.main',
            color: 'white',
            p: 1,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <WifiOffIcon fontSize="small" />
            No internet connection
          </Typography>
        </Box>
      )}

      {/* Reconnection success alert */}
      <Snackbar
        open={showAlert}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          icon={<WifiIcon />}
          sx={{ width: '100%' }}
        >
          Connection restored
        </Alert>
      </Snackbar>
    </>
  );
}

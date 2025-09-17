import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import { useState } from 'react';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role name from the populated role object
  const userRoleName = user.role?.name || user.role; // Handle both object and string formats
  
  if (userRoleName !== 'admin' && userRoleName !== 'manager') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setRetryCount(prev => prev + 1)}
            >
              Retry
            </Button>
          }
        >
          Access denied. Admin or Manager privileges required.
          <br />
          Current role: {userRoleName}
          <br />
          Please contact an administrator if you believe this is an error.
        </Alert>
      </Box>
    );
  }

  return children;
}

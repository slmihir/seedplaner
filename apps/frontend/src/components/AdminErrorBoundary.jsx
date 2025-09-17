import React from 'react';
import { Container, Alert, Button, Typography, Box } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console for debugging
    console.error('Admin Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Admin Page Error
            </Typography>
            <Typography variant="body2" gutterBottom>
              Something went wrong while loading the admin page. This could be due to:
            </Typography>
            <ul>
              <li>Network connectivity issues</li>
              <li>Invalid user permissions</li>
              <li>Corrupted browser cache</li>
              <li>Backend API unavailability</li>
            </ul>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
            >
              Retry
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleClearCache}
            >
              Clear Cache & Reload
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Development Error Details
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Typography>
            </Alert>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;

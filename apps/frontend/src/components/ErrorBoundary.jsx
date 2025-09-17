import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Stack, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Refresh as RefreshIcon, BugReport as BugReportIcon } from '@mui/icons-material';
import AppFallback from './AppFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      timestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Enhanced error logging
    console.error('🚨 ErrorBoundary caught an error:', {
      error: error,
      errorInfo: errorInfo,
      errorId: this.state.errorId,
      timestamp: this.state.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack
    });

    // Log to localStorage for debugging
    try {
      const errorLog = {
        id: this.state.errorId,
        timestamp: this.state.timestamp,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log error to localStorage:', e);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    try {
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      // Reload page
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear cache:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use the simplified AppFallback for better UX
      return (
        <AppFallback 
          error={this.state.error}
          onRetry={this.handleReload}
          onGoHome={() => window.location.href = '/login'}
          showRetry={true}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

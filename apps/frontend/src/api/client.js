import axios from 'axios';

// Determine API base URL based on current host
const getApiBaseUrl = () => {
  console.log('🔧 getApiBaseUrl Debug:');
  console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('  window.location.hostname:', window.location.hostname);
  console.log('  hostname === "192.168.101.202":', window.location.hostname === '192.168.101.202');
  
  // Always use proxy for better browser compatibility
  // The Vite proxy will handle routing to the correct backend
  console.log('  Using proxy URL: /api');
  return '/api';
};

const apiBaseUrl = getApiBaseUrl();

// Debug logging
console.log('🔧 API Client Configuration (v2.0):');
console.log('  Hostname:', window.location.hostname);
console.log('  API Base URL:', apiBaseUrl);
console.log('  Full URL Example:', `${apiBaseUrl}/auth/login`);
console.log('  Timestamp:', new Date().toISOString());

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000, // 10 second timeout
});

// Test function for debugging network connectivity
export const testConnection = async () => {
  try {
    // Test using the proxy - this should work better
    const healthUrl = '/health'; // Use proxy path
    console.log('🧪 Testing connection via proxy to:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connection test successful:', response.status, response.statusText);
    const data = await response.json();
    console.log('📊 Health response:', data);
    return response;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('Error details:', error.message);
    return null;
  }
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  window.testConnection = testConnection;
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to set auth token:', error);
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
// Debug logging for requests
console.log('🔧 API Request:', {
  method: config.method?.toUpperCase(),
  url: config.url,
  baseURL: config.baseURL,
  fullURL: `${config.baseURL}${config.url}`,
  headers: config.headers
});
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    return response;
  },
  (error) => {
    // Enhanced error handling
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    
    // Log error details
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'NETWORK_ERROR'} (${duration}ms)`, {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Handle different error types
    if (!error.response) {
      // Network error
      error.code = 'NETWORK_ERROR';
      error.message = 'Network error - please check your internet connection';
    } else if (error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response.status >= 500) {
      // Server error
      error.code = 'SERVER_ERROR';
      error.message = 'Server error - please try again later';
    }

    // Log error to localStorage for debugging
    try {
      const errorLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        response: error.response?.data,
        duration: duration
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('apiErrorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 20 errors
      if (existingLogs.length > 20) {
        existingLogs.splice(0, existingLogs.length - 20);
      }
      localStorage.setItem('apiErrorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log API error:', e);
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error('Failed to set auth token:', error);
  }
}

export default api;

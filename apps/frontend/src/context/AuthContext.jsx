import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 3;

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        setError(null);
        console.log('🔐 AuthProvider: Starting authentication boot...');
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('🔐 AuthProvider: No token found, user not authenticated');
          if (!cancelled) setLoading(false);
          return;
        }

        console.log('🔐 AuthProvider: Token found, validating with server...');
        setAuthToken(token);
        
        const res = await api.get('/users/me');
        console.log('🔐 AuthProvider: User validation successful:', res.data.user);
        
        if (!cancelled) {
          setUser(res.data.user);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (error) {
        console.error('🔐 AuthProvider: Boot error:', error);
        
        if (!cancelled) {
          setError(error);
          setAuthToken(null);
          localStorage.removeItem('token'); // Clear invalid token
          
          // Retry logic for network errors
          if (retryCount < maxRetries && error.code === 'NETWORK_ERROR') {
            console.log(`🔐 AuthProvider: Retrying authentication (${retryCount + 1}/${maxRetries})...`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              if (!cancelled) {
                boot();
              }
            }, 2000 * (retryCount + 1)); // Exponential backoff
            return;
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    boot();
    return () => { cancelled = true; };
  }, [retryCount]);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const res = await api.post('/auth/login', { email, password });
      console.log('AuthContext: Login successful, received token and user data');
      console.log('AuthContext: User data:', JSON.stringify(res.data.user, null, 2));
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      console.error('AuthContext: Error status:', error.response?.status);
      throw error; // Re-throw to let the component handle it
    }
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setAuthToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setError(null);
    setRetryCount(0);
  };

  const retry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
  };

  const refreshUser = async () => {
    try {
      console.log('AuthContext: Refreshing user data...');
      const res = await api.get('/users/me');
      console.log('AuthContext: User data refreshed:', JSON.stringify(res.data.user, null, 2));
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error('AuthContext: Failed to refresh user data:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({ 
    user, 
    loading, 
    error, 
    retryCount, 
    maxRetries,
    login, 
    signup, 
    logout, 
    retry,
    refreshUser
  }), [user, loading, error, retryCount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute() {
  const { user, loading, error, retryCount, maxRetries, retry } = useAuth();
  
  if (loading) {
    return (
      <LoadingScreen 
        message="Authenticating..."
        showProgress={retryCount > 0}
        progress={(retryCount / maxRetries) * 100}
        timeout={15000}
      />
    );
  }

  if (error && retryCount >= maxRetries) {
    return (
      <LoadingScreen 
        message="Authentication failed"
        error={error}
        onRetry={retry}
        timeout={0}
      />
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

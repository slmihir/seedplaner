// Utility functions for cache management

export const clearBrowserCache = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear any cached API responses (if using a cache)
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Force reload the page
  window.location.reload(true);
};

export const clearAuthCache = () => {
  // Clear only auth-related data
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

export const getCacheInfo = () => {
  return {
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage),
    hasToken: !!localStorage.getItem('token') || !!sessionStorage.getItem('token')
  };
};

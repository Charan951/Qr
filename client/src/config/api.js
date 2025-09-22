// API Configuration
const API_CONFIG = {
  // Dynamic Base URL - works for both development and production
  BASE_URL: (() => {
    // Check if we have a custom API URL in environment
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    
    // In production, use the environment variable or fallback to production URL
    if (process.env.NODE_ENV === 'production') {
      return 'https://qr-nk38.onrender.com';
    }
    
    // In development, use localhost with the correct port
    return 'http://localhost:5000';
  })(),
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    ADMIN_LOGIN: '/api/auth/login',
    HR_LOGIN: '/api/auth/login',
    
    // Admin routes
    ADMIN_REQUESTS: '/api/admin/requests',
    ADMIN_STATS: '/api/admin/dashboard/stats',
    ADMIN_HR_USERS: '/api/admin/hr-users',
    ADMIN_EXPORT: '/api/admin/export',
    
    // HR routes
    HR_REQUESTS: '/api/hr/requests',
    HR_REQUESTS_BULK: '/api/hr/requests/bulk',
    
    // General routes
    REQUESTS: '/api/requests',
    IMAGES: '/api/images',
    IMAGES_REQUEST: '/api/images/request',
    UPLOAD: '/api/images/upload',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get base URL
export const getBaseUrl = () => {
  return API_CONFIG.BASE_URL;
};

// Helper function to build dynamic URLs (e.g., with IDs)
export const buildApiUrl = (endpoint, ...params) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  params.forEach(param => {
    url += `/${param}`;
  });
  return url;
};

// Export endpoints for easy access
export const API_ENDPOINTS = API_CONFIG.ENDPOINTS;

// Default export
export default API_CONFIG;
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and HTML responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      const isHTML = contentType.includes('text/html');
      
      if (isHTML) {
        console.error('[API Error] Backend returned HTML instead of JSON:', {
          url: error.config?.url,
          status: error.response.status,
          statusText: error.response.statusText,
          contentType,
          preview: typeof error.response.data === 'string' 
            ? error.response.data.substring(0, 200) 
            : error.response.data
        });
      }
      
      // Check if response is HTML (common when backend is down or route doesn't exist)
      if (isHTML || (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<'))) {
        console.error('[API Error] Received HTML response - backend may be down or route not found');
        return Promise.reject(new Error(`Backend returned HTML (likely error page). Status: ${error.response.status}. Check if backend is running.`));
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;


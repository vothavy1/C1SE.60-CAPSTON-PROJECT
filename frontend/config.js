// Cấu hình API endpoint cho backend
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  
  // Test endpoints
  TESTS: {
    LIST: '/tests',
    DETAIL: (id) => `/tests/${id}`,
    QUESTIONS: (id) => `/tests/${id}/questions`,
    SUBMIT: (id) => `/candidate-tests/${id}/submit`
  },
  
  // Candidate Test endpoints
  CANDIDATE_TESTS: {
    START: '/candidate-tests/start',
    SUBMIT: (id) => `/candidate-tests/${id}/submit`,
    RESULTS: '/candidate-tests/my-results'
  }
};

// Helper function để gọi API
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    ...(options.body && { body: options.body })
  };
  
  const response = await fetch(API_CONFIG.BASE_URL + endpoint, fetchOptions);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API call failed');
  }
  
  return response.json();
}

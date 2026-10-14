import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cpl_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for unified, sanitized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Network / Connection / Timeout errors
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Please try again.'
          : 'Network error. Please check your connection.';
      const netErr = new Error(message);
      netErr.code = 'NETWORK_ERROR';
      netErr.status = 0;
      return Promise.reject(netErr);
    }

    const { status, data, headers } = error.response;

    // 2. Unexpected Content-Type (HTML error pages from CDN/proxy/NGINX)
    const contentType = headers?.['content-type'] || '';
    if (typeof data === 'string' && (contentType.includes('text/html') || data.trim().startsWith('<'))) {
      const htmlErr = new Error('Server returned an unexpected format. Please try again.');
      htmlErr.code = 'UNEXPECTED_RESPONSE';
      htmlErr.status = status;
      return Promise.reject(htmlErr);
    }

    // 3. Status-specific sanitized message mapping
    let sanitizedMessage = 'Something went wrong. Please try again.';

    if (data?.message && typeof data.message === 'string') {
      // Use clean backend message provided by our sanitized error handler
      sanitizedMessage = data.message;
    } else if (status === 400) {
      sanitizedMessage = 'Invalid request parameters.';
    } else if (status === 401) {
      sanitizedMessage = 'Authentication required or session expired. Please log in again.';
      // Clean up stale token on 401
      localStorage.removeItem('cpl_auth_token');
    } else if (status === 403) {
      sanitizedMessage = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      sanitizedMessage = 'Requested resource was not found.';
    } else if (status === 409) {
      sanitizedMessage = 'A conflict occurred with an existing resource.';
    } else if (status === 429) {
      sanitizedMessage = 'Too many requests. Please slow down and try again.';
    } else if (status >= 500) {
      sanitizedMessage = 'A server error occurred. Please try again later.';
    }

    const normalizedError = new Error(sanitizedMessage);
    normalizedError.status = status;
    normalizedError.code =
      data?.code || (status === 401 ? 'AUTH_REQUIRED' : status === 403 ? 'FORBIDDEN' : 'API_ERROR');
    normalizedError.errors = Array.isArray(data?.errors) ? data.errors : undefined;

    return Promise.reject(normalizedError);
  }
);

export default api;

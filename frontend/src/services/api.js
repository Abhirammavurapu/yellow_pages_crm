import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'A network error occurred';
    const errorCode = error.response?.data?.errorCode || 'UNKNOWN_ERROR';

    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      window.location.href = '/login?session=expired';
    }

    return Promise.reject({
      status: error.response?.status,
      message,
      errorCode,
      details: error.response?.data?.details,
      data: error.response?.data
    });
  }
);

export default api;

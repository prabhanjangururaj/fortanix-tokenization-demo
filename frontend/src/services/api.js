import axios from 'axios';

// Use relative URL so nginx proxy handles the routing to backend
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};

// Records API
export const recordsAPI = {
  createRecord: async (recordData) => {
    const response = await api.post('/api/records', recordData);
    return response.data;
  },

  getAllRecords: async () => {
    const response = await api.get('/api/records');
    return response.data;
  },

  searchRecords: async (query, field = 'name') => {
    const response = await api.get(`/api/records/search`, {
      params: { query, field }
    });
    return response.data;
  },

  getRecordById: async (id) => {
    const response = await api.get(`/api/records/${id}`);
    return response.data;
  },

  deleteRecord: async (id) => {
    const response = await api.delete(`/api/records/${id}`);
    return response.data;
  },

  getRawRecords: async () => {
    const response = await api.get('/api/records/raw/view');
    return response.data;
  }
};

export default api;

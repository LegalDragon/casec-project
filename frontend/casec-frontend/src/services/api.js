import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('casec-auth');
    if (authData) {
      const { token } = JSON.parse(authData).state;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('casec-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Membership Types APIs
export const membershipTypesAPI = {
  getAll: () => api.get('/membershiptypes'),
  getById: (id) => api.get(`/membershiptypes/${id}`),
  create: (data) => api.post('/membershiptypes', data),
  update: (id, data) => api.put(`/membershiptypes/${id}`, data),
  delete: (id) => api.delete(`/membershiptypes/${id}`),
};

// Clubs APIs
export const clubsAPI = {
  getAll: () => api.get('/clubs'),
  getById: (id) => api.get(`/clubs/${id}`),
  getMyClubs: () => api.get('/clubs/my-clubs'),
  create: (data) => api.post('/clubs', data),
  update: (id, data) => api.put(`/clubs/${id}`, data),
  delete: (id) => api.delete(`/clubs/${id}`),
  join: (id) => api.post(`/clubs/${id}/join`),
  leave: (id) => api.post(`/clubs/${id}/leave`),
  // Admin endpoints
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/clubs/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  assignAdmin: (clubId, userId) => api.post(`/clubs/${clubId}/admins`, { userId }),
  removeAdmin: (clubId, userId) => api.delete(`/clubs/${clubId}/admins/${userId}`),
  getEvents: (id) => api.get(`/clubs/${id}/events`),
};

// Events APIs
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getAllAdmin: () => api.get('/events/all'),
  getById: (id) => api.get(`/events/${id}`),
  getMyEvents: () => api.get('/events/my-events'),
  getTypes: () => api.get('/events/types'),
  getCategories: () => api.get('/events/categories'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  unregister: (id) => api.post(`/events/${id}/unregister`),
};

// Users APIs
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
};

// Payments APIs
export const paymentsAPI = {
  process: (data) => api.post('/payments/process', data),
  getHistory: () => api.get('/payments/history'),
};

// Theme APIs
export const themeAPI = {
  getActive: () => api.get('/theme/active'),
  getCurrent: () => api.get('/theme'),
  update: (data) => api.put('/theme', data),
  uploadLogo: (formData) => {
    return api.post('/theme/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadFavicon: (formData) => {
    return api.post('/theme/favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getPresets: () => api.get('/theme/presets'),
  applyPreset: (presetId) => api.post(`/theme/apply-preset/${presetId}`),
  reset: () => api.post('/theme/reset'),
};

export default api;

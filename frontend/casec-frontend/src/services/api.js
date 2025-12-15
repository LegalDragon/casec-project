import axios from 'axios';

// Use runtime config (from public/config.js) first, then env var, then default
// Default is empty string since backend routes are at root level (no /api prefix)
let API_BASE_URL = window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || '';

// Normalize: remove trailing slash if present
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Helper function to get full asset URL (for avatars, images, etc.)
export const getAssetUrl = (path) => {
  if (!path) return null;
  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If path starts with /, prepend API_BASE_URL
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  // Otherwise, return as-is
  return path;
};

// Export API_BASE_URL for direct use if needed
export { API_BASE_URL };

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
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
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
  getMembers: (id) => api.get(`/clubs/${id}/members`),
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
  uploadThumbnail: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/events/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  saveThumbnailFromUrl: (id, imageUrl) => api.post(`/events/${id}/thumbnail-from-url`, { imageUrl }),
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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

// Membership Durations APIs
export const membershipDurationsAPI = {
  getAll: () => api.get('/membershipdurations'),
  getAllAdmin: () => api.get('/membershipdurations/admin/all'),
  create: (data) => api.post('/membershipdurations/admin', data),
  update: (id, data) => api.put(`/membershipdurations/admin/${id}`, data),
  delete: (id) => api.delete(`/membershipdurations/admin/${id}`),
};

// Membership Payments APIs
export const membershipPaymentsAPI = {
  // User endpoints
  getStatus: () => api.get('/membershippayments/status'),
  getMethods: () => api.get('/membershippayments/methods'),
  getDurations: () => api.get('/membershipdurations'),
  submit: (data) => api.post('/membershippayments', data),
  uploadProof: (paymentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/membershippayments/${paymentId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  cancel: (paymentId) => api.delete(`/membershippayments/${paymentId}`),

  // Admin endpoints
  getPending: () => api.get('/membershippayments/admin/pending'),
  getAll: (params) => api.get('/membershippayments/admin/all', { params }),
  getPaymentDetails: (paymentId) => api.get(`/membershippayments/admin/${paymentId}`),
  confirm: (paymentId, data) => api.post(`/membershippayments/admin/${paymentId}/confirm`, data),
  updateLinkedUsers: (paymentId, familyMemberIds) => api.put(`/membershippayments/admin/${paymentId}/linked-users`, { familyMemberIds }),
  getUserFamily: (userId) => api.get(`/membershippayments/admin/user/${userId}/family`),
  searchUsers: (query, excludeUserId) => api.get('/membershippayments/admin/users/search', {
    params: { query, excludeUserId }
  }),
};

// Utility APIs
export const utilityAPI = {
  fetchUrlMetadata: (url) => api.post('/utility/fetch-url-metadata', { url }),
};

export default api;

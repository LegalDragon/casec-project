import axios from "axios";

// Priority: config.json (runtime) > VITE_API_URL (build-time) > empty string (same origin)
// config.json is loaded in main.jsx before the app renders
let API_BASE_URL =
  window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || "";

// Normalize: remove trailing slash if present
if (API_BASE_URL.endsWith("/")) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

// Helper function to get full asset URL (for avatars, images, etc.)
export const getAssetUrl = (path) => {
  if (!path) return null;
  // If path is already a full URL, return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // If path starts with /api, replace with API_BASE_URL
  // keep backwards compatibility
  if (path.startsWith("/api")) {
    return `${API_BASE_URL}${path.substring(4)}`;
  }

  // If path starts with /, prepend API_BASE_URL
  if (path.startsWith("/")) {
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
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("casec-auth");
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
      localStorage.removeItem("casec-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (credentials) => api.post("/auth/login", credentials),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
};

// Membership Types APIs
export const membershipTypesAPI = {
  getAll: () => api.get("/membershiptypes"),
  getById: (id) => api.get(`/membershiptypes/${id}`),
  create: (data) => api.post("/membershiptypes", data),
  update: (id, data) => api.put(`/membershiptypes/${id}`, data),
  delete: (id) => api.delete(`/membershiptypes/${id}`),
};

// Clubs APIs
export const clubsAPI = {
  getAll: () => api.get("/clubs"),
  getById: (id) => api.get(`/clubs/${id}`),
  getMyClubs: () => api.get("/clubs/my-clubs"),
  create: (data) => api.post("/clubs", data),
  update: (id, data) => api.put(`/clubs/${id}`, data),
  delete: (id) => api.delete(`/clubs/${id}`),
  join: (id) => api.post(`/clubs/${id}/join`),
  leave: (id) => api.post(`/clubs/${id}/leave`),
  // Admin endpoints
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/clubs/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  assignAdmin: (clubId, userId) =>
    api.post(`/clubs/${clubId}/admins`, { userId }),
  removeAdmin: (clubId, userId) =>
    api.delete(`/clubs/${clubId}/admins/${userId}`),
  getEvents: (id) => api.get(`/clubs/${id}/events`),
  getMembers: (id) => api.get(`/clubs/${id}/members`),
};

// Events APIs
export const eventsAPI = {
  getAll: (params) => api.get("/events", { params }),
  getAllAdmin: () => api.get("/events/all"),
  getById: (id) => api.get(`/events/${id}`),
  getMyEvents: () => api.get("/events/my-events"),
  getTypes: () => api.get("/events/types"),
  getCategories: () => api.get("/events/categories"),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  unregister: (id) => api.post(`/events/${id}/unregister`),
  uploadThumbnail: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/events/${id}/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  saveThumbnailFromUrl: (id, imageUrl) =>
    api.post(`/events/${id}/thumbnail-from-url`, { imageUrl }),
};

// Event Types APIs
export const eventTypesAPI = {
  getAll: () => api.get("/eventtypes"),
  getAllAdmin: () => api.get("/eventtypes/all"),
  getById: (id) => api.get(`/eventtypes/${id}`),
  create: (data) => api.post("/eventtypes", data),
  update: (id, data) => api.put(`/eventtypes/${id}`, data),
  delete: (id) => api.delete(`/eventtypes/${id}`),
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get("/users"),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getDashboard: () => api.get("/users/dashboard"),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Payments APIs
export const paymentsAPI = {
  process: (data) => api.post("/payments/process", data),
  getHistory: () => api.get("/payments/history"),
};

// Theme APIs
export const themeAPI = {
  getActive: () => api.get("/theme/active"),
  getCurrent: () => api.get("/theme"),
  update: (data) => api.put("/theme", data),
  uploadLogo: (formData) => {
    return api.post("/theme/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadFavicon: (formData) => {
    return api.post("/theme/favicon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getPresets: () => api.get("/theme/presets"),
  applyPreset: (presetId) => api.post(`/theme/apply-preset/${presetId}`),
  reset: () => api.post("/theme/reset"),
};

// Membership Durations APIs
export const membershipDurationsAPI = {
  getAll: () => api.get("/membershipdurations"),
  getAllAdmin: () => api.get("/membershipdurations/admin/all"),
  create: (data) => api.post("/membershipdurations/admin", data),
  update: (id, data) => api.put(`/membershipdurations/admin/${id}`, data),
  delete: (id) => api.delete(`/membershipdurations/admin/${id}`),
};

// Membership Payments APIs
export const membershipPaymentsAPI = {
  // User endpoints
  getStatus: () => api.get("/membershippayments/status"),
  getMethods: () => api.get("/membershippayments/methods"),
  getDurations: () => api.get("/membershipdurations"),
  submit: (data) => api.post("/membershippayments", data),
  uploadProof: (paymentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/membershippayments/${paymentId}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  cancel: (paymentId) => api.delete(`/membershippayments/${paymentId}`),

  // Admin endpoints
  getPending: () => api.get("/membershippayments/admin/pending"),
  getAll: (params) => api.get("/membershippayments/admin/all", { params }),
  getPaymentDetails: (paymentId) =>
    api.get(`/membershippayments/admin/${paymentId}`),
  confirm: (paymentId, data) =>
    api.post(`/membershippayments/admin/${paymentId}/confirm`, data),
  updateLinkedUsers: (paymentId, familyMemberIds) =>
    api.put(`/membershippayments/admin/${paymentId}/linked-users`, {
      familyMemberIds,
    }),
  getUserFamily: (userId) =>
    api.get(`/membershippayments/admin/user/${userId}/family`),
  searchUsers: (query, excludeUserId) =>
    api.get("/membershippayments/admin/users/search", {
      params: { query, excludeUserId },
    }),

  // Payment Methods Admin endpoints
  getAllMethods: () => api.get("/membershippayments/admin/methods"),
  createMethod: (data) => api.post("/membershippayments/admin/methods", data),
  updateMethod: (id, data) =>
    api.put(`/membershippayments/admin/methods/${id}`, data),
  deleteMethod: (id) => api.delete(`/membershippayments/admin/methods/${id}`),
};

// Polls APIs
export const pollsAPI = {
  // Public endpoints
  getActive: () => api.get("/polls"),
  getFeatured: () => api.get("/polls/featured"),
  getById: (id) => api.get(`/polls/${id}`),
  vote: (id, data) => api.post(`/polls/${id}/vote`, data),

  // Admin endpoints
  getAllAdmin: () => api.get("/polls/admin/all"),
  getResults: (id) => api.get(`/polls/${id}/results`),
  create: (data) => api.post("/polls", data),
  update: (id, data) => api.put(`/polls/${id}`, data),
  delete: (id) => api.delete(`/polls/${id}`),
};

// Surveys APIs
export const surveysAPI = {
  // Public endpoints
  getActive: () => api.get("/surveys"),
  getFeatured: () => api.get("/surveys/featured"),
  getById: (id) => api.get(`/surveys/${id}`),
  startSurvey: (id, data) => api.post(`/surveys/${id}/start`, data),
  submitAnswer: (id, data) => api.post(`/surveys/${id}/answer`, data),
  completeSurvey: (id) => api.post(`/surveys/${id}/complete`),
  getMyResponse: (id) => api.get(`/surveys/${id}/my-response`),

  // Admin endpoints
  getAllAdmin: () => api.get("/surveys/admin/all"),
  getResults: (id) => api.get(`/surveys/${id}/results`),
  create: (data) => api.post("/surveys", data),
  update: (id, data) => api.put(`/surveys/${id}`, data),
  delete: (id) => api.delete(`/surveys/${id}`),
};

// Utility APIs
export const utilityAPI = {
  fetchUrlMetadata: (url) => api.post("/utility/fetch-url-metadata", { url }),
};

// Raffle APIs
export const rafflesAPI = {
  // Public endpoints
  getActive: () => api.get("/raffles"),
  getById: (id) => api.get(`/raffles/${id}`),
  getDrawingData: (id) => api.get(`/raffles/${id}/drawing`),

  // Admin endpoints
  getAllAdmin: () => api.get("/raffles/admin/all"),
  create: (data) => api.post("/raffles", data),
  update: (id, data) => api.put(`/raffles/${id}`, data),
  delete: (id) => api.delete(`/raffles/${id}`),

  // Prize management
  addPrize: (raffleId, data) => api.post(`/raffles/${raffleId}/prizes`, data),
  updatePrize: (prizeId, data) => api.put(`/raffles/prizes/${prizeId}`, data),
  deletePrize: (prizeId) => api.delete(`/raffles/prizes/${prizeId}`),

  // Ticket tier management
  addTier: (raffleId, data) => api.post(`/raffles/${raffleId}/tiers`, data),
  updateTier: (tierId, data) => api.put(`/raffles/tiers/${tierId}`, data),
  deleteTier: (tierId) => api.delete(`/raffles/tiers/${tierId}`),

  // Drawing management
  startDrawing: (id) => api.post(`/raffles/${id}/start-drawing`),
  revealDigit: (id, digit) =>
    api.post(`/raffles/${id}/reveal-digit`, { digit }),
  resetDrawing: (id) => api.post(`/raffles/${id}/reset-drawing`),

  // Participant management (admin)
  getParticipants: (id) => api.get(`/raffles/${id}/participants`),
  confirmPayment: (participantId, data) =>
    api.post(`/raffles/participants/${participantId}/confirm-payment`, data),
};

// Raffle Participant APIs (public, uses session token)
export const raffleParticipantAPI = {
  register: (raffleId, data) =>
    api.post(`/raffleparticipants/${raffleId}/register`, data),
  verifyOtp: (raffleId, data) =>
    api.post(`/raffleparticipants/${raffleId}/verify-otp`, data),
  resendOtp: (raffleId, data) =>
    api.post(`/raffleparticipants/${raffleId}/resend-otp`, data),
  getMyInfo: (raffleId, sessionToken) =>
    api.get(`/raffleparticipants/${raffleId}/me`, {
      headers: { "X-Raffle-Session": sessionToken },
    }),
  purchaseTickets: (raffleId, data, sessionToken) =>
    api.post(`/raffleparticipants/${raffleId}/purchase`, data, {
      headers: { "X-Raffle-Session": sessionToken },
    }),
  updateAvatar: (raffleId, avatarUrl, sessionToken) =>
    api.put(
      `/raffleparticipants/${raffleId}/avatar`,
      { avatarUrl },
      { headers: { "X-Raffle-Session": sessionToken } }
    ),
  uploadAvatar: (raffleId, file, sessionToken) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/raffleparticipants/${raffleId}/avatar-upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Raffle-Session": sessionToken,
      },
    });
  },
};

export default api;

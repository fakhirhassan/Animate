import axios from 'axios';

// Base API URL for Flask backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  signup: (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/auth/signup', data),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),

  getById: (id: string) => api.get(`/projects/${id}`),

  create: (data: FormData) => api.post('/projects', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  update: (id: string, data: any) => api.put(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),

  convertTo3D: (id: string) => api.post(`/projects/${id}/convert`),
};

// Admin API
export const adminAPI = {
  getUsers: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/users', { params }),

  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  getSystemStats: () => api.get('/admin/stats'),

  getUserGrowth: (months?: number) =>
    api.get('/admin/analytics/user-growth', { params: { months } }),

  getConversionActivity: (days?: number) =>
    api.get('/admin/analytics/conversions', { params: { days } }),

  getRecentActivities: (limit?: number) =>
    api.get('/admin/activities', { params: { limit } }),
};

// Conversion API (2D to 3D)
export const conversionAPI = {
  convert2Dto3D: (formData: FormData) =>
    api.post('/convert/2d-to-3d', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getHistory: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get('/convert/history', { params }),

  getConversionById: (id: string) => api.get(`/convert/history/${id}`),

  deleteConversion: (id: string) => api.delete(`/convert/history/${id}`),

  getStats: () => api.get('/convert/stats'),

  getStatus: (jobId: string) => api.get(`/convert/status/${jobId}`),

  downloadModel: (jobId: string, download: boolean = true) =>
    api.get(`/convert/download/${jobId}`, {
      params: { download: download.toString() },
      responseType: download ? 'blob' : undefined,
    }),

  getSupportedFormats: () => api.get('/convert/supported-formats'),
};

// Animation API
export const animationAPI = {
  generate: (data: { script: string; style: string }) =>
    api.post('/animation/generate', data),

  getStatus: (jobId: string) => api.get(`/animation/status/${jobId}`),

  download: (jobId: string) => api.get(`/animation/download/${jobId}`, {
    responseType: 'blob',
  }),
};

export default api;

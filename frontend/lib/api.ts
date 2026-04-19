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

// Track if we're already refreshing to avoid infinite loops
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
};

// Response interceptor — auto-refresh expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/signup');
      if (isAuthPage) return Promise.reject(error);

      // Try to refresh the token
      const authStorage = localStorage.getItem('auth-storage');
      let refreshToken: string | null = null;
      try {
        const parsed = JSON.parse(authStorage || '{}');
        refreshToken = parsed?.state?.refreshToken;
      } catch {}

      if (!refreshToken) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const newToken = response.data?.data?.token;
        const newRefreshToken = response.data?.data?.refresh_token;

        if (newToken) {
          localStorage.setItem('authToken', newToken);
          // Update zustand store
          try {
            const store = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            if (store.state) {
              store.state.token = newToken;
              store.state.refreshToken = newRefreshToken || refreshToken;
              localStorage.setItem('auth-storage', JSON.stringify(store));
            }
          } catch {}

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  sendOtp: (data: { email: string; name?: string; password?: string; is_resend?: boolean }) =>
    api.post('/auth/send-otp', data),

  verifyOtp: (data: { email: string; token: string; name?: string }) =>
    api.post('/auth/verify-otp', data),

  updateProfile: (data: { name: string }) =>
    api.patch('/auth/update-profile', data),

  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
    api.post('/auth/change-password', data),

  deleteAccount: (data: { password: string }) =>
    api.delete('/auth/delete-account', { data }),
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

  getRoleDistribution: () => api.get('/admin/analytics/role-distribution'),

  getConversionStatus: () => api.get('/admin/analytics/conversion-status'),

  getTopCreators: (limit?: number) =>
    api.get('/admin/analytics/top-creators', { params: { limit } }),

  getHeatmap: (days?: number) =>
    api.get('/admin/analytics/heatmap', { params: { days } }),

  getOverview: () => api.get('/admin/analytics/overview'),
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

// Script / Scene Parser API
export const scriptAPI = {
  analyzeScene: (script: string) =>
    api.post('/script/analyze', { script }),

  checkParser: () => api.get('/script/check'),
};

// Animation / Video Generation API
export const animationAPI = {
  // Full pipeline: text → scene parse → multi-clip video + voice → stitched MP4
  generate: (data: {
    text: string;
    num_frames_per_segment?: number;
    num_inference_steps?: number;
    fps?: number;
    voice_preset?: string;
    num_clips?: number;
  }) => api.post('/animation/generate', data, { timeout: 1800000 }), // 30 min timeout

  // Single clip text-to-video
  textToVideo: (data: {
    prompt: string;
    num_frames?: number;
    num_inference_steps?: number;
    fps?: number;
    height?: number;
    width?: number;
    seed?: number;
  }) => api.post('/animation/text-to-video', data, { timeout: 600000 }),

  // Image animation with optional voice
  imageAnimate: (formData: FormData) =>
    api.post('/animation/image-animate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    }),

  checkGenerator: () => api.get('/animation/check'),

  unloadModel: () => api.post('/animation/unload'),
};

// Voice / TTS API
export const voiceAPI = {
  generate: (data: { text: string; voice_preset?: string }) =>
    api.post('/voice/generate', data, { timeout: 60000 }),

  getPresets: () => api.get('/voice/presets'),
};

// Image Generation API (Text-to-Image)
export const imageAPI = {
  generate: (data: {
    prompt: string;
    width?: number;
    height?: number;
    num_inference_steps?: number;
    seed?: number;
  }) => api.post('/image/generate', data, { timeout: 300000 }), // 5 min timeout

  checkGenerator: () => api.get('/image/check'),
};

export default api;

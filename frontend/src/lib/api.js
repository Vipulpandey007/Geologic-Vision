import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle token expiry ─────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Clear auth and redirect
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  sendOtp: (phone: string) => api.post('/auth/student/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/student/verify-otp', { phone, otp }),
  adminLogin: (email: string, password: string) => api.post('/auth/admin/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name: string }) => api.patch('/auth/profile', data),
};

// ── Course API ────────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll: (params?: { search?: string; isFree?: boolean }) => api.get('/courses', { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  getAllAdmin: () => api.get('/courses/admin/all'),
  create: (data: FormData) => api.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/courses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

// ── Chapter API ───────────────────────────────────────────────────────────────
export const chapterAPI = {
  getByCourse: (courseId: string) => api.get(`/chapters/course/${courseId}`),
  create: (data: { courseId: string; title: string; description?: string }) => api.post('/chapters', data),
  update: (id: string, data: object) => api.put(`/chapters/${id}`, data),
  delete: (id: string) => api.delete(`/chapters/${id}`),
  reorder: (chapters: { id: string; order: number }[]) => api.patch('/chapters/reorder', { chapters }),
};

// ── PDF API ───────────────────────────────────────────────────────────────────
export const pdfAPI = {
  upload: (chapterId: string, data: FormData) =>
    api.post(`/pdfs/upload/${chapterId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (p) => p,
    }),
  getSignedUrl: (id: string) => api.get(`/pdfs/${id}/view`),
  update: (id: string, data: object) => api.put(`/pdfs/${id}`, data),
  delete: (id: string) => api.delete(`/pdfs/${id}`),
};

// ── Payment API ───────────────────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (courseId: string) => api.post('/payments/create-order', { courseId }),
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payments/verify', data),
  getMyPurchases: () => api.get('/payments/my-purchases'),
  getHistory: (params?: object) => api.get('/payments/history', { params }),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
};

export default api;

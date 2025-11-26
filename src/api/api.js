import axios from 'axios';

// Buat instance axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});

// Tambahkan interceptor request untuk menambahkan access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tambahkan interceptor response untuk handle refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika status 401 dan belum retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        // Panggil endpoint /refresh
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/refresh`,
          { refresh_token: refreshToken }
        );

        // Simpan access token baru
        localStorage.setItem('access_token', res.data.access_token);

        // Update header dan retry request
        originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(originalRequest);
      } catch (err) {
        // Jika gagal refresh, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

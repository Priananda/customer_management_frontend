import axios from "axios";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await auth.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        auth.logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

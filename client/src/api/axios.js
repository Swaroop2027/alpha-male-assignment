import axios from "axios";

// In local dev, falls back to "/api" (Vite proxy). In production, reads Vercel environment variable.
export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Auto-attach JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("alpha_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export default api;
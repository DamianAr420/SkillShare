import axios from "axios";

const API_BASE = import.meta.env.PROD
  ? "https://skillshare-tgfy.onrender.com/api"
  : "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized — token invalid or expired");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;

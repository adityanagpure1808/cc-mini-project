import axios from "axios";

// In development (npm run dev), Vite proxies /users and /orders to the gateway.
// In production (K8s / Docker), set VITE_API_BASE in your environment.
const BASE = import.meta.env.VITE_API_BASE || "";

const api = axios.create({ baseURL: BASE });

// Attach JWT automatically on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

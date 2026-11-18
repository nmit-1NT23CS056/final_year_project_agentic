import axios from 'axios';

// Get backend base URL from environment (e.g. VITE_API_BASE_URL=https://my-backend.onrender.com)
const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const BACKEND_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
export const API_BASE_URL = `${BACKEND_URL}/api`;

// Create an Axios instance configured to talk to our FastAPI backend
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;

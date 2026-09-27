import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sih-v23m.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ner_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If offline or network error, let callers know
    if (!navigator.onLine || error.code === 'ERR_NETWORK') {
      console.warn('[API Client] Client offline or network unreachable.');
    }
    return Promise.reject(error);
  }
);

export default api;

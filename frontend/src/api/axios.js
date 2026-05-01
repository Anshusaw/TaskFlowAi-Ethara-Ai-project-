import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❗ DO NOT redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn('Unauthorized request');
    }
    return Promise.reject(err);
  }
);

export default api;
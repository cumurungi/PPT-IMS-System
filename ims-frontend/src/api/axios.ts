import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ims_token');
      window.location.href = '/login';
    } else if (err.response && err.response.status >= 400) {
      import('@/composables/useToast').then(({ useToast }) => {
        const toast = useToast();
        const message = err.response.data?.message || err.response.data?.error || `Request failed (${err.response.status})`;
        toast.error(message);
      });
    }
    return Promise.reject(err);
  }
);

export default api;

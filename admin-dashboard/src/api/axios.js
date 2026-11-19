import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'x-admin-token': import.meta.env.VITE_ADMIN_API_SECRET || 'sreytha-admin-v1-secret'
  }
});

export default instance;

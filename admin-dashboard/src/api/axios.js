import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://curtain-shop.onrender.com/api'
});

export default instance;

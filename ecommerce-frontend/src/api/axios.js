import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
const baseURL =
  !envUrl || envUrl.includes('sreytha-curtain-shop.onrender.com')
    ? (import.meta.env.PROD ? 'https://curtain-shop.onrender.com/api' : 'http://localhost:5000/api')
    : envUrl;

const instance = axios.create({
  baseURL
});

export default instance;

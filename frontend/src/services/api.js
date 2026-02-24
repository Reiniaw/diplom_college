import axios from 'axios';

const api = axios.create({
  // URL твоего Django сервера. Обычно 8000 порт.
  baseURL: 'http://127.0.0.1:8000/api/', 
});

export const getProducts = () => api.get('products/');
export const getCategories = () => api.get('categories/');

export default api;
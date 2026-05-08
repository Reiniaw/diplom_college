import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/',
});

export const getProducts = () => api.get('products/');
export const getCategories = () => api.get('categories/');

export default api;
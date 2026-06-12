import axios from 'axios';
import API_BASE from './config';

// Получить заголовки с токеном из localStorage (для совместимости со старым кодом)
export const getHeaders = () => {
  const token = localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Получить первое изображение товара с полным URL
export const getProductImageUrl = (product) => {
  if (!product) return null;

  if (product.images && product.images.length > 0) {
    const imageUrl = product.images[0].image;
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
  }

  if (product.image) {
    return product.image.startsWith('http') ? product.image : `${API_BASE}${product.image}`;
  }

  return null;
};

// Получить все изображения товара
export const getProductImagesUrls = (product) => {
  if (!product || !product.images) return [];

  return product.images.map(img => {
    const url = img.image || img;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  });
};

// axios-инстанс с автоматическим refresh токена
const api = axios.create({
  baseURL: API_BASE,
});

// Перед каждым запросом подставляем актуальный access токен
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Флаг чтобы не запускать несколько refresh одновременно
let isRefreshing = false;
let failedQueue = []; // запросы которые ждут пока обновится токен

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// После каждого ответа — если 401, пробуем обновить токен
api.interceptors.response.use(
  response => response, // успех — пропускаем как есть
  async error => {
    const originalRequest = error.config;

    // Если не 401 или уже пробовали — пробрасываем ошибку дальше
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Если уже идёт refresh — ставим запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refresh = localStorage.getItem('refresh');

    if (!refresh) {
      // Refresh токена нет — разлогиниваем
      logout();
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(`${API_BASE}token/refresh/`, { refresh });
      const newAccess = res.data.access;

      localStorage.setItem('access', newAccess);
      processQueue(null, newAccess);

      // Повторяем оригинальный запрос с новым токеном
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Refresh тоже протух — разлогиниваем
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.dispatchEvent(new Event('userUpdated'));
  // Перенаправляем на логин
  window.location.href = '/login';
}

export default api;
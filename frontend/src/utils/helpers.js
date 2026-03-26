// Получить заголовки с токеном из localStorage
export const getHeaders = () => {
  const token = localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Получить первое изображение товара с полным URL
export const getProductImageUrl = (product) => {
  if (!product) return null;
  
  // Новая структура с images []
  if (product.images && product.images.length > 0) {
    const imageUrl = product.images[0].image;
    return imageUrl.startsWith('http') ? imageUrl : `http://127.0.0.1:8000${imageUrl}`;
  }
  
  // Обратная совместимость со старой структурой (image)
  if (product.image) {
    return product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`;
  }
  
  return null;
};

// Получить все изображения товара
export const getProductImagesUrls = (product) => {
  if (!product || !product.images) return [];
  
  return product.images.map(img => {
    const url = img.image || img;
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
  });
};

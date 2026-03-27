import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getHeaders, getProductImageUrl, getProductImagesUrls } from '../utils/helpers';
import { useToast } from '../components/ToastContext';

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [techFields, setTechFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState({});

  // Фильтры
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [techFilters, setTechFilters] = useState({}); // key -> value
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/categories/${id}/`),
        axios.get('http://127.0.0.1:8000/api/products/')
      ]);
      setCategory(catRes.data);
      setTechFields(catRes.data.tech_fields || []);
      setProducts(prodRes.data.filter(p => p.category === parseInt(id)));
    } catch (err) {
      console.error("Ошибка загрузки категории", err);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(p => {
    // Фильтр по цене
    const price = parseFloat(p.price);
    const min = priceMin ? parseFloat(priceMin) : 0;
    const max = priceMax ? parseFloat(priceMax) : Infinity;
    if (price < min || price > max) return false;

    // Фильтр по тех. характеристикам
    for (const [key, value] of Object.entries(techFilters)) {
      if (!value) continue;
      const techValue = p.tech_values?.find(tv => tv.tech_field.key === key);
      if (!techValue || !techValue.value.toLowerCase().includes(value.toLowerCase())) return false;
    }

    // Поиск по названию
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  // Добавление в корзину
  const addToCart = async (productId) => {
    if (!token) {
      toast.addToast("Для совершения покупок необходимо войти в аккаунт!", "error");
      return;
    }
    try {
      const cartRes = await axios.get('http://127.0.0.1:8000/api/orders/current-cart/', { headers: getHeaders() });
      await axios.post(`http://127.0.0.1:8000/api/orders/${cartRes.data.id}/add-item/`,
        { product_id: productId, quantity: 1 },
        { headers: getHeaders() }
      );
      toast.addToast("Товар успешно добавлен в корзину! 📸");
    } catch (err) {
      toast.addToast("Не удалось добавить товар.", "error");
    }
  };

  // Листание фото
  const nextImage = (e, productId, productImages) => {
    e.preventDefault();
    e.stopPropagation();
    if (productImages.length === 0) return;
    const currentIndex = selectedImageIndexes[productId] || 0;
    const nextIndex = (currentIndex + 1) % productImages.length;
    setSelectedImageIndexes(prev => ({...prev, [productId]: nextIndex}));
  };

  const prevImage = (e, productId, productImages) => {
    e.preventDefault();
    e.stopPropagation();
    if (productImages.length === 0) return;
    const currentIndex = selectedImageIndexes[productId] || 0;
    const prevIndex = (currentIndex - 1 + productImages.length) % productImages.length;
    setSelectedImageIndexes(prev => ({...prev, [productId]: prevIndex}));
  };

  const handleTechFilterChange = (key, value) => {
    setTechFilters(prev => ({...prev, [key]: value}));
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono">ЗАГРУЗКА...</div>;
  if (!category) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Категория не найдена</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-8 pt-10">
        <Link to="/" className="text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-2 mb-8 uppercase text-xs tracking-widest font-bold">
          ← Назад в каталог
        </Link>

        <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-8">
          {category.name}
        </h1>

        {/* Панель фильтров */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 mb-12">
          <h3 className="text-lg font-bold mb-6">Фильтры</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Цена */}
            <div>
              <label className="block text-sm font-medium mb-2">Цена от</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Цена до</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                placeholder="Макс"
              />
            </div>

            {/* Поиск */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Поиск по названию</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                placeholder="Название товара..."
              />
            </div>

            {/* Динамические фильтры по тех. полям */}
            {techFields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-2">{field.label}</label>
                <input
                  type="text"
                  value={techFilters[field.key] || ''}
                  onChange={(e) => handleTechFilterChange(field.key, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                  placeholder={`Фильтр по ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Список товаров */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => {
            const images = getProductImagesUrls(product);
            const currentImageIndex = selectedImageIndexes[product.id] || 0;
            const currentImage = images[currentImageIndex] || null;

            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 hover:border-sky-500/50 transition-all block"
              >
                <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-800">
                  {currentImage ? (
                    <>
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => prevImage(e, product.id, images)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ←
                          </button>
                          <button
                            onClick={(e) => nextImage(e, product.id, images)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            →
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-4xl">📸</div>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-sky-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sky-400 font-mono text-lg font-black mb-4">
                  {Number(product.price).toLocaleString()} ₸
                </p>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(product.id);
                  }}
                  className="w-full bg-sky-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-sky-400 transition-all"
                >
                  В корзину
                </button>
              </Link>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            Нет товаров, соответствующих фильтрам
          </div>
        )}
      </div>
    </div>
  );
}
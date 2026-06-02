import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getHeaders, getProductImageUrl, getProductImagesUrls } from '../utils/helpers';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

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
  const [techFilters, setTechFilters] = useState({}); // fieldId -> [value1, value2, ...]
  const [techFieldValues, setTechFieldValues] = useState({}); // fieldId -> [all unique values]
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFilter, setExpandedFilter] = useState(null); // Какой фильтр развернут
  const [techSearches, setTechSearches] = useState({}); // fieldId -> search text in filter

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}categories/${id}/`),
        axios.get(`${API_BASE}products/`)
      ]);
      setCategory(catRes.data);
      setTechFields(catRes.data.tech_fields || []);
      const categoryProducts = prodRes.data.filter(p => p.category === parseInt(id));
      setProducts(categoryProducts);

      // Вычисляем уникальные значения для каждого tech_field
      const fieldValuesMap = {};
      for (let field of catRes.data.tech_fields || []) {
        const values = new Set();
        for (let prod of categoryProducts) {
          if (prod.tech_values) {
            const techVal = prod.tech_values.find(tv => tv.tech_field.id === field.id);
            if (techVal?.value) {
              values.add(techVal.value);
            }
          }
        }
        fieldValuesMap[field.id] = Array.from(values).sort();
      }
      setTechFieldValues(fieldValuesMap);
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

    // Фильтр по тех. характеристикам (множественный выбор)
    for (const [fieldId, selectedValues] of Object.entries(techFilters)) {
      if (!selectedValues || selectedValues.length === 0) continue;
      const techValue = p.tech_values?.find(tv => tv.tech_field.id === parseInt(fieldId));
      if (!techValue || !selectedValues.includes(techValue.value)) return false;
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
      const cartRes = await axios.get(`${API_BASE}orders/current-cart/`, { headers: getHeaders() });
      await axios.post(`${API_BASE}orders/${cartRes.data.id}/add-item/`,
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

  const toggleTechFilter = (fieldId, value) => {
    setTechFilters(prev => {
      const current = prev[fieldId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return updated.length > 0
        ? { ...prev, [fieldId]: updated }
        : { ...prev, [fieldId]: undefined };
    });
  };

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setTechFilters({});
    setSearchQuery('');
    setTechSearches({});
    setExpandedFilter(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono">ЗАГРУЗКА...</div>;
  if (!category) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Категория не найдена</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
        <Link to="/" className="text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-2 mb-6 uppercase text-xs tracking-widest font-bold">
          ← Назад в каталог
        </Link>

        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8">
          {category.name}
        </h1>

        {/* ДВУХКОЛОНЧНЫЙ LAYOUT: ФИЛЬТРЫ СЛЕВА + ТОВАРЫ СПРАВА */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          
          {/* ЛЕВАЯ ПАНЕЛЬ: ФИЛЬТРЫ */}
          <div className="md:sticky md:top-6 h-fit">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">🔍 Фильтры</h3>
                {(priceMin || priceMax || searchQuery || Object.values(techFilters).some(v => v?.length > 0)) && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Ценовые фильтры */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <label className="block text-xs font-medium mb-2 uppercase tracking-wide">Цена</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg outline-none focus:border-sky-500 text-sm"
                    placeholder="от"
                  />
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg outline-none focus:border-sky-500 text-sm"
                    placeholder="до"
                  />
                </div>
              </div>

              {/* Поиск по названию */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <label className="block text-xs font-medium mb-2 uppercase tracking-wide">Поиск</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg outline-none focus:border-sky-500 text-sm"
                  placeholder="По названию..."
                />
              </div>

              {/* Аккордион фильтров по характеристикам */}
              <div className="space-y-2">
                {techFields.map(field => {
                  const selectedCount = (techFilters[field.id] || []).length;
                  const isExpanded = expandedFilter === field.id;
                  const fieldSearch = techSearches[field.id] || '';
                  const allValues = techFieldValues[field.id] || [];
                  const filteredValues = allValues.filter(v => 
                    v.toLowerCase().includes(fieldSearch.toLowerCase())
                  );

                  return (
                    <div key={field.id} className="border border-slate-700 rounded-lg overflow-hidden">
                      {/* Заголовок фильтра (кликабельный) */}
                      <button
                        onClick={() => setExpandedFilter(isExpanded ? null : field.id)}
                        className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-900/80 transition-colors text-sm"
                      >
                        <span className="font-bold text-slate-300 flex-1 text-left">{field.label}</span>
                        {selectedCount > 0 && (
                          <span className="text-xs bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-bold ml-2">
                            {selectedCount}
                          </span>
                        )}
                        <span className={`text-slate-400 transition-transform text-xs ml-2 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {/* Содержимое фильтра (раскрывается) */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-950 border-t border-slate-700">
                          {/* Поиск внутри фильтра */}
                          <input
                            type="text"
                            placeholder="Поиск..."
                            value={fieldSearch}
                            onChange={(e) => setTechSearches(prev => ({...prev, [field.id]: e.target.value}))}
                            className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg mb-2 outline-none focus:border-sky-500 text-xs"
                          />

                          {/* Чекбоксы значений */}
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {filteredValues.length > 0 ? (
                              filteredValues.map(value => (
                                <label key={value} className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={(techFilters[field.id] || []).includes(value)}
                                    onChange={() => toggleTechFilter(field.id, value)}
                                    className="w-3 h-3 rounded border-slate-600 text-sky-500 cursor-pointer"
                                  />
                                  <span className="text-xs text-slate-300 group-hover:text-sky-400 transition-colors">
                                    {value}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <div className="text-center text-slate-500 text-xs py-2">Не найдено</div>
                            )}
                          </div>

                          {/* Кнопка очистки этого фильтра */}
                          {(techFilters[field.id] || []).length > 0 && (
                            <button
                              onClick={() => setTechFilters(prev => ({...prev, [field.id]: undefined}))}
                              className="w-full mt-2 text-xs text-slate-400 hover:text-sky-400 transition-colors py-1 border-t border-slate-700"
                            >
                              Очистить
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ: ТОВАРЫ */}
          <div>
            {/* Сетка товаров */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
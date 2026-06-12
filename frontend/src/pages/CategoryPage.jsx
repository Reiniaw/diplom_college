import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getProductImageUrl, getProductImagesUrls } from '../utils/helpers';
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
  const [techFilters, setTechFilters] = useState({}); // fieldId -> [value1, value2, ...]
  const [techFieldValues, setTechFieldValues] = useState({}); // fieldId -> [all unique values]
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFilter, setExpandedFilter] = useState(null); // Какой фильтр развернут
  const [techSearches, setTechSearches] = useState({}); // fieldId -> search text in filter
  const [showFilters, setShowFilters] = useState(false); // Показывать ли фильтры на мобилке
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc' | 'name_asc'

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get(`categories/${id}/`),
        api.get(`products/`)
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
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'ru');
    return 0;
  });

  const activeFilterCount = Object.values(techFilters).filter(v => v && v.length > 0).length
    + (priceMin || priceMax ? 1 : 0)
    + (searchQuery ? 1 : 0);

  // Добавление в корзину
  const addToCart = async (productId) => {
    if (!token) {
      toast.addToast("Для совершения покупок необходимо войти в аккаунт!", "error");
      return;
    }
    try {
      const cartRes = await api.get(`orders/current-cart/`);
      await api.post(`orders/${cartRes.data.id}/add-item/`,
        { product_id: productId, quantity: 1 }
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
    setShowFilters(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono">ЗАГРУЗКА...</div>;
  if (!category) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Категория не найдена</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="w-full px-4 md:px-8 pt-6 md:pt-10">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-2 mb-4 md:mb-8 uppercase text-xs md:text-sm tracking-widest font-bold">
            ← Назад в каталог
          </Link>

          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter mb-4">
              {category.name}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              {filteredProducts.length} товаров • Выберите характеристики для фильтрации
            </p>
          </div>

          {/* КНОПКА ФИЛЬТРОВ НА МОБИЛКЕ */}
          <div className="md:hidden mb-4 flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-lg font-bold hover:border-sky-500 transition-colors"
            >
              🔍 {showFilters ? 'Скрыть' : 'Фильтры'}
              {activeFilterCount > 0 && (
                <span className="bg-sky-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-bold hover:border-red-500 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* ДВУХКОЛОНЧНЫЙ LAYOUT: ФИЛЬТРЫ СЛЕВА + ТОВАРЫ СПРАВА (desktop)
                         ИЛИ ФИЛЬТРЫ ВЫШЕ ТОВАРОВ (mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-8">
            
            {/* ЛЕВАЯ ПАНЕЛЬ: ФИЛЬТРЫ (на мобилке - условно показывается) */}
            {(showFilters || window.innerWidth >= 768) && (
            <div className="md:sticky md:top-6 h-fit">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm md:text-lg font-bold">🔍 Фильтры</h3>
                  {(priceMin || priceMax || searchQuery || Object.values(techFilters).some(v => v?.length > 0)) && (
                    <button 
                      onClick={clearFilters}
                      className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
                    >
                      ✕ Очистить
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
                        <button
                          onClick={() => setExpandedFilter(isExpanded ? null : field.id)}
                          className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-900/80 transition-colors text-sm"
                        >
                          <span className="font-bold text-slate-300 flex-1 text-left text-xs md:text-sm">{field.label}</span>
                          {selectedCount > 0 && (
                            <span className="text-xs bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-bold ml-2">
                              {selectedCount}
                            </span>
                          )}
                          <span className={`text-slate-400 transition-transform text-xs ml-2 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="p-3 bg-slate-950 border-t border-slate-700">
                            <input
                              type="text"
                              placeholder="Поиск..."
                              value={fieldSearch}
                              onChange={(e) => setTechSearches(prev => ({...prev, [field.id]: e.target.value}))}
                              className="w-full bg-slate-800 border border-slate-700 p-2 rounded-lg mb-2 outline-none focus:border-sky-500 text-xs"
                            />

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
            )}

            {/* ПРАВАЯ ЧАСТЬ: ТОВАРЫ */}
            <div>
              {/* Сортировка */}
              <div className="flex items-center justify-between mb-4 gap-3">
                <span className="text-slate-500 text-xs font-mono">{filteredProducts.length} товаров</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {[
                    { value: 'default', label: 'По умолчанию' },
                    { value: 'price_asc', label: 'Дешевле' },
                    { value: 'price_desc', label: 'Дороже' },
                    { value: 'name_asc', label: 'А–Я' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${sortBy === opt.value ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-sky-500/50 hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Сетка товаров */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map(product => {
                  const images = getProductImagesUrls(product);
                  const currentImageIndex = selectedImageIndexes[product.id] || 0;
                  const currentImage = images[currentImageIndex] || null;

                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-[2rem] p-4 md:p-6 hover:border-sky-500/50 transition-all block h-full"
                    >
                      <div className="relative mb-4 md:mb-6 overflow-hidden rounded-lg md:rounded-2xl bg-slate-800">
                        {currentImage ? (
                          <>
                            <img
                              src={currentImage}
                              alt={product.name}
                              className="w-full h-40 md:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={(e) => prevImage(e, product.id, images)}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={(e) => nextImage(e, product.id, images)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  →
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-40 md:h-48 flex items-center justify-center text-3xl md:text-4xl">📸</div>
                        )}
                      </div>

                      <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-3 group-hover:text-sky-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sky-400 font-mono text-base md:text-lg font-black mb-4 md:mb-6">
                        {Number(product.price).toLocaleString()} ₸
                      </p>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product.id);
                        }}
                        className="w-full bg-sky-500 text-slate-950 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold hover:bg-sky-400 transition-all text-sm md:text-base"
                      >
                        В корзину
                      </button>
                    </Link>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 md:py-20 px-4">
                  <span className="text-4xl md:text-5xl block mb-3">🕵️‍♂️</span>
                  <h2 className="text-lg md:text-xl font-bold text-slate-500 uppercase italic mb-3">Ничего не найдено</h2>
                  <p className="text-slate-600 text-xs md:text-sm mb-4">Попробуйте изменить фильтры</p>
                  <button onClick={() => {setSearchQuery(''); setTechFilters({});}} className="text-sky-500 hover:text-sky-400 underline text-xs md:text-sm transition-colors font-semibold">
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
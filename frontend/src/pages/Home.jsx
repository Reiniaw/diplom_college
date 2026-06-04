import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getHeaders, getProductImageUrl, getProductImagesUrls } from '../utils/helpers';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTechFields, setCategoryTechFields] = useState({});
  const [selectedImageIndexes, setSelectedImageIndexes] = useState({});
  const [favorites, setFavorites] = useState(new Set()); // Set из product_id

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchData();
    if (token) fetchFavorites();
  }, []);

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        axios.get(`${API_BASE}products/`),
        axios.get(`${API_BASE}categories/`)
      ]);
      setProducts(p.data);
      setCategories(c.data);
      const techFieldsMap = {};
      for (let category of c.data) {
        techFieldsMap[category.id] = category.tech_fields || [];
      }
      setCategoryTechFields(techFieldsMap);
    } catch (err) {
      console.error("Ошибка загрузки витрины", err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_BASE}favorites/`, { headers: getHeaders() });
      // Храним Set из product.id для быстрой проверки
      setFavorites(new Set(res.data.map(f => f.product.id)));
    } catch (err) {
      console.error("Ошибка загрузки избранного", err);
    }
  };

  const toggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.addToast("Войдите в аккаунт чтобы сохранять в избранное", "error");
      return;
    }
    const isFav = favorites.has(productId);
    if (isFav) {
      // Нужен id записи Favorite, получим через повторный запрос
      try {
        const res = await axios.get(`${API_BASE}favorites/`, { headers: getHeaders() });
        const record = res.data.find(f => f.product.id === productId);
        if (record) {
          await axios.delete(`${API_BASE}favorites/${record.id}/`, { headers: getHeaders() });
          setFavorites(prev => { const next = new Set(prev); next.delete(productId); return next; });
          toast.addToast("Убрано из избранного");
        }
      } catch (err) {
        toast.addToast("Ошибка", "error");
      }
    } else {
      try {
        await axios.post(`${API_BASE}favorites/`, { product_id: productId }, { headers: getHeaders() });
        setFavorites(prev => new Set(prev).add(productId));
        toast.addToast("Добавлено в избранное ♥");
      } catch (err) {
        toast.addToast(err.response?.data?.detail || "Ошибка", "error");
      }
    }
  };

  const addToCart = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!token) {
      toast.addToast("Для совершения покупок необходимо войти в аккаунт!", "error");
      return;
    }
    if (!product.is_in_stock) {
      toast.addToast("Товар нет в наличии!", "error");
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
      const errorMsg = err.response?.data?.detail || "Не удалось добавить товар.";
      toast.addToast(errorMsg, "error");
    }
  };

  const nextImage = (e, productId, productImages) => {
    e.preventDefault(); e.stopPropagation();
    if (!productImages.length) return;
    const cur = selectedImageIndexes[productId] || 0;
    setSelectedImageIndexes(prev => ({ ...prev, [productId]: (cur + 1) % productImages.length }));
  };

  const prevImage = (e, productId, productImages) => {
    e.preventDefault(); e.stopPropagation();
    if (!productImages.length) return;
    const cur = selectedImageIndexes[productId] || 0;
    setSelectedImageIndexes(prev => ({ ...prev, [productId]: (cur - 1 + productImages.length) % productImages.length }));
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="relative min-h-[500px] md:min-h-[600px] py-12 md:py-20 flex items-center justify-center overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-slate-950 to-slate-950 z-0"></div>
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-sky-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="relative z-10 text-center px-4 md:px-6 max-w-4xl">
          <div className="mb-4 md:mb-6 inline-block">
            <span className="text-sky-400 text-xs md:text-sm font-black uppercase tracking-[0.15em] bg-sky-500/15 px-4 md:px-6 py-2 rounded-full border border-sky-500/30">✨ Добро пожаловать в Pro Lens</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4 md:mb-6 leading-tight">
            Запечатли <br className="hidden md:block" /><span className="text-sky-500">идеальный кадр</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-lg lg:text-xl max-w-2xl md:max-w-3xl mx-auto font-light leading-relaxed mb-8 md:mb-12">
            От профессиональных камер до инновационных аксессуаров — всё для ваших шедевров
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
            <button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-sm md:text-base tracking-widest hover:shadow-lg hover:shadow-sky-500/50 transition-all active:scale-95">
              Смотреть каталог ↓
            </button>
            <Link to="/profile" className="w-full sm:w-auto border border-sky-500/40 bg-sky-500/5 backdrop-blur-md px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base hover:bg-sky-500/10 hover:border-sky-500 transition-all">
              Личный кабинет →
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full px-4 md:px-8 py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          {/* ПОИСК И КАТЕГОРИИ */}
          <div className="flex flex-col gap-6 md:gap-8 mb-12 md:mb-16">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Поиск товара..."
                className="w-full bg-slate-900 border border-slate-800 p-3 md:p-4 pl-10 md:pl-12 rounded-xl md:rounded-2xl outline-none focus:border-sky-500 transition-all text-base md:text-lg font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg md:text-xl">🔍</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg">✕</button>
              )}
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-2xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${!selectedCategory ? 'bg-white text-black shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                Все товары
              </button>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-2xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${selectedCategory === cat.id ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* СЕТКА ТОВАРОВ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => {
              const productImages = getProductImagesUrls(product) || [];
              const currentImageIndex = selectedImageIndexes[product.id] || 0;
              const currentImage = productImages.length > 0 ? productImages[currentImageIndex] : null;
              const isFav = favorites.has(product.id);

              return (
                <div key={product.id} className="group relative bg-gradient-to-b from-slate-900/60 to-slate-950 border border-slate-800 rounded-2xl md:rounded-[2rem] overflow-hidden hover:border-sky-500/50 transition-all duration-300 flex flex-col shadow-lg hover:shadow-sky-500/10 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-sky-500/0 group-hover:from-sky-500/5 group-hover:to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  {/* ГАЛЕРЕЯ */}
                  <Link to={`/product/${product.id}`} className="h-40 md:h-48 lg:h-56 bg-slate-900 relative overflow-hidden block group">
                    {currentImage ? (
                      <img src={currentImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl md:text-5xl font-black">📸</div>
                    )}

                    {/* Ценник */}
                    <div className="absolute top-3 right-3 md:top-4 md:right-4">
                      <span className="bg-sky-500 text-slate-950 px-3 md:px-5 py-1 md:py-2 rounded-lg md:rounded-xl font-black text-sm md:text-lg shadow-xl font-mono">
                        {Number(product.price).toLocaleString()}₸
                      </span>
                    </div>

                    {/* Наличие */}
                    <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${product.is_in_stock ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {product.is_in_stock ? `${product.stock} шт` : 'Нет'}
                      </span>
                    </div>

                    {/* Категория */}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4">
                      <span className="bg-slate-950/80 backdrop-blur-md text-slate-400 px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {categories.find(c => c.id === product.category)?.name || 'N/A'}
                      </span>
                    </div>

                    {/* Кнопки листания */}
                    {productImages.length > 1 && (
                      <>
                        <button onClick={(e) => prevImage(e, product.id, productImages)} className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-1.5 md:p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20 text-sm md:text-base">‹</button>
                        <button onClick={(e) => nextImage(e, product.id, productImages)} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-1.5 md:p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20 text-sm md:text-base">›</button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-md text-slate-300 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold">
                          {currentImageIndex + 1} / {productImages.length}
                        </div>
                      </>
                    )}
                  </Link>

                  <div className="p-4 md:p-6 flex flex-col flex-1 relative z-10">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-base md:text-lg font-black mb-2 tracking-tight group-hover:text-sky-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                      {product.description || "Высокое качество и надежность"}
                    </p>

                    {/* КНОПКИ: Купить + Избранное */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={!product.is_in_stock}
                        className={`flex-1 font-black py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all uppercase italic text-xs md:text-sm tracking-tight active:scale-95 duration-200 shadow-lg ${product.is_in_stock ? 'bg-white text-slate-950 hover:bg-sky-500 hover:shadow-sky-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}`}
                      >
                        {product.is_in_stock ? 'Купить' : 'Нет в наличии'}
                      </button>

                      {/* КНОПКА ИЗБРАННОГО */}
                      <button
                        onClick={(e) => toggleFavorite(e, product.id)}
                        title={isFav ? "Убрать из избранного" : "В избранное"}
                        className={`flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl border transition-all active:scale-95 flex items-center justify-center text-lg ${isFav ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-rose-500/50 hover:text-rose-400'}`}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 md:py-32 border-2 border-dashed border-slate-800 rounded-2xl md:rounded-[3rem] px-4">
              <span className="text-5xl md:text-6xl block mb-4">🕵️‍♂️</span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-500 uppercase italic mb-4">По вашему запросу ничего не нашли</h2>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="text-sky-500 hover:text-sky-400 underline transition-colors font-semibold">Сбросить все фильтры</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

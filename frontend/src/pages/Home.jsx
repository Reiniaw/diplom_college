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
  const [categoryTechFields, setCategoryTechFields] = useState({}); // Кэш tech_fields по категориям
  const [selectedImageIndexes, setSelectedImageIndexes] = useState({}); // productId -> imageIndex

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        axios.get(`${API_BASE}products/`),
        axios.get(`${API_BASE}categories/`)
      ]);
      setProducts(p.data);
      setCategories(c.data);
      
      // Загружаем tech_fields для каждой категории
      const techFieldsMap = {};
      for (let category of c.data) {
        techFieldsMap[category.id] = category.tech_fields || [];
      }
      setCategoryTechFields(techFieldsMap);
    } catch (err) {
      console.error("Ошибка загрузки витрины", err);
    }
  };

  // --- ЛОГИКА ДОБАВЛЕНИЯ В КОРЗИНУ ---
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
      const cartId = cartRes.data.id;

      await axios.post(`${API_BASE}orders/${cartId}/add-item/`, 
        { product_id: productId, quantity: 1 },
        { headers: getHeaders() }
      );

      toast.addToast("Товар успешно добавлен в корзину! 📸");
    } catch (err) {
      console.error("Ошибка при добавлении в корзину:", err);
      const errorMsg = err.response?.data?.detail || "Не удалось добавить товар. Проверьте соединение с сервером.";
      toast.addToast(errorMsg, "error");
    }
  };

  // --- ЛИСТАНИЕ ФОТОГРАФИЙ ---
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

  // Комбинированный фильтр: Категория + Поиск
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* 1. БАННЕР (HERO SECTION) */}
      <section className="relative h-[550px] flex items-center justify-center overflow-hidden border-b border-slate-900/50">
        {/* Фоновые глобусы */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-slate-950 to-slate-950 z-0"></div>
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="relative z-10 text-center px-6">
          <div className="mb-4 inline-block">
            <span className="text-sky-500 text-sm font-black uppercase tracking-[0.2em] bg-sky-500/20 px-6 py-2 rounded-full border border-sky-500/30">✨ Добро пожаловать в Pro Lens</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter mb-6">
            ЗАПЕЧАТЛИ <br/><span className="text-sky-500">идеальный кадр</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed mb-12">
            От профессиональных камер до инновационных аксессуаров. <br />
            Всё что нужно для создания шедевров
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
             <button className="bg-sky-500 text-slate-950 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 text-lg active:scale-95">
               Смотреть каталог ↓
             </button>
             <Link to="/profile" className="border border-sky-500/40 bg-sky-500/5 backdrop-blur-md px-10 py-4 rounded-2xl font-bold hover:bg-sky-500/10 hover:border-sky-500 transition-all text-lg">
               Личный кабинет
             </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* 2. ПАНЕЛЬ ПОИСКА И ФИЛЬТРОВ */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16">
          <nav className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${!selectedCategory ? 'bg-white text-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              Все модели
            </button>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="relative w-full lg:w-96">
            <input 
              type="text" 
              placeholder="Поиск по названию..."
              className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:border-sky-500 transition-all text-lg font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">🔍</span>
            {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">✕</button>
            )}
          </div>
        </div>

        {/* 3. СЕТКА ТОВАРОВ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const techFields = categoryTechFields[product.category] || [];
            const productImages = getProductImagesUrls(product) || [];
            const currentImageIndex = selectedImageIndexes[product.id] || 0;
            const currentImage = productImages.length > 0 ? productImages[currentImageIndex] : null;
            
            return (
            <div key={product.id} className="group relative bg-gradient-to-b from-slate-900/60 to-slate-950 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-sky-500/50 transition-all duration-300 flex flex-col shadow-lg hover:shadow-sky-500/10">
              
              {/* Декоративный градиент при наведении */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-sky-500/0 group-hover:from-sky-500/5 group-hover:to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              {/* ГАЛЕРЕЯ ФОТОГРАФИЙ */}
              <Link to={`/product/${product.id}`} className="h-64 bg-slate-900 relative overflow-hidden block group">
                {currentImage ? (
                  <img 
                    src={currentImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 text-5xl font-black">📸</div>
                )}
                
                {/* Ценник */}
                <div className="absolute top-4 right-4">
                  <span className="bg-sky-500 text-slate-950 px-5 py-2 rounded-xl font-black text-lg shadow-xl font-mono">
                    {product.price}₸
                  </span>
                </div>
                
                {/* Статус наличия */}
                <div className="absolute bottom-4 right-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    product.is_in_stock 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {product.is_in_stock ? `${product.stock} шт` : 'Нет'}
                  </span>
                </div>
                
                {/* Категория */}
                <div className="absolute top-4 left-4">
                  <span className="bg-slate-950/80 backdrop-blur-md text-slate-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {categories.find(c => c.id === product.category)?.name || 'N/A'}
                  </span>
                </div>

                {/* КНОПКИ ЛИСТАНИЯ ФОТОГРАФИЙ */}
                {productImages.length > 1 && (
                  <>
                    {/* Стрелка влево */}
                    <button
                      onClick={(e) => prevImage(e, product.id, productImages)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                      ‹
                    </button>
                    
                    {/* Стрелка вправо */}
                    <button
                      onClick={(e) => nextImage(e, product.id, productImages)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-950/70 hover:bg-slate-950 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                      ›
                    </button>

                    {/* Индикатор изображений */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                      {currentImageIndex + 1} / {productImages.length}
                    </div>
                  </>
                )}
              </Link>

              <div className="p-6 flex flex-col flex-1 relative z-10">
                {/* Заголовок */}
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-lg font-black mb-2 tracking-tight group-hover:text-sky-400 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Описание */}
                <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                  {product.description || "Профессиональная техника для вашего творчества"}
                </p>
                
                
                {/* КНОПКА КУПИТЬ */}
                <button 
                  onClick={() => addToCart(product.id)}
                  disabled={!product.is_in_stock}
                  className={`w-full font-black py-3 rounded-xl transition-all uppercase italic text-sm tracking-tight active:scale-95 duration-200 shadow-lg ${
                    product.is_in_stock 
                      ? 'bg-white text-slate-950 hover:bg-sky-500 hover:shadow-sky-500/30' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {product.is_in_stock ? 'Купить' : 'Нет в наличии'}
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed border-slate-900 rounded-[3rem]">
            <span className="text-6xl block mb-4">🕵️‍♂️</span>
            <h2 className="text-2xl font-bold text-slate-500 uppercase italic">По вашему запросу ничего не нашли</h2>
            <button onClick={() => {setSearchQuery(''); setSelectedCategory(null)}} className="mt-4 text-sky-500 underline">Сбросить все фильтры</button>
          </div>
        )}
      </div>
    </div>
  );
}
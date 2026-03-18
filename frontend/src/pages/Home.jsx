import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('access');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/products/'),
        axios.get('http://127.0.0.1:8000/api/categories/')
      ]);
      setProducts(p.data);
      setCategories(c.data);
    } catch (err) {
      console.error("Ошибка загрузки витрины", err);
    }
  };

  // --- ЛОГИКА ДОБАВЛЕНИЯ В КОРЗИНУ ---
  const addToCart = async (productId) => {
    if (!token) {
      alert("Для совершения покупок необходимо войти в аккаунт!");
      return;
    }

    try {
      // 1. Получаем текущую активную корзину пользователя
      const cartRes = await axios.get('http://127.0.0.1:8000/api/orders/current-cart/', { headers });
      const cartId = cartRes.data.id;

      // 2. Добавляем товар в эту корзину (количество по умолчанию 1)
      await axios.post(`http://127.0.0.1:8000/api/orders/${cartId}/add-item/`, 
        { product_id: productId, quantity: 1 },
        { headers }
      );

      alert("Товар успешно добавлен в корзину! 📸");
    } catch (err) {
      console.error("Ошибка при добавлении в корзину:", err);
      alert("Не удалось добавить товар. Проверьте соединение с сервером.");
    }
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
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/20 via-slate-950 to-slate-950 z-0"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px]"></div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">
            Pro <span className="text-sky-500">Lens</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Запечатлейте моменты с помощью лучшей техники. <br />
            От классических зеркалок до современных беззеркальных систем.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
             <button className="bg-sky-500 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20">
               Смотреть новинки
             </button>
             <Link to="/profile" className="border border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
               Мой кабинет
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
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                {cat.name}
              </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredProducts.map(product => (
            <div key={product.id} className="group bg-slate-900/50 border border-slate-900 rounded-[2.5rem] overflow-hidden hover:border-sky-500/30 transition-all flex flex-col">
              <div className="h-72 bg-slate-900 relative overflow-hidden">
                {product.image ? (
                  <img 
                    src={product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 text-4xl font-black">📸</div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-slate-950/90 backdrop-blur-md text-sky-400 px-4 py-2 rounded-xl font-mono font-black text-lg shadow-xl">
                    {product.price} ₸
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-sky-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2">
                  {product.description || "Профессиональное решение для ваших лучших кадров."}
                </p>
                
                {/* КНОПКА С ФУНКЦИОНАЛОМ */}
                <button 
                  onClick={() => addToCart(product.id)}
                  className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-sky-500 transition-all uppercase italic tracking-tighter active:scale-95"
                >
                  Купить
                </button>
              </div>
            </div>
          ))}
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
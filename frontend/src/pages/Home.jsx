import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((response) => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке товаров:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-10 text-xl font-light">Загрузка техники...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Фото- и аудиотехника</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-xl transition-all duration-300">
            <div className="aspect-square bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
              {/* Если добавишь ImageField в Django, заменим на реальное фото */}
              <span className="text-slate-400 text-sm group-hover:scale-110 transition-transform">Нет фото</span>
            </div>
            <h3 className="font-semibold text-lg text-slate-900 mb-2 truncate">{product.name}</h3>
            <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-indigo-600">{product.price} ₸</span>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-600 transition-colors">
                В корзину
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getHeaders, getProductImagesUrls } from '../utils/helpers';
import { useToast } from '../components/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const prodRes = await axios.get(`http://127.0.0.1:8000/api/products/${id}/`);
        setProduct(prodRes.data);
        
        // Загружаем категорию для получения динамических полей
        const catRes = await axios.get(`http://127.0.0.1:8000/api/categories/${prodRes.data.category}/`);
        setCategory(catRes.data);
      } catch (err) {
        console.error("Ошибка загрузки данных", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const images = getProductImagesUrls(product);

  // Функции для листания фото
  const nextSlide = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const addToCart = async () => {
    if (!token) {
      toast.addToast("Войдите в аккаунт!", "error");
      return;
    }
    try {
      const cartRes = await axios.get('http://127.0.0.1:8000/api/orders/current-cart/', { headers: getHeaders() });
      await axios.post(`http://127.0.0.1:8000/api/orders/${cartRes.data.id}/add-item/`, 
        { product_id: product.id, quantity: 1 }, { headers: getHeaders() }
      );
      toast.addToast("Добавлено в корзину! 📸");
    } catch (err) {
      toast.addToast("Ошибка при добавлении", "error");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono">ЗАГРУЗКА...</div>;
  if (!product) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Товар не найден</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-8 pt-10">
        <Link to="/" className="text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-2 mb-8 uppercase text-xs tracking-widest font-bold">
          ← Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* ГАЛЕРЕЯ С ЛИСТАНИЕМ */}
          <div className="flex flex-col gap-4">
            <div className="relative group bg-slate-900 border border-slate-800 rounded-[3rem] p-8 overflow-hidden h-[500px] flex items-center justify-center">
              <div className="absolute -inset-1 bg-sky-500/10 rounded-[3rem] blur-2xl"></div>
              
              {images.length > 0 ? (
                <>
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={product.name} 
                    className="relative z-10 max-w-full max-h-full object-contain transition-all duration-700 ease-in-out"
                  />
                  
                  {/* Кнопки переключения */}
                  {images.length > 1 && (
                    <>
                      <button onClick={prevSlide} className="absolute left-6 z-20 bg-slate-950/50 p-4 rounded-full border border-slate-800 hover:bg-sky-500 hover:border-sky-400 transition-all opacity-0 group-hover:opacity-100">
                        ←
                      </button>
                      <button onClick={nextSlide} className="absolute right-6 z-20 bg-slate-950/50 p-4 rounded-full border border-slate-800 hover:bg-sky-500 hover:border-sky-400 transition-all opacity-0 group-hover:opacity-100">
                        →
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-6 right-8 z-20 font-mono text-xs text-slate-500">
                    {String(selectedImageIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                </>
              ) : (
                <div className="text-6xl grayscale opacity-20">📸</div>
              )}
            </div>

            {/* Миниатюры */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all ${
                      selectedImageIndex === idx ? 'border-sky-500 scale-105' : 'border-slate-800 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ИНФО И ХАРАКТЕРИСТИКИ */}
          <div className="flex flex-col">
            <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-6 mb-10">
               <span className="text-4xl font-mono font-black text-sky-400">
                 {Number(product.price).toLocaleString()} ₸
               </span>
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs text-slate-500 uppercase tracking-[0.3em]">В наличии</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-8 mb-10">
              <h3 className="text-xs font-bold text-sky-500 uppercase mb-4 tracking-[0.2em]">История модели</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                {product.description || "Описание этой модели находится в архиве. Скоро мы его восстановим."}
              </p>
            </div>

            {/* ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ */}
            <div className="space-y-1 mb-12">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/50 mb-8 border-l-2 border-sky-500 pl-4">
                Спецификации устройства
              </h3>
              
              <div className="grid grid-cols-1 gap-1">
                <SpecRow label="Разрешение" value={product.megapixels ? `${product.megapixels} MP` : null} />
                <SpecRow label="Матрица" value={product.sensor_type} />
                <SpecRow label="Видео" value={product.video_resolution} />
                <SpecRow label="Масса" value={product.weight ? `${product.weight} г` : null} />
                
                {/* Динамические поля из категории */}
                {category?.tech_fields?.map((field) => {
                  const techValue = product.tech_values?.find(tv => tv.tech_field.id === field.id);
                  return (
                    <SpecRow 
                      key={field.id}
                      label={field.label}
                      value={techValue?.value} 
                    />
                  );
                })}
              </div>
            </div>

            <button 
              onClick={addToCart}
              className="group relative w-full bg-white text-black font-black py-6 rounded-2xl hover:bg-sky-500 transition-all uppercase italic tracking-tighter text-2xl active:scale-[0.97]"
            >
              <span className="relative z-10">Добавить в корзину</span>
              <div className="absolute inset-0 rounded-2xl bg-sky-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }) {
  // Убираем кавычки в начале и конце, если они есть, и конвертируем в строку
  const cleanValue = typeof value === 'string' ? value.replace(/^["\']|["\']$/g, '').trim() : String(value || '').trim();
  if (!cleanValue) return null;
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-900/50 group">
      <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase text-[10px] tracking-widest">{label}</span>
      <span className="text-white font-mono text-sm">{cleanValue}</span>
    </div>
  );
}
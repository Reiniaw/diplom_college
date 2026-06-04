import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getHeaders, getProductImagesUrls } from '../utils/helpers';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Избранное
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null); // id записи Favorite для удаления
  const [favLoading, setFavLoading] = useState(false);

  // Отзывы
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasMyReview, setHasMyReview] = useState(false);

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
    fetchReviews();
    if (token) fetchFavoriteStatus();
  }, [id]);

  const fetchData = async () => {
    try {
      const prodRes = await axios.get(`${API_BASE}products/${id}/`);
      setProduct(prodRes.data);
      const catRes = await axios.get(`${API_BASE}categories/${prodRes.data.category}/`);
      setCategory(catRes.data);
    } catch (err) {
      console.error("Ошибка загрузки данных", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}favorites/`, { headers: getHeaders() });
      const record = res.data.find(f => f.product.id === Number(id));
      setIsFav(!!record);
      setFavId(record?.id || null);
    } catch (err) { /* ignore */ }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE}products/${id}/reviews/`);
      setReviews(res.data);
      setHasMyReview(res.data.some(r => r.is_mine));
    } catch (err) {
      console.error("Ошибка загрузки отзывов", err);
    }
  };

  const toggleFavorite = async () => {
    if (!token) { toast.addToast("Войдите в аккаунт!", "error"); return; }
    setFavLoading(true);
    try {
      if (isFav && favId) {
        await axios.delete(`${API_BASE}favorites/${favId}/`, { headers: getHeaders() });
        setIsFav(false);
        setFavId(null);
        toast.addToast("Убрано из избранного");
      } else {
        const res = await axios.post(`${API_BASE}favorites/`, { product_id: Number(id) }, { headers: getHeaders() });
        setIsFav(true);
        setFavId(res.data.id);
        toast.addToast("Добавлено в избранное ♥");
      }
    } catch (err) {
      toast.addToast(err.response?.data?.detail || "Ошибка", "error");
    } finally {
      setFavLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) { toast.addToast("Войдите в аккаунт!", "error"); return; }
    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_BASE}products/${id}/reviews/`,
        { rating: reviewForm.rating, text: reviewForm.text },
        { headers: getHeaders() }
      );
      toast.addToast("Отзыв опубликован! ✅");
      setReviewForm({ rating: 5, text: '' });
      fetchReviews();
    } catch (err) {
      toast.addToast(err.response?.data?.detail || "Ошибка при отправке", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await axios.delete(`${API_BASE}products/${id}/reviews/${reviewId}/`, { headers: getHeaders() });
      toast.addToast("Отзыв удалён");
      fetchReviews();
    } catch (err) {
      toast.addToast("Ошибка при удалении", "error");
    }
  };

  const addToCart = async () => {
    if (!token) { toast.addToast("Войдите в аккаунт!", "error"); return; }
    if (!product.is_in_stock) { toast.addToast("Товар нет в наличии!", "error"); return; }
    try {
      const cartRes = await axios.get(`${API_BASE}orders/current-cart/`, { headers: getHeaders() });
      await axios.post(`${API_BASE}orders/${cartRes.data.id}/add-item/`,
        { product_id: product.id, quantity: 1 }, { headers: getHeaders() }
      );
      toast.addToast("Добавлено в корзину! 📸");
    } catch (err) {
      toast.addToast(err.response?.data?.detail || "Ошибка при добавлении", "error");
    }
  };

  const images = getProductImagesUrls(product);
  const nextSlide = () => setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));

  // Средний рейтинг
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono">ЗАГРУЗКА...</div>;
  if (!product) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Товар не найден</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <Link to="/" className="text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-2 mb-6 sm:mb-8 uppercase text-xs tracking-widest font-bold">
          ← Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">

          {/* ГАЛЕРЕЯ */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative group bg-slate-900 border border-slate-800 rounded-[3rem] p-4 sm:p-8 overflow-hidden h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
              <div className="absolute -inset-1 bg-sky-500/10 rounded-[3rem] blur-2xl"></div>
              {images.length > 0 ? (
                <>
                  <img src={images[selectedImageIndex]} alt={product.name} className="relative z-10 max-w-full max-h-full object-contain transition-all duration-700 ease-in-out" />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevSlide} className="absolute left-2 sm:left-6 z-20 bg-slate-950/50 p-2 sm:p-4 rounded-full border border-slate-800 hover:bg-sky-500 hover:border-sky-400 transition-all opacity-0 group-hover:opacity-100 text-xs sm:text-base">←</button>
                      <button onClick={nextSlide} className="absolute right-2 sm:right-6 z-20 bg-slate-950/50 p-2 sm:p-4 rounded-full border border-slate-800 hover:bg-sky-500 hover:border-sky-400 transition-all opacity-0 group-hover:opacity-100 text-xs sm:text-base">→</button>
                    </>
                  )}
                  <div className="absolute bottom-3 right-4 sm:bottom-6 sm:right-8 z-20 font-mono text-[10px] sm:text-xs text-slate-500">
                    {String(selectedImageIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </div>
                </>
              ) : (
                <div className="text-6xl grayscale opacity-20">📸</div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all ${selectedImageIndex === idx ? 'border-sky-500 scale-105' : 'border-slate-800 opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ИНФО */}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black uppercase italic tracking-tighter mb-3 sm:mb-4 leading-none">
              {product.name}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-10">
              <span className="text-3xl sm:text-4xl font-mono font-black text-sky-400">
                {Number(product.price).toLocaleString()} ₸
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`h-2 w-2 rounded-full ${product.is_in_stock ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs sm:text-sm uppercase tracking-[0.3em] ${product.is_in_stock ? 'text-green-400' : 'text-red-400'}`}>
                  {product.is_in_stock ? `В наличии (${product.stock})` : 'НЕТ В НАЛИЧИИ'}
                </span>
              </div>
              {/* Средний рейтинг рядом с ценой */}
              {avgRating && (
                <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="font-mono font-bold text-sm text-white">{avgRating}</span>
                  <span className="text-slate-500 text-xs">({reviews.length})</span>
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] p-5 sm:p-8 mb-6 sm:mb-10">
              <h3 className="text-xs font-bold text-sky-500 uppercase mb-3 sm:mb-4 tracking-[0.2em]">История модели</h3>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base lg:text-lg">
                {product.description || "Описание этой модели находится в архиве. Скоро мы его восстановим."}
              </p>
            </div>

            {/* ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ */}
            <div className="space-y-1 mb-8 sm:mb-12">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-white/50 mb-6 sm:mb-8 border-l-2 border-sky-500 pl-4">
                Спецификации устройства
              </h3>
              <div className="grid grid-cols-1 gap-1">
                <SpecRow label="Разрешение" value={product.megapixels ? `${product.megapixels} MP` : null} />
                <SpecRow label="Матрица" value={product.sensor_type} />
                <SpecRow label="Видео" value={product.video_resolution} />
                <SpecRow label="Масса" value={product.weight ? `${product.weight} г` : null} />
                {category?.tech_fields?.map((field) => {
                  const techValue = product.tech_values?.find(tv => tv.tech_field.id === field.id);
                  return <SpecRow key={field.id} label={field.label} value={techValue?.value} />;
                })}
              </div>
            </div>

            {/* КНОПКИ: Купить + Избранное */}
            <div className="flex gap-3">
              <button
                onClick={addToCart}
                disabled={!product.is_in_stock}
                className={`group relative flex-1 font-black py-4 sm:py-6 rounded-2xl transition-all uppercase italic tracking-tighter text-lg sm:text-2xl active:scale-[0.97] ${product.is_in_stock ? 'bg-white text-black hover:bg-sky-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}`}
              >
                <span className="relative z-10">{product.is_in_stock ? 'Добавить в корзину' : 'НЕТ В НАЛИЧИИ'}</span>
                <div className="absolute inset-0 rounded-2xl bg-sky-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
              </button>

              {/* КНОПКА ИЗБРАННОГО */}
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                title={isFav ? "Убрать из избранного" : "В избранное"}
                className={`flex-shrink-0 w-14 sm:w-16 rounded-2xl border-2 transition-all active:scale-95 flex items-center justify-center text-2xl ${isFav ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 hover:bg-rose-500/30' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-rose-500/50 hover:text-rose-400'}`}
              >
                {isFav ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── СЕКЦИЯ ОТЗЫВОВ ─── */}
        <div className="mt-16 sm:mt-24">
          <div className="flex items-end gap-4 mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Отзывы</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-xl">★</span>
                <span className="text-2xl font-black font-mono">{avgRating}</span>
                <span className="text-slate-500 text-sm">/ 5 · {reviews.length} {reviews.length === 1 ? 'отзыв' : 'отзывов'}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ФОРМА НОВОГО ОТЗЫВА */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 h-fit">
              {!token ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">Войдите чтобы оставить отзыв</p>
                  <Link to="/login" className="text-sky-500 font-bold hover:text-sky-400 transition-colors uppercase text-xs tracking-widest">
                    Войти →
                  </Link>
                </div>
              ) : hasMyReview ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-slate-400 font-medium">Вы уже оставили отзыв</p>
                  <p className="text-slate-600 text-xs mt-1">Можно удалить его ниже</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Ваш отзыв</h3>

                  {/* Звёзды */}
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className={`text-3xl transition-all active:scale-90 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-slate-500 text-sm self-center">{reviewForm.rating} из 5</span>
                  </div>

                  <textarea
                    placeholder="Расскажите о товаре — что понравилось, что нет..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600 text-sm resize-none mb-4"
                    value={reviewForm.text}
                    onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                  />

                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-2xl uppercase transition-all active:scale-95 shadow-lg shadow-sky-500/20 disabled:opacity-50 text-sm"
                  >
                    {submittingReview ? 'Публикация...' : 'Опубликовать отзыв'}
                  </button>
                </>
              )}
            </div>

            {/* СПИСОК ОТЗЫВОВ */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-[2.5rem] p-12 text-center">
                  <div className="text-5xl mb-4 opacity-30">★</div>
                  <p className="text-slate-600 italic">Отзывов пока нет. Будьте первым!</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className={`bg-slate-900 border rounded-[2rem] p-6 transition-all ${review.is_mine ? 'border-sky-500/40' : 'border-slate-800'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Аватар-заглушка */}
                        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-sm flex-shrink-0">
                          {review.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {review.username}
                            {review.is_mine && <span className="ml-2 text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30 uppercase">Вы</span>}
                          </p>
                          <p className="text-slate-600 text-[10px] font-mono">
                            {new Date(review.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Звёзды */}
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
                          ))}
                        </div>
                        {/* Кнопка удаления — только автору */}
                        {review.is_mine && (
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="text-slate-700 hover:text-rose-500 transition-colors text-xs ml-1"
                            title="Удалить отзыв"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-slate-400 text-sm leading-relaxed">{review.text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }) {
  const cleanValue = typeof value === 'string' ? value.replace(/^["']|["']$/g, '').trim() : String(value || '').trim();
  if (!cleanValue) return null;
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-900/50 group">
      <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase text-[10px] tracking-widest">{label}</span>
      <span className="text-white font-mono text-sm">{cleanValue}</span>
    </div>
  );
}

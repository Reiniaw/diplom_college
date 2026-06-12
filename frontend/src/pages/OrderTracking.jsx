import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/helpers';

const STATUS_STEPS = [
  {
    key: 'placed',
    label: 'Принят',
    desc: 'Заказ оформлен и передан в обработку',
    icon: '✓',
  },
  {
    key: 'processing',
    label: 'Собирается',
    desc: 'Комплектуем ваш заказ на складе',
    icon: '◈',
  },
  {
    key: 'shipped',
    label: 'В доставке',
    desc: 'Заказ передан курьеру',
    icon: '◎',
  },
  {
    key: 'delivered',
    label: 'Доставлен',
    desc: 'Заказ успешно доставлен',
    icon: '★',
  },
];

// Маппинг статусов бэкенда на индекс прогресса
function getStepIndex(status) {
  if (status === 'cancelled') return -1;
  if (status === 'placed')    return 0;
  if (status === 'shipped')   return 2;
  return 0;
}

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
    // Автообновление каждые 30 сек
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`orders/${id}/`);
      setOrder(res.data);
      setError(null);
    } catch (err) {
      setError('Заказ не найден или у вас нет доступа');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-500 font-mono uppercase tracking-widest">
      Загрузка...
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">{error}</p>
      <Link to="/profile" className="text-sky-500 hover:text-sky-400">← Мои заказы</Link>
    </div>
  );

  const stepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 pb-20">
      <div className="max-w-2xl mx-auto">

        <Link to="/profile" className="text-slate-500 hover:text-sky-500 transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2 mb-8">
          ← Мои заказы
        </Link>

        {/* Заголовок */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase italic">
              Заказ <span className="text-sky-400">#{order.id}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {new Date(order.created_at).toLocaleString('ru-RU', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
            isCancelled
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : order.status === 'shipped'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            {isCancelled ? 'Отменён' : order.status === 'shipped' ? 'В доставке' : 'Оформлен'}
          </span>
        </div>

        {/* Трекер прогресса */}
        {!isCancelled ? (
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8 mb-6">
            <div className="relative">
              {/* Линия прогресса */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-800 z-0" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-sky-500 z-0 transition-all duration-700"
                style={{ width: `${stepIndex === 0 ? 0 : (stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />

              {/* Шаги */}
              <div className="relative z-10 grid grid-cols-4 gap-2">
                {STATUS_STEPS.map((s, i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        done    ? 'bg-sky-500 border-sky-500 text-slate-950' :
                        active  ? 'bg-sky-500/20 border-sky-500 text-sky-400 animate-pulse' :
                                  'bg-slate-950 border-slate-800 text-slate-600'
                      }`}>
                        {s.icon}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-bold ${active ? 'text-sky-400' : done ? 'text-white' : 'text-slate-600'}`}>
                          {s.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Текущий статус */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-slate-400 text-sm text-center">
                {STATUS_STEPS[stepIndex]?.desc}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-[2rem] p-6 mb-6 text-center">
            <p className="text-red-400 font-bold">Этот заказ был отменён</p>
          </div>
        )}

        {/* Состав заказа */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8 mb-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Состав заказа</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-4 pb-3 border-b border-slate-800/50 last:border-0 last:pb-0">
                <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product_image && (
                    <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.product_name}</p>
                  <p className="text-slate-500 text-xs">{item.quantity} шт. × {item.price} ₸</p>
                </div>
                <p className="font-mono text-sky-400 text-sm flex-shrink-0">{item.total_price} ₸</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Итого</span>
            <span className="text-2xl font-black font-mono text-white">{order.total_price} ₸</span>
          </div>
        </div>

        {/* Доставка */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Данные доставки</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-slate-600 uppercase text-[10px] font-black tracking-wide pt-0.5 w-16 flex-shrink-0">Адрес</span>
              <span className="text-slate-300">{order.address || 'Не указан'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-600 uppercase text-[10px] font-black tracking-wide pt-0.5 w-16 flex-shrink-0">Телефон</span>
              <span className="text-slate-300 font-mono">{order.phone || 'Не указан'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-600 uppercase text-[10px] font-black tracking-wide pt-0.5 w-16 flex-shrink-0">Время</span>
              <span className="text-slate-300">{order.delivery_time || 'Не указано'}</span>
            </div>
            {order.notes && (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border-l-2 border-sky-500">
                <p className="text-slate-400 text-xs italic">"{order.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Сноска про автообновление */}
        <p className="text-center text-slate-700 text-xs mt-6">
          Страница обновляется автоматически каждые 30 секунд
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import api from '../utils/helpers';
import { useToast } from '../components/ToastContext';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 8;

  const toggleOrder = (id) => setExpandedOrders(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`orders/`);
      // Убираем из списка корзины, оставляем только реальные заказы
      setOrders(res.data.filter(o => o.status !== 'cart'));
    } catch (err) {
      console.error("Ошибка загрузки заказов", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`orders/${orderId}/change-status/`, { status: newStatus }
      );
      toast.addToast(`Статус заказа #${orderId} изменен на ${newStatus}`);
      fetchOrders(); // Обновляем список
    } catch (err) {
      toast.addToast("Ошибка при обновлении статуса", "error");
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

  if (loading) return <div className="p-20 text-white text-center font-mono uppercase">Загрузка протоколов продаж...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 sm:mb-12 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Менеджер Заказов</h1>
            <p className="text-slate-500 font-mono text-xs sm:text-sm mt-2">Контроль и обработка входящих транзакций</p>
          </div>
          
          {/* Фильтр по статусам */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
            {['all', 'placed', 'shipped', 'delivered', 'cancelled'].map(s => (
              <button 
                key={s}
                onClick={() => { setFilterStatus(s); setCurrentPage(1); setExpandedOrders(new Set()); }}
                className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all flex-shrink-0 ${filterStatus === s ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {s === 'all' ? 'Все' : s === 'placed' ? 'Оформлены' : s === 'shipped' ? 'Отправлены' : s === 'delivered' ? 'Доставлены' : 'Отменены'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:gap-5">
          {paginatedOrders.map(order => {
            const isOpen = expandedOrders.has(order.id);
            const statusColor = {
              placed: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
              shipped: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
              delivered: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
              cancelled: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
            }[order.status] || 'text-slate-400 border-slate-700 bg-slate-800';
            const statusLabel = { placed: 'Оформлен', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменен' }[order.status] || order.status;

            return (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl transition-all hover:border-slate-700">
                {/* Кликабельная шапка */}
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full p-4 sm:p-6 flex items-center gap-3 sm:gap-5 text-left hover:bg-slate-800/20 transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black italic flex-shrink-0">
                    #{order.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base truncate">{order.user_name || `Клиент #${order.user}`}</p>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-mono">{new Date(order.created_at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border flex-shrink-0 hidden sm:block ${statusColor}`}>{statusLabel}</span>
                  <span className="font-mono font-black text-sm sm:text-base flex-shrink-0">{order.total_price} ₸</span>
                  <span className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {/* Раскрывающееся тело */}
                {isOpen && (
                  <div className="border-t border-slate-800">
                    {/* Шапка с изменением статуса */}
                    <div className="px-4 sm:px-6 lg:px-8 py-4 bg-slate-800/20 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-widest">Статус:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 p-2 sm:p-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="placed">Оформлен</option>
                          <option value="shipped">Отправлен</option>
                          <option value="delivered">Доставлен</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                      {/* Список товаров */}
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 sm:mb-4">Состав заказа</h4>
                        {order.items && order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between border-b border-slate-800/50 pb-2 sm:pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                                {item.product_image && <img src={item.product_image} className="w-full h-full object-cover" alt="" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs sm:text-sm truncate">{item.product_name}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{item.quantity} шт. × {item.price} ₸</p>
                              </div>
                            </div>
                            <p className="font-mono font-bold text-sky-400 text-xs sm:text-sm flex-shrink-0 ml-2">{item.total_price} ₸</p>
                          </div>
                        ))}
                      </div>

                      {/* Логистика */}
                      <div className="bg-slate-950/50 p-4 sm:p-6 lg:p-8 rounded-[2rem] border border-slate-800 flex flex-col justify-between">
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Логистика</h4>
                          <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-sm">
                            <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-1 sm:mr-2">Адрес:</span> {order.address || 'Не указан'}</p>
                            <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-1 sm:mr-2">Телефон:</span> {order.phone || 'Нет связи'}</p>
                            <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-1 sm:mr-2">Время:</span> {order.delivery_time}</p>
                            {order.notes && (
                              <p className="mt-2 p-2 sm:p-3 bg-slate-900 rounded-xl text-slate-400 italic text-xs border-l-2 border-sky-500">"{order.notes}"</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800 flex justify-between items-end">
                          <span className="text-slate-500 uppercase text-[9px] sm:text-[10px] font-black tracking-widest">Итог к оплате</span>
                          <span className="text-2xl sm:text-3xl font-black italic text-white">{order.total_price} ₸</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="text-center py-16 sm:py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <p className="text-slate-600 italic text-sm sm:text-base">Заказов с таким статусом не найдено</p>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); setExpandedOrders(new Set()); }}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:border-sky-500/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
            >
              ← Назад
            </button>
            <span className="text-slate-500 text-xs font-mono px-2">
              {currentPage} / {totalPages} · {filteredOrders.length} заказов
            </span>
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); setExpandedOrders(new Set()); }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:border-sky-500/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
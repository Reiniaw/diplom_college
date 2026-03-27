import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getHeaders, getProductImageUrl } from '../utils/helpers';
import { useToast } from '../components/ToastContext';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/orders/', { headers: getHeaders() });
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
      await axios.patch(`http://127.0.0.1:8000/api/orders/${orderId}/`, 
        { status: newStatus }, 
        { headers: getHeaders() }
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

  if (loading) return <div className="p-20 text-white text-center font-mono uppercase">Загрузка протоколов продаж...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">Менеджер Заказов</h1>
            <p className="text-slate-500 font-mono mt-2">Контроль и обработка входящих транзакций</p>
          </div>
          
          {/* Фильтр по статусам */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {['all', 'placed', 'cancelled'].map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${filterStatus === s ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {s === 'all' ? 'Все' : s === 'placed' ? 'Оформлены' : 'Отменены'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-8">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl transition-all hover:border-slate-700">
              {/* Шапка карточки */}
              <div className="p-8 bg-slate-800/20 border-b border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-sky-500 text-slate-950 rounded-2xl flex items-center justify-center text-xl font-black italic">
                    #{order.id}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Клиент: {order.user_name || `ID ${order.user}`}</h3>
                    <p className="text-slate-500 text-xs font-mono">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-widest mr-2">Статус:</span>
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-bold uppercase outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="placed">Оформлен</option>
                    <option value="cancelled">Отменен</option>
                    {/* Если добавишь в модели новые статусы (shipped, done), они появятся и тут */}
                  </select>
                </div>
              </div>

              {/* Содержимое заказа */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Список товаров */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Состав заказа</h4>
                  {order.items && order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b border-slate-800/50 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                           {item.product_image && <img src={item.product_image} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.product_name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{item.quantity} шт. × {item.price} ₸</p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-sky-400">{item.total_price} ₸</p>
                    </div>
                  ))}
                </div>

                {/* Информация о доставке */}
                <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Логистика</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-2">Адрес:</span> {order.address || 'Не указан'}</p>
                      <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-2">Телефон:</span> {order.phone || 'Нет связи'}</p>
                      <p><span className="text-slate-600 font-bold uppercase text-[9px] mr-2">Время:</span> {order.delivery_time}</p>
                      {order.notes && (
                        <p className="mt-4 p-3 bg-slate-900 rounded-xl text-slate-400 italic text-xs border-l-2 border-sky-500">
                          "{order.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-end">
                    <span className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Итог к оплате</span>
                    <span className="text-3xl font-black italic text-white">{order.total_price} ₸</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <p className="text-slate-600 italic">Заказов с таким статусом не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
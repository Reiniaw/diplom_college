import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/orders/', { headers });
      setOrders(res.data);
    } catch (err) { console.error("Ошибка загрузки заказов"); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/orders/${orderId}/change-status/`, 
        { status: newStatus }, 
        { headers }
      );
      fetchOrders(); // Обновляем список
    } catch (err) { alert("Не удалось обновить статус"); }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-10 uppercase italic">Управление продажами</h1>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-800">
                <th className="p-6">ID / Дата</th>
                <th className="p-6">Клиент</th>
                <th className="p-6">Сумма</th>
                <th className="p-6">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-800/10 transition-colors">
                  <td className="p-6 font-mono text-sm">
                    #{order.id} <br />
                    <span className="text-slate-500 text-[10px]">{new Date(order.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="p-6 font-bold text-sky-400">{order.user_name || `User ID: ${order.user}`}</td>
                  <td className="p-6 font-bold">{order.total_price} ₸</td>
                  <td className="p-6">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none cursor-pointer"
                    >
                      <option value="cart">Корзина</option>
                      <option value="placed">Оформлен</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
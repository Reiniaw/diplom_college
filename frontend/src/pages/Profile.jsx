import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]); 
  const [showHireForm, setShowHireForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'seller' });
  const [myOrders, setMyOrders] = useState([]);

  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      // 1. Загружаем заказы и фильтруем ТОЛЬКО СВОИ (даже для админов)
      axios.get('http://127.0.0.1:8000/api/orders/', { headers })
        .then(res => {
          // Показываем только оформленные заказы, принадлежащие текущему пользователю
          const personal = res.data.filter(o => o.user === user.id && o.status !== 'cart');
          setMyOrders(personal);
        })
        .catch(err => console.error("Ошибка загрузки истории", err));

      // 2. Если Директор — загружаем персонал
      if (user.role === 'director') {
        fetchEmployees();
      }
    }
  }, [user]);

  const fetchProfile = () => {
    axios.get('http://127.0.0.1:8000/api/me/', { headers })
      .then(res => setUser(res.data))
      .catch(err => console.error("Ошибка авторизации"));
  };

  const fetchEmployees = () => {
    axios.get('http://127.0.0.1:8000/api/users/', { headers })
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Ошибка загрузки списка штата"));
  };

  const handleHire = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', newEmployee);
      alert(`Сотрудник ${newEmployee.username} успешно нанят!`);
      setNewEmployee({ username: '', password: '', role: 'seller' });
      setShowHireForm(false);
      fetchEmployees();
    } catch (err) {
      alert("Ошибка при создании сотрудника");
    }
  };

  const handleFire = async (id, username) => {
    if (window.confirm(`Вы уверены, что хотите уволить сотрудника ${username}?`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, { headers });
        fetchEmployees();
      } catch (err) {
        alert("Ошибка при удалении");
      }
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/users/${id}/`, { role: newRole }, { headers });
      fetchEmployees();
    } catch (err) {
      alert("Ошибка при смене роли");
    }
  };

  if (!user) return <div className="p-20 text-white text-center font-mono">Синхронизация профиля...</div>;

  const isStaff = ['director', 'manager', 'seller'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Личный кабинет</h1>
            <p className="text-sky-400 font-medium font-mono text-lg uppercase tracking-widest">
              {user.username} <span className="text-slate-600 ml-2">[{user.role}]</span>
            </p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="text-slate-500 hover:text-rose-500 text-xs font-black transition-colors uppercase tracking-[0.2em]"
          >
            Завершить сеанс →
          </button>
        </header>

        {/* --- ПАНЕЛЬ HR (ВОССТАНОВЛЕНА ДЛЯ ДИРЕКТОРА) --- */}
        {user.role === 'director' && (
          <section className="mb-16">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-2xl font-bold uppercase italic tracking-tight">Управление персоналом</h2>
                <button 
                  onClick={() => setShowHireForm(!showHireForm)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20"
                >
                  {showHireForm ? 'Закрыть' : '+ Нанять сотрудника'}
                </button>
              </div>

              {showHireForm && (
                <div className="p-8 bg-slate-800/20 border-b border-slate-800 animate-in fade-in duration-300">
                   <form onSubmit={handleHire} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Логин" required className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none" onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} />
                    <input type="password" placeholder="Пароль" required className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none" onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} />
                    <select className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none text-sm" onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}>
                      <option value="seller">Продавец</option>
                      <option value="manager">Руководитель</option>
                    </select>
                    <button type="submit" className="bg-white text-black font-bold rounded-xl hover:bg-sky-500 transition-colors uppercase text-xs">Принять</button>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-900/30">
                      <th className="p-6">ID</th>
                      <th className="p-6">Сотрудник</th>
                      <th className="p-6">Должность</th>
                      <th className="p-6 text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-6 text-slate-500 text-sm font-mono">{emp.id}</td>
                        <td className="p-6 font-bold">{emp.username} {emp.id === user.id && <span className="text-sky-500 ml-2">●</span>}</td>
                        <td className="p-6">
                          <select 
                            className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-[10px] outline-none"
                            value={emp.role}
                            disabled={emp.id === user.id}
                            onChange={(e) => handleChangeRole(emp.id, e.target.value)}
                          >
                            <option value="user">Клиент</option>
                            <option value="seller">Продавец</option>
                            <option value="manager">Руководитель</option>
                            <option value="director">Директор</option>
                          </select>
                        </td>
                        <td className="p-6 text-right">
                          {emp.id !== user.id && (
                            <button onClick={() => handleFire(emp.id, emp.username)} className="text-rose-500 hover:text-rose-400 font-bold text-[10px] uppercase">Уволить</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* --- ПАНЕЛЬ БИЗНЕСА (ДИЗАЙН ВОССТАНОВЛЕН) --- */}
        {isStaff && (
          <section className="mb-16">
            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              <span className="w-12 h-px bg-slate-800"></span> 
              Бизнес-инструменты 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl italic font-black">BOX</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Складской учет</h3>
                <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">
                  {user.role === 'seller' 
                    ? 'Мониторинг остатков техники и изменение цен.' 
                    : 'Добавление товаров, управление категориями и инвентаризация.'}
                </p>
                <Link to="/warehouse" className="inline-flex items-center gap-3 bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs italic tracking-widest">
                  Открыть Склад <span>→</span>
                </Link>
              </div>

              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl italic font-black">CRM</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Менеджер Заказов</h3>
                <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">
                  Контроль всех входящих заказов. Управление статусами доставки и проверка клиентских данных.
                </p>
                <Link to="/orders-manager" className="inline-flex items-center gap-3 bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs italic tracking-widest">
                  Все продажи <span>→</span>
                </Link>
              </div>

            </div>
          </section>
        )}
        
        {/* --- ПОДРОБНАЯ ЛИЧНАЯ ИСТОРИЯ ПОКУПОК --- */}
        <section className="space-y-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <span className="w-12 h-1 bg-sky-500"></span>
                Личная история заказов
            </h2>
            
            <div className="grid gap-6">
                {myOrders.map(order => (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                        {/* Шапка заказа */}
                        <div className="p-6 bg-slate-800/30 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <span className="text-sky-500 font-mono font-bold uppercase tracking-tighter">ЗАКАЗ #{order.id}</span>
                                <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">
                                    {new Date(order.created_at).toLocaleString()}
                                </p>
                            </div>
                            <span className="px-4 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-400 border border-slate-700">
                                {order.status === 'placed' ? 'Оформлен' : 'Обработан'}
                            </span>
                        </div>

                        {/* Список товаров в заказе */}
                        <div className="p-6 space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-700">
                                            {item.product_image ? (
                                                <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">📸</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{item.product_name}</p>
                                            <p className="text-[10px] text-slate-500">{item.quantity} шт. × {item.price} ₸</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm font-mono">{item.total_price} ₸</p>
                                </div>
                            ))}
                        </div>

                        {/* Инфо о доставке и Итог */}
                        <div className="p-8 bg-slate-950/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="text-[10px] text-slate-500 space-y-1 italic uppercase tracking-wider">
                                <p>📍 {order.address || 'Адрес не указан'}</p>
                                <p>📞 {order.phone || 'Контакт не указан'}</p>
                                <p>💬 {order.notes || 'Комментарий не укзан'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Итого к оплате</p>
                                <p className="text-3xl font-black text-white italic">{order.total_price} ₸</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {myOrders.length === 0 && (
                    <div className="bg-slate-900/50 p-20 rounded-[3rem] border border-slate-800 border-dashed text-center">
                        <p className="text-slate-500 italic">У вас пока нет оформленных покупок.</p>
                        <Link to="/" className="text-sky-500 font-bold mt-4 inline-block hover:underline">Перейти в магазин →</Link>
                    </div>
                )}
            </div>
        </section>
      </div>
    </div>
  );
}
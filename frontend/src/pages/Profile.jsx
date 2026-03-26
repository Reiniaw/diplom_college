import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { getHeaders } from '../utils/helpers';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]); 
  const [showHireForm, setShowHireForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'seller' });
  const [myOrders, setMyOrders] = useState([]);
  
  // --- ФИЛЬТР ДАТ И СТАТИСТИКА ---
  const [stats, setStats] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('access');

  // 1. Первичная загрузка профиля
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchProfile();
    }
  }, []);

  // 2. Загрузка статистики (только при первом получении данных пользователя)
  useEffect(() => {
    if (user?.role === 'director') {
      fetchStats(); // Загружаем начальные данные без фильтров
      fetchEmployees();
    }
    
    if (user) {
      // Личная история заказов
      axios.get('http://127.0.0.1:8000/api/orders/', { headers: getHeaders() })
        .then(res => {
          const personal = res.data.filter(o => o.user === user.id && o.status !== 'cart');
          setMyOrders(personal);
        })
        .catch(err => console.error("Ошибка загрузки истории", err));
    }
  }, [user]);

  const fetchProfile = () => {
    axios.get('http://127.0.0.1:8000/api/me/', { headers: getHeaders() })
      .then(res => setUser(res.data))
      .catch(err => {
        localStorage.clear();
        navigate('/login');
      });
  };

  // ОСНОВНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ СТАТИСТИКИ
  const fetchStats = (dFrom = dateFrom, dTo = dateTo) => {
    let url = 'http://127.0.0.1:8000/api/director/stats/';
    const params = new URLSearchParams();
    if (dFrom) params.append('date_from', dFrom);
    if (dTo) params.append('date_to', dTo);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    axios.get(url, { headers: getHeaders() })
      .then(res => setStats(res.data))
      .catch(err => console.error("Ошибка аналитики", err));
  };

  // Функция для кнопки "Применить"
  const handleApplyFilters = () => {
    fetchStats();
  };

  // Функция для сброса фильтров
  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    fetchStats('', ''); // Передаем пустые строки сразу, не дожидаясь обновления стейта
  };

  const fetchEmployees = () => {
    axios.get('http://127.0.0.1:8000/api/users/', { headers: getHeaders() })
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Ошибка штата"));
  };

  const handleHire = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', newEmployee, { headers: getHeaders() });
      alert(`Сотрудник ${newEmployee.username} нанят!`);
      setNewEmployee({ username: '', password: '', role: 'seller' });
      setShowHireForm(false);
      fetchEmployees();
    } catch (err) { alert("Ошибка при создании"); }
  };

  const handleFire = async (id, username) => {
    if (window.confirm(`Уволить ${username}?`)) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, { headers: getHeaders() });
        fetchEmployees();
      } catch (err) { alert("Ошибка удаления"); }
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/users/${id}/`, { role: newRole }, { headers: getHeaders() });
      fetchEmployees();
    } catch (err) { alert("Ошибка роли"); }
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono uppercase tracking-[0.2em] animate-pulse">
      Проверка протокола доступа...
    </div>
  );

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
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-slate-500 hover:text-rose-500 text-xs font-black transition-colors uppercase tracking-[0.2em]"
          >
            Завершить сеанс →
          </button>
        </header>

        {/* --- ПАНЕЛЬ ДИРЕКТОРА С ФИЛЬТРОМ ДАТ --- */}
        {user.role === 'director' && (
          <section className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
              <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <span className="w-12 h-px bg-sky-500/30"></span> 
                Финансовый мониторинг
              </h2>
              
              <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl">
                <input 
                  type="date" 
                  className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 outline-none focus:border-sky-500 transition-colors"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-slate-600 font-bold">—</span>
                <input 
                  type="date" 
                  className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 outline-none focus:border-sky-500 transition-colors"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                
                {/* КНОПКА ПРИМЕНИТЬ */}
                <button 
                  onClick={handleApplyFilters}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                >
                  Применить
                </button>

                {(dateFrom || dateTo) && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase px-2 transition-colors"
                  >
                    Сброс
                  </button>
                )}
              </div>
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-5 italic font-black">CASH</div>
                  <p className="text-slate-500 text-[10px] uppercase font-black mb-2">Общая выручка</p>
                  <p className="text-5xl font-black italic text-white">
                    {(stats.total_sales || 0).toLocaleString()} <span className="text-sky-500 text-2xl font-normal not-italic">₸</span>
                  </p>
                </div>

                <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-5 italic font-black">ORDERS</div>
                  <p className="text-slate-500 text-[10px] uppercase font-black mb-2">Заказов за период</p>
                  <p className="text-5xl font-black italic text-white">{stats.orders_count || stats.orders_today || 0}</p>
                </div>

                <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl">
                  <h3 className="text-xs font-black uppercase text-sky-500 mb-6">Бестселлеры</h3>
                  <div className="space-y-4">
                    {(stats.top_products || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300 truncate pr-2">{item.product__name}</span>
                        <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-sky-400">{item.total_qty} шт.</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-10">Отчет доходности</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 text-[10px] uppercase tracking-[0.3em] border-b border-slate-800">
                          <th className="pb-6">Дата</th>
                          <th className="pb-6 text-center">Сделок</th>
                          <th className="pb-6">Товары</th>
                          <th className="pb-6 text-right">Выручка</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {(stats.daily_sales || []).map((day, i) => (
                          <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-6 font-mono text-sky-500 text-sm">{day.date}</td>
                            <td className="py-6 text-center font-bold text-slate-400">{day.count}</td>
                            <td className="py-6">
                              <div className="flex flex-wrap gap-2">
                                {day.items?.map((name, idx) => (
                                  <span key={idx} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase border border-slate-700">{name}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-6 text-right font-black italic text-xl">
                              {day.total.toLocaleString()} <span className="text-xs not-italic text-sky-500">₸</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* --- ПАНЕЛЬ HR --- */}
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
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
                      <th className="p-6">ID</th>
                      <th className="p-6">Сотрудник</th>
                      <th className="p-6">Должность</th>
                      <th className="p-6 text-right">Действие</th>
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

        {/* --- ПАНЕЛЬ БИЗНЕСА --- */}
        {isStaff && (
          <section className="mb-16">
            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              <span className="w-12 h-px bg-slate-800"></span> Операционное управление 
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl italic font-black">BOX</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Складской учет</h3>
                <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">
                  {user.role === 'seller' ? 'Мониторинг остатков и изменение цен.' : 'Управление товарами и инвентаризация.'}
                </p>
                <Link to="/warehouse" className="bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs">Открыть Склад →</Link>
              </div>

              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl italic font-black">CRM</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Менеджер Заказов</h3>
                <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">Контроль входящих заказов, статусов доставки и проверка данных.</p>
                <Link to="/orders-manager" className="bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs">Все продажи →</Link>
              </div>
            </div>
          </section>
        )}
        
        {/* --- ЛИЧНАЯ ИСТОРИЯ --- */}
        <section className="space-y-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <span className="w-12 h-1 bg-sky-500"></span> Личная история заказов
            </h2>
            <div className="grid gap-6">
                {myOrders.map(order => (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                        <div className="p-6 bg-slate-800/30 flex justify-between items-center border-b border-slate-800">
                            <div>
                                <span className="text-sky-500 font-mono font-bold uppercase tracking-tighter">ЗАКАЗ #{order.id}</span>
                                <p className="text-slate-500 text-[10px] mt-1 uppercase">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <span className="px-4 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-400 border border-slate-700">
                                {order.status === 'placed' ? 'Оформлен' : 'Обработан'}
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex-shrink-0">
                                            {item.product_image ? <img src={item.product_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700">📸</div>}
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
                        <div className="p-8 bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-[10px] text-slate-500 italic uppercase">
                                <p>📍 {order.address || 'Нет адреса'}</p>
                                <p>📞 {order.phone || 'Нет контакта'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-[10px] font-bold mb-1">Итого к оплате</p>
                                <p className="text-3xl font-black italic">{order.total_price} ₸</p>
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
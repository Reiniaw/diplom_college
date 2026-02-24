import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]); 
  const [showHireForm, setShowHireForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'seller' });

  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Только Директор загружает список штата для HR-панели
  useEffect(() => {
    if (user && user.role === 'director') {
      fetchEmployees();
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

  if (!user) return <div className="p-20 text-white text-center">Загрузка профиля...</div>;

  // Проверка: относится ли пользователь к персоналу магазина
  const isStaff = ['director', 'manager', 'seller'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Личный кабинет</h1>
            <p className="text-sky-400 font-medium font-mono text-lg">
              {user.username} <span className="text-slate-600 ml-2">[{user.role.toUpperCase()}]</span>
            </p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="text-slate-500 hover:text-rose-500 text-sm font-bold transition-colors uppercase tracking-widest"
          >
            Выйти из системы →
          </button>
        </header>

        {/* --- ПАНЕЛЬ HR (ТОЛЬКО ДЛЯ ДИРЕКТОРА) --- */}
        {user.role === 'director' && (
          <section className="mb-12">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-2xl font-bold">Управление персоналом</h2>
                <button 
                  onClick={() => setShowHireForm(!showHireForm)}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20"
                >
                  {showHireForm ? 'Закрыть анкету' : '+ Нанять сотрудника'}
                </button>
              </div>

              {showHireForm && (
                <div className="p-8 bg-slate-800/20 border-b border-slate-800 animate-in fade-in duration-300">
                   <form onSubmit={handleHire} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input 
                      type="text" placeholder="Логин" required
                      className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                      onChange={e => setNewEmployee({...newEmployee, username: e.target.value})}
                    />
                    <input 
                      type="password" placeholder="Пароль" required
                      className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none focus:border-sky-500"
                      onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                    />
                    <select 
                      className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none"
                      onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                    >
                      <option value="seller">Продавец</option>
                      <option value="manager">Руководитель</option>
                    </select>
                    <button type="submit" className="bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors">Принять в штат</button>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-800 bg-slate-900/30">
                      <th className="p-6">ID</th>
                      <th className="p-6">ФИО / Логин</th>
                      <th className="p-6">Должность</th>
                      <th className="p-6 text-right">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="p-6 text-slate-500 text-sm font-mono">{emp.id}</td>
                        <td className="p-6 font-bold">{emp.username} {emp.id === user.id && <span className="text-sky-500 ml-2">(Вы)</span>}</td>
                        <td className="p-6">
                          <select 
                            className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-xs outline-none focus:border-sky-500"
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
                            <button onClick={() => handleFire(emp.id, emp.username)} className="text-rose-500 hover:text-rose-400 font-bold text-xs uppercase tracking-tighter">Уволить</button>
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

        {/* --- ПАНЕЛЬ БИЗНЕСА (ДИРЕКТОР, РУКОВОДИТЕЛЬ, ПРОДАВЕЦ) --- */}
        {isStaff && (
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-px bg-slate-800"></span> 
              Бизнес-инструменты 
              <span className="w-full h-px bg-slate-800"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Карточка Склада */}
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-7xl">📦</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Складской учет</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
                  {user.role === 'seller' 
                    ? 'Просмотр наличия техники и оперативное изменение цен.' 
                    : 'Полный цикл: добавление товаров, управление категориями и остатками.'}
                </p>
                <Link to="/warehouse" className="inline-flex items-center gap-2 bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-8 py-4 rounded-2xl font-black transition-all uppercase text-sm">
                  Открыть Склад <span>→</span>
                </Link>
              </div>

              {/* Карточка Заказов */}
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-7xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Менеджер Заказов</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
                  Контроль всех входящих заказов. Смена статусов доставки и проверка оплаты.
                </p>
                <Link to="/orders-manager" className="inline-flex items-center gap-2 bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-8 py-4 rounded-2xl font-black transition-all uppercase text-sm">
                  Все продажи <span>→</span>
                </Link>
              </div>

            </div>
          </section>
        )}
        
        {/* --- СЕКЦИЯ КЛИЕНТА (ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ) --- */}
        {user.role === 'user' && (
          <section className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-3xl mb-6">📸</div>
            <h2 className="text-2xl font-bold mb-2">История ваших покупок</h2>
            <p className="text-slate-500 max-w-sm mb-8">Здесь будут отображаться ваши заказы, как только вы выберете технику в нашем каталоге.</p>
            <Link to="/" className="bg-sky-500 text-slate-950 px-8 py-3 rounded-xl font-bold">Перейти к покупкам</Link>
          </section>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { getHeaders } from '../utils/helpers';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

// Инпут пароля с кнопкой показать/скрыть
function PasswordInput({ placeholder, value, onChange, error = false }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-900 border p-3 sm:p-4 rounded-2xl outline-none focus:ring-1 transition-colors text-sm pr-24 ${
          error
            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500'
            : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
      >
        {show ? 'Скрыть' : 'Показать'}
      </button>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showHireForm, setShowHireForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ username: '', password: '', role: 'seller' });
  const [myOrders, setMyOrders] = useState([]);

  const [activeTab, setActiveTab] = useState('profile');
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '', email: '', phone: '', address: '',
    first_name: '', last_name: '',
    current_password: '', new_password: '', confirm_password: ''
  });

  // Email verification state
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  // Показ/скрытие секции смены пароля
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [stats, setStats] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('access');
  const toast = useToast();

  useEffect(() => {
    if (!token) { navigate('/login'); }
    else { fetchProfile(); }
  }, []);

  useEffect(() => {
    if (user?.role === 'director') { fetchStats(); fetchEmployees(); }
    if (user) {
      axios.get(`${API_BASE}orders/`, { headers: getHeaders() })
        .then(res => setMyOrders(res.data.filter(o => o.status !== 'cart')))
        .catch(err => console.error("Ошибка загрузки истории", err));
      fetchFavorites();
    }
  }, [user]);

  const fetchProfile = () => {
    axios.get(`${API_BASE}me/`, { headers: getHeaders() })
      .then(res => {
        setUser(res.data);
        setProfileData({
          username: res.data.username || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      })
      .catch(() => { localStorage.clear(); navigate('/login'); });
  };

  const fetchFavorites = async () => {
    setFavLoading(true);
    try {
      const res = await axios.get(`${API_BASE}favorites/`, { headers: getHeaders() });
      setFavorites(res.data);
    } catch (err) {
      console.error("Ошибка избранного", err);
    } finally {
      setFavLoading(false);
    }
  };

  const removeFavorite = async (favId) => {
    try {
      await axios.delete(`${API_BASE}favorites/${favId}/`, { headers: getHeaders() });
      setFavorites(prev => prev.filter(f => f.id !== favId));
      toast.addToast("Убрано из избранного");
    } catch (err) {
      toast.addToast("Ошибка", "error");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      };
      if (profileData.new_password) {
        if (!profileData.current_password) {
          toast.addToast("Введите текущий пароль для смены пароля", "error");
          return;
        }
        if (profileData.new_password !== profileData.confirm_password) {
          toast.addToast("Новые пароли не совпадают", "error");
          return;
        }
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
      }
      const res = await axios.patch(`${API_BASE}me/`, updateData, { headers: getHeaders() });
      setUser(res.data);
      window.dispatchEvent(new Event('userUpdated'));
      toast.addToast("Профиль успешно обновлен! ✅");
      setIsEditingProfile(false);
      setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
      // Если пароль изменён — перелогиниться
      if (profileData.new_password) {
        toast.addToast("Пароль изменён. Войдите снова.");
        setTimeout(() => { localStorage.clear(); navigate('/login'); }, 1500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]?.[0]
        || "Ошибка обновления";
      toast.addToast(errMsg, "error");
    }
  };

  const handleSendVerification = async () => {
    setVerifyLoading(true);
    try {
      await axios.post(`${API_BASE}send-verification/`, {}, { headers: getHeaders() });
      setVerifySent(true);
      toast.addToast("Письмо отправлено! Проверьте почту.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Ошибка отправки письма";
      toast.addToast(msg, "error");
    } finally {
      setVerifyLoading(false);
    }
  };

  const fetchStats = (dFrom = dateFrom, dTo = dateTo) => {
    let url = `${API_BASE}director/stats/`;
    const params = new URLSearchParams();
    if (dFrom) params.append('date_from', dFrom);
    if (dTo) params.append('date_to', dTo);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    axios.get(url, { headers: getHeaders() })
      .then(res => setStats(res.data))
      .catch(err => console.error("Ошибка аналитики", err));
  };

  const fetchEmployees = () => {
    axios.get(`${API_BASE}users/`, { headers: getHeaders() })
      .then(res => setEmployees(res.data))
      .catch(() => {});
  };

  const handleHire = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}register/`, newEmployee, { headers: getHeaders() });
      toast.addToast(`Сотрудник ${newEmployee.username} нанят!`);
      setNewEmployee({ username: '', password: '', role: 'seller' });
      setShowHireForm(false);
      fetchEmployees();
    } catch (err) { toast.addToast("Ошибка при создании", "error"); }
  };

  const handleFire = async (id, username) => {
    if (window.confirm(`Уволить ${username}?`)) {
      try {
        await axios.delete(`${API_BASE}users/${id}/`, { headers: getHeaders() });
        fetchEmployees();
      } catch (err) { alert("Ошибка удаления"); }
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await axios.patch(`${API_BASE}users/${id}/`, { role: newRole }, { headers: getHeaders() });
      fetchEmployees();
    } catch (err) { alert("Ошибка роли"); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_BASE}orders/${orderId}/change-status/`, { status: newStatus }, { headers: getHeaders() });
      toast.addToast(`Статус заказа #${orderId} изменен на ${newStatus}`);
      axios.get(`${API_BASE}orders/`, { headers: getHeaders() })
        .then(res => setMyOrders(res.data.filter(o => o.status !== 'cart')));
    } catch (err) { toast.addToast("Ошибка при обновлении статуса", "error"); }
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono uppercase tracking-[0.2em] animate-pulse">
      Проверка протокола доступа...
    </div>
  );

  const isStaff = ['director', 'manager', 'seller'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-6xl mx-auto">

        {/* ── БАННЕР ПОДТВЕРЖДЕНИЯ EMAIL ── */}
        {user.email && !user.email_verified && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 text-xl flex-shrink-0">⚠</span>
              <div>
                <p className="text-amber-300 font-bold text-sm">Email не подтверждён</p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                  Подтвердите <span className="text-amber-300 font-mono">{user.email}</span>, чтобы получать уведомления о заказах
                </p>
              </div>
            </div>
            <button
              onClick={handleSendVerification}
              disabled={verifyLoading || verifySent}
              className="flex-shrink-0 px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/40 text-slate-950 font-black text-xs uppercase rounded-xl transition-all active:scale-95"
            >
              {verifyLoading ? 'Отправка...' : verifySent ? '✓ Письмо отправлено' : 'Отправить письмо'}
            </button>
          </div>
        )}

        {/* Баннер: email вообще не указан */}
        {!user.email && (
          <div className="mb-6 flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
            <span className="text-slate-400 text-xl">📧</span>
            <p className="text-slate-400 text-sm">
              Укажите email в профиле, чтобы получать чеки и уведомления о заказах
            </p>
          </div>
        )}

        {/* ШАПКА */}
        <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase mb-1 sm:mb-2">Личный кабинет</h1>
            <p className="text-sky-400 font-medium font-mono text-xs sm:text-lg uppercase tracking-widest">
              {user.username} <span className="text-slate-600 ml-2 text-xs sm:text-base">[{user.role}]</span>
              {user.email_verified && <span className="ml-3 text-emerald-400 text-xs font-normal">✓ email подтверждён</span>}
            </p>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-slate-500 hover:text-rose-500 text-xs font-black transition-colors uppercase tracking-[0.2em]"
          >
            Завершить сеанс →
          </button>
        </header>

        {/* ВКЛАДКИ */}
        {!isStaff && (
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-8 w-fit">
            {[
              { key: 'profile', label: '👤 Профиль' },
              { key: 'orders', label: `📦 Заказы${myOrders.length ? ` (${myOrders.length})` : ''}` },
              { key: 'favorites', label: `♥ Избранное${favorites.length ? ` (${favorites.length})` : ''}` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === tab.key ? 'bg-sky-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ВКЛАДКА: ПРОФИЛЬ ── */}
        {(activeTab === 'profile' || isStaff) && (
          <section className="mb-12 sm:mb-16">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-900/50 gap-3">
                <h2 className="text-lg sm:text-2xl font-bold uppercase italic tracking-tight">Мой Профиль</h2>
                <button
                  onClick={() => { setIsEditingProfile(!isEditingProfile); setShowPasswordSection(false); }}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all shadow-lg text-xs uppercase ${isEditingProfile ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-sky-500 hover:bg-sky-400 text-slate-950'}`}
                >
                  {isEditingProfile ? 'Отмена' : '✎ Редактировать'}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  {/* Логин */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Логин</label>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="Новый логин"
                      className="w-full bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                      value={profileData.username}
                      onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input
                      type="text"
                      placeholder="Имя"
                      autoComplete="given-name"
                      className="bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                      value={profileData.first_name}
                      onChange={e => setProfileData({ ...profileData, first_name: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Фамилия"
                      autoComplete="family-name"
                      className="bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                      value={profileData.last_name}
                      onChange={e => setProfileData({ ...profileData, last_name: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      className="bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                      value={profileData.email}
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                    />
                    <input
                      type="tel"
                      placeholder="Номер телефона"
                      autoComplete="tel"
                      className="bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                      value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <textarea
                    placeholder="Адрес доставки"
                    rows="3"
                    autoComplete="street-address"
                    className="w-full bg-slate-950 border border-slate-700 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 transition-colors text-sm"
                    value={profileData.address}
                    onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                  />

                  {/* Смена пароля */}
                  <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(s => !s);
                        // Сбрасываем поля при закрытии
                        if (showPasswordSection) {
                          setProfileData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
                        }
                      }}
                      className="w-full flex justify-between items-center p-4 sm:p-5 hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-bold text-sky-500 uppercase tracking-wider">
                        🔐 Сменить пароль
                      </span>
                      <span className="text-slate-500 text-xs font-bold">
                        {showPasswordSection ? '▲ Свернуть' : '▼ Развернуть'}
                      </span>
                    </button>

                    {showPasswordSection && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
                        {/* Honeypot — чтобы браузер не вставлял автозаполнение */}
                        <input type="password" style={{ display: 'none' }} autoComplete="current-password" readOnly tabIndex={-1} />

                        <PasswordInput
                          placeholder="Текущий пароль"
                          value={profileData.current_password}
                          onChange={e => setProfileData({ ...profileData, current_password: e.target.value })}
                        />
                        <PasswordInput
                          placeholder="Новый пароль"
                          value={profileData.new_password}
                          onChange={e => setProfileData({ ...profileData, new_password: e.target.value })}
                        />
                        <div>
                          <PasswordInput
                            placeholder="Подтвердите новый пароль"
                            value={profileData.confirm_password}
                            onChange={e => setProfileData({ ...profileData, confirm_password: e.target.value })}
                            error={profileData.confirm_password !== '' && profileData.new_password !== profileData.confirm_password}
                          />
                          {profileData.confirm_password !== '' && (
                            <p className={`text-xs mt-1.5 ml-1 font-semibold ${profileData.new_password === profileData.confirm_password ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {profileData.new_password === profileData.confirm_password ? '✓ Пароли совпадают' : '✕ Пароли не совпадают'}
                            </p>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs ml-1">
                          Заполните все три поля чтобы сменить пароль. После смены потребуется войти снова.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 sm:py-4 rounded-2xl uppercase shadow-lg shadow-sky-500/20 transition-all active:scale-95 text-sm">Сохранить изменения</button>
                    <button type="button" onClick={() => { setIsEditingProfile(false); setShowPasswordSection(false); }} className="flex-1 border border-slate-700 hover:bg-slate-800 font-bold py-4 rounded-2xl uppercase transition-colors text-sm">Отмена</button>
                  </div>
                </form>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: 'Логин', value: user.username },
                      { label: 'Email', value: user.email ? (
                        <span className="flex items-center gap-2">
                          {user.email}
                          {user.email_verified
                            ? <span className="text-emerald-400 text-xs font-bold px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full">✓ подтверждён</span>
                            : <span className="text-amber-400 text-xs font-bold px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-full">не подтверждён</span>
                          }
                        </span>
                      ) : '—' },
                      { label: 'Имя', value: user.first_name || '—' },
                      { label: 'Фамилия', value: user.last_name || '—' },
                      { label: 'Телефон', value: user.phone || '—' },
                      { label: 'Роль', value: user.role },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">{label}</p>
                        <p className="text-white font-bold text-sm">{value}</p>
                      </div>
                    ))}
                    {user.address && (
                      <div className="md:col-span-2">
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Адрес доставки</p>
                        <p className="text-white font-bold text-sm">{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── ВКЛАДКА: ИЗБРАННОЕ ── */}
        {activeTab === 'favorites' && !isStaff && (
          <section className="mb-12">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4 mb-8">
              <span className="w-12 h-1 bg-sky-500"></span> Избранное
            </h2>
            {favLoading ? (
              <p className="text-slate-500 italic">Загрузка...</p>
            ) : favorites.length === 0 ? (
              <div className="bg-slate-900/50 p-20 rounded-[3rem] border border-slate-800 border-dashed text-center">
                <p className="text-slate-500 italic">Избранное пусто</p>
                <Link to="/" className="text-sky-500 font-bold mt-4 inline-block hover:underline">Перейти в магазин →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map(fav => {
                  const p = fav.product;
                  return (
                    <div key={fav.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group hover:border-sky-500/50 transition-all shadow-xl">
                      <Link to={`/product/${p.id}`} className="block relative aspect-square bg-slate-800 overflow-hidden">
                        {p.images?.[0]?.image
                          ? <img src={p.images[0].image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                          : <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl">📸</div>
                        }
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-950/80 text-sky-400 font-mono">
                            {Number(p.price).toLocaleString()}₸
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${p.is_in_stock ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {p.is_in_stock ? 'В наличии' : 'Нет'}
                          </span>
                        </div>
                      </Link>
                      <div className="p-5">
                        <Link to={`/product/${p.id}`}>
                          <h3 className="font-black text-sm mb-1 group-hover:text-sky-400 transition-colors line-clamp-2">{p.name}</h3>
                        </Link>
                        <p className="text-slate-600 text-xs mb-4 line-clamp-2">{p.description || '—'}</p>
                        <div className="flex gap-2">
                          <Link to={`/product/${p.id}`} className="flex-1 text-center bg-white text-slate-950 hover:bg-sky-500 font-black py-2 rounded-xl uppercase text-xs transition-all">
                            Смотреть
                          </Link>
                          <button
                            onClick={() => removeFavorite(fav.id)}
                            className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center text-sm"
                            title="Убрать из избранного"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── ВКЛАДКА: ЗАКАЗЫ ── */}
        {(activeTab === 'orders' || isStaff) && (
          <>
            {/* ПАНЕЛЬ ДИРЕКТОРА */}
            {user.role === 'director' && (
              <section className="mb-16">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                  <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] flex items-center gap-4">
                    <span className="w-12 h-px bg-sky-500/30"></span> Финансовый мониторинг
                  </h2>
                  <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl">
                    <input type="date" className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 outline-none focus:border-sky-500 transition-colors" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <span className="text-slate-600 font-bold">—</span>
                    <input type="date" className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-sky-400 outline-none focus:border-sky-500 transition-colors" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    <button onClick={() => fetchStats()} className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-sky-500/20 active:scale-95">Применить</button>
                    {(dateFrom || dateTo) && (
                      <button onClick={() => { setDateFrom(''); setDateTo(''); fetchStats('', ''); }} className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase px-2 transition-colors">Сброс</button>
                    )}
                  </div>
                </div>
                {stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 text-6xl opacity-5 italic font-black">CASH</div>
                      <p className="text-slate-500 text-[10px] uppercase font-black mb-2">Общая выручка</p>
                      <p className="text-5xl font-black italic text-white">{(stats.total_sales || 0).toLocaleString()} <span className="text-sky-500 text-2xl font-normal not-italic">₸</span></p>
                    </div>
                    <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 text-6xl opacity-5 italic font-black">ORDERS</div>
                      <p className="text-slate-500 text-[10px] uppercase font-black mb-2">Заказов за период</p>
                      <p className="text-5xl font-black italic text-white">{stats.orders_count || 0}</p>
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
                              <th className="pb-6">Дата</th><th className="pb-6 text-center">Сделок</th><th className="pb-6">Товары</th><th className="pb-6 text-right">Выручка</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {(stats.daily_sales || []).map((day, i) => (
                              <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                <td className="py-6 font-mono text-sky-500 text-sm">{day.date}</td>
                                <td className="py-6 text-center font-bold text-slate-400">{day.count}</td>
                                <td className="py-6"><div className="flex flex-wrap gap-2">{day.items?.map((name, idx) => <span key={idx} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase border border-slate-700">{name}</span>)}</div></td>
                                <td className="py-6 text-right font-black italic text-xl">{day.total.toLocaleString()} <span className="text-xs not-italic text-sky-500">₸</span></td>
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

            {/* ПАНЕЛЬ HR */}
            {user.role === 'director' && (
              <section className="mb-16">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-2xl font-bold uppercase italic tracking-tight">Управление персоналом</h2>
                    <button onClick={() => setShowHireForm(!showHireForm)} className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20">
                      {showHireForm ? 'Закрыть' : '+ Нанять сотрудника'}
                    </button>
                  </div>
                  {showHireForm && (
                    <div className="p-8 bg-slate-800/20 border-b border-slate-800">
                      <form onSubmit={handleHire} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Логин" required className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none" onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })} />
                        <input type="password" placeholder="Пароль" required autoComplete="new-password" className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none" onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })} />
                        <select className="bg-slate-950 border border-slate-700 p-3 rounded-xl outline-none text-sm" onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}>
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
                          <th className="p-6">ID</th><th className="p-6">Сотрудник</th><th className="p-6">Должность</th><th className="p-6 text-right">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {employees.map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="p-6 text-slate-500 text-sm font-mono">{emp.id}</td>
                            <td className="p-6 font-bold">{emp.username} {emp.id === user.id && <span className="text-sky-500 ml-2">●</span>}</td>
                            <td className="p-6">
                              <select className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-[10px] outline-none" value={emp.role} disabled={emp.id === user.id} onChange={e => handleChangeRole(emp.id, e.target.value)}>
                                <option value="user">Клиент</option><option value="seller">Продавец</option><option value="manager">Руководитель</option><option value="director">Директор</option>
                              </select>
                            </td>
                            <td className="p-6 text-right">
                              {emp.id !== user.id && <button onClick={() => handleFire(emp.id, emp.username)} className="text-rose-500 hover:text-rose-400 font-bold text-[10px] uppercase">Уволить</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ПАНЕЛЬ БИЗНЕСА */}
            {isStaff && (
              <section className="mb-16">
                <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                  <span className="w-12 h-px bg-slate-800"></span> Операционное управление
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-8xl italic font-black">BOX</span></div>
                    <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Складской учет</h3>
                    <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">{user.role === 'seller' ? 'Мониторинг остатков и изменение цен.' : 'Управление товарами и инвентаризация.'}</p>
                    <Link to="/warehouse" className="bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs">Открыть Склад →</Link>
                  </div>
                  <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-sky-500/50 transition-all group relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-8xl italic font-black">CRM</span></div>
                    <h3 className="text-2xl font-bold mb-3 uppercase italic tracking-tighter">Менеджер Заказов</h3>
                    <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">Контроль входящих заказов, статусов доставки и проверка данных.</p>
                    <Link to="/orders-manager" className="bg-white/5 group-hover:bg-sky-500 group-hover:text-black px-10 py-4 rounded-2xl font-black transition-all uppercase text-xs">Все продажи →</Link>
                  </div>
                </div>
              </section>
            )}

            {/* ИСТОРИЯ ЗАКАЗОВ */}
            <section className="space-y-8">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <span className="w-12 h-1 bg-sky-500"></span> Личная история заказов
              </h2>
              <div className="grid gap-6">
                {myOrders.map(order => (
                  <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                    <div className="p-6 bg-slate-800/30 flex justify-between items-center border-b border-slate-800 gap-4 flex-wrap">
                      <div>
                        <span className="text-sky-500 font-mono font-bold uppercase tracking-tighter">ЗАКАЗ #{order.id}</span>
                        <p className="text-slate-500 text-[10px] mt-1 uppercase">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      {isStaff ? (
                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black uppercase text-slate-300 outline-none focus:border-sky-500 transition-colors">
                          <option value="placed">Оформлен</option><option value="shipped">Отправлен</option><option value="delivered">Доставлен</option><option value="cancelled">Отменен</option>
                        </select>
                      ) : (
                        <span className="px-4 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-400 border border-slate-700">
                          {order.status === 'placed' ? 'Оформлен' : order.status === 'shipped' ? 'Отправлен' : order.status === 'delivered' ? 'Доставлен' : 'Отменен'}
                        </span>
                      )}
                      <Link to={`/order/${order.id}`} className="text-sky-500 hover:text-sky-400 text-xs font-bold transition-colors">Отследить →</Link>
                    </div>
                    <div className="p-6 space-y-4">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex-shrink-0">
                              {item.product_image ? <img src={item.product_image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-700">📸</div>}
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
          </>
        )}

      </div>
    </div>
  );
}
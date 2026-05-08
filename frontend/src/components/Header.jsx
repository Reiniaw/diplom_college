import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getHeaders } from '../utils/helpers';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access');

  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/me/', {
        headers: getHeaders()
      })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
    }
  }, [token]);

  const isStaff = user && ['director', 'manager', 'seller'].includes(user.role);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="group">
          <span className="text-2xl font-black italic tracking-tighter uppercase group-hover:text-sky-500 transition-colors">
            PRO <span className="text-sky-500 group-hover:text-white transition-colors">LENS</span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <div className="hidden md:flex items-center gap-10">
          <Link to="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Каталог</Link>
          
          {isStaff && (
            <div className="flex items-center gap-6 border-x border-white/10 px-6">
              <Link to="/warehouse" className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 hover:text-sky-400">Склад</Link>
              <Link to="/orders-manager" className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 hover:text-sky-400">Заказы</Link>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-6">
          {token ? (
            <>
              <Link to="/cart" className="relative flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-sky-500 transition-colors border border-slate-800 hover:border-sky-500 rounded-lg group">
                <span className="text-xs font-black uppercase tracking-widest group-hover:text-sky-500">Корзина</span>
                <div className="w-5 h-5 rounded-full bg-sky-500/20 group-hover:bg-sky-500/40 flex items-center justify-center">
                  <span className="text-[10px] font-black text-sky-500">📦</span>
                </div>
              </Link>
              <Link to="/profile" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all">
                <span className="text-xs font-bold uppercase tracking-tighter">{user?.username}</span>
                <div className="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center text-[10px] text-slate-950 font-black">
                  {user?.role?.[0]?.toUpperCase() ?? '?'}
                </div>
              </Link>
            </>
          ) : (
            <Link to="/login" className="bg-sky-500 text-slate-950 px-6 py-2 rounded-xl font-black uppercase text-xs hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20">
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
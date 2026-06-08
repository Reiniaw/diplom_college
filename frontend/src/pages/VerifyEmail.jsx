import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/config';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден в ссылке');
      return;
    }

    axios.get(`${API_BASE}verify-email/?token=${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.detail || 'Email успешно подтверждён!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Неверный или устаревший токен');
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-6">
      <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl text-center relative">

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-white">Проверяем токен...</h2>
            <p className="text-slate-400 text-sm mt-2">Подождите секунду</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Готово!</h2>
            <p className="text-emerald-400 font-medium mb-8">{message}</p>
            <Link
              to="/profile"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 px-8 rounded-2xl uppercase text-sm transition-all active:scale-95 shadow-lg shadow-sky-500/20"
            >
              Вернуться в профиль →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ✕
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Ошибка</h2>
            <p className="text-rose-400 font-medium mb-8">{message}</p>
            <Link
              to="/profile"
              className="inline-block border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-2xl uppercase text-sm transition-all"
            >
              В профиль
            </Link>
          </>
        )}

      </div>
    </div>
  );
}

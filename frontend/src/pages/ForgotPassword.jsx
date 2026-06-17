import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}password-reset/`, { email });
      setSent(true);
    } catch (err) {
      // Не раскрываем, существует ли email — показываем то же сообщение
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative">

        {!sent ? (
          <>
            {/* Заголовок */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                🔑
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Забыли пароль?</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Введите email — пришлём ссылку для сброса
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600 text-sm sm:text-base"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold py-3 sm:py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 text-sm sm:text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin"></span>
                    Отправляем...
                  </span>
                ) : (
                  'ОТПРАВИТЬ ССЫЛКУ'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <Link
                to="/login"
                className="text-slate-400 text-xs sm:text-sm hover:text-sky-400 transition-colors"
              >
                ← Вернуться ко входу
              </Link>
            </div>
          </>
        ) : (
          /* Состояние «письмо отправлено» */
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Проверьте почту</h2>
              <p className="text-slate-400 text-sm mb-2">
                Если аккаунт с адресом
              </p>
              <p className="text-sky-400 font-semibold text-sm mb-4 break-all">{email}</p>
              <p className="text-slate-400 text-sm mb-8">
                существует — письмо со ссылкой уже в пути. Ссылка действует <span className="text-white font-semibold">15 минут</span>.
              </p>
              <Link
                to="/login"
                className="inline-block border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-2xl uppercase text-sm transition-all"
              >
                Ко входу
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

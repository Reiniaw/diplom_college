import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

function PasswordInput({ placeholder, value, onChange, error = false, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required
        className={`w-full bg-slate-800/50 border text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:ring-1 transition-all placeholder:text-slate-600 text-sm sm:text-base pr-24 ${
          error
            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500'
            : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
      >
        {show ? 'Скрыть' : 'Показать'}
      </button>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMatch = passwords.confirm === '' || passwords.new === passwords.confirm;
  const canSubmit = passwords.new.length >= 8 && passwords.new === passwords.confirm;

  // Если токена нет — сразу ошибка
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-6">
        <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none"></div>
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl text-center relative">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✕</div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Ошибка</h2>
          <p className="text-rose-400 font-medium mb-8">Токен не найден в ссылке</p>
          <Link to="/forgot-password" className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 px-8 rounded-2xl uppercase text-sm transition-all active:scale-95 shadow-lg shadow-sky-500/20">
            Запросить снова
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}password-reset/confirm/`, {
        token,
        new_password: passwords.new,
      });
      setDone(true);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.new_password?.[0];
      toast.addToast(detail || 'Ссылка устарела или недействительна', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative">

        {!done ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                🔒
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Новый пароль</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Придумайте надёжный пароль от 8 символов</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Новый пароль */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Новый пароль
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                />
                {passwords.new.length > 0 && passwords.new.length < 8 && (
                  <p className="text-xs mt-1.5 ml-1 font-semibold text-rose-400">
                    Минимум 8 символов
                  </p>
                )}
              </div>

              {/* Подтверждение */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Подтвердите пароль
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  error={!passwordsMatch}
                />
                {passwords.confirm !== '' && (
                  <p className={`text-xs mt-1.5 ml-1 font-semibold ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? '✓ Пароли совпадают' : '✕ Пароли не совпадают'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold py-3 sm:py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 mt-3 sm:mt-4 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin"></span>
                    Сохраняем...
                  </span>
                ) : (
                  'СОХРАНИТЬ ПАРОЛЬ'
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Готово!</h2>
            <p className="text-emerald-400 font-medium mb-8">Пароль успешно изменён</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 px-8 rounded-2xl uppercase text-sm transition-all active:scale-95 shadow-lg shadow-sky-500/20"
            >
              Войти →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

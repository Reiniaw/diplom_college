import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

// Достаёт человекочитаемые сообщения из ответа DRF.
// Валидационные ошибки приходят как { field: ["текст", ...], ... } —
// возвращаем массив, чтобы Toast показал каждое отдельной строкой.
function getErrorMessages(err) {
  const data = err.response?.data;
  if (!data) {
    return ['Не удалось связаться с сервером. Проверьте подключение.'];
  }
  if (typeof data === 'string') {
    return [data];
  }
  if (typeof data.detail === 'string') {
    if (data.detail.includes('No active account')) {
      return ['Неверный логин или пароль'];
    }
    return [data.detail];
  }
  const messages = Object.values(data)
    .flat()
    .filter((m) => typeof m === 'string');
  return messages.length ? messages : ['Ошибка: проверьте данные'];
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.addToast("Пароли не совпадают", "error");
      return;
    }

    const endpoint = isLogin ? 'token/' : 'register/';
    try {
      const { confirmPassword, ...sendData } = formData;
      // При логине email не нужен
      const payload = isLogin
        ? { username: sendData.username, password: sendData.password }
        : sendData;

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      if (isLogin) {
        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);
        window.dispatchEvent(new Event('userUpdated'));
        navigate('/profile');
      } else {
        toast.addToast("Регистрация прошла успешно! Теперь войдите.");
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.addToast(getErrorMessages(err), "error");
    }
  };

  const handleSwitch = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirm(false);
  };

  const passwordsMatch = formData.confirmPassword === '' || formData.password === formData.confirmPassword;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative">

        {/* Заголовок */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {isLogin ? 'С возвращением' : 'Создать аккаунт'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            {isLogin ? 'Войдите в систему AVStore' : 'Присоединяйтесь к сообществу профессионалов'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Логин */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Логин
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              className="w-full bg-slate-800/50 border border-slate-700 text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600 text-sm sm:text-base"
              placeholder="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {/* Email — только при регистрации */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full bg-slate-800/50 border border-slate-700 text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600 text-sm sm:text-base"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <p className="text-slate-600 text-[10px] mt-1.5 ml-1">
                Нужен для сброса пароля — подтвердите после регистрации
              </p>
            </div>
          )}

          {/* Пароль */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full bg-slate-800/50 border border-slate-700 text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600 text-sm sm:text-base pr-24"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {/* Ссылка «Забыл пароль» — только при входе */}
            {isLogin && (
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-slate-500 hover:text-sky-400 transition-colors font-semibold uppercase tracking-wider"
                >
                  Забыли пароль?
                </Link>
              </div>
            )}
          </div>

          {/* Подтверждение пароля — только при регистрации */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className={`w-full bg-slate-800/50 border text-white p-3 sm:p-3.5 rounded-2xl outline-none focus:ring-1 transition-all placeholder:text-slate-600 text-sm sm:text-base pr-24 ${
                    passwordsMatch
                      ? 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                      : 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500'
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
                >
                  {showConfirm ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              {formData.confirmPassword !== '' && (
                <p className={`text-xs mt-1.5 ml-1 font-semibold ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordsMatch ? '✓ Пароли совпадают' : '✕ Пароли не совпадают'}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!isLogin && !passwordsMatch && formData.confirmPassword !== ''}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold py-3 sm:py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 mt-3 sm:mt-4 text-sm sm:text-base"
          >
            {isLogin ? 'ВОЙТИ В СИСТЕМУ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </button>
        </form>

        {/* Переключатель */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800 text-center">
          <button
            onClick={handleSwitch}
            className="text-slate-400 text-xs sm:text-sm hover:text-sky-400 transition-colors"
          >
            {isLogin ? (
              <span>Нет аккаунта? <b className="text-white ml-1">Создать сейчас</b></span>
            ) : (
              <span>Уже есть аккаунт? <b className="text-white ml-1">Войти</b></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
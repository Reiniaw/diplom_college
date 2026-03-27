import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'token/' : 'register/';
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/${endpoint}`, formData);
      if (isLogin) {
        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);
        window.location.href = '/profile'; // Перезагружаем для обновления хэдера
      } else {
        toast.addToast("Регистрация прошла успешно! Теперь войдите.");
        setIsLogin(true);
      }
    } catch (err) {
      toast.addToast("Ошибка: проверьте данные", "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex items-center justify-center p-4">
      {/* Декоративный фоновый элемент */}
      <div className="absolute w-64 h-64 bg-sky-500/10 blur-[120px] rounded-full top-1/4 left-1/4"></div>
      
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
        
        {/* Заголовок */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'С возвращением' : 'Создать аккаунт'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Войдите в систему AVStore' : 'Присоединяйтесь к сообществу профессионалов'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Логин
            </label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-800/50 border border-slate-700 text-white p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
              placeholder="username"
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Пароль
            </label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-800/50 border border-slate-700 text-white p-3.5 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 mt-4">
            {isLogin ? 'ВОЙТИ В СИСТЕМУ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </button>
        </form>

        {/* Переключатель */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-sm hover:text-sky-400 transition-colors"
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
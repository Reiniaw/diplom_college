import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  // Проверяем, есть ли токен доступа в хранилище
  const isAuthenticated = !!localStorage.getItem('access'); 

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/'); // Перенаправляем на главную после выхода
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Логотип — теперь это ссылка на главную */}
        <Link to="/" className="text-xl font-semibold tracking-wide">
          AV<span className="text-sky-400">Store</span>
        </Link>

        {/* Навигация */}
        <nav className="hidden md:flex gap-8 text-md text-slate-300">
          <Link to="/" className="hover:text-white transition-colors">Каталог</Link>
          <Link to="/photo" className="hover:text-white transition-colors">Фото</Link>
          <Link to="/audio" className="hover:text-white transition-colors">Аудио</Link>
        </nav>

        {/* Правая часть: Корзина + Аккаунт */}
        <div className="flex items-center gap-6">
          {/* Корзина (видна всем) */}
          <Link to="/cart" className="text-slate-300 hover:text-white text-xl relative">
            🛒
            {/* Тут позже можно добавить кружочек с количеством товаров */}
          </Link>

          <div className="h-6 w-[1px] bg-slate-700"></div> {/* Разделитель */}

          {/* Логика входа/профиля */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/profile" 
                className="text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors"
              >
                Мой профиль
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            >
              Вход / Регистрация
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
export default function Header() {
  return (
    <header className="border-b border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Логотип */}
        <div className="text-xl font-semibold tracking-wide">
          AV<span className="text-sky-400">Store</span>
        </div>

        {/* Навигация */}
        <nav className="flex gap-6 text-md text-slate-300">
          <a href="#" className="hover:text-white">Фото</a>
          <a href="#" className="hover:text-white">Аудио</a>
        </nav>

        {/* Корзина */}
        <button className="text-slate-300 hover:text-white">
          🛒
        </button>
      </div>
    </header>
  );
}

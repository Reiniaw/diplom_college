import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <p className="text-sky-500 font-mono text-xs sm:text-sm uppercase tracking-[0.3em] mb-4">Ошибка 404</p>
      <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black italic uppercase tracking-tighter mb-4 text-center">
        НЕТ <span className="text-sky-500 block sm:inline">КАДРА</span>
      </h1>
      <p className="text-slate-500 mb-8 sm:mb-10 text-center text-sm sm:text-base">Страница не найдена или была удалена</p>
      <Link
        to="/"
        className="w-full sm:w-auto bg-sky-500 text-slate-950 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-black uppercase hover:bg-sky-400 transition-all text-sm sm:text-base"
      >
        Вернуться в каталог
      </Link>
    </div>
  );
}
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
      <p className="text-sky-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">Ошибка 404</p>
      <h1 className="text-9xl font-black italic uppercase tracking-tighter mb-4">
        НЕТ <span className="text-sky-500">КАДРА</span>
      </h1>
      <p className="text-slate-500 mb-10">Страница не найдена или была удалена</p>
      <Link
        to="/"
        className="bg-sky-500 text-slate-950 px-10 py-4 rounded-2xl font-black uppercase hover:bg-sky-400 transition-all"
      >
        Вернуться в каталог
      </Link>
    </div>
  );
}
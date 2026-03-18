import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-20 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6">
              PRO <span className="text-sky-500">LENS</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Специализированная платформа для учета и продажи профессиональной фототехники. 
              Разработано в рамках дипломного проекта, 2026.
            </p>
          </div>

          {/* Links Col */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Навигация</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/" className="hover:text-sky-500 transition-colors">Магазин</Link></li>
              <li><Link to="/profile" className="hover:text-sky-500 transition-colors">Кабинет</Link></li>
              <li><Link to="/cart" className="hover:text-sky-500 transition-colors">Корзина</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Разработка</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li className="text-slate-500">GitHub: <span className="text-white">Reiniaw</span></li>
              <li className="text-slate-500">Локация: <span className="text-white">Astana, KZ</span></li>
              <li className="text-slate-500">Статус: <span className="text-sky-500">Production Ready</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            © 2026 REINIAW · DIPLOMA PROJECT · ALL RIGHTS RESERVED
          </p>
          <div className="flex gap-6">
             <span className="text-[10px] font-black text-slate-800 uppercase italic">React + Django + PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  profile: UserProfile;
  lang: Language;
  onNavigate: (view: 'HOME' | 'ADMIN' | 'PRICING' | 'LIBRARY') => void;
  onLogout: () => void;
}

export const UserMenu: React.FC<Props> = ({ profile, lang, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pe-4 bg-white border border-slate-200 rounded-full hover:border-blue-400 hover:shadow-lg transition-all group"
      >
        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors">
          {profile.email[0].toUpperCase()}
        </div>
        <div className="text-start hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{profile.plan}</p>
          <p className="text-xs font-bold text-slate-700 max-w-[120px] truncate">{profile.email}</p>
        </div>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-3 w-64 bg-white rounded-[2rem] border border-slate-100 shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-top-2 ${isRtl ? 'left-0' : 'right-0'}`}>
          <div className="p-4 bg-slate-50 border-b border-slate-100 rounded-t-[1.5rem] mb-2">
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg uppercase">{profile.plan} PLAN</span>
            <p className="text-xs font-bold text-slate-500 mt-2 truncate">{profile.email}</p>
          </div>

          <button onClick={() => { onNavigate('LIBRARY'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-colors group">
             <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
             </div>
             {isRtl ? 'مكتبتي المحفوظة' : 'My Library'}
          </button>

          <button onClick={() => { onNavigate('PRICING'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-colors group">
             <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
             {isRtl ? 'إدارة الاشتراك' : 'Manage Plan'}
          </button>

          {profile.isAdmin && (
            <button onClick={() => { onNavigate('ADMIN'); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-white rounded-2xl transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.544.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
              </div>
              {isRtl ? 'لوحة المشرف' : 'Admin Dashboard'}
            </button>
          )}

          <div className="my-2 border-t border-slate-50"></div>

          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
};

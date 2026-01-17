
import React, { useState } from 'react';
import { auth } from '../services/firebase';
// Fix: Use standard modular imports from firebase/auth
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  lang: Language;
}

export const Auth: React.FC<Props> = ({ lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const formatError = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return t.emailInUse;
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return t.wrongPassword;
      default:
        return code.replace('auth/', '').replace(/-/g, ' ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err.code);
      setError(formatError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(isRtl ? "يرجى إدخال البريد الإلكتروني أولاً" : "Please enter your email first");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(t.resetSent);
      setError(null);
    } catch (err: any) {
      setError(formatError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in zoom-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200 transition-transform hover:rotate-3">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900">{isLogin ? t.login : t.signup}</h2>
        <p className="text-slate-500 mt-2 text-sm font-medium">{t.welcome}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">{t.email}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all ${isRtl ? 'text-right' : 'text-left'} font-bold`}
            placeholder="example@mail.com"
          />
        </div>
        
        {isLogin && (
          <div className="flex justify-between items-center mb-1 px-1">
             <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t.password}</label>
             <button 
               type="button" 
               onClick={handleResetPassword}
               className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
             >
               {t.forgotPassword}
             </button>
          </div>
        )}
        
        {!isLogin && (
           <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">{t.password}</label>
        )}

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all ${isRtl ? 'text-right' : 'text-left'} font-bold`}
          placeholder="••••••••"
        />

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-black animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-black animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {success}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-200 disabled:opacity-50 mt-4"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          ) : (
            isLogin ? t.login : t.signup
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-slate-100 pt-6">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setSuccess(null);
          }}
          className="text-sm font-black text-slate-500 hover:text-blue-600 transition-colors"
        >
          {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
        </button>
      </div>
    </div>
  );
};

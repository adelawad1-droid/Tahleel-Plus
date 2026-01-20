
import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { Language } from '../types';
import { TRANSLATIONS, REGIONS } from '../constants';
import { createUserProfile } from '../services/userService';
import { detectUserLocation } from '../services/geoLocationService';

interface Props {
  lang: Language;
}

export const Auth: React.FC<Props> = ({ lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('SA');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Auto-detect location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const detectedRegion = await detectUserLocation();
        if (detectedRegion) {
          setSelectedRegion(detectedRegion);
        }
      } catch (error) {
        console.warn('Location detection failed, using default region');
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

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
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile with default region
        await createUserProfile(userCred.user.uid, email, 'SA');
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is new and create profile if needed
      if (result.user.metadata?.creationTime === result.user.metadata?.lastSignInTime) {
        await createUserProfile(result.user.uid, result.user.email || '', 'SA');
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err.code);
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
        </div>        {!isLogin && (
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">{t.password}</label>
          </div>
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

        <div className="relative mt-6 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-white text-slate-400 font-black">{isRtl ? 'أو' : 'OR'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-slate-700 py-4 rounded-xl font-black text-lg hover:bg-slate-50 active:scale-[0.98] transition-all shadow-lg border border-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isRtl ? 'تسجيل دخول عبر جوجل' : 'Sign in with Google'}
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

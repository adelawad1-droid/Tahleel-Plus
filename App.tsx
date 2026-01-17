
import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { AnalysisResult, Language, UserProfile, PlanConfig, AppConfig } from './types';
import { TRANSLATIONS } from './constants';
import { analyzeEcommerceQuery } from './services/geminiService';
import { syncUserProfile, incrementSearchCount, handleStripeReturn, getPlanConfigs, getAppConfig } from './services/userService';
import { LanguageToggle } from './components/LanguageToggle';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Auth } from './components/Auth';
import { Pricing } from './components/Pricing';
import { AdminPanel } from './components/AdminPanel';
import { UserMenu } from './components/UserMenu';
import { SavedLibrary } from './components/SavedLibrary';
import { Profile } from './components/Profile';

type ViewMode = 'HOME' | 'ADMIN' | 'PRICING' | 'LIBRARY' | 'AUTH' | 'PROFILE';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [view, setView] = useState<ViewMode>('HOME');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const [guestSearchCount, setGuestSearchCount] = useState<number>(() => {
    const saved = localStorage.getItem('guest_search_count');
    return saved ? parseInt(saved) : 0;
  });

  const [query, setQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('guest_search_count', guestSearchCount.toString());
  }, [guestSearchCount]);

  const refreshProfile = async (uid: string, email: string) => {
    try {
      const p = await syncUserProfile(uid, email);
      setProfile(p);
      return p;
    } catch (e) {
      console.error("Profile Refresh Error:", e);
      return null;
    }
  };

  const loadInitialData = async () => {
    const [plansData, configData] = await Promise.all([
      getPlanConfigs(),
      getAppConfig()
    ]);
    setPlans(plansData);
    setAppConfig(configData);
    
    if (configData) {
      const activeName = lang === 'ar' ? configData.siteNameAr : configData.siteNameEn;
      if (activeName) document.title = activeName;
      
      if (configData.siteFavicon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = configData.siteFavicon;
      }
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [lang, view]); // Reload config when switching views (to catch admin updates)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const wasSuccessful = await handleStripeReturn(currentUser.uid);
        if (wasSuccessful) {
           setPaymentSuccess(true);
           setTimeout(() => setPaymentSuccess(false), 8000);
        }
        await refreshProfile(currentUser.uid, currentUser.email!);
        setView('HOME');
        setError(null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
    setView('HOME');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setLastSearchedQuery(query);

    try {
      // Pass the API key from database if it exists
      const dbApiKey = appConfig?.geminiApiKey;
      const data = await analyzeEcommerceQuery(query, lang, dbApiKey);
      setResult(data);
      
      if (user) {
        await incrementSearchCount(user.uid);
        await refreshProfile(user.uid, user.email!);
      } else {
        setGuestSearchCount(prev => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التحليل.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold animate-pulse">جاري تأمين الاتصال...</p>
    </div>
  );

  const activeSiteName = (lang === 'ar' ? appConfig?.siteNameAr : appConfig?.siteNameEn) || t.title;

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 font-['Cairo']`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-all overflow-hidden">
              {appConfig?.siteLogo ? (
                <img src={appConfig.siteLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              )}
            </div>
            <div className="hidden sm:block text-right">
              <h1 className="text-xl font-black text-slate-900 leading-none">{activeSiteName}</h1>
              {profile?.isAdmin && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider border border-blue-100">{t.adminBadge}</span>}
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {user && profile ? (
              <UserMenu profile={profile} lang={lang} onNavigate={setView} onLogout={() => signOut(auth)} />
            ) : (
              <button onClick={() => setView('AUTH')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
                {t.login}
              </button>
            )}
            <LanguageToggle current={lang} onToggle={setLang} />
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {paymentSuccess && (
          <div className="max-w-4xl mx-auto mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 shadow-sm">
             {isRtl ? 'تم تفعيل باقتك بنجاح!' : 'Package Activated Successfully!'}
          </div>
        )}

        {view === 'ADMIN' && user && <AdminPanel lang={lang} />}
        {view === 'PRICING' && user && <Pricing lang={lang} onSelect={() => setView('HOME')} />}
        {view === 'LIBRARY' && user && <SavedLibrary lang={lang} />}
        {view === 'PROFILE' && user && profile && <Profile profile={profile} lang={lang} onRefresh={() => refreshProfile(user.uid, user.email!)} />}
        {view === 'AUTH' && !user && <div className="py-12"><Auth lang={lang} /></div>}
        
        {view === 'HOME' && (
          <>
            {!result && !loading && (
              <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black mb-6 border border-blue-100 shadow-sm">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span></span>
                  {t.liveBadge}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{activeSiteName}</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
              </div>
            )}

            <div className={`transition-all duration-700 ${result || loading ? 'mb-8' : 'mb-16'}`}>
              {error && (
                <div className="max-w-4xl mx-auto mb-8 p-6 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-700 shadow-sm animate-in zoom-in duration-300">
                  <p className="text-lg font-black text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSearch} className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 p-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl transition-all hover:border-blue-300 hover:shadow-blue-100">
                <div className="flex-1 relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-7' : 'left-0 pl-7'} flex items-center text-blue-600`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder={t.searchPlaceholder} 
                    className={`w-full py-6 ${isRtl ? 'pr-16 pl-6' : 'pl-16 pr-6'} bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-300 font-bold`} 
                  />
                </div>
                <button 
                  disabled={loading} 
                  className="bg-blue-600 text-white px-12 py-6 rounded-[1.8rem] font-black text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 min-w-[220px]"
                >
                  {loading ? '...' : t.searchBtn}
                </button>
              </form>
            </div>

            {loading && (
              <div className="text-center py-24 animate-in fade-in duration-500">
                <div className="w-28 h-28 border-8 border-blue-50 border-t-blue-600 rounded-full animate-spin mx-auto mb-10"></div>
                <p className="text-3xl font-black text-slate-900 mb-3">{t.analyzing}</p>
              </div>
            )}
            {result && <AnalysisDashboard data={result} lang={lang} queryStr={lastSearchedQuery} />}
          </>
        )}
      </main>

      <footer className="w-full py-6 bg-white border-t border-slate-100 text-center text-slate-400 text-xs font-bold">
        <div className="max-w-7xl mx-auto px-6">
          <p>{activeSiteName} — {isRtl ? 'كافة الحقوق محفوظة' : 'All rights reserved'} © 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

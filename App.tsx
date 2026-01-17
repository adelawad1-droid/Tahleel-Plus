
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

type ViewMode = 'HOME' | 'ADMIN' | 'PRICING' | 'LIBRARY' | 'AUTH';

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
    
    // SEO & Branding Sync
    if (configData) {
      const activeName = lang === 'ar' ? configData.siteNameAr : configData.siteNameEn;
      const activeDesc = lang === 'ar' ? configData.siteDescriptionAr : configData.siteDescriptionEn;
      const activeKeywords = lang === 'ar' ? configData.siteKeywordsAr : configData.siteKeywordsEn;
      
      if (activeName) document.title = activeName;
      
      // Update Meta Tags
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && activeDesc) metaDesc.setAttribute('content', activeDesc);
      
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords && activeKeywords) metaKeywords.setAttribute('content', activeKeywords);
      
      // Update Favicon
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
  }, [lang]);

  useEffect(() => {
    const initApp = async () => {
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
      return unsubscribe;
    };

    const initPromise = initApp();
    return () => {
      initPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
    setView('HOME');
  };

  const handleLogout = () => {
    signOut(auth);
    handleReset();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    if (!user) {
      if (guestSearchCount >= 3) {
        setError(isRtl ? 'لقد استنفدت المحاولات الـ 3 المجانية. يرجى إنشاء حساب لمتابعة التحليل.' : 'You have used all 3 free attempts. Please create an account to continue.');
        setView('AUTH');
        return;
      }
    } else if (profile && !profile.isAdmin) {
      const currentPlanConfig = plans.find(p => p.id === profile.plan);
      const limit = currentPlanConfig ? currentPlanConfig.searchLimit : (profile.plan === 'FREE' ? 3 : 0);
      
      if (profile.searchCount >= limit) {
        setError(isRtl 
          ? `عذراً، لقد استنفدت كافة محاولاتك لباقة ${profile.plan}. يرجى الترقية لمتابعة التحليلات.` 
          : `Sorry, you have used all your attempts for the ${profile.plan} plan. Please upgrade to continue.`);
        setView('PRICING');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setLastSearchedQuery(query);

    try {
      const data = await analyzeEcommerceQuery(query, lang);
      setResult(data);
      
      if (user) {
        await incrementSearchCount(user.uid);
        await refreshProfile(user.uid, user.email!);
      } else {
        setGuestSearchCount(prev => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التحليل، يرجى المحاولة لاحقاً.");
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
              <UserMenu profile={profile} lang={lang} onNavigate={setView} onLogout={handleLogout} />
            ) : (
              <button 
                onClick={() => setView('AUTH')}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
              >
                {t.login}
              </button>
            )}
            <LanguageToggle current={lang} onToggle={setLang} />
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {paymentSuccess && (
          <div className="max-w-4xl mx-auto mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-[2rem] text-emerald-800 shadow-xl animate-in zoom-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                   <h3 className="text-xl font-black mb-1">{isRtl ? 'تم تفعيل باقتك بنجاح!' : 'Package Activated Successfully!'}</h3>
                   <p className="text-sm font-bold opacity-80">{isRtl ? 'مبروك! تم ترقية حسابك وتفعيل كافة مميزات الباقة الجديدة. يمكنك البدء بالتحليل الآن.' : 'Congratulations! Your account has been upgraded. You can now access all features of your new plan.'}</p>
                </div>
                <button onClick={() => setPaymentSuccess(false)} className="ms-auto p-2 hover:bg-emerald-100 rounded-full">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
          </div>
        )}

        {view === 'ADMIN' && user && <AdminPanel lang={lang} />}
        {view === 'PRICING' && user && <Pricing lang={lang} onSelect={() => setView('HOME')} />}
        {view === 'LIBRARY' && user && <SavedLibrary lang={lang} />}
        {view === 'AUTH' && !user && (
          <div className="py-12">
             <Auth lang={lang} />
          </div>
        )}
        
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
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div className="text-center md:text-start flex-grow">
                      <p className="text-lg font-black leading-tight mb-2">{error}</p>
                      <button 
                        onClick={() => !user ? setView('AUTH') : setView('PRICING')} 
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all mt-2 shadow-lg shadow-blue-100"
                      >
                        {!user ? (isRtl ? 'سجل الآن مجاناً' : 'Register Now Free') : (isRtl ? 'عرض الباقات' : 'View Plans')}
                      </button>
                    </div>
                  </div>
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
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>...</span>
                    </div>
                  ) : t.searchBtn}
                </button>
              </form>
            </div>

            {loading && (
              <div className="text-center py-24 animate-in fade-in duration-500">
                <div className="relative inline-block mb-10">
                   <div className="w-28 h-28 border-8 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>
                   </div>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-3">{t.analyzing}</p>
              </div>
            )}
            {result && <AnalysisDashboard data={result} lang={lang} queryStr={lastSearchedQuery} />}
          </>
        )}
      </main>

      <footer className="w-full py-6 bg-white border-t border-slate-100 text-center text-slate-400 text-xs font-bold">
        <div className="max-w-7xl mx-auto px-6">
          <p>
            {activeSiteName} — {isRtl ? 'كافة الحقوق محفوظة' : 'All rights reserved'} © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

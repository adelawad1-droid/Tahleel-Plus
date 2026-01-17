
import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { AnalysisResult, Language, UserProfile, PlanConfig, AppConfig } from './types';
import { TRANSLATIONS, LOADING_MESSAGES } from './constants';
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

const GUEST_LIMIT = 3;

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
  const [loadingStep, setLoadingStep] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Dynamic loading messages logic
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < LOADING_MESSAGES[lang].length - 1 ? prev + 1 : prev));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading, lang]);

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
  }, [lang, view]);

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
        // If they were on AUTH page and logged in, take them HOME
        if(view === 'AUTH') setView('HOME');
        setError(null);
        setShowLimitModal(false);
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [view]);

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

    if (!user && guestSearchCount >= GUEST_LIMIT) {
      setShowLimitModal(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setLastSearchedQuery(query);

    try {
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
      
      {/* --- LIMIT REACHED MODAL --- */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-300 relative">
              <button 
                onClick={() => setShowLimitModal(false)}
                className="absolute top-8 end-8 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="p-12 text-center">
                 <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                 </div>
                 
                 <h3 className="text-3xl font-black text-slate-900 mb-4">
                   {isRtl ? 'انتهت تجاربك المجانية' : 'Free Trials Ended'}
                 </h3>
                 <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                   {isRtl 
                    ? 'لقد استهلكت جميع المحاولات المتاحة للزوار (3 عمليات بحث). اشترك الآن للحصول على تحليلات غير محدودة ودقيقة للسوق السعودي.' 
                    : 'You have used all guest trials (3 searches). Subscribe now for unlimited deep strategic analysis for the Saudi market.'}
                 </p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setView('AUTH')}
                      className="bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
                    >
                      {t.signup}
                    </button>
                    <button 
                      onClick={() => { setShowLimitModal(false); setView('PRICING'); }}
                      className="bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                      {isRtl ? 'مشاهدة الباقات' : 'View Plans'}
                    </button>
                 </div>
                 
                 <button 
                   onClick={() => setShowLimitModal(false)}
                   className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600"
                 >
                   {isRtl ? 'إغلاق والعودة' : 'Close and return'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={handleReset} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-all overflow-hidden text-white">
                {appConfig?.siteLogo ? (
                  <img src={appConfig.siteLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
              </div>
              <div className="hidden sm:block text-right">
                <h1 className="text-xl font-black text-slate-900 leading-none">{activeSiteName}</h1>
                {profile?.isAdmin && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider border border-blue-100">{t.adminBadge}</span>}
              </div>
            </button>

            {/* Public Pricing Link */}
            <button 
              onClick={() => setView('PRICING')} 
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'PRICING' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t.pricingTitle}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {!user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">
                  {isRtl ? `التجارب المتبقية: ${Math.max(0, GUEST_LIMIT - guestSearchCount)}` : `Trials Left: ${Math.max(0, GUEST_LIMIT - guestSearchCount)}`}
                </span>
              </div>
            )}
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
        {view === 'PRICING' && <Pricing lang={lang} onSelect={(planId) => {
          if (!user && planId !== 'FREE') {
            setView('AUTH');
          } else {
            setView('HOME');
          }
        }} />}
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
                <div className="max-w-4xl mx-auto mb-8 p-8 bg-rose-50 border border-rose-200 rounded-[2.5rem] text-rose-700 shadow-xl animate-in zoom-in duration-300">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-black mb-4">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSearch} className={`max-w-6xl mx-auto flex flex-col md:flex-row gap-4 p-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl transition-all ${!user && guestSearchCount >= GUEST_LIMIT ? 'opacity-50 grayscale select-none cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-blue-100'}`}>
                <div className="flex-1 relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-7' : 'left-0 pl-7'} flex items-center text-blue-600`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    disabled={!user && guestSearchCount >= GUEST_LIMIT}
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder={!user && guestSearchCount >= GUEST_LIMIT ? (isRtl ? 'انتهت تجاربك.. سجل دخولك للمتابعة' : 'Trials ended.. login to continue') : t.searchPlaceholder} 
                    className={`w-full py-6 ${isRtl ? 'pr-16 pl-6' : 'pl-16 pr-6'} bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-300 font-bold disabled:cursor-not-allowed`} 
                  />
                </div>
                <button 
                  type="submit"
                  className={`px-12 py-6 rounded-[1.8rem] font-black text-lg transition-all shadow-xl min-w-[220px] flex items-center justify-center gap-3
                    ${!user && guestSearchCount >= GUEST_LIMIT 
                      ? 'bg-slate-400 text-white cursor-pointer hover:bg-slate-500' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-blue-200'}
                    ${loading ? 'opacity-50' : ''}
                  `}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {!user && guestSearchCount >= GUEST_LIMIT && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                      {!user && guestSearchCount >= GUEST_LIMIT ? (isRtl ? 'فتح المحرك' : 'Unlock Engine') : t.searchBtn}
                    </>
                  )}
                </button>
              </form>
            </div>

            {loading && (
              <div className="text-center py-20 animate-in fade-in duration-500">
                <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
                   {/* Breathing Circles around the bulb */}
                   <div className="absolute w-20 h-20 border-2 border-blue-400 rounded-full animate-[ping_3s_infinite] opacity-30"></div>
                   <div className="absolute w-32 h-32 border border-blue-300 rounded-full animate-[ping_4s_infinite] opacity-10"></div>
                   <div className="absolute w-40 h-40 border border-blue-200 rounded-full animate-[ping_5s_infinite] opacity-5"></div>
                   
                   {/* Central Lightbulb Icon with subtle pulse */}
                   <div className="relative z-10 animate-pulse duration-[2000ms]">
                      <svg className="w-24 h-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                      </svg>
                   </div>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                   <p className="text-2xl font-black text-slate-900 transition-all duration-500 h-16 flex items-center justify-center">
                     {LOADING_MESSAGES[lang][loadingStep]}
                   </p>
                   
                   {/* Progress Bar Container */}
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${((loadingStep + 1) / LOADING_MESSAGES[lang].length) * 100}%` }}
                      ></div>
                   </div>
                   
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                     {isRtl ? 'قد يستغرق البحث العميق 10-15 ثانية' : 'Deep search may take 10-15 seconds'}
                   </p>
                </div>
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

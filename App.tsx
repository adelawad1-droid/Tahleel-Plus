
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import { PublicLibrary } from './components/PublicLibrary';
import { SearchHistoryModal } from './components/SearchHistoryModal';
import { RegionSelector } from './components/RegionSelector';
import { SearchFeatures } from './components/SearchFeatures';

type ViewMode = 'HOME' | 'ADMIN' | 'PRICING' | 'LIBRARY' | 'PUBLIC_LIBRARY' | 'AUTH' | 'PROFILE';

const GUEST_LIMIT = 3;

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [view, setView] = useState<ViewMode>('HOME');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const pathToView = (path: string): ViewMode => {
      if (path.startsWith('/pricing')) return 'PRICING';
      if (path.startsWith('/library')) return 'LIBRARY';
      if (path.startsWith('/analysis-library')) return 'PUBLIC_LIBRARY';
      if (path.startsWith('/auth')) return 'AUTH';
      if (path.startsWith('/profile')) return 'PROFILE';
      if (path.startsWith('/admin')) return 'ADMIN';
      return 'HOME';
    };

    const viewToPath = (v: ViewMode): string => {
      switch (v) {
        case 'PRICING': return '/pricing';
        case 'LIBRARY': return '/library';
        case 'PUBLIC_LIBRARY': return '/analysis-library';
        case 'AUTH': return '/auth';
        case 'PROFILE': return '/profile';
        case 'ADMIN': return '/admin';
        default: return '/';
      }
    };

    useEffect(() => {
      setView(pathToView(location.pathname));
    }, [location.pathname]);

  
  const [guestSearchCount, setGuestSearchCount] = useState<number>(() => {
    const saved = localStorage.getItem('guest_search_count');
    return saved ? parseInt(saved) : 0;
  });

  const [guestRegion, setGuestRegion] = useState<string>(() => {
    const saved = localStorage.getItem('guest_region');
    return saved || 'SA';
  });

  // Gate free users after exceeding guest limit
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSearchHistoryModal, setShowSearchHistoryModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    try {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

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
      // 1. Update Title
      const activeName = lang === 'ar' ? configData.siteNameAr : configData.siteNameEn;
      if (activeName) document.title = activeName;
      
      // 2. Update Description Meta Tag
      const activeDesc = lang === 'ar' ? configData.siteDescriptionAr : configData.siteDescriptionEn;
      if (activeDesc) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          (metaDesc as any).name = "description";
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', activeDesc);
      }

      // 3. Update Keywords Meta Tag
      const activeKeywords = lang === 'ar' ? configData.siteKeywordsAr : configData.siteKeywordsEn;
      if (activeKeywords) {
        let metaKey = document.querySelector('meta[name="keywords"]');
        if (!metaKey) {
          metaKey = document.createElement('meta');
          (metaKey as any).name = "keywords";
          document.head.appendChild(metaKey);
        }
        metaKey.setAttribute('content', activeKeywords);
      }
      
      // 4. Update Favicon
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
    document.documentElement.lang = isRtl ? 'ar' : 'en';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    loadInitialData();
  }, [lang, view]);

  // Update canonical link based on current path
  useEffect(() => {
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`;
  }, [location.pathname]);

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
    navigate('/');
  };

  const handleUnlockEngine = () => {
    // التوجيه لصفحة تسجيل الدخول
    navigate('/auth');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // منع البحث لغير المسجلين - يجب تسجيل الدخول أولاً
    if (!user) {
      setShowLimitModal(true);
      return;
    }

    // التحقق من عدد عمليات البحث للمستخدم المجاني
    if (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) {
      setShowLimitModal(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setLastSearchedQuery(query);

    try {
      const dbApiKey = appConfig?.geminiApiKey;
      const dbSearchKey = appConfig?.googleSearchApiKey;
      const dbSearchId = appConfig?.googleSearchId;
      const userRegion = profile?.region || 'SA';
      const data = await analyzeEcommerceQuery(query, lang, dbApiKey, dbSearchKey, dbSearchId, userRegion);
      setResult(data);
      
      // زيادة عداد البحث للمستخدم المسجل
      if (user) {
        await incrementSearchCount(user.uid);
        await refreshProfile(user.uid, user.email!);
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

  // SEO Meta tags based on view
  const getPageMeta = () => {
    switch(view) {
      case 'PRICING':
        return {
          title: lang === 'ar' ? 'الباقات والأسعار - تحليل بلس' : 'Pricing Plans - Tahleel Plus',
          description: lang === 'ar' ? 'اختر الباقة المناسبة لك من باقات تحليل بلس لتحليل الأسواق بذكاء اصطناعي متقدم' : 'Choose your perfect plan from Tahleel Plus packages for global market analysis with advanced AI'
        };
      case 'LIBRARY':
        return {
          title: lang === 'ar' ? 'مكتبتي - تحليل بلس' : 'My Library - Tahleel Plus',
          description: lang === 'ar' ? 'الوصول إلى جميع تحليلاتك المحفوظة في مكان واحد' : 'Access all your saved analyses in one place'
        };
      case 'PUBLIC_LIBRARY':
        return {
          title: lang === 'ar' ? 'مكتبة التحليلات - تحليل بلس' : 'Analysis Library - Tahleel Plus',
          description: lang === 'ar' ? 'استكشف تحليلات السوق المنتقاة بعناية من فريق تحليل بلس لمختلف المنتجات والخدمات' : 'Explore curated market analyses from Tahleel Plus team for various products and services'
        };
      case 'AUTH':
        return {
          title: lang === 'ar' ? 'تسجيل الدخول - تحليل بلس' : 'Login - Tahleel Plus',
          description: lang === 'ar' ? 'سجل دخولك لتبدأ رحلتك في تحليل الأسواق العالمية' : 'Login to start your global market analysis journey'
        };
      case 'PROFILE':
        return {
          title: lang === 'ar' ? 'ملفي الشخصي - تحليل بلس' : 'My Profile - Tahleel Plus',
          description: lang === 'ar' ? 'إدارة حسابك وباقتك ومعلوماتك الشخصية' : 'Manage your account, plan and personal information'
        };
      case 'ADMIN':
        return {
          title: lang === 'ar' ? 'لوحة الإدارة - تحليل بلس' : 'Admin Panel - Tahleel Plus',
          description: lang === 'ar' ? 'لوحة التحكم الكاملة لإدارة النظام' : 'Complete control panel for system management'
        };
      default:
        return {
          title: lang === 'ar' ? 'تحليل بلس - محرك تحليل الأسواق بالذكاء الاصطناعي' : 'Tahleel Plus - AI-Powered Market Analysis Engine',
          description: lang === 'ar' ? 'اكتشف فرص التجارة الإلكترونية في أسواق متعددة بتحليل شامل يعتمد على الذكاء الاصطناعي المتقدم' : 'Discover e-commerce opportunities across global markets with comprehensive AI-powered analysis'
        };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 font-['Cairo']`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Helmet>
        <html lang={lang === 'ar' ? 'ar' : 'en'} dir={isRtl ? 'rtl' : 'ltr'} />
        <title>{pageMeta.title}</title>
        <meta name="description" content={pageMeta.description} />
        <meta property="og:title" content={pageMeta.title} />
        <meta property="og:description" content={pageMeta.description} />
        <meta name="twitter:title" content={pageMeta.title} />
        <meta name="twitter:description" content={pageMeta.description} />
      </Helmet>
      
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-all overflow-hidden text-white">
                {appConfig?.siteLogo ? (
                  <img src={appConfig.siteLogo} alt={lang === 'ar' ? 'شعار الموقع' : 'Site Logo'} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة البحث' : 'Search Icon'}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                )}
              </div>
              <div className="text-right">
                <h1 className="text-xl font-black text-slate-900 leading-none">{activeSiteName}</h1>
                <p className="text-[10px] text-slate-500 mt-0.5">{isRtl ? 'قرارات مبنية على بيانات' : 'Data-Driven Decisions'}</p>
              </div>
            </button>

            {/* Public Pricing Link */}
            <button 
              onClick={() => { setView('PRICING'); navigate('/pricing'); }} 
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'PRICING' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة الباقات' : 'Pricing Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t.pricingTitle}
            </button>

            {/* Public Library Link */}
            <button 
              onClick={() => { setView('PUBLIC_LIBRARY'); navigate('/analysis-library'); }} 
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'PUBLIC_LIBRARY' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة مكتبة التحليلات' : 'Analysis Library Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
              {isRtl ? 'مكتبة التحليلات' : 'Analysis Library'}
            </button>

            {/* Library Link - Only for logged in users */}
            {user && profile && (
              <button 
                onClick={() => { setView('LIBRARY'); navigate('/library'); }} 
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'LIBRARY' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة المكتبة' : 'Library Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {isRtl ? 'مكتبتي' : 'My Library'}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">
                    {isRtl ? 'سجّل دخولك للبحث' : 'Login to Search'}
                  </span>
                </div>
              )}
              {user && profile && profile.plan === 'FREE' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">
                    {isRtl ? `التجارب المتبقية: ${Math.max(0, GUEST_LIMIT - (profile.searchCount || 0))}` : `Trials Left: ${Math.max(0, GUEST_LIMIT - (profile.searchCount || 0))}`}
                  </span>
                </div>
              )}
              {user && profile ? (
                <UserMenu profile={profile} lang={lang} plans={plans} onNavigate={(v) => { setView(v); navigate(viewToPath(v)); }} onLogout={() => signOut(auth)} />
              ) : (
                <button onClick={() => { setView('AUTH'); navigate('/auth'); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
                  {t.login}
                </button>
              )}
              <LanguageToggle current={lang} onToggle={setLang} />
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed top-[73px] inset-x-0 bottom-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Panel */}
            <div className="fixed top-[73px] end-0 w-72 bg-white border-s border-slate-200 shadow-2xl z-50 md:hidden max-h-[calc(100vh-73px)] overflow-y-auto rounded-es-3xl">
              <div className="px-4 py-2 space-y-1">
              <button 
                onClick={() => { setView('PRICING'); navigate('/pricing'); setMobileMenuOpen(false); }} 
                className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'PRICING' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {t.pricingTitle}
              </button>
              
              <button 
                onClick={() => { setView('PUBLIC_LIBRARY'); navigate('/analysis-library'); setMobileMenuOpen(false); }} 
                className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'PUBLIC_LIBRARY' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {isRtl ? 'مكتبة التحليلات' : 'Analysis Library'}
              </button>

              {user && profile && (
                <button 
                  onClick={() => { setView('LIBRARY'); navigate('/library'); setMobileMenuOpen(false); }} 
                  className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'LIBRARY' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {isRtl ? 'مكتبتي' : 'My Library'}
                </button>
              )}

              {/* User Section */}
              {user && profile ? (
                <>
                  <button 
                    onClick={() => { setView('PROFILE'); navigate('/profile'); setMobileMenuOpen(false); }} 
                    className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'PROFILE' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {isRtl ? 'الملف الشخصي' : 'Profile'}
                  </button>
                  {profile.isAdmin && (
                    <button 
                      onClick={() => { setView('ADMIN'); navigate('/admin'); setMobileMenuOpen(false); }} 
                      className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-black transition-all ${view === 'ADMIN' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {isRtl ? 'لوحة التحكم' : 'Admin Panel'}
                    </button>
                  )}
                  <button 
                    onClick={() => { signOut(auth); setMobileMenuOpen(false); }} 
                    className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-black text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    {isRtl ? 'تسجيل الخروج' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg">
                    <span className="text-xs font-black text-rose-600">
                      {isRtl ? 'سجّل دخولك للبحث' : 'Login to Search'}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setView('AUTH'); navigate('/auth'); setMobileMenuOpen(false); }} 
                    className="w-full bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-600 transition-all"
                  >
                    {t.login}
                  </button>
                </>
              )}

              {/* Language Toggle */}
              <button
                onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); }}
                className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
          </>
        )}
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
            navigate('/auth');
          } else {
            setView('HOME');
            navigate('/');
          }
        }} />}
        {view === 'LIBRARY' && user && <SavedLibrary lang={lang} />}
        {view === 'PUBLIC_LIBRARY' && <PublicLibrary 
          lang={lang} 
          user={user}
          onNavigateToAuth={() => {
            setView('AUTH');
            navigate('/auth');
          }}
        />}
        {view === 'PROFILE' && user && profile && <Profile profile={profile} plans={plans} lang={lang} onRefresh={() => refreshProfile(user.uid, user.email!)} />}
        {view === 'AUTH' && !user && <div className="py-12"><Auth lang={lang} /></div>}
        
        {view === 'HOME' && (
          <>
            {!result && !loading && (
              <div className="text-center mb-3 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black mb-1.5 border border-blue-100 shadow-sm">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span></span>
                  {t.liveBadge}
                </div>
                <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto font-medium">{t.subtitle}</p>
              </div>
            )}

            <div className={`transition-all duration-700 ${result || loading ? 'mb-8' : 'mb-6'}`}>
              {error && (
                <div className="max-w-4xl mx-auto mb-8 p-8 bg-rose-50 border border-rose-200 rounded-[2.5rem] text-rose-700 shadow-xl animate-in zoom-in duration-300">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة تحذير' : 'Warning Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-black mb-4">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSearch} className={`max-w-6xl mx-auto ${!user ? 'opacity-50 grayscale select-none cursor-not-allowed' : (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) ? 'opacity-50 grayscale select-none cursor-not-allowed' : ''}`}>
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search Input Box */}
                  <div className="flex-1 relative">
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-blue-600 pointer-events-none`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة البحث' : 'Search Icon'}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      disabled={!user || (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT)}
                      value={query} 
                      onChange={(e) => setQuery(e.target.value)} 
                      placeholder={!user ? (isRtl ? 'سجّل دخولك للبحث...' : 'Login to search...') : (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) ? (isRtl ? 'انتهت تجاربك.. اشترك للمتابعة' : 'Trials ended.. subscribe to continue') : t.searchPlaceholder} 
                      className={`w-full ${isRtl ? 'pr-14 pl-5' : 'pl-14 pr-5'} py-4 bg-white border border-slate-200 rounded-2xl outline-none text-base text-slate-900 placeholder:text-slate-400 font-bold disabled:cursor-not-allowed shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:shadow-lg`} 
                    />
                  </div>
                  
                  {/* Search Button Box */}
                  <button 
                    type={!user || (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) ? 'button' : 'submit'}
                    onClick={!user ? handleUnlockEngine : (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) ? () => { setView('PRICING'); navigate('/pricing'); } : undefined}
                    className={`px-8 md:px-10 py-4 rounded-2xl font-black text-base transition-all shadow-sm flex items-center justify-center gap-2 md:min-w-[200px]
                      ${!user 
                        ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700' 
                        : (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT)
                          ? 'bg-amber-500 text-white cursor-pointer hover:bg-amber-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}
                      ${loading ? 'opacity-50' : ''}
                    `}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {!user && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة تسجيل' : 'Login Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                        {(profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة ترقية' : 'Upgrade Icon'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        {!user ? (isRtl ? 'سجّل دخولك' : 'Login') : (profile?.plan === 'FREE' && (profile?.searchCount || 0) >= GUEST_LIMIT) ? (isRtl ? 'اشترك الآن' : 'Subscribe') : t.searchBtn}
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              {/* رسالة توضيحية للعميل */}
              <div className="max-w-6xl mx-auto mt-3 px-4">
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {isRtl ? (
                      <>
                        يمكنك البحث بـ
                        <span className="font-bold"> اسم المنتج</span> أو 
                        <span className="font-bold"> رابط المنتج</span> أو 
                        <span className="font-bold"> رابط المتجر</span> 
                        للحصول على نتائج أدق
                      </>
                    ) : (
                      <>
                        Search by <span className="font-bold">product name</span>, <span className="font-bold">product link</span>, or <span className="font-bold">store link</span> for accurate results
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* ميزات محرك البحث */}
              {!loading && !result && (
                <div className="max-w-6xl mx-auto mt-12">
                  <SearchFeatures lang={lang} />
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-20 animate-in fade-in duration-500">
                <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
                   
                   {/* Rotating Orbit Rings */}
                   <div className="absolute w-40 h-40 rounded-full border-2 border-dashed border-blue-200 animate-[spin_8s_linear_infinite]"></div>
                   <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-blue-300 animate-[spin_6s_linear_infinite_reverse]"></div>
                   <div className="absolute w-24 h-24 rounded-full border-2 border-blue-400 animate-[spin_4s_linear_infinite]"></div>
                   
                   {/* Orbiting Dots */}
                   <div className="absolute w-40 h-40 animate-[spin_3s_linear_infinite]">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                   </div>
                   <div className="absolute w-32 h-32 animate-[spin_2.5s_linear_infinite_reverse]">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></div>
                   </div>
                   <div className="absolute w-24 h-24 animate-[spin_2s_linear_infinite]">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                   </div>
                   
                   {/* Small Central Lightbulb Icon - No Background */}
                   <div className="relative z-10">
                      <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
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
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${((loadingStep + 1) / LOADING_MESSAGES[lang].length) * 100}%` }}
                      ></div>
                   </div>
                   
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                     {isRtl ? 'قد يستغرق البحث العميق 10-15 ثانية' : 'Deep search may take 10-15 seconds'}
                   </p>
                </div>
              </div>
            )}
            {result && <AnalysisDashboard data={result} lang={lang} queryStr={lastSearchedQuery} apiKey={appConfig?.geminiApiKey} userId={user?.uid} region={user ? (profile?.region || 'SA') : guestRegion} />}
          </>
        )}
      </main>

      <SearchHistoryModal
        isOpen={showSearchHistoryModal}
        lang={lang}
        guestSearchCount={guestSearchCount}
        onClose={() => setShowSearchHistoryModal(false)}
        onProceedWithSearch={() => {
          setShowSearchHistoryModal(false);
          handleSearch();
        }}
        onLoginRedirect={() => {
          setShowSearchHistoryModal(false);
          setView('AUTH');
          navigate('/auth');
        }}
      />

      {/* Region Selector Widget */}
      <RegionSelector 
        lang={lang}
        user={user}
        profile={profile}
        guestRegion={guestRegion}
        onRegionChange={(region) => {
          if (user) {
            refreshProfile(user.uid, user.email!);
          } else {
            setGuestRegion(region);
            localStorage.setItem('guest_region', region);
          }
        }}
      />

      <footer className="w-full py-6 bg-white border-t border-slate-100 text-center text-slate-400 text-xs font-bold">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] mb-2 leading-relaxed">
            {isRtl 
              ? 'تحليل السوق • الذكاء الاصطناعي • تحليل المنتجات • ذكاء العملاء • دراسة المنافسين • تحليل الفرص • توقعات النمو • تحليل الربحية • استراتيجية التسويق • تحليل المبيعات'
              : 'Market Analysis • Artificial Intelligence • Product Analysis • Customer Intelligence • Competitor Research • Opportunity Discovery • Growth Forecasting • Profit Analysis • Marketing Strategy • Sales Analytics'
            }
          </p>
          <p>{activeSiteName} — {isRtl ? 'كافة الحقوق محفوظة' : 'All rights reserved'} © 2026 | info@tahlilplus.net</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

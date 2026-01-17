
import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from './services/firebase';
import { AnalysisResult, Language } from './types';
import { TRANSLATIONS } from './constants';
import { analyzeEcommerceQuery } from './services/geminiService';
import { LanguageToggle } from './components/LanguageToggle';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { Auth } from './components/Auth';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleLogout = () => {
    signOut(auth);
    handleReset();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeEcommerceQuery(query, lang);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 font-['Cairo']`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={handleReset}
            className="flex items-center gap-3 group hover:opacity-80 transition-all cursor-pointer bg-transparent border-none p-0"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="hidden sm:block text-right">
              <h1 className="text-xl font-bold text-slate-900 leading-none">{t.title}</h1>
              {isAdmin && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider border border-blue-100">{t.adminBadge}</span>}
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {user && (
              <button 
                onClick={handleLogout}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                {t.logout}
              </button>
            )}
            <LanguageToggle current={lang} onToggle={setLang} />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {!user ? (
          <div className="py-12">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{t.title}</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">{t.authRequired}</p>
            </div>
            <Auth lang={lang} />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {!result && !loading && (
              <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-6 border border-blue-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  {t.liveBadge}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                  {t.title}
                </h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                  {t.subtitle}
                </p>
              </div>
            )}

            {/* Search Bar Container */}
            <div className={`transition-all duration-700 ${result || loading ? 'mb-8' : 'mb-16'}`}>
              <form 
                onSubmit={handleSearch}
                className={`max-w-4xl mx-auto flex flex-col md:flex-row gap-4 p-2 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-900/5 transition-transform hover:scale-[1.01]`}
              >
                <div className="flex-1 relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-6' : 'left-0 pl-6'} flex items-center pointer-events-none text-blue-600`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className={`w-full py-5 ${isRtl ? 'pr-16 pl-4' : 'pl-16 pr-4'} bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-300 font-bold`}
                  />
                </div>
                <button 
                  disabled={loading}
                  className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    t.searchBtn
                  )}
                </button>
              </form>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                  <svg className="w-10 h-10 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-slate-900 mb-2">{t.analyzing}</p>
                <p className="text-slate-400 text-sm">{isRtl ? "نستخدم أحدث نماذج الذكاء الاصطناعي لفحص المتاجر والمنافسين" : "Using the latest AI models to scan stores and competitors"}</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="max-w-md mx-auto p-8 bg-white border border-red-100 rounded-3xl text-center shadow-xl shadow-red-500/5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-900 font-black text-xl mb-2">Error</p>
                <p className="text-red-600 font-medium leading-relaxed">{error}</p>
                <button onClick={() => setError(null)} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 underline">Close</button>
              </div>
            )}

            {/* Results Dashboard */}
            {result && <AnalysisDashboard data={result} lang={lang} />}

            {/* Empty State Features */}
            {!result && !loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                <FeatureItem 
                  icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                  title={isRtl ? "بيانات دقيقة ومحدثة" : "Accurate Live Data"}
                  desc={isRtl ? "نعتمد على محرك بحث قوي يجلب البيانات الحية من المتاجر السعودية الكبرى لحظياً." : "We rely on a powerful engine that fetches live data from major Saudi stores in real-time."}
                />
                <FeatureItem 
                  icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  title={isRtl ? "مقارنة تنافسية عميقة" : "Deep Competitive Mapping"}
                  desc={isRtl ? "نحلل أسعار المنافسين في (نون، سلة، زد، وغيرها) ونحدد لك أفضل فرصة للدخول." : "We analyze competitor prices on (Noon, Salla, Zid, etc.) and identify your best entry point."}
                />
                <FeatureItem 
                  icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  title={isRtl ? "رؤية استراتيجية SWOT" : "SWOT Strategic Insights"}
                  desc={isRtl ? "تحليل رباعي متقدم يوضح لك نقاط القوة والضعف والفرص والتهديدات في السوق المستهدف." : "Advanced 4-way analysis showing strengths, weaknesses, opportunities, and threats in your target market."}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="w-full py-12 bg-white border-t border-slate-200 text-center text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="font-bold mb-2 text-slate-900" dir="ltr">Tahleel Plus • AI-Powered Analysis Engine 2025 ©</p>
          <p className="text-xs opacity-70">Designed for the Saudi Vision 2030 digital economy</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="text-lg font-black text-slate-900 mb-3">{title}</h4>
    <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);

export default App;

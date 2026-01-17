
import React, { useState, useCallback } from 'react';
import { AnalysisResult, Language } from './types';
import { TRANSLATIONS } from './constants';
import { analyzeEcommerceQuery } from './services/geminiService';
import { LanguageToggle } from './components/LanguageToggle';
import { AnalysisDashboard } from './components/AnalysisDashboard';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
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

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
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
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">
              {t.title}
            </h1>
          </button>
          <LanguageToggle current={lang} onToggle={setLang} />
        </div>
      </nav>

      {/* Main Content Area - flex-grow pushes footer down */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        {!result && !loading && (
          <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
              {t.title}
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>
        )}

        {/* Search Bar Container */}
        <div className={`transition-all duration-700 ${result || loading ? 'mb-8' : 'mb-16'}`}>
          <form 
            onSubmit={handleSearch}
            className={`max-w-4xl mx-auto flex flex-col md:flex-row gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-blue-900/5 transition-transform hover:scale-[1.01]`}
          >
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-4 pl-12 pr-4 bg-transparent outline-none text-lg text-slate-900 placeholder:text-slate-400 font-medium ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>
            <button 
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xl font-medium text-slate-600">{t.analyzing}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-800 font-bold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Dashboard */}
        {result && <AnalysisDashboard data={result} lang={lang} />}

        {/* Empty State Features */}
        {!result && !loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 mt-12">
            <FeatureItem 
              icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              title={isRtl ? "بيانات دقيقة" : "Accurate Data"}
              desc={isRtl ? "نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل السوق السعودي" : "Utilizing the latest AI to analyze the Saudi market."}
            />
            <FeatureItem 
              icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              title={isRtl ? "مقارنة فورية" : "Instant Comparison"}
              desc={isRtl ? "قارن الأسعار والخدمات بين المتاجر الكبرى في ثوانٍ" : "Compare prices and services across major stores in seconds."}
            />
            <FeatureItem 
              icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title={isRtl ? "تحليل SWOT" : "SWOT Analysis"}
              desc={isRtl ? "احصل على رؤية شاملة لنقاط القوة والفرص لكل منتج" : "Get a full view of strengths and opportunities for every product."}
            />
          </div>
        )}
      </main>

      {/* Persistent Footer - Pushed to the very bottom */}
      <footer className="w-full py-10 bg-white border-t border-slate-200 text-center text-slate-400 text-sm">
        <p dir="ltr">Tahleel Plus • AI-Powered Analysis Engine 2025 ©</p>
      </footer>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-slate-200">
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
      {icon}
    </div>
    <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default App;

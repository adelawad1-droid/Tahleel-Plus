import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Language, LibraryCategory, PublicAnalysis } from '../types';
import { TRANSLATIONS, REGIONS } from '../constants';
import { getCategories, getPublicAnalysesByCategory, getAllPublicAnalyses, searchPublicLibrary, getPublicAnalysis } from '../services/publicLibraryService';
import { AnalysisDashboard } from './AnalysisDashboard';

interface Props {
  lang: Language;
  user: User | null;
  onNavigateToAuth: () => void;
}

export const PublicLibrary: React.FC<Props> = ({ lang, user, onNavigateToAuth }) => {
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [analyses, setAnalyses] = useState<PublicAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<PublicAnalysis[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<PublicAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [selectedCategory, searchTerm, analyses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, analysesData] = await Promise.all([
        getCategories(),
        getAllPublicAnalyses()
      ]);
      setCategories(categoriesData);
      setAnalyses(analysesData);
      setFilteredAnalyses(analysesData);
    } catch (error) {
      console.error('Error loading public library:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnalyses = async () => {
    let result = analyses;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.categoryId === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.itemName.toLowerCase().includes(term) ||
        a.query.toLowerCase().includes(term) ||
        (isRtl ? a.categoryNameAr : a.categoryNameEn).toLowerCase().includes(term)
      );
    }

    setFilteredAnalyses(result);
  };

  const handleAnalysisClick = async (analysis: PublicAnalysis) => {
    // Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Set the analysis immediately for faster UX
    setSelectedAnalysis(analysis);
    
    // Increment view count in the background if analysis has an ID
    if (analysis.id) {
      try {
        await getPublicAnalysis(analysis.id);
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
  };

  if (selectedAnalysis) {
    // اختيار النسخة المناسبة حسب اللغة الحالية
    const displayData = isRtl 
      ? (selectedAnalysis.dataAr || selectedAnalysis.data) 
      : (selectedAnalysis.dataEn || selectedAnalysis.data);
    
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedAnalysis(null)}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isRtl ? 'العودة للمكتبة' : 'Back to Library'}
          </button>
          {/* مؤشر اللغة المتاحة */}
          <div className="flex gap-2 mb-4">
            {selectedAnalysis.dataAr && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                🇸🇦 {isRtl ? 'عربي متوفر' : 'Arabic Available'}
              </span>
            )}
            {selectedAnalysis.dataEn && (
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                🇬🇧 {isRtl ? 'إنجليزي متوفر' : 'English Available'}
              </span>
            )}
          </div>
          <AnalysisDashboard data={displayData} lang={lang} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            {isRtl ? 'مكتبة التحليلات' : 'Analysis Library'}
          </h1>
          <p className="text-sm text-slate-500 font-bold">
            {isRtl ? `تحاليل منتقاة من فريق تحليل بلس • ${analyses.length} تحليل متاح` : `Curated analyses from Tahleel Plus team • ${analyses.length} analyses available`}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="rounded-3xl p-8 mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'ابحث في المكتبة...' : 'Search library...'}
              className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 transition-all pr-12 shadow-sm"
            />
            <svg className="w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 end-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {isRtl ? 'الكل' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id!)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                }`}
              >
                {isRtl ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>
        )}

        {/* Analyses Grid */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {isRtl ? 'لا توجد نتائج' : 'No Results'}
            </h3>
            <p className="text-slate-500">
              {isRtl ? 'جرب تغيير البحث أو الفلتر' : 'Try changing your search or filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map(analysis => (
              <div
                key={analysis.id}
                onClick={() => handleAnalysisClick(analysis)}
                className="bg-white rounded-[2rem] border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer overflow-hidden group flex flex-col"
                style={{ minHeight: '280px' }}
              >
                {/* Category Badge */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <span className="text-white font-black text-xs uppercase tracking-wide">
                    {isRtl ? analysis.categoryNameAr : analysis.categoryNameEn}
                  </span>
                </div>

                <div className="p-8 flex flex-col flex-grow">
                  {/* Title */}
                  <h3 className={`text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-relaxed mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {analysis.itemName}
                  </h3>

                  {/* Language and Region Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                      {analysis.query.match(/[\u0600-\u06FF]/) ? '🇸🇦 عربي' : '🇬🇧 English'}
                    </span>
                    {analysis.region && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        {REGIONS.find(r => r.code === analysis.region)?.[isRtl ? 'nameAr' : 'nameEn'] || analysis.region}
                      </span>
                    )}
                  </div>

                  {/* Query */}
                  <p className={`text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                    {analysis.query}
                  </p>

                  {/* Spacer to push stats to bottom */}
                  <div className="flex-grow"></div>

                  {/* Stats - Always at bottom */}
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-bold">{analysis.views || 0}</span>
                    </div>
                    <div className="text-blue-600 font-bold group-hover:underline">
                      {isRtl ? 'عرض التحليل ←' : 'View Analysis →'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 end-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-slate-900 text-center mb-3">
              {isRtl ? 'التسجيل مطلوب' : 'Registration Required'}
            </h3>
            <p className="text-slate-600 text-center mb-6">
              {isRtl 
                ? 'للوصول إلى التحاليل الكاملة، يرجى التسجيل في الموقع أولاً'
                : 'To access full analyses, please register on the site first'
              }
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  onNavigateToAuth();
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
              >
                {isRtl ? 'التسجيل الآن' : 'Register Now'}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

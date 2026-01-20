import React, { useState, useEffect } from 'react';
import { AnalysisResult, Language } from '../types';
import { TRANSLATIONS, REGIONS } from '../constants';
import { translateToArabic, translateAnalysis } from '../services/geminiService';
import { saveAnalysis, checkExistingSavedAnalysis } from '../services/userService';
import { publishAnalysisByUser } from '../services/publicLibraryService';
import { openPrintWindow, downloadAsPDF } from '../services/printService';
import { auth } from '../services/firebase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Target, Zap, AlertCircle, CheckCircle, Clock, MapPin, Eye, Printer, Download, Share2, Lightbulb, Upload, FileDown, BookmarkPlus
} from 'lucide-react';

interface Props {
  data: AnalysisResult;
  lang: Language;
  apiKey?: string;
  userId?: string;
  queryStr?: string;
  region?: string; // 'SA', 'AE', 'EG', etc.
}

export const AnalysisDashboard: React.FC<Props> = ({ data, lang, apiKey, userId, queryStr, region = 'SA' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'demand' | 'competitors' | 'profitability' | 'decisions' | 'opportunities' | 'buyerIntent' | 'growth' | 'executive'>('overview');
  const [saved, setSaved] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState<string>(data.summary);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null); // تخزين ID التحليل المحفوظ
  const [isTranslating, setIsTranslating] = useState(false); // حالة الترجمة
  const [translatedData, setTranslatedData] = useState<AnalysisResult | null>(null); // النسخة المترجمة
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Load categories when publish modal opens
  useEffect(() => {
    if (publishModal) {
      loadCategories();
    }
  }, [publishModal]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { getCategories } = await import('../services/publicLibraryService');
      const cats = await getCategories();
      setCategories(cats);
      // Select first category by default
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Translate summary to Arabic if needed
  useEffect(() => {
    const translateContent = async () => {
      if (isRtl && apiKey && data.summary) {
        const translated = await translateToArabic(data.summary, apiKey);
        setTranslatedSummary(translated);
      } else {
        setTranslatedSummary(data.summary);
      }
    };
    
    translateContent();
  }, [data.summary, isRtl, apiKey]);

  // Handle Print - استخدام السكربت الاحترافي
  const handlePrint = () => {
    openPrintWindow(data, lang);
  };

  // Handle PDF Download - تحميل كملف PDF
  const handleDownloadPDF = () => {
    downloadAsPDF(data, lang);
  };

  // Handle Print Single Section - استخدام السكربت الاحترافي
  const handlePrintSection = (sectionName: string) => {
    openPrintWindow(data, lang, sectionName);
  };

  // Handle Save and Publish with Translation
  const handleSave = async () => {
    if (!userId) {
      alert(isRtl ? 'يجب تسجيل الدخول لحفظ النتائج' : 'Please login to save results');
      return;
    }
    if (!queryStr) {
      alert(isRtl ? 'لا يوجد بحث لحفظه' : 'No search to save');
      return;
    }
    
    try {
      // التحقق من وجود تحليل مشابه محفوظ
      const existingAnalysis = await checkExistingSavedAnalysis(userId, queryStr);
      
      if (existingAnalysis) {
        if (existingAnalysis.isPublished) {
          alert(isRtl 
            ? '✅ هذا التحليل محفوظ ومنشور بالفعل في مكتبتك والمكتبة العامة' 
            : '✅ This analysis is already saved and published in your library');
          return;
        } else {
          // محفوظ ولكن غير منشور - نخزن الـ ID ونعرض نافذة النشر
          setCurrentSavedId(existingAnalysis.id!);
          setSaved(true);
          setPublishModal(true);
          setTimeout(() => setSaved(false), 3000);
          return;
        }
      }
      
      // ترجمة التحليل للغة الأخرى قبل الحفظ
      setIsTranslating(true);
      let dataAr: AnalysisResult | undefined;
      let dataEn: AnalysisResult | undefined;
      
      if (apiKey) {
        try {
          const targetLang = isRtl ? 'en' : 'ar';
          const translated = await translateAnalysis(data, targetLang, apiKey);
          setTranslatedData(translated);
          
          if (isRtl) {
            // البحث كان بالعربي - النسخة الأصلية عربي
            dataAr = data;
            dataEn = translated;
          } else {
            // البحث كان بالإنجليزي - النسخة الأصلية إنجليزي
            dataEn = data;
            dataAr = translated;
          }
        } catch (translationError) {
          console.error('Translation failed, saving original only:', translationError);
          // في حالة فشل الترجمة، نحفظ النسخة الأصلية فقط
        }
      }
      setIsTranslating(false);
      
      // حفظ التحليل مع النسختين
      const savedId = await saveAnalysis(
        userId, 
        queryStr, 
        data, 
        region,
        isRtl ? 'ar' : 'en',
        dataAr,
        dataEn
      );
      setCurrentSavedId(savedId); // نخزن الـ ID
      setSaved(true);
      
      // فتح نافذة النشر مباشرة
      setPublishModal(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (e) {
      console.error('Save failed:', e);
      alert(isRtl ? 'فشل الحفظ. الرجاء المحاولة مرة أخرى' : 'Save failed. Please try again');
    }
  };

  const handlePublish = async () => {
    if (!userId || !auth.currentUser) return;
    if (!selectedCategory) {
      alert(isRtl ? 'يرجى اختيار قسم للنشر فيه' : 'Please select a category to publish');
      return;
    }
    
    setPublishing(true);
    try {
        // استخدم currentSavedId إذا كان موجوداً، وإلا احفظ التحليل
        const savedId = currentSavedId || await saveAnalysis(userId, queryStr || '', data, region);
      
        if (!currentSavedId) {
          setCurrentSavedId(savedId);
      }
      
      // انشره باستخدام الـ ID
      await publishAnalysisByUser(
        savedId,
        userId,
        auth.currentUser.email || '',
        queryStr || '',
        data,
        region,
        selectedCategory
      );
      
      alert(isRtl ? 'تم نشر التحليل في المكتبة العامة بنجاح! ✅' : 'Analysis published successfully! ✅');
      setPublishModal(false);
      setSelectedCategory('');
    } catch (error: any) {
      console.error('Error publishing:', error);
        if (error.message === 'ALREADY_PUBLISHED' || error.message === 'SAVED_ANALYSIS_NOT_FOUND') {
        alert(isRtl ? 'هذا التحليل منشور بالفعل في المكتبة العامة' : 'This analysis is already published in the public library');
          setPublishModal(false);
      } else {
        alert(isRtl ? 'حدث خطأ أثناء النشر' : 'Error publishing analysis');
      }
    } finally {
      setPublishing(false);
    }
  };

  // Color palette - Professional Color Scheme
  const colors = ['#3b82f6', '#06b6d4', '#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];
  const chartColors = { positive: '#10b981', negative: '#ef4444', warning: '#f59e0b', neutral: '#6b7280' };

  // Determine verdict colors - Premium styling with distinct colors
  const verdictStyle = data.finalVerdict.recommendation === 'GO'
    ? { 
        // Gold for GO (Excellent)
        bg: 'from-amber-500 via-yellow-500 to-orange-500',
        text: 'text-white',
        border: 'border-amber-300',
        badge: 'bg-amber-100 text-amber-800',
        icon: 'text-amber-100'
      }
    : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION'
    ? { 
        // Green for CAUTION (Neutral/Middle)
        bg: 'from-emerald-600 via-teal-600 to-cyan-600',
        text: 'text-white',
        border: 'border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800',
        icon: 'text-emerald-100'
      }
    : { 
        // Red for NO-GO (Risk)
        bg: 'from-rose-600 via-red-600 to-red-700',
        text: 'text-white',
        border: 'border-rose-300',
        badge: 'bg-rose-100 text-rose-800',
        icon: 'text-rose-100'
      };

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      {/* Product Header - Strong Teal/Green */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 rounded-[1.5rem] p-6 md:p-8 text-white shadow-2xl hover:shadow-3xl transition-all border-2 border-teal-500 print-no-break">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                {isRtl ? '🇸🇦 عربي' : '🇬🇧 English'}
              </span>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md text-white uppercase tracking-widest">
                {t.verdictTitle}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 leading-tight">{data.itemName}</h2>
            <p className="text-sm md:text-base opacity-95 leading-relaxed max-w-3xl font-medium">{translatedSummary}</p>
          </div>
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white bg-opacity-15 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-md border border-white border-opacity-30">
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Market Stats Cards - 3 Cards Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Average Price */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-[1.5rem] p-6 border-2 border-emerald-500 hover:border-emerald-400 hover:shadow-2xl shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.avgPrice}</h3>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white font-black text-lg backdrop-blur-sm">
              ر.س
            </div>
          </div>
          <p className="text-3xl font-black text-white mb-2">{data.marketStats.averagePrice.toFixed(0)} <span className="text-lg">ر.س</span></p>
          <div className="flex items-center gap-2 text-xs font-bold text-white opacity-90">
            <span>{isRtl ? 'منخفض' : 'Low'}: {data.marketStats.lowestPrice.toFixed(0)} ر.س</span>
            <span>•</span>
            <span>{isRtl ? 'عالي' : 'High'}: {data.marketStats.highestPrice.toFixed(0)} ر.س</span>
          </div>
        </div>

        {/* Demand Level */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[1.5rem] p-6 border-2 border-blue-500 hover:border-blue-400 hover:shadow-2xl shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.demand}</h3>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mb-2">{data.marketStats.demandLevel}</p>
          {data.demandAnalysis && (
            <p className="text-xs font-bold text-white opacity-90">{data.demandAnalysis.monthlyDemandEstimate} {isRtl ? 'وحدة/شهر' : 'units/month'}</p>
          )}
        </div>

        {/* Market Saturation */}
        <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 hover:shadow-2xl shadow-lg transition-all ${
          data.marketStats.marketSaturation > 70
            ? 'from-rose-600 to-rose-700 border-rose-500 hover:border-rose-400'
            : data.marketStats.marketSaturation > 40
            ? 'from-orange-600 to-orange-700 border-orange-500 hover:border-orange-400'
            : 'from-emerald-600 to-emerald-700 border-emerald-500 hover:border-emerald-400'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.saturation}</h3>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mb-2">{data.marketStats.marketSaturation}%</p>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all bg-white"
              style={{ width: `${data.marketStats.marketSaturation}%` }}
            />
          </div>
        </div>
      </div>

      {/* Verdict Box - Premium Display with Distinct Colors - Full Width & Larger */}
      <div className={`bg-gradient-to-br rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden border-2 w-full ${
        data.finalVerdict.recommendation === 'GO'
          ? 'from-amber-500 via-yellow-500 to-orange-500 border-amber-300'
          : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION'
          ? 'from-emerald-600 via-teal-600 to-cyan-600 border-emerald-300'
          : 'from-rose-600 via-red-600 to-red-700 border-rose-300'
      }`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-6 md:gap-8 mb-6">
            <div className="flex items-center gap-4 md:gap-6 flex-1">
              <div>
                <p className="text-xs md:text-sm font-bold text-white opacity-90 uppercase tracking-widest mb-3">{t.verdictTitle}</p>
                <div className="flex items-center gap-3">
                  {/* Status Circle */}
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    data.finalVerdict.recommendation === 'GO'
                      ? 'bg-emerald-400'
                      : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}></div>
                  
                  {/* Verdict Text */}
                  <div>
                    <h2 className="text-lg md:text-xl font-bold leading-tight text-white">
                      {data.finalVerdict.recommendation === 'GO' ? (isRtl ? 'انطلق' : 'GO') : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? (isRtl ? 'تقدم بحذر' : 'PROCEED') : (isRtl ? 'لا ينصح دخول السوق في هذا المجال' : 'NO-GO')}
                    </h2>
                    <p className="text-sm md:text-base font-medium text-white opacity-90 mt-1">
                      {isRtl ? (
                        data.finalVerdict.recommendation === 'GO' ? 'فرصة استثمارية واعدة' : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'الدخول ممكن بشرط تحقيق الشروط التالية' : 'مخاطرة عالية'
                      ) : (
                        data.finalVerdict.recommendation === 'GO' ? 'Promising opportunity' : data.finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'Entry possible if the following conditions are met' : 'High Risk'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* تفاصيل التوصية أو الشروط */}
          {data.finalVerdict.recommendation === 'PROCEED WITH CAUTION' && data.finalVerdict.conditions && data.finalVerdict.conditions.length > 0 ? (
            <div className="mt-4">
              <ul className="list-disc pl-6 text-white text-base md:text-lg opacity-95">
                {data.finalVerdict.conditions.map((cond: string, idx: number) => (
                  <li key={idx}>{cond}</li>
                ))}
              </ul>
              <p className="mt-4 text-white text-base md:text-lg opacity-95">{data.finalVerdict.reasoning}</p>
            </div>
          ) : data.finalVerdict.recommendation === 'NO-GO' && data.finalVerdict.notes && data.finalVerdict.notes.length > 0 ? (
            <>
              <p className="text-base md:text-lg leading-relaxed font-medium text-white opacity-95 mb-4">{data.finalVerdict.reasoning}</p>
              <div className="bg-white bg-opacity-10 rounded-xl p-4 mt-2">
                <h3 className="text-white text-base md:text-lg font-bold mb-2">{isRtl ? 'ملاحظات إضافية:' : 'Additional Notes:'}</h3>
                <ul className="list-disc pl-6 text-white text-base md:text-lg opacity-95">
                  {data.finalVerdict.notes.map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
                <p className="mt-2 text-white text-sm md:text-base opacity-80">{isRtl ? 'رغم وجود فرص، إلا أن المخاطر لا تزال مرتفعة.' : 'Despite opportunities, risks remain high.'}</p>
              </div>
            </>
          ) : (
            <p className="text-base md:text-lg leading-relaxed font-medium text-white opacity-95">{data.finalVerdict.reasoning}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render Demand Tab
  const renderDemand = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      
      {data.demandAnalysis && (
        <>
          {/* Demand Section Header */}
          <div className="border-l-4 border-l-slate-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-slate-700 flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8" />
              {t.demandAnalysis}
            </h2>
            <p className="text-slate-600 font-medium">{t.marketDemandEvaluation}</p>
          </div>

          {/* Demand Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[1.5rem] p-6 border-2 border-blue-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.monthlyDemand}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.demandAnalysis.monthlyDemandEstimate}
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.unitsEstimated}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-[1.5rem] p-6 border-2 border-purple-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.demandScore}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.demandAnalysis.demandScore}%
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.overallStrength}</p>
            </div>

            <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
              data.demandAnalysis.demandStability === 'High'
                ? 'from-emerald-600 to-emerald-700 border-emerald-500'
                : data.demandAnalysis.demandStability === 'Medium'
                ? 'from-orange-600 to-orange-700 border-orange-500'
                : 'from-rose-600 to-rose-700 border-rose-500'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.stability}</h3>
              </div>
              <p className="text-2xl font-black text-white mb-2">
                {t.levels[data.demandAnalysis.demandStability] || data.demandAnalysis.demandStability}
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.volatilityLevel}</p>
            </div>
          </div>

          {/* Seasonality */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-xl font-black text-slate-700 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6" />
              {t.seasonalityAnalysis}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-bold text-emerald-700 mb-3">{t.peakMonths}</h4>
                <div className="flex flex-wrap gap-2">
                  {data.demandAnalysis.seasonality.peakMonths.map((month, i) => (
                    <span key={i} className="text-emerald-700 px-2 py-1 text-sm font-bold">
                      {month}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">{t.lowMonths}</h4>
                <div className="flex flex-wrap gap-2">
                  {data.demandAnalysis.seasonality.lowMonths.map((month, i) => (
                    <span key={i} className="text-slate-600 px-2 py-1 text-sm font-bold">
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {isRtl && data.demandAnalysis.seasonality.analysis.includes('Seasonal patterns') 
                ? 'أنماط موسمية تتوافق مع مواسم التسوق والأعياد في المملكة العربية السعودية'
                : data.demandAnalysis.seasonality.analysis}
            </p>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] border-2 border-purple-500 p-8 shadow-lg">
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              {t.geographicDistribution}
            </h3>
            <p className="text-white leading-relaxed font-medium opacity-95">
              {isRtl && data.demandAnalysis.geographicDistribution.includes('Distributed across major')
                ? 'توزيع واسع في المراكز الحضرية الرئيسية: الرياض، جدة، الدمام'
                : data.demandAnalysis.geographicDistribution}
            </p>
          </div>

          {/* Trend Chart */}
          {data.trends && data.trends.length > 0 && (
            <div className="bg-white rounded-[2rem] border-2 border-slate-200 p-8 shadow-xl">
              <h3 className="text-xl font-black text-teal-700 mb-8 flex items-center gap-3">
                <TrendingUp className="w-7 h-7" />
                {isRtl ? 'اتجاه الطلب' : 'Demand Trend'}
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569"
                    style={{ fontSize: '13px', fontWeight: '600' }}
                    tick={{ fill: '#475569' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#10b981"
                    style={{ fontSize: '13px', fontWeight: '600' }}
                    tick={{ fill: '#10b981' }}
                    label={{ value: isRtl ? 'السعر' : 'Price', angle: -90, position: 'insideLeft', style: { fill: '#10b981', fontWeight: 'bold' } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="#ef4444"
                    style={{ fontSize: '13px', fontWeight: '600' }}
                    tick={{ fill: '#ef4444' }}
                    label={{ value: isRtl ? 'الطلب' : 'Demand', angle: 90, position: 'insideRight', style: { fill: '#ef4444', fontWeight: 'bold' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                      border: '2px solid #e2e8f0',
                      borderRadius: '1rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontWeight: '600'
                    }}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name={isRtl ? 'السعر' : 'Price'}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="demand" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name={isRtl ? 'الطلب' : 'Demand'}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: '#dc2626' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Competitors Tab
  const renderCompetitors = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      
      {/* Competitors Section Header */}
      <div className="border-l-4 border-l-orange-500 pl-6 mb-8 print-no-break">
        <h2 className="text-4xl font-black text-orange-600 flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" />
          {t.competitorAnalysis}
        </h2>
        <p className="text-slate-600 font-medium">{t.competitorIntelligence}</p>
      </div>

      {/* Competitor Intelligence Summary */}
      {data.competitorIntelligence && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-[1.5rem] p-6 border-2 border-orange-500 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.activeCompetitors}</h3>
            </div>
            <p className="text-4xl font-black text-white">{data.competitorIntelligence.activeCompetitors}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-[1.5rem] p-6 border-2 border-amber-500 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.strengthIndex}</h3>
            </div>
            <p className="text-4xl font-black text-white">{data.competitorIntelligence.competitorStrengthIndex.toFixed(0)}</p>
            <p className="text-xs font-bold text-white opacity-90 mt-2">{isRtl ? 'مستوى القوة' : 'strength level'}</p>
          </div>

          <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
            data.competitorIntelligence.entryDifficulty === 'Low'
              ? 'from-emerald-600 to-emerald-700 border-emerald-500'
              : data.competitorIntelligence.entryDifficulty === 'Medium'
              ? 'from-orange-600 to-orange-700 border-orange-500'
              : 'from-rose-600 to-rose-700 border-rose-500'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.entryDifficulty}</h3>
            </div>
            <p className="text-2xl font-black text-white mb-2">
              {t.levels[data.competitorIntelligence.entryDifficulty] || data.competitorIntelligence.entryDifficulty}
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-[1.5rem] p-6 border-2 border-pink-500 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.marketGaps}</h3>
            </div>
            <p className="text-4xl font-black text-white">{data.competitorIntelligence.marketGaps.length}</p>
            <p className="text-xs font-bold text-white opacity-90 mt-2">{t.opportunitiesIdentified}</p>
          </div>
        </div>
      )}

      {/* Competitors Table */}
      {data.competitors && data.competitors.length > 0 && (
        <div className="bg-slate-50 rounded-[2rem] border-2 border-gray-200 overflow-hidden shadow-lg">
          <div className="p-8 bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-black text-slate-700 flex items-center gap-3">
              <Users className="w-6 h-6" />
              {t.competitorTable}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-gray-100 border-b-2 border-slate-200">
                <tr>
                  <th className={`p-4 text-left font-black text-slate-700 text-sm uppercase tracking-widest ${isRtl ? 'text-right' : ''}`}>{t.store}</th>
                  <th className={`p-4 text-left font-black text-slate-700 text-sm uppercase tracking-widest ${isRtl ? 'text-right' : ''}`}>{t.price}</th>
                  <th className={`p-4 text-left font-black text-slate-700 text-sm uppercase tracking-widest ${isRtl ? 'text-right' : ''}`}>{t.rating}</th>
                  <th className={`p-4 text-left font-black text-slate-700 text-sm uppercase tracking-widest ${isRtl ? 'text-right' : ''}`}>{t.shipping}</th>
                  <th className={`p-4 text-left font-black text-slate-700 text-sm uppercase tracking-widest ${isRtl ? 'text-right' : ''}`}>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.competitors.map((comp, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-700 hover:underline font-bold">
                        {comp.storeName}
                      </a>
                    </td>
                    <td className="p-4 font-black text-orange-700">{comp.price.toFixed(0)} {isRtl ? 'ر.س' : 'SAR'}</td>
                    <td className="p-4">
                      <span className="text-slate-700 px-3 py-1 text-sm font-black">
                        ⭐ {comp.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{comp.shippingDays} {t.days}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 text-xs font-black text-slate-700">
                        {comp.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Market Gaps */}
      {data.competitorIntelligence && data.competitorIntelligence.marketGaps.length > 0 && (
        <div className="bg-gradient-to-br from-orange-600 to-rose-600 rounded-[2rem] border-2 border-orange-500 p-8 shadow-lg">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6" />
            {t.marketGapsOpportunities}
          </h3>
          <div className="space-y-3">
            {data.competitorIntelligence.marketGaps.map((gap, i) => (
              <div key={i} className="bg-white bg-opacity-20 backdrop-blur-sm border-2 border-white border-opacity-30 rounded-xl p-4 flex items-start gap-3 hover:bg-opacity-30 transition-all">
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <p className="text-white font-medium">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Profitability Tab
  const renderProfitability = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      
      {data.profitabilityAnalysis && (
        <>
          {/* Profitability Section Header */}
          <div className="border-l-4 border-l-green-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-green-700 flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8" />
              {t.profitabilityAnalysis}
            </h2>
            <p className="text-slate-600 font-medium">{t.revenueAndProfit}</p>
          </div>

          {/* Profitability Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-[1.5rem] p-6 border-2 border-emerald-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.averageSalePrice}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.profitabilityAnalysis.averageSalePrice.toFixed(0)}
              </p>
              <p className="text-xs font-bold text-white opacity-90">SAR per unit</p>
            </div>

            <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
              data.profitabilityAnalysis.estimatedProfitMargin > 30
                ? 'from-green-600 to-green-700 border-green-500'
                : 'from-orange-600 to-orange-700 border-orange-500'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.profitMargin}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.profitabilityAnalysis.estimatedProfitMargin.toFixed(1)}%
              </p>
              <p className="text-xs font-bold text-white opacity-90">estimated</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[1.5rem] p-6 border-2 border-blue-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.breakEvenPoint}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.profitabilityAnalysis.breakEvenPoint}
              </p>
              <p className="text-xs font-bold text-white opacity-90">{isRtl ? 'وحدة' : 'units'}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-[1.5rem] p-6 border-2 border-purple-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.profitabilityScore}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.profitabilityAnalysis.profitabilityScore}%
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.strengthRating}</p>
            </div>

            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-[1.5rem] p-6 border-2 border-teal-500 shadow-lg hover:shadow-2xl transition-all md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.monthlyRevenue}</h3>
              </div>
              <p className="text-3xl font-black text-white">{data.profitabilityAnalysis.estimatedMonthlyRevenue}</p>
              <p className="text-xs font-bold text-white opacity-90 mt-2">{t.estimatedAtExpectedSales}</p>
            </div>
          </div>

          {/* Profitability Analysis */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-black text-sm">ر.س</span>
              {t.priceSensitivity}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.profitabilityAnalysis.priceSensitivity}</p>
          </div>
        </>
      )}

      {/* Operations & Financials */}
      {data.operationsFinancials && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-600" />
              {t.pricingViability}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.operationsFinancials.pricingViability}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              {t.expectedProfitMargins}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.operationsFinancials.expectedProfitMargins}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-3">
              <Share2 className="w-6 h-6 text-purple-600" />
              {t.supplyChainEase}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.operationsFinancials.supplyChainEase}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
              <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                {t.paymentMethods}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.operationsFinancials.recommendedPaymentMethods.map((method, i) => (
                  <span key={i} className="text-slate-700 px-2 py-1 text-sm font-bold">
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
              <h3 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-3">
                <Zap className="w-6 h-6 text-blue-600" />
                {t.deliveryMethods}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.operationsFinancials.recommendedDelivery.map((delivery, i) => (
                  <span key={i} className="text-slate-700 px-2 py-1 text-sm font-bold">
                    {delivery}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Decision Metrics Tab
  const renderDecisions = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      
      {/* Decisions Section Header */}
      <div className="border-l-4 border-l-purple-600 pl-6 mb-8 print-no-break">
        <h2 className="text-4xl font-black text-purple-700 flex items-center gap-3 mb-2">
          <Target className="w-8 h-8" />
          {t.decisionMetrics}
        </h2>
        <p className="text-slate-600 font-medium">{t.strategicDecisionFramework}</p>
      </div>

      {data.decisionMetrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
              data.decisionMetrics.successScore > 70
                ? 'from-green-600 to-green-700 border-green-500'
                : data.decisionMetrics.successScore > 40
                ? 'from-orange-600 to-orange-700 border-orange-500'
                : 'from-rose-600 to-rose-700 border-rose-500'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.successScore}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.decisionMetrics.successScore}%
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.probabilityOfSuccess}</p>
            </div>

            <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
              data.decisionMetrics.riskScore > 70
                ? 'from-rose-600 to-rose-700 border-rose-500'
                : data.decisionMetrics.riskScore > 40
                ? 'from-orange-600 to-orange-700 border-orange-500'
                : 'from-green-600 to-green-700 border-green-500'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.riskScore}</h3>
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.decisionMetrics.riskScore}%
              </p>
              <p className="text-xs font-bold text-white opacity-90">{isRtl ? 'مستوى المخاطر' : 'market risk level'}</p>
            </div>

            <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 shadow-lg hover:shadow-2xl transition-all ${
              data.decisionMetrics.beginnerFriendly
                ? 'from-emerald-600 to-emerald-700 border-emerald-500'
                : 'from-orange-600 to-orange-700 border-orange-500'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.beginnerFriendly}</h3>
              </div>
              <p className="text-3xl font-black text-white mb-2">
                {data.decisionMetrics.beginnerFriendly ? '✓ Yes' : '✗ No'}
              </p>
              <p className="text-xs font-bold text-white opacity-90">{t.easeOfEntry}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-[1.5rem] p-6 border-2 border-amber-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.capitalRequired}</h3>
              </div>
              <p className="text-2xl font-black text-white mb-2">{data.decisionMetrics.capitalRequired}</p>
              <p className="text-xs font-bold text-white opacity-90">{t.startupInvestment}</p>
            </div>
          </div>

          {/* Time to Profit */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] border-2 border-blue-500 p-8 shadow-lg">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-white" />
              {t.timeToProfit}
            </h3>
            <p className="text-2xl font-black text-white mb-2">{data.decisionMetrics.timeToProfit}</p>
            <p className="text-white opacity-90 font-medium">{t.estimatedBreakEven}</p>
          </div>

          {/* Final Recommendation */}
          <div className={`rounded-[2rem] border-2 p-8 shadow-lg ${
            data.decisionMetrics.recommendation === 'GO'
              ? 'bg-green-50 border-green-400'
              : data.decisionMetrics.recommendation === 'CAUTION'
              ? 'bg-orange-50 border-orange-400'
              : 'bg-rose-50 border-rose-400'
          }`}>
            <h3 className={`text-2xl font-black mb-4 flex items-center gap-3 ${
              data.decisionMetrics.recommendation === 'GO'
                ? 'text-green-700'
                : data.decisionMetrics.recommendation === 'CAUTION'
                ? 'text-orange-700'
                : 'text-rose-700'
            }`}>
              {data.decisionMetrics.recommendation === 'GO' ? (
                <>
                  <CheckCircle className="w-7 h-7" />
                  {isRtl ? 'انطلق - تقدم بثقة' : 'GO - Proceed with Confidence'}
                </>
              ) : data.decisionMetrics.recommendation === 'CAUTION' ? (
                <>
                  <AlertCircle className="w-7 h-7" />
                  {isRtl ? 'حذر - ضع المخاطر في الاعتبار' : 'CAUTION - Consider Risks'}
                </>
              ) : (
                <>
                  <AlertCircle className="w-7 h-7" />
                  {isRtl ? 'لا ينصح دخول السوق في هذا المجال' : 'NO-GO - Not Recommended'}
                </>
              )}
            </h3>
            <p className="text-slate-700 leading-relaxed font-medium">{t.basedOnAnalysis}</p>
          </div>
        </>
      )}
    </div>
  );

  // Render Opportunities Tab
  const renderOpportunities = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      
      {data.opportunityFinder && data.opportunityFinder.opportunities.length > 0 ? (
        <>
          {/* Opportunities Section Header */}
          <div className="border-l-4 border-l-pink-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-pink-700 flex items-center gap-3 mb-2">
              <Target className="w-8 h-8" />
              {t.growthOpportunities}
            </h2>
            <p className="text-slate-600 font-medium">{t.identifiedGaps}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.opportunityFinder.opportunities.map((opp, i) => (
              <div key={i} className="group">
                <div className={`bg-gradient-to-br rounded-[1.5rem] p-6 border-2 hover:shadow-2xl shadow-lg transition-all h-full ${
                  opp.potentialScore > 75
                    ? 'from-green-600 to-green-700 border-green-500'
                    : opp.potentialScore > 50
                    ? 'from-orange-600 to-orange-700 border-orange-500'
                    : 'from-slate-600 to-slate-700 border-slate-500'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white group-hover:bg-opacity-30 transition-colors backdrop-blur-sm">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-white bg-opacity-20 text-white backdrop-blur-sm">
                      {opp.potentialScore}%
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">
                    {isRtl && opp.titleAr ? opp.titleAr : opp.title}
                  </h3>
                  <p className="text-white opacity-90 font-medium mb-4 leading-relaxed">
                    {isRtl && opp.descriptionAr ? opp.descriptionAr : opp.description}
                  </p>
                  <div className="text-xs font-bold text-white opacity-80 uppercase tracking-widest">
                    {isRtl ? 'النوع' : 'Type'}: {isRtl ? (
                      opp.type === 'green' ? 'منطقة خضراء' :
                      opp.type === 'blue' ? 'منطقة زرقاء' :
                      opp.type === 'niche' ? 'سوق متخصص' :
                      opp.type === 'price' ? 'فرصة سعرية' :
                      opp.type === 'premium' ? 'منتج فاخر' :
                      opp.type
                    ) : opp.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-dashed border-gray-200 p-12 text-center shadow-lg">
          <p className="text-slate-400 font-bold">{isRtl ? 'لا توجد فرص محددة' : 'No specific opportunities identified'}</p>
        </div>
      )}

      {/* Strategic Analysis */}
      {data.strategicAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-4">{t.uniqueSellingProposition}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.strategicAnalysis.usp}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-lg font-black text-slate-700 mb-4">{t.saturationRisk}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.strategicAnalysis.saturationRisk}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg md:col-span-2">
            <h3 className="text-lg font-black text-slate-700 mb-4">{t.imitationRisk}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">{data.strategicAnalysis.imitationRisk}</p>
          </div>
        </div>
      )}

      {/* SWOT Analysis */}
      {data.swot && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-[1.5rem] border-2 border-emerald-500 p-6 shadow-lg">
            <h3 className="text-lg font-black text-white mb-4">{t.swotStrengths}</h3>
            <ul className="space-y-2">
              {data.swot.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium text-white">
                  <span className="text-lg">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-red-600 rounded-[1.5rem] border-2 border-rose-500 p-6 shadow-lg">
            <h3 className="text-lg font-black text-white mb-4">{t.swotWeaknesses}</h3>
            <ul className="space-y-2">
              {data.swot.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium text-white">
                  <span className="text-lg">✕</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-[1.5rem] border-2 border-blue-500 p-6 shadow-lg">
            <h3 className="text-lg font-black text-white mb-4">{t.swotOpportunities}</h3>
            <ul className="space-y-2">
              {data.swot.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium text-white">
                  <span className="text-lg">◆</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-[1.5rem] border-2 border-amber-500 p-6 shadow-lg">
            <h3 className="text-lg font-black text-white mb-4">{t.swotThreats}</h3>
            <ul className="space-y-2">
              {data.swot.threats.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium text-white">
                  <span className="text-lg">⚠</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  // Render Buyer Intent Tab
  const renderBuyerIntent = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      {data.buyerIntentAnalysis && (
        <>
          {/* Buyer Intent Section Header */}
          <div className="border-l-4 border-l-purple-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-purple-700 flex items-center gap-3 mb-2">
              <Target className="w-8 h-8" />
              {t.buyerIntentAnalysis}
            </h2>
            <p className="text-slate-600 font-medium">{t.buyerIntentDescription}</p>
          </div>

          {/* Intent Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-[1.5rem] p-6 border-2 border-purple-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.intentScore}</h3>
                <Zap className="w-5 h-5 text-white opacity-80" />
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {data.buyerIntentAnalysis.intentScore}%
              </p>
              <p className="text-xs font-bold text-white opacity-90 mt-2">
                {data.buyerIntentAnalysis.intentLevel === 'High' ? t.high : data.buyerIntentAnalysis.intentLevel === 'Medium' ? t.medium : t.low}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[1.5rem] p-6 border-2 border-indigo-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.searchIntentType}</h3>
                <Eye className="w-5 h-5 text-white opacity-80" />
              </div>
              <p className="text-2xl font-black text-white mb-2">
                {data.buyerIntentAnalysis.searchIntentType === 'Transactional' ? t.transactional : data.buyerIntentAnalysis.searchIntentType === 'Informational' ? t.informational : t.mixed}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-[1.5rem] p-6 border-2 border-pink-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.conversionProbability}</h3>
                <TrendingUp className="w-5 h-5 text-white opacity-80" />
              </div>
              <p className="text-4xl font-black text-white mb-2">
                {Math.round(data.buyerIntentAnalysis.conversionProbability * 100)}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-[1.5rem] p-6 border-2 border-violet-500 shadow-lg hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t.buyerJourneyStage}</h3>
                <MapPin className="w-5 h-5 text-white opacity-80" />
              </div>
              <p className="text-sm font-bold text-white">
                {data.buyerIntentAnalysis.buyerJourneyStage}
              </p>
            </div>
          </div>

          {/* Keyword Analysis */}
          {data.buyerIntentAnalysis.keywordAnalysis && (
            <div className="bg-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
              <h3 className="text-2xl font-black text-slate-700 mb-6">{t.keywordAnalysis}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.buyerIntentAnalysis.keywordAnalysis.transactionalKeywords.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-bold text-green-700 mb-3">{t.transactionalKeywords}</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.buyerIntentAnalysis.keywordAnalysis.transactionalKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.buyerIntentAnalysis.keywordAnalysis.informationalKeywords.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-bold text-blue-700 mb-3">{t.informationalKeywords}</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.buyerIntentAnalysis.keywordAnalysis.informationalKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.buyerIntentAnalysis.keywordAnalysis.brandKeywords.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-700 mb-3">{t.brandKeywords}</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.buyerIntentAnalysis.keywordAnalysis.brandKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {data.buyerIntentAnalysis.insights && data.buyerIntentAnalysis.insights.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2rem] border-2 border-purple-200 p-8 shadow-lg">
              <h3 className="text-2xl font-black text-purple-700 mb-6 flex items-center gap-3">
                <Lightbulb className="w-6 h-6" />
                {t.insights}
              </h3>
              <div className="space-y-3">
                {data.buyerIntentAnalysis.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-purple-200">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Growth Scenarios Tab
  const renderGrowthScenarios = () => {
    // Helper function to translate timeframe
    const translateTimeframe = (timeframe: string) => {
      if (!isRtl) return timeframe;
      const translations: Record<string, string> = {
        '6-12 months': '6-12 شهر',
        '3-6 months': '3-6 أشهر',
        '1-3 months': '1-3 أشهر',
      };
      return translations[timeframe] || timeframe;
    };

    // Render scenario card
    const renderScenarioCard = (
      scenario: any, 
      title: string, 
      isRecommended: boolean,
      colorScheme: { bg: string; border: string; header: string; text: string }
    ) => (
      <div className={`rounded-[2rem] border-2 overflow-hidden shadow-lg transition-all hover:shadow-xl ${
        isRecommended ? `${colorScheme.border} ring-4 ring-opacity-30` : 'border-gray-200 bg-white'
      }`}>
        {/* Header */}
        <div className={`${isRecommended ? colorScheme.header : 'bg-slate-100'} p-5`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-black ${isRecommended ? 'text-white' : 'text-slate-700'}`}>
              {title}
            </h3>
            {isRecommended && (
              <span className="bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1 rounded-full">
                {isRtl ? '✓ موصى به' : '✓ Recommended'}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-white">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Units Sold */}
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-slate-500 mb-1">{isRtl ? 'المبيعات الشهرية' : 'Monthly Sales'}</p>
              <p className="text-2xl font-black text-slate-700">
                {scenario.costBreakdown?.unitsSold || 0}
              </p>
              <p className="text-xs text-slate-500">{isRtl ? 'وحدة' : 'units'}</p>
            </div>
            
            {/* Growth Rate */}
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-slate-500 mb-1">{t.growthRate}</p>
              <p className="text-2xl font-black text-teal-600">{scenario.growthRate}%</p>
              <p className="text-xs text-slate-500">{isRtl ? 'شهرياً' : 'monthly'}</p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-3 mb-6">
            {/* Revenue */}
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-bold text-green-700">{t.monthlyRevenue}</span>
              <span className="text-lg font-black text-green-600">
                {scenario.monthlyRevenue.toLocaleString()} {t.sar}
              </span>
            </div>
            
            {/* Costs Section */}
            {scenario.costBreakdown && (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs font-bold text-slate-500 mb-2">{isRtl ? 'تفاصيل التكاليف' : 'Cost Breakdown'}</p>
                  
                  <div className="space-y-2">
                    {/* Product Costs */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{isRtl ? 'تكلفة المنتجات' : 'Product Costs'}</span>
                      <span className="font-bold text-red-500">
                        -{scenario.costBreakdown.productCosts.toLocaleString()} {t.sar}
                      </span>
                    </div>
                    
                    {/* Shipping Costs */}
                    {scenario.costBreakdown.shippingCosts > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{isRtl ? 'تكاليف الشحن' : 'Shipping Costs'}</span>
                        <span className="font-bold text-red-400">
                          -{scenario.costBreakdown.shippingCosts.toLocaleString()} {t.sar}
                        </span>
                      </div>
                    )}
                    
                    {/* Platform Fees */}
                    {scenario.costBreakdown.platformFees > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{isRtl ? 'رسوم المنصة' : 'Platform Fees'}</span>
                        <span className="font-bold text-red-400">
                          -{scenario.costBreakdown.platformFees.toLocaleString()} {t.sar}
                        </span>
                      </div>
                    )}
                    
                    {/* Marketing */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{isRtl ? 'ميزانية التسويق' : 'Marketing Budget'}</span>
                      <span className="font-bold text-orange-500">
                        -{scenario.costBreakdown.marketingBudget.toLocaleString()} {t.sar}
                      </span>
                    </div>
                    
                    {/* Operational */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{isRtl ? 'مصاريف تشغيلية' : 'Operational Expenses'}</span>
                      <span className="font-bold text-amber-500">
                        -{scenario.costBreakdown.operationalExpenses.toLocaleString()} {t.sar}
                      </span>
                    </div>
                    
                    {/* Total Costs */}
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                      <span className="text-sm font-bold text-red-700">{isRtl ? 'إجمالي التكاليف' : 'Total Costs'}</span>
                      <span className="font-black text-red-600">
                        -{scenario.costBreakdown.totalCosts.toLocaleString()} {t.sar}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Net Profit */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
              <span className="text-sm font-bold text-blue-700">{isRtl ? 'صافي الربح' : 'Net Profit'}</span>
              <span className="text-xl font-black text-blue-600">
                {scenario.monthlyProfit.toLocaleString()} {t.sar}
              </span>
            </div>
            
            {/* Profit Margin Percentage */}
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500">{isRtl ? 'هامش الربح الصافي' : 'Net Profit Margin'}: </span>
              <span className="text-sm font-black text-slate-700">
                {scenario.monthlyRevenue > 0 ? Math.round((scenario.monthlyProfit / scenario.monthlyRevenue) * 100) : 0}%
              </span>
            </div>
            
            {/* Per Unit Info */}
            {scenario.costBreakdown?.pricePerUnit && (
              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-[10px] text-green-600 font-bold">{isRtl ? 'سعر الوحدة' : 'Price/Unit'}</p>
                  <p className="text-sm font-black text-green-700">{scenario.costBreakdown.pricePerUnit} {t.sar}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-[10px] text-red-600 font-bold">{isRtl ? 'تكلفة الوحدة' : 'Cost/Unit'}</p>
                  <p className="text-sm font-black text-red-700">{scenario.costBreakdown.costPerUnit} {t.sar}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-[10px] text-blue-600 font-bold">{isRtl ? 'ربح الوحدة' : 'Profit/Unit'}</p>
                  <p className="text-sm font-black text-blue-700">{scenario.costBreakdown.profitPerUnit} {t.sar}</p>
                </div>
              </div>
            )}
          </div>

          {/* Timeframe */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">{t.timeframe}</span>
              <span className="text-lg font-black text-slate-700">{translateTimeframe(scenario.timeframe)}</span>
            </div>
          </div>

          {/* Assumptions */}
          <div className="border-t-2 border-gray-100 pt-4">
            <p className="text-xs font-bold text-slate-500 mb-2">{t.assumptions}</p>
            <ul className="space-y-1">
              {scenario.assumptions.filter((_: string, i: number) => isRtl ? i % 2 === 0 : i % 2 === 1).slice(0, 3).map((assumption: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-teal-500">•</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );

    return (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      {data.growthScenarios && (
        <>
          {/* Growth Scenarios Section Header */}
          <div className="border-l-4 border-l-teal-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-teal-700 flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8" />
              {t.growthScenarios}
            </h2>
            <p className="text-slate-600 font-medium">{t.growthScenariosDescription}</p>
          </div>

          {/* Recommended Scenario Badge */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-[2rem] p-6 text-white shadow-lg">
            <p className="text-sm font-bold uppercase tracking-widest mb-2">{t.recommendedScenario}</p>
            <p className="text-3xl font-black">
              {data.growthScenarios.recommendedScenario === 'conservative' ? t.conservativeScenario : 
               data.growthScenarios.recommendedScenario === 'moderate' ? t.moderateScenario : 
               t.optimisticScenario}
            </p>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conservative */}
            {renderScenarioCard(
              data.growthScenarios.conservative,
              t.conservativeScenario,
              data.growthScenarios.recommendedScenario === 'conservative',
              { bg: 'bg-amber-50', border: 'border-amber-400 ring-amber-200', header: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-amber-700' }
            )}

            {/* Moderate */}
            {renderScenarioCard(
              data.growthScenarios.moderate,
              t.moderateScenario,
              data.growthScenarios.recommendedScenario === 'moderate',
              { bg: 'bg-teal-50', border: 'border-teal-400 ring-teal-200', header: 'bg-gradient-to-r from-teal-500 to-cyan-500', text: 'text-teal-700' }
            )}

            {/* Optimistic */}
            {renderScenarioCard(
              data.growthScenarios.optimistic,
              t.optimisticScenario,
              data.growthScenarios.recommendedScenario === 'optimistic',
              { bg: 'bg-green-50', border: 'border-green-400 ring-green-200', header: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-green-700' }
            )}
          </div>

          {/* Scalability Factors */}
          {data.growthScenarios.scalabilityFactors && data.growthScenarios.scalabilityFactors.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-[2rem] border-2 border-teal-200 p-8 shadow-lg">
              <h3 className="text-2xl font-black text-teal-700 mb-6">{t.scalabilityFactors}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.growthScenarios.scalabilityFactors.filter((_: string, i: number) => isRtl ? i % 2 === 0 : i % 2 === 1).map((factor: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-teal-200">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 font-medium">{factor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )};

  // Render Executive Summary Tab
  const renderExecutiveSummary = () => (
    <div className="space-y-8 animate-in fade-in duration-500 print-page-break">
      {data.executiveSummary && (
        <>
          {/* Executive Summary Section Header */}
          <div className="border-l-4 border-l-amber-600 pl-6 mb-8 print-no-break">
            <h2 className="text-4xl font-black text-amber-700 flex items-center gap-3 mb-2">
              <Target className="w-8 h-8" />
              {t.executiveSummary}
            </h2>
          </div>

          {/* Quick Summary Cards from All Tabs */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] border-2 border-slate-200 p-8 shadow-lg">
            <h3 className="text-2xl font-black text-slate-700 mb-6 flex items-center gap-2">
              <span>📊</span>
              {isRtl ? 'ملخص سريع من جميع الأقسام' : 'Quick Summary from All Sections'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Demand Summary */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'الطلب' : 'Demand'}</p>
                <p className="text-3xl font-black">{data.demandAnalysis?.demandScore || 0}%</p>
                <p className="text-xs opacity-80">{data.demandAnalysis?.monthlyDemandEstimate || 0} {isRtl ? 'وحدة/شهر' : 'units/mo'}</p>
              </div>
              
              {/* Competitors Summary */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'المنافسون' : 'Competitors'}</p>
                <p className="text-3xl font-black">{data.competitorIntelligence?.activeCompetitors || 0}</p>
                <p className="text-xs opacity-80">{isRtl ? 'قوة' : 'Strength'}: {data.competitorIntelligence?.competitorStrengthIndex || 0}%</p>
              </div>
              
              {/* Profitability Summary */}
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'الربحية' : 'Profit'}</p>
                <p className="text-3xl font-black">{data.profitabilityAnalysis?.estimatedProfitMargin || 0}%</p>
                <p className="text-xs opacity-80">{data.profitabilityAnalysis?.estimatedMonthlyRevenue || ''}</p>
              </div>
              
              {/* Buyer Intent Summary */}
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'نية الشراء' : 'Intent'}</p>
                <p className="text-3xl font-black">{data.buyerIntentAnalysis?.intentScore || 0}%</p>
                <p className="text-xs opacity-80">{data.buyerIntentAnalysis?.intentLevel === 'High' ? (isRtl ? 'عالية' : 'High') : data.buyerIntentAnalysis?.intentLevel === 'Medium' ? (isRtl ? 'متوسطة' : 'Medium') : (isRtl ? 'منخفضة' : 'Low')}</p>
              </div>
              
              {/* Success Score */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'فرصة النجاح' : 'Success'}</p>
                <p className="text-3xl font-black">{data.decisionMetrics?.successScore || 0}%</p>
                <p className="text-xs opacity-80">{isRtl ? 'احتمالية' : 'Probability'}</p>
              </div>
              
              {/* Risk Score */}
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'المخاطرة' : 'Risk'}</p>
                <p className="text-3xl font-black">{data.decisionMetrics?.riskScore || 0}%</p>
                <p className="text-xs opacity-80">{isRtl ? 'مستوى' : 'Level'}</p>
              </div>
              
              {/* Opportunities */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'الفرص' : 'Opportunities'}</p>
                <p className="text-3xl font-black">{data.opportunityFinder?.opportunities?.length || 0}</p>
                <p className="text-xs opacity-80">{isRtl ? 'فرصة متاحة' : 'Available'}</p>
              </div>
              
              {/* Growth Scenario */}
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-4 text-white">
                <p className="text-xs font-bold opacity-80 mb-1">{isRtl ? 'السيناريو' : 'Scenario'}</p>
                <p className="text-lg font-black">
                  {data.growthScenarios?.recommendedScenario === 'optimistic' 
                    ? (isRtl ? 'متفائل' : 'Optimistic')
                    : data.growthScenarios?.recommendedScenario === 'moderate'
                    ? (isRtl ? 'متوسط' : 'Moderate')
                    : (isRtl ? 'متحفظ' : 'Conservative')}
                </p>
                <p className="text-xs opacity-80">{isRtl ? 'الموصى به' : 'Recommended'}</p>
              </div>
            </div>
          </div>

          {/* One Page Summary */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border-2 border-amber-300 p-8 shadow-lg">
            <h3 className="text-2xl font-black text-amber-700 mb-6">{t.onePageSummary}</h3>
            <div className="space-y-3">
              {data.executiveSummary.onePageSummary.split('\n').map((line, i) => (
                <p key={i} className="text-slate-700 leading-relaxed font-medium">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Key Findings */}
          {data.executiveSummary.keyFindings && data.executiveSummary.keyFindings.length > 0 && (
            <div className="bg-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
              <h3 className="text-2xl font-black text-slate-700 mb-6">{t.keyFindings}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.executiveSummary.keyFindings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 font-medium">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Metrics */}
          <div className="bg-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
            <h3 className="text-2xl font-black text-slate-700 mb-6">{t.criticalMetrics}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p className="text-sm font-bold text-slate-500 mb-2">{t.marketSize}</p>
                <p className="text-2xl font-black text-slate-700">{data.executiveSummary.criticalMetrics.marketSize}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p className="text-sm font-bold text-slate-500 mb-2">{t.demand}</p>
                <p className="text-2xl font-black text-slate-700">{data.executiveSummary.criticalMetrics.demandLevel}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p className="text-sm font-bold text-slate-500 mb-2">{t.competitorAnalysis}</p>
                <p className="text-2xl font-black text-slate-700">{data.executiveSummary.criticalMetrics.competitionLevel}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p className="text-sm font-bold text-slate-500 mb-2">{t.profitabilityAnalysis}</p>
                <p className="text-2xl font-black text-slate-700">{data.executiveSummary.criticalMetrics.profitPotential}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p className="text-sm font-bold text-slate-500 mb-2">{t.riskScore}</p>
                <p className="text-2xl font-black text-slate-700">{data.executiveSummary.criticalMetrics.riskLevel}</p>
              </div>
            </div>
          </div>

          {/* Investment Required */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-[2rem] p-8 text-white shadow-lg">
            <h3 className="text-2xl font-black mb-6">{t.investmentRequired}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-bold opacity-90 mb-2">{t.initialInvestment}</p>
                <p className="text-3xl font-black">{data.executiveSummary.investmentRequired.initial.toLocaleString()} {t.sar}</p>
              </div>
              <div>
                <p className="text-sm font-bold opacity-90 mb-2">{t.monthlyInvestment}</p>
                <p className="text-3xl font-black">{data.executiveSummary.investmentRequired.monthly.toLocaleString()} {t.sar}</p>
              </div>
              <div>
                <p className="text-sm font-bold opacity-90 mb-2">{t.breakEven}</p>
                <p className="text-3xl font-black">{data.executiveSummary.investmentRequired.breakEven}</p>
              </div>
            </div>
          </div>

          {/* Opportunities & Market Gaps Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Opportunities */}
            {data.opportunityFinder?.opportunities && data.opportunityFinder.opportunities.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2rem] border-2 border-green-200 p-6 shadow-lg">
                <h3 className="text-xl font-black text-green-700 mb-4 flex items-center gap-2">
                  <span>✨</span>
                  {isRtl ? 'أفضل الفرص' : 'Top Opportunities'}
                </h3>
                <div className="space-y-2">
                  {data.opportunityFinder.opportunities.slice(0, 3).map((opp: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-green-100">
                      <span className="text-green-600 font-bold">{i + 1}.</span>
                      <p className="text-sm text-slate-700 font-medium">{opp.opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Market Gaps */}
            {data.competitorIntelligence?.marketGaps && data.competitorIntelligence.marketGaps.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] border-2 border-blue-200 p-6 shadow-lg">
                <h3 className="text-xl font-black text-blue-700 mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  {isRtl ? 'فجوات السوق' : 'Market Gaps'}
                </h3>
                <div className="space-y-2">
                  {data.competitorIntelligence.marketGaps.slice(0, 3).map((gap: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <span className="text-blue-600">•</span>
                      <p className="text-sm text-slate-700 font-medium">{gap}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Growth Projections Summary */}
          {data.growthScenarios && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-[2rem] border-2 border-teal-200 p-6 shadow-lg">
              <h3 className="text-xl font-black text-teal-700 mb-4 flex items-center gap-2">
                <span>📈</span>
                {isRtl ? 'توقعات النمو (السيناريو الموصى به)' : 'Growth Projections (Recommended Scenario)'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const scenario = data.growthScenarios[data.growthScenarios.recommendedScenario];
                  return (
                    <>
                      <div className="bg-white rounded-xl p-4 text-center border border-teal-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">{isRtl ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</p>
                        <p className="text-xl font-black text-teal-700">{scenario?.monthlyRevenue?.toLocaleString() || 0} {t.sar}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center border border-teal-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">{isRtl ? 'الربح الشهري' : 'Monthly Profit'}</p>
                        <p className="text-xl font-black text-green-600">{scenario?.monthlyProfit?.toLocaleString() || 0} {t.sar}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center border border-teal-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">{isRtl ? 'الوحدات المتوقعة' : 'Expected Units'}</p>
                        <p className="text-xl font-black text-slate-700">{scenario?.costBreakdown?.unitsSold || 0}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center border border-teal-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">{isRtl ? 'معدل النمو' : 'Growth Rate'}</p>
                        <p className="text-xl font-black text-teal-700">{scenario?.growthRate || 0}% {isRtl ? '/شهر' : '/mo'}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Strategic Recommendation */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-[2rem] p-8 text-white shadow-lg">
            <h3 className="text-2xl font-black mb-4">{t.strategicRecommendation}</h3>
            <p className="text-lg font-medium leading-relaxed">{data.executiveSummary.strategicRecommendation}</p>
          </div>

          {/* Next Steps */}
          {data.executiveSummary.nextSteps && data.executiveSummary.nextSteps.length > 0 && (
            <div className="bg-slate-50 rounded-[2rem] border-2 border-gray-200 p-8 shadow-lg">
              <h3 className="text-2xl font-black text-slate-700 mb-6">{t.nextSteps}</h3>
              <div className="space-y-3">
                {data.executiveSummary.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-black flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 font-medium mt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* Print Header - يظهر فقط عند الطباعة */}
      <div className="hidden print:block" style={{ pageBreakAfter: 'avoid' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '3px solid #000' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: '900', marginBottom: '10px', color: '#000' }}>
            {isRtl ? 'تقرير تحليل بلس - تحليل السوق السعودي' : 'Tahleel Plus Report - Saudi Market Analysis'}
          </h1>
          <p style={{ fontSize: '12pt', color: '#333', marginBottom: '5px' }}>
            {isRtl ? `المنتج: ${data.itemName}` : `Product: ${data.itemName}`}
          </p>
          <p style={{ fontSize: '10pt', color: '#666' }}>
            {isRtl ? `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}` : `Report Date: ${new Date().toLocaleDateString('en-US')}`}
          </p>
        </div>
      </div>

      {/* Action bar pinned above results */}
      <div
        className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 shadow-lg bg-white/95 backdrop-blur no-print mb-6"
      >
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse order-2' : ''}`}>
          {/* زر تحميل PDF */}
          <button
            onClick={handleDownloadPDF}
            className={`px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 flex items-center gap-2 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}
            title={isRtl ? 'تحميل PDF' : 'Download PDF'}
          >
            <FileDown className="w-5 h-5" />
            {isRtl ? 'تحميل PDF' : 'PDF'}
          </button>
          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 flex items-center gap-2 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}
            title={isRtl ? 'طباعة التقرير الكامل' : 'Print Full Report'}
          >
            <Printer className="w-5 h-5" />
            {isRtl ? 'طباعة' : 'Print'}
          </button>
          <button
            onClick={handleSave}
            disabled={isTranslating}
            className={`px-6 py-3 font-black rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 flex items-center gap-2 uppercase tracking-widest ${
              isTranslating ? 'bg-yellow-500 hover:bg-yellow-600' : saved ? 'bg-green-600 hover:bg-green-700' : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white ${isRtl ? 'flex-row-reverse' : ''} ${isTranslating ? 'cursor-wait' : ''}`}
            title={isRtl ? 'حفظ في المكتبة' : 'Save to Library'}
          >
            {isTranslating ? (
              <>
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isRtl ? 'جاري الترجمة...' : 'Translating...'}
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                {isRtl ? 'تم الحفظ' : 'Saved'}
              </>
            ) : (
              <>
                <BookmarkPlus className="w-5 h-5" />
                {isRtl ? 'حفظ في المكتبة' : 'Save to Library'}
              </>
            )}
          </button>
        </div>
        <div className={`flex-1 min-w-[200px] ${isRtl ? 'text-right order-1' : ''}`}>
          <p className="text-sm font-black text-slate-700">
            {isRtl ? 'طباعة التقارير' : 'Print Reports'}
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {isRtl ? 'طباعة كاملة أو قسم واحد من الأقسام' : 'Print full report or individual sections'}
          </p>
        </div>
      </div>

      {/* Tab Navigation - Professional Colors */}
      <div className="mb-4 no-print">
        <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
          {[
            { id: 'overview', label: isRtl ? 'نظرة عامة' : 'Overview', bg: 'bg-blue-600 hover:bg-blue-700' },
            { id: 'demand', label: isRtl ? 'الطلب' : 'Demand', bg: 'bg-emerald-600 hover:bg-emerald-700' },
            { id: 'competitors', label: isRtl ? 'المنافسون' : 'Competitors', bg: 'bg-orange-600 hover:bg-orange-700' },
            { id: 'profitability', label: isRtl ? 'الربحية' : 'Profitability', bg: 'bg-green-600 hover:bg-green-700' },
            { id: 'decisions', label: isRtl ? 'المقاييس' : 'Decisions', bg: 'bg-purple-600 hover:bg-purple-700' },
            { id: 'opportunities', label: isRtl ? 'الفرص' : 'Opportunities', bg: 'bg-pink-600 hover:bg-pink-700' },
            { id: 'buyerIntent', label: isRtl ? 'نية الشراء' : 'Buyer Intent', bg: 'bg-violet-600 hover:bg-violet-700' },
            { id: 'growth', label: isRtl ? 'النمو' : 'Growth', bg: 'bg-teal-600 hover:bg-teal-700' },
            { id: 'executive', label: isRtl ? 'الملخص' : 'Summary', bg: 'bg-amber-600 hover:bg-amber-700' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 font-bold text-xs md:text-sm rounded-lg transition-all text-white ${tab.bg} ${
                  isActive ? 'ring-1 ring-gray-300/50' : 'opacity-75'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-[2rem] border-2 border-gray-200 p-4 md:p-8 shadow-lg print:border-0 print:p-0">
        {/* Navigation Component */}
        {(() => {
          const tabIds = ['overview', 'demand', 'competitors', 'profitability', 'decisions', 'opportunities', 'buyerIntent', 'growth', 'executive'];
          const tabLabels = isRtl 
            ? ['نظرة عامة', 'الطلب', 'المنافسون', 'الربحية', 'المقاييس', 'الفرص', 'نية الشراء', 'النمو', 'الملخص']
            : ['Overview', 'Demand', 'Competitors', 'Profitability', 'Decisions', 'Opportunities', 'Buyer Intent', 'Growth', 'Summary'];
          const currentIndex = tabIds.indexOf(activeTab);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : null;
          const nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : null;
          
          // دالة للتنقل مع التمرير لأعلى الصفحة
          const navigateToTab = (tabId: string) => {
            setActiveTab(tabId as any);
            // التمرير لأعلى الصفحة
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          
          const NavigationButtons = () => (
            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-slate-200 no-print">
              {prevIndex !== null ? (
                <button
                  onClick={() => navigateToTab(tabIds[prevIndex])}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all text-sm font-bold"
                >
                  <span>←</span>
                  <span>{isRtl ? 'السابق:' : 'Previous:'} {tabLabels[prevIndex]}</span>
                </button>
              ) : <div />}
              
              <span className="text-sm text-slate-500 font-bold bg-slate-100 px-4 py-2 rounded-lg">
                {currentIndex + 1} / {tabIds.length}
              </span>
              
              {nextIndex !== null ? (
                <button
                  onClick={() => navigateToTab(tabIds[nextIndex])}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-bold"
                >
                  <span>{isRtl ? 'التالي:' : 'Next:'} {tabLabels[nextIndex]}</span>
                  <span>→</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-bold">
                  ✅ {isRtl ? 'اكتمل التحليل!' : 'Analysis Complete!'}
                </div>
              )}
            </div>
          );
          
          return (
            <>
              {/* Overview Section */}
              <div className={`tab-content-section ${activeTab !== 'overview' ? 'hidden print:block' : ''}`} data-section="overview">
                {renderOverview()}
                {activeTab === 'overview' && <NavigationButtons />}
                <div className="print:hidden" />
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>
              
              {/* Demand Section */}
              <div className={`tab-content-section ${activeTab !== 'demand' ? 'hidden print:block' : ''}`} data-section="demand">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '📊 تحليل الطلب' : '📊 Demand Analysis'}
                  </h1>
                </div>
                {renderDemand()}
                {activeTab === 'demand' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>
              
              {/* Competitors Section */}
              <div className={`tab-content-section ${activeTab !== 'competitors' ? 'hidden print:block' : ''}`} data-section="competitors">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '👥 تحليل المنافسين' : '👥 Competitor Analysis'}
                  </h1>
                </div>
                {renderCompetitors()}
                {activeTab === 'competitors' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>
              
              {/* Profitability Section */}
              <div className={`tab-content-section ${activeTab !== 'profitability' ? 'hidden print:block' : ''}`} data-section="profitability">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '💰 تحليل الربحية' : '💰 Profitability Analysis'}
                  </h1>
                </div>
                {renderProfitability()}
                {activeTab === 'profitability' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>
              
              {/* Decisions Section */}
              <div className={`tab-content-section ${activeTab !== 'decisions' ? 'hidden print:block' : ''}`} data-section="decisions">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '🎯 مقاييس القرار' : '🎯 Decision Metrics'}
                  </h1>
                </div>
                {renderDecisions()}
                {activeTab === 'decisions' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>
              
              {/* Opportunities Section */}
              <div className={`tab-content-section ${activeTab !== 'opportunities' ? 'hidden print:block' : ''}`} data-section="opportunities">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '🚀 فرص النمو' : '🚀 Growth Opportunities'}
                  </h1>
                </div>
                {renderOpportunities()}
                {activeTab === 'opportunities' && <NavigationButtons />}
              </div>

              {/* Buyer Intent Section */}
              <div className={`tab-content-section ${activeTab !== 'buyerIntent' ? 'hidden print:block' : ''}`} data-section="buyerIntent">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '🎯 تحليل نية الشراء' : '🎯 Buyer Intent Analysis'}
                  </h1>
                </div>
                {renderBuyerIntent()}
                {activeTab === 'buyerIntent' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>

              {/* Growth Scenarios Section */}
              <div className={`tab-content-section ${activeTab !== 'growth' ? 'hidden print:block' : ''}`} data-section="growth">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '📈 سيناريوهات النمو' : '📈 Growth Scenarios'}
                  </h1>
                </div>
                {renderGrowthScenarios()}
                {activeTab === 'growth' && <NavigationButtons />}
                <div className="hidden print:block" style={{ pageBreakAfter: 'always' }} />
              </div>

              {/* Executive Summary Section */}
              <div className={`tab-content-section ${activeTab !== 'executive' ? 'hidden print:block' : ''}`} data-section="executive">
                <div className="hidden print:block" style={{ marginTop: '0' }}>
                  <h1 style={{ fontSize: '22pt', fontWeight: '900', marginBottom: '20px', paddingBottom: '10px', borderBottom: '3px solid #000', color: '#000' }}>
                    {isRtl ? '📋 الملخص التنفيذي' : '📋 Executive Summary'}
                  </h1>
                </div>
                {renderExecutiveSummary()}
                {activeTab === 'executive' && <NavigationButtons />}
              </div>
            </>
          );
        })()}
      </div>

      {/* Publish Modal - عند الحفظ */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-[2rem] shadow-2xl max-w-md w-full border-2 border-blue-200 animate-in fade-in slide-in-from-bottom-4 duration-300 ${isRtl ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-[2rem] p-6 text-white">
              <h3 className={`text-2xl font-black flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Upload className="w-6 h-6 flex-shrink-0" />
                {isRtl ? 'نشر التحليل' : 'Publish Analysis'}
              </h3>
              <p className="text-sm opacity-90 mt-2">
                {isRtl ? 'شارك هذا التحليل مع الجميع في مكتبة التحليلات' : 'Share this analysis with everyone in the library'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Region Info */}
              <div className={`bg-blue-50 border-2 border-blue-200 rounded-xl p-4 ${isRtl ? 'text-right' : ''}`}>
                <p className="text-sm font-bold text-blue-700 mb-2">{isRtl ? 'المنطقة' : 'Region'}</p>
                <p className="text-lg font-black text-slate-900">
                  🌍 {REGIONS.find(r => r.code === region)?.[isRtl ? 'nameAr' : 'nameEn'] || region}
                </p>
              </div>

              {/* Product Name */}
              <div className={`bg-slate-50 border-2 border-slate-200 rounded-xl p-4 ${isRtl ? 'text-right' : ''}`}>
                <p className="text-sm font-bold text-slate-700 mb-2">{isRtl ? 'المنتج' : 'Product'}</p>
                <p className="text-lg font-black text-slate-900 truncate">{queryStr}</p>
              </div>

              {/* Category Selection - REQUIRED */}
              <div className={`border-2 border-red-300 bg-red-50 rounded-xl p-4 ${isRtl ? 'text-right' : ''}`}>
                <label className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                  {isRtl ? (
                    <>
                      <span>*</span>
                      <span>اختر قسم النشر</span>
                    </>
                  ) : (
                    <>
                      <span>Select Category *</span>
                      <span>*</span>
                    </>
                  )}
                </label>
                {loadingCategories ? (
                  <div className="text-slate-600 font-bold text-sm">
                    {isRtl ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : categories.length > 0 ? (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-4 py-2.5 border-2 border-red-300 rounded-lg font-bold bg-white text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 ${isRtl ? 'text-right' : ''}`}
                  >
                    <option value="">{isRtl ? '-- اختر قسم --' : '-- Select Category --'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {isRtl ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-slate-600 font-bold text-sm">
                    {isRtl ? 'لا توجد أقسام متاحة' : 'No categories available'}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className={`bg-amber-50 border-2 border-amber-200 rounded-xl p-4 ${isRtl ? 'text-right' : ''}`}>
                <p className="text-sm text-amber-700 font-medium">
                  {isRtl 
                    ? '⚠️ سيكون هذا التحليل مرئياً لجميع المستخدمين في مكتبة التحليلات العامة'
                    : '⚠️ This analysis will be visible to all users in the public library'
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className={`border-t-2 border-slate-200 p-6 flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => {
                  setPublishModal(false);
                  setSelectedCategory('');
                }}
                disabled={publishing}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {isRtl ? 'حفظ فقط في مكتبتي' : 'Save Only to My Library'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !selectedCategory}
                className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''} ${
                  !selectedCategory || publishing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={!selectedCategory ? (isRtl ? 'اختر قسم أولاً' : 'Select category first') : ''}
              >
                <Upload className={`w-4 h-4 ${publishing ? 'animate-spin' : ''}`} />
                {publishing ? (isRtl ? 'جاري النشر...' : 'Publishing...') : (isRtl ? 'نشر الآن' : 'Publish Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { AnalysisResult, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { saveAnalysis } from '../services/userService';
import { auth } from '../services/firebase';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line
} from 'recharts';

interface Props {
  data: AnalysisResult;
  lang: Language;
  queryStr?: string;
}

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 print:shadow-none print:border-slate-300 print:break-inside-avoid">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 print:shadow-none print:bg-slate-900">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const DataPoint: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className="py-4 border-b border-slate-50 last:border-0 group print:border-slate-100">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-blue-400 transition-colors print:text-slate-500">{label}</p>
    <p className={`text-base font-bold ${highlight ? 'text-blue-600 underline decoration-blue-200 underline-offset-8 print:text-slate-900 print:no-underline' : 'text-slate-700'}`}>{value}</p>
  </div>
);

export const AnalysisDashboard: React.FC<Props> = ({ data, lang, queryStr }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleSave = async () => {
    if (!auth.currentUser || !queryStr) {
      alert(isRtl ? 'يرجى تسجيل الدخول لحفظ التقرير' : 'Please login to save the report');
      return;
    }
    setSaving(true);
    try {
      await saveAnalysis(auth.currentUser.uid, queryStr, data);
      setSaved(true);
    } catch (e) {
      alert("Error saving analysis");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const verdictStyles = {
    'GO': { bg: 'bg-emerald-600', text: 'text-white' },
    'NO-GO': { bg: 'bg-rose-600', text: 'text-white' },
    'PROCEED WITH CAUTION': { bg: 'bg-amber-500', text: 'text-white' }
  };

  const style = verdictStyles[data.finalVerdict.recommendation as keyof typeof verdictStyles] || { bg: 'bg-slate-800', text: 'text-white' };

  return (
    <div className={`mt-8 space-y-8 animate-in fade-in duration-1000 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ACTION BAR (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm print:hidden">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-500">{isRtl ? 'الإجراءات المتاحة للتقرير' : 'Report Actions'}</p>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              {isRtl ? 'طباعة التقرير' : 'Print Report'}
            </button>
            
            {!saved ? (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    {isRtl ? 'حفظ في حسابي' : 'Save to Account'}
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {isRtl ? 'تم الحفظ بنجاح' : 'Saved to Library'}
              </div>
            )}
         </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-8 mb-10">
         <h1 className="text-4xl font-black text-slate-900 mb-2">Tahleel Plus • تحليل بلس</h1>
         <p className="text-lg text-slate-500 font-bold uppercase tracking-widest">Strategic Market Intelligence Report - 2025</p>
         <div className="mt-4 text-sm font-bold text-slate-400">
           {isRtl ? 'تحليل لـ: ' : 'Analysis for: '} <span className="text-slate-900">{queryStr}</span> • {new Date().toLocaleDateString()}
         </div>
      </div>

      {/* FINAL VERDICT HERO */}
      <div className={`p-10 rounded-[2.5rem] ${style.text} shadow-2xl relative overflow-hidden transition-all duration-500 ${style.bg} print:shadow-none print:rounded-3xl print:border-2 print:border-slate-200 print:text-slate-900 print:bg-slate-50`}>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0 print:hidden">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 text-center lg:text-start">
             <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-1 print:text-slate-500">{t.verdictTitle}</h2>
             <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-4 print:text-blue-900">{data.finalVerdict.recommendation}</h3>
             <p className="text-lg opacity-95 leading-relaxed font-medium italic print:text-slate-700">
              "{data.finalVerdict.reasoning}"
            </p>
          </div>
        </div>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center print:border-slate-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.avgPrice}</p>
          <p className="text-2xl font-black text-blue-600 print:text-slate-900">{data.marketStats.averagePrice} <span className="text-xs opacity-50">SAR</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center print:border-slate-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.demand}</p>
          <p className="text-2xl font-black text-slate-900">{data.marketStats.demandLevel}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center print:border-slate-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.saturation}</p>
          <p className="text-2xl font-black text-slate-900">{data.marketStats.marketSaturation}%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center print:border-slate-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? "توقع الربح" : "Profit Forecast"}</p>
          <p className="text-2xl font-black text-emerald-600 print:text-slate-900">{data.operationsFinancials.expectedProfitMargins}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-1">
        <SectionCard title={t.marketDeepDive} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 print:grid-cols-2">
            <DataPoint label={isRtl ? "الحاجة الفعلية" : "Actual Demand"} value={data.marketAnalysis.actualDemand} />
            <DataPoint label={isRtl ? "المشكلة التي يحلها" : "Problem Solved"} value={data.marketAnalysis.problemSolved} />
            <DataPoint label={isRtl ? "التوافق الثقافي" : "Cultural Fit"} value={data.marketAnalysis.culturalCompatibility} />
            <DataPoint label={isRtl ? "حجم البحث KSA" : "KSA Search Volume"} value={data.marketAnalysis.searchVolumeKSA} highlight />
            <DataPoint label={isRtl ? "قابلية التوسع" : "Scalability"} value={data.marketAnalysis.scalability} />
            <DataPoint label={isRtl ? "عوامل موسمية" : "Seasonality"} value={data.marketAnalysis.seasonalFactors} />
          </div>
        </SectionCard>

        <SectionCard title={t.marketingSection} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}>
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 print:bg-slate-50 print:border-slate-300">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-slate-900">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse print:hidden"></span>
                {isRtl ? "الجمهور المستهدف" : "Target Persona"}
              </h4>
              <p className="text-lg font-black text-slate-800 mb-2">{data.marketingStrategy.targetAudience.demographics}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{data.marketingStrategy.targetAudience.behavior}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DataPoint label={isRtl ? "تكلفة الاستحواذ CAC" : "Expected CAC"} value={data.marketingStrategy.expectedCAC} />
              <DataPoint label={isRtl ? "مؤشرات الأداء KPI" : "Target KPIs"} value={data.marketingStrategy.conversionKPIs} highlight />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm print:shadow-none print:rounded-3xl print:border-slate-300">
        <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
          <span className="w-3 h-10 bg-blue-600 rounded-full print:bg-slate-900"></span>
          {t.priceTrend}
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="price" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={4} />
              <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden print:bg-white print:text-slate-900 print:shadow-none print:border-2 print:border-slate-200 print:rounded-3xl">
        <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
          <span className="w-3 h-10 bg-blue-500 rounded-full print:bg-slate-900"></span>
          {t.recommendations}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">
          {data.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-6 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 print:bg-slate-50 print:border-slate-200 print:text-slate-900">
              <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black print:bg-slate-900 print:text-white">{i+1}</span>
              <p className="text-base font-bold text-slate-100 print:text-slate-900">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRINT-ONLY FOOTER */}
      <div className="hidden print:block text-center mt-20 pt-8 border-t border-slate-200 text-slate-400 text-xs">
         <p>Tahleel Plus • Produced by Strategic AI Analysis for the Saudi Market</p>
         <p className="mt-1 font-bold">Confidential Commercial Document • 2025</p>
      </div>
    </div>
  );
};

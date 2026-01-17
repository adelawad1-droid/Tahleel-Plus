
import React from 'react';
import { AnalysisResult, Language } from '../types';
import { TRANSLATIONS } from '../constants';
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
}

// Sub-components defined with explicit React.FC typing to ensure children and props are correctly handled by the TS compiler
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const DataPoint: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className="py-3 border-b border-slate-50 last:border-0">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-blue-600 underline decoration-blue-200 underline-offset-4' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export const AnalysisDashboard: React.FC<Props> = ({ data, lang }) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const verdictColors = {
    'GO': 'bg-green-600',
    'NO-GO': 'bg-red-600',
    'PROCEED WITH CAUTION': 'bg-orange-500'
  };

  return (
    <div className={`mt-8 space-y-8 animate-in fade-in duration-1000 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* FINAL VERDICT HERO */}
      <div className={`p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden ${verdictColors[data.finalVerdict.recommendation as keyof typeof verdictColors] || 'bg-slate-800'}`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">{t.verdictTitle}</h2>
            <h3 className="text-4xl font-extrabold mb-4">{data.finalVerdict.recommendation}</h3>
            <p className="text-lg opacity-90 leading-relaxed font-medium">
              {data.finalVerdict.reasoning}
            </p>
          </div>
        </div>
        {/* Abstract background shape */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MARKET DEEP DIVE */}
        <SectionCard title={t.marketDeepDive} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataPoint label={isRtl ? "الحاجة الفعلية" : "Actual Demand"} value={data.marketAnalysis.actualDemand} />
            <DataPoint label={isRtl ? "المشكلة التي يحلها" : "Problem Solved"} value={data.marketAnalysis.problemSolved} />
            <DataPoint label={isRtl ? "التوافق الثقافي" : "Cultural Fit"} value={data.marketAnalysis.culturalCompatibility} />
            <DataPoint label={isRtl ? "حجم البحث KSA" : "KSA Search Volume"} value={data.marketAnalysis.searchVolumeKSA} highlight />
            <DataPoint label={isRtl ? "قابلية التوسع" : "Scalability"} value={data.marketAnalysis.scalability} />
            <DataPoint label={isRtl ? "عوامل موسمية" : "Seasonality"} value={data.marketAnalysis.seasonalFactors} />
          </div>
        </SectionCard>

        {/* MARKETING STRATEGY */}
        <SectionCard title={t.marketingSection} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}>
          <div className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">{isRtl ? "الجمهور المستهدف" : "Target Persona"}</h4>
              <p className="text-sm text-slate-700 font-bold mb-1">{data.marketingStrategy.targetAudience.demographics}</p>
              <p className="text-sm text-slate-500">{data.marketingStrategy.targetAudience.behavior}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DataPoint label={isRtl ? "تكلفة الاستحواذ CAC" : "Expected CAC"} value={data.marketingStrategy.expectedCAC} />
              <DataPoint label={isRtl ? "مؤشرات الأداء KPI" : "Target KPIs"} value={data.marketingStrategy.conversionKPIs} highlight />
            </div>
            <div className="flex flex-wrap gap-2">
              {data.marketingStrategy.bestChannels.map((ch, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">#{ch}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* STRATEGIC ANALYSIS */}
        <SectionCard title={t.strategySection} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
              <h4 className="text-xs font-bold opacity-70 uppercase mb-2">{isRtl ? "ميزة التنافس الحقيقية USP" : "Unique Selling Point"}</h4>
              <p className="text-lg font-bold italic leading-relaxed">"{data.strategicAnalysis.usp}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DataPoint label={isRtl ? "خطر التشبع" : "Saturation Risk"} value={data.strategicAnalysis.saturationRisk} />
              <DataPoint label={isRtl ? "خطر التقليد" : "Imitation Risk"} value={data.strategicAnalysis.imitationRisk} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-2 uppercase">{isRtl ? "أبرز المنافسين" : "Key Competitors"}</p>
              <div className="flex flex-wrap gap-2">
                {data.strategicAnalysis.directCompetitors.map((comp, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold">{comp}</span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* OPERATIONS & FINANCIALS */}
        <SectionCard title={t.opsSection} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <h4 className="text-xs font-bold text-green-700 uppercase mb-1">{isRtl ? "هوامش الربح" : "Profit Margins"}</h4>
                <p className="text-xl font-black text-green-800">{data.operationsFinancials.expectedProfitMargins}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 uppercase mb-1">{isRtl ? "قابلية التسعير" : "Pricing Viability"}</h4>
                <p className="text-sm font-bold text-blue-800">{data.operationsFinancials.pricingViability}</p>
              </div>
            </div>
            <DataPoint label={isRtl ? "سهولة التشغيل والتوريد" : "Supply Chain Ease"} value={data.operationsFinancials.supplyChainEase} />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase">{isRtl ? "الدفع الموصى به" : "Recommended Payments"}</p>
                <div className="flex flex-wrap gap-1">
                  {data.operationsFinancials.recommendedPaymentMethods.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase">{isRtl ? "التوصيل الموصى به" : "Best Logistics"}</p>
                <div className="flex flex-wrap gap-1">
                  {data.operationsFinancials.recommendedDelivery.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* TRENDS & COMPETITORS (Professional Tables/Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            {t.priceTrend}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }} />
                <Area type="monotone" dataKey="price" stroke="#2563eb" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={4} />
                <Line type="monotone" dataKey="demand" stroke="#10b981" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            {t.recommendations}
          </h3>
          <ul className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold group-hover:scale-110 transition-transform">{i+1}</span>
                <span className="text-sm font-semibold text-slate-700 leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grounding Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {t.sourcesTitle}
          </h3>
          <div className="flex flex-wrap gap-4">
            {data.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-95"
              >
                <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} className="w-4 h-4 rounded" alt="" />
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

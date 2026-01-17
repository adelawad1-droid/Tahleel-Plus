
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
  Line,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface Props {
  data: AnalysisResult;
  lang: Language;
}

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
    <div className="flex items-center gap-4 mb-8">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900">{title}</h3>
    </div>
    {children}
  </div>
);

const DataPoint: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className="py-4 border-b border-slate-50 last:border-0 group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-blue-400 transition-colors">{label}</p>
    <p className={`text-base font-bold ${highlight ? 'text-blue-600 underline decoration-blue-200 underline-offset-8' : 'text-slate-700'}`}>{value}</p>
  </div>
);

export const AnalysisDashboard: React.FC<Props> = ({ data, lang }) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const verdictStyles = {
    'GO': { bg: 'bg-emerald-600', text: 'text-white', label: 'Positive' },
    'NO-GO': { bg: 'bg-rose-600', text: 'text-white', label: 'Negative' },
    'PROCEED WITH CAUTION': { bg: 'bg-amber-500', text: 'text-white', label: 'Caution' }
  };

  const style = verdictStyles[data.finalVerdict.recommendation as keyof typeof verdictStyles] || { bg: 'bg-slate-800', text: 'text-white', label: 'Neutral' };

  return (
    <div className={`mt-8 space-y-8 animate-in fade-in duration-1000 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* FINAL VERDICT HERO */}
      <div className={`p-10 rounded-[2.5rem] ${style.text} shadow-2xl relative overflow-hidden transition-all duration-500 ${style.bg}`}>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="shrink-0">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 text-center lg:text-start">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-3">{t.verdictTitle}</h2>
            <h3 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">{data.finalVerdict.recommendation}</h3>
            <p className="text-xl opacity-95 leading-relaxed font-medium max-w-4xl italic">
              "{data.finalVerdict.reasoning}"
            </p>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-[80px]"></div>
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-black/10 rounded-full blur-[60px]"></div>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.avgPrice}</p>
          <p className="text-2xl font-black text-blue-600">{data.marketStats.averagePrice} <span className="text-xs opacity-50">SAR</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.demand}</p>
          <p className="text-2xl font-black text-slate-900">{data.marketStats.demandLevel}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.saturation}</p>
          <p className="text-2xl font-black text-slate-900">{data.marketStats.marketSaturation}%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRtl ? "توقع الربح" : "Profit Forecast"}</p>
          <p className="text-2xl font-black text-emerald-600">{data.operationsFinancials.expectedProfitMargins}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MARKET DEEP DIVE */}
        <SectionCard title={t.marketDeepDive} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <DataPoint label={isRtl ? "الحاجة الفعلية" : "Actual Demand"} value={data.marketAnalysis.actualDemand} />
            <DataPoint label={isRtl ? "المشكلة التي يحلها" : "Problem Solved"} value={data.marketAnalysis.problemSolved} />
            <DataPoint label={isRtl ? "التوافق الثقافي" : "Cultural Fit"} value={data.marketAnalysis.culturalCompatibility} />
            <DataPoint label={isRtl ? "حجم البحث KSA" : "KSA Search Volume"} value={data.marketAnalysis.searchVolumeKSA} highlight />
            <DataPoint label={isRtl ? "قابلية التوسع" : "Scalability"} value={data.marketAnalysis.scalability} />
            <DataPoint label={isRtl ? "عوامل موسمية" : "Seasonality"} value={data.marketAnalysis.seasonalFactors} />
          </div>
        </SectionCard>

        {/* MARKETING STRATEGY */}
        <SectionCard title={t.marketingSection} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}>
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                {isRtl ? "الجمهور المستهدف" : "Target Persona"}
              </h4>
              <p className="text-lg font-black text-slate-800 mb-2">{data.marketingStrategy.targetAudience.demographics}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{data.marketingStrategy.targetAudience.behavior}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                 {data.marketingStrategy.targetAudience.interests.map((int, i) => (
                   <span key={i} className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg text-blue-500 border border-blue-100">#{int}</span>
                 ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DataPoint label={isRtl ? "تكلفة الاستحواذ CAC" : "Expected CAC"} value={data.marketingStrategy.expectedCAC} />
              <DataPoint label={isRtl ? "مؤشرات الأداء KPI" : "Target KPIs"} value={data.marketingStrategy.conversionKPIs} highlight />
            </div>
            <div className="flex flex-wrap gap-2">
              {data.marketingStrategy.bestChannels.map((ch, i) => (
                <span key={i} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">#{ch}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* STRATEGIC SWOT */}
        <SectionCard title={t.swotAnalysis} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-3">{isRtl ? "القوة" : "Strengths"}</h4>
              <ul className="space-y-1">
                {data.swot.strengths.slice(0, 3).map((s, i) => <li key={i} className="text-xs font-bold text-emerald-900">• {s}</li>)}
              </ul>
            </div>
            <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
              <h4 className="text-[10px] font-black text-rose-700 uppercase mb-3">{isRtl ? "الضعف" : "Weaknesses"}</h4>
              <ul className="space-y-1">
                {data.swot.weaknesses.slice(0, 3).map((w, i) => <li key={i} className="text-xs font-bold text-rose-900">• {w}</li>)}
              </ul>
            </div>
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-700 uppercase mb-3">{isRtl ? "الفرص" : "Opportunities"}</h4>
              <ul className="space-y-1">
                {data.swot.opportunities.slice(0, 3).map((o, i) => <li key={i} className="text-xs font-bold text-blue-900">• {o}</li>)}
              </ul>
            </div>
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
              <h4 className="text-[10px] font-black text-amber-700 uppercase mb-3">{isRtl ? "التهديدات" : "Threats"}</h4>
              <ul className="space-y-1">
                {data.swot.threats.slice(0, 3).map((t, i) => <li key={i} className="text-xs font-bold text-amber-900">• {t}</li>)}
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* OPERATIONS & FINANCIALS */}
        <SectionCard title={t.opsSection} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                <h4 className="text-[10px] font-black opacity-60 uppercase mb-2">{isRtl ? "هامش الربح المتوقع" : "Expected Profit"}</h4>
                <p className="text-3xl font-black text-emerald-400">{data.operationsFinancials.expectedProfitMargins}</p>
              </div>
              <div className="p-6 bg-blue-600 text-white rounded-[2rem] shadow-xl">
                <h4 className="text-[10px] font-black opacity-60 uppercase mb-2">{isRtl ? "قابلية التسعير" : "Pricing Ease"}</h4>
                <p className="text-sm font-bold leading-tight">{data.operationsFinancials.pricingViability}</p>
              </div>
            </div>
            <DataPoint label={isRtl ? "سهولة التشغيل والتوريد" : "Supply Chain Ease"} value={data.operationsFinancials.supplyChainEase} />
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] text-slate-400 font-black mb-3 uppercase tracking-widest">{isRtl ? "طرق الدفع المفضلة" : "Preferred Payments"}</p>
                <div className="flex flex-wrap gap-2">
                  {data.operationsFinancials.recommendedPaymentMethods.map((p, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-black">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black mb-3 uppercase tracking-widest">{isRtl ? "شركاء الخدمات اللوجستية" : "Logistics Partners"}</p>
                <div className="flex flex-wrap gap-2">
                  {data.operationsFinancials.recommendedDelivery.map((d, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-black">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* PRICE DYNAMICS TABLE/CHART */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <h3 className="text-2xl font-black flex items-center gap-4">
            <span className="w-3 h-10 bg-blue-600 rounded-full"></span>
            {t.priceTrend}
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-xs font-bold text-slate-500">{isRtl ? "السعر" : "Price"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-slate-500">{isRtl ? "الطلب" : "Demand"}</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="price" stroke="#2563eb" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={5} />
              <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COMPETITORS MAP */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="text-2xl font-black mb-8 flex items-center gap-4">
          <span className="w-3 h-10 bg-rose-500 rounded-full"></span>
          {t.competitorTable}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-black">{t.store}</th>
                <th className="px-6 py-4 font-black">{t.price}</th>
                <th className="px-6 py-4 font-black">{t.rating}</th>
                <th className="px-6 py-4 font-black">{t.shipping}</th>
                <th className="px-6 py-4 font-black">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.competitors.map((comp, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                      {comp.storeName}
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </td>
                  <td className="px-6 py-4 font-black text-blue-600">{comp.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{comp.rating}</span>
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-bold">{comp.shippingDays} {isRtl ? 'أيام' : 'Days'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${comp.stockStatus.toLowerCase().includes('in') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {comp.stockStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
            <span className="w-3 h-10 bg-blue-500 rounded-full"></span>
            {t.recommendations}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-6 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                <span className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">{i+1}</span>
                <p className="text-lg font-bold text-slate-100 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      {/* SOURCES */}
      {data.sources && data.sources.length > 0 && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.4em] flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 shadow-sm group"
              >
                <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}`} className="w-5 h-5 rounded shadow-sm" alt="" />
                <span className="group-hover:text-blue-600">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

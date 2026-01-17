
import React, { useEffect, useState } from 'react';
import { SavedAnalysis, Language } from '../types';
import { getSavedAnalyses, deleteSavedAnalysis } from '../services/userService';
import { auth } from '../services/firebase';
import { AnalysisDashboard } from './AnalysisDashboard';

interface Props {
  lang: Language;
}

export const SavedLibrary: React.FC<Props> = ({ lang }) => {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState<SavedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const isRtl = lang === 'ar';

  const load = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const data = await getSavedAnalyses(auth.currentUser.uid);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(isRtl ? 'حذف من المكتبة؟' : 'Delete from library?')) {
      await deleteSavedAnalysis(id);
      load();
    }
  };

  if (selected) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-blue-600 font-black hover:underline"
        >
          {isRtl ? '← العودة للمكتبة' : '← Back to Library'}
        </button>
        <div className="bg-white p-6 rounded-3xl border border-blue-100 mb-8">
           <h2 className="text-xl font-black text-slate-900">{selected.query}</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(selected.timestamp).toLocaleDateString()}</p>
        </div>
        <AnalysisDashboard data={selected.data} lang={lang} />
      </div>
    );
  }

  if (loading) return <div className="py-20 text-center text-slate-400 font-black">Loading Library...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">{isRtl ? 'مكتبتي الاستراتيجية' : 'Strategic Library'}</h2>
        <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black">{items.length} {isRtl ? 'تقرير' : 'Reports'}</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center">
          <p className="text-slate-400 font-bold">{isRtl ? 'لا يوجد تقارير محفوظة حتى الآن.' : 'No saved reports yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelected(item)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <button 
                  onClick={(e) => handleDelete(item.id!, e)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 truncate">{item.query}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.data.finalVerdict.recommendation === 'GO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {item.data.finalVerdict.recommendation}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

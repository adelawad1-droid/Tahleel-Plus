
import React, { useEffect, useState } from 'react';
import { SavedAnalysis, Language } from '../types';
import { getSavedAnalyses, deleteSavedAnalysis } from '../services/userService';
import { publishAnalysisByUser } from '../services/publicLibraryService';
import { auth } from '../services/firebase';
import { AnalysisDashboard } from './AnalysisDashboard';
import { REGIONS } from '../constants';

interface Props {
  lang: Language;
}

export const SavedLibrary: React.FC<Props> = ({ lang }) => {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState<SavedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishModal, setPublishModal] = useState<SavedAnalysis | null>(null);
  const [publishing, setPublishing] = useState(false);
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
    

  const handlePublish = async (e: React.MouseEvent, item: SavedAnalysis) => {
    e.stopPropagation();
    if (item.isPublished) {
      alert(isRtl ? 'هذا التحليل منشور بالفعل في المكتبة العامة' : 'This analysis is already published');
      return;
    }
    setPublishModal(item);
  };

  const confirmPublish = async () => {
    if (!publishModal || !auth.currentUser) return;
    
    setPublishing(true);
    try {
      await publishAnalysisByUser(
        publishModal.id!,
        auth.currentUser.uid,
        auth.currentUser.email || '',
        publishModal.query,
        publishModal.data,
        publishModal.region || 'SA'
      );
      
      alert(isRtl ? 'تم نشر التحليل في المكتبة العامة بنجاح! ✅' : 'Analysis published successfully! ✅');
      setPublishModal(null);
      load(); // إعادة تحميل القائمة لتحديث حالة النشر
    } catch (error: any) {
      console.error('Error publishing:', error);
      if (error.message === 'ALREADY_PUBLISHED') {
        alert(isRtl ? 'هذا التحليل منشور بالفعل في المكتبة العامة' : 'This analysis is already published in the public library');
        setPublishModal(null);
        load(); // إعادة تحميل للتأكد من تحديث الحالة
      } else {
        alert(isRtl ? 'حدث خطأ أثناء النشر' : 'Error publishing analysis');
      }
    } finally {
      setPublishing(false);
    }
  };  load();
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
              className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer group relative flex flex-col"
              style={{ minHeight: '220px' }}
            >
              {/* Title */}
              <h3 className={`text-xl font-black text-slate-900 leading-relaxed mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{item.query}</h3>
              
              {/* Language Badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                  {item.query.match(/[\u0600-\u06FF]/) ? '🇸🇦 عربي' : '🇬🇧 English'}
                </span>
                {item.region && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                    {REGIONS.find(r => r.code === item.region)?.[isRtl ? 'nameAr' : 'nameEn'] || item.region}
                  </span>
                )}
              </div>
              
              {/* Published Badge */}
              {item.isPublished && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                    ✅ {isRtl ? 'منشور في المكتبة' : 'Published'}
                  </span>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="absolute top-6 left-6 flex gap-2">
                {/* Publish Button */}
                {!item.isPublished && (
                  <button 
                    onClick={(e) => handlePublish(e, item)}
                    className="p-2 text-slate-300 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isRtl ? 'نشر في المكتبة العامة' : 'Publish to Public Library'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </button>
                )}
                
                {/* Delete Button */}
                <button 
                  onClick={(e) => handleDelete(item.id!, e)}
                  className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={isRtl ? 'حذف' : 'Delete'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              
              {/* Spacer to push stats to bottom */}
              <div className="flex-grow"></div>
              
              {/* Stats - Always at bottom */}
              <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4 mt-auto">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="text-blue-600 font-bold group-hover:underline">
                  {isRtl ? 'عرض التحليل ←' : 'View Analysis →'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Publish Confirmation Modal */}
      {publishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {isRtl ? '📤 نشر في المكتبة العامة' : '📤 Publish to Public Library'}
            </h3>
            
            <div className="mb-6 space-y-3">
              <p className="text-slate-600 font-bold">
                {isRtl 
                  ? 'هل تريد نشر هذا التحليل في المكتبة العامة ليستفيد منه الجميع؟' 
                  : 'Do you want to publish this analysis to the public library for everyone to benefit from?'}
              </p>
              
              <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-slate-700">{isRtl ? '📊 التحليل:' : '📊 Analysis:'}</p>
                <p className="text-lg font-black text-slate-900">{publishModal.query}</p>
                
                {publishModal.region && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-slate-600">{isRtl ? 'السوق:' : 'Market:'}</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-lg text-sm font-bold text-blue-600">
                      🌍 {REGIONS.find(r => r.code === publishModal.region)?.[isRtl ? 'nameAr' : 'nameEn']}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-green-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700">
                  {isRtl 
                    ? '✅ سيظهر هذا التحليل في مكتبة التحليلات مع علامة الدولة' 
                    : '✅ This analysis will appear in the Analysis Library with country badge'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmPublish}
                disabled={publishing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 px-6 rounded-2xl transition-all disabled:opacity-50"
              >
                {publishing 
                  ? (isRtl ? 'جاري النشر...' : 'Publishing...') 
                  : (isRtl ? '✅ نشر الآن' : '✅ Publish Now')}
              </button>
              <button
                onClick={() => setPublishModal(null)}
                disabled={publishing}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-6 rounded-2xl transition-all disabled:opacity-50"
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

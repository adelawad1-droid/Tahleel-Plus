
import React, { useEffect, useState } from 'react';
import { Language, UserProfile, PlanType, UserStatus, PlanConfig, AppConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAllUsers, updateUserPlan, getPlanConfigs, updatePlanConfigs, deleteUserRecord, resetUserSearches, getAppConfig, updateAppConfig } from '../services/userService';

interface Props {
  lang: Language;
}

type AdminTab = 'USERS' | 'PLANS' | 'SITE_SETTINGS' | 'SETTINGS';

export const AdminPanel: React.FC<Props> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('USERS');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ geminiApiKey: '', siteName: 'تحليل بلس', siteLogo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [userData, planData, configData] = await Promise.all([
        getAllUsers(),
        getPlanConfigs(),
        getAppConfig()
      ]);
      setUsers(userData);
      setPlans(planData);
      if (configData) setAppConfig(prev => ({ ...prev, ...configData }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateUser = async (uid: string, plan: PlanType, status: UserStatus) => {
    setActionLoadingId(uid);
    try {
      await updateUserPlan(uid, plan, status, false);
      await loadData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetSearches = async (uid: string) => {
    if (confirm(isRtl ? 'هل تريد تصفير عداد البحث لهذا المستخدم؟' : 'Reset search count for this user?')) {
      setActionLoadingId(uid);
      try {
        await resetUserSearches(uid);
        await loadData(true);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm(isRtl ? '⚠️ تحذير: سيتم حذف العضو تماماً. لا يمكن التراجع.' : '⚠️ Warning: Delete user permanently. This cannot be undone.')) {
      setActionLoadingId(uid);
      try {
        await deleteUserRecord(uid);
        await loadData(true);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleUpdatePlanField = (index: number, field: keyof PlanConfig, value: any) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  const handleAddPlan = () => {
    const newPlan: PlanConfig = {
      id: `PLAN_${Date.now()}`,
      nameAr: 'باقة جديدة',
      nameEn: 'New Plan',
      price: 99,
      stripeUrl: '',
      searchLimit: 10,
      featuresAr: [isRtl ? 'ميزة جديدة' : 'New feature'],
      featuresEn: ['New feature'],
      isPopular: false
    };
    setPlans([...plans, newPlan]);
  };

  const handleDeletePlan = (index: number) => {
    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Are you sure you want to delete this plan?')) {
      const newPlans = plans.filter((_, i) => i !== index);
      setPlans(newPlans);
    }
  };

  const savePlans = async () => {
    setSavingPlan(true);
    try {
      await updatePlanConfigs(plans);
      alert(isRtl ? 'تم حفظ الباقات بنجاح' : 'Plans saved successfully');
    } catch (e: any) {
      alert(isRtl ? 'خطأ في الصلاحيات' : 'Permission Error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleSaveAppConfig = async () => {
    setSavingConfig(true);
    try {
      await updateAppConfig(appConfig);
      alert(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
      window.location.reload(); // Reload to apply site name/logo globally
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSavingConfig(false);
    }
  };

  const getSuccessUrl = (planId: string) => {
    const origin = window.location.origin;
    return `${origin}/?stripe_success=true&plan_id=${planId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(isRtl ? 'تم نسخ الرابط! ضعه في خانة Success URL في Stripe' : 'URL copied! Paste it in the Success URL field in Stripe');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-slate-400">Loading Management Engine...</p>
    </div>
  );

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'USERS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isRtl ? 'المستفيدين' : 'Users'}
          </button>
          <button 
            onClick={() => setActiveTab('PLANS')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'PLANS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isRtl ? 'الباقات' : 'Plans'}
          </button>
          <button 
            onClick={() => setActiveTab('SITE_SETTINGS')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'SITE_SETTINGS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isRtl ? 'إعدادات الموقع' : 'Site Info'}
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'SETTINGS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isRtl ? 'مفاتيح الربط' : 'API Keys'}
          </button>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => loadData()} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
           </button>
        </div>
      </div>

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-right" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المستخدم' : 'USER'}</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isRtl ? 'منح باقة' : 'GRANT PLAN'}</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isRtl ? 'حالة الحساب' : 'ACCOUNT STATUS'}</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isRtl ? 'تحكم' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.uid} className={`hover:bg-blue-50/20 transition-colors ${actionLoadingId === u.uid ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{u.email}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded border border-blue-100">{u.plan}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{u.searchCount} {isRtl ? 'بحث' : 'Searches'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <select 
                      value={u.plan}
                      onChange={(e) => handleUpdateUser(u.uid, e.target.value, u.status)}
                      className="bg-white border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 outline-none focus:border-blue-500 shadow-sm"
                    >
                      <option value="FREE">FREE</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.id}</option>
                      ))}
                      <option value="ELITE">ELITE</option>
                    </select>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => handleUpdateUser(u.uid, u.plan, u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE')}
                      className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      {u.status === 'ACTIVE' ? (isRtl ? 'إيقاف الحساب' : 'Suspend') : (isRtl ? 'تفعيل الحساب' : 'Activate')}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleResetSearches(u.uid)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                       <button onClick={() => handleDeleteUser(u.uid)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200">
            <h2 className="text-xl font-black">{isRtl ? 'إدارة باقات الدفع' : 'Payment Plans Management'}</h2>
            <div className="flex gap-4">
              <button onClick={handleAddPlan} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">+ {isRtl ? 'إضافة باقة' : 'Add Plan'}</button>
              <button onClick={savePlans} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl">{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1">ID (PLAN NAME IN DB)</label>
                    <input type="text" value={plan.id} onChange={(e) => handleUpdatePlanField(index, 'id', e.target.value)} className="text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 w-full outline-none" />
                  </div>
                  <button onClick={() => handleDeletePlan(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">NAME (AR)</label>
                    <input type="text" value={plan.nameAr} onChange={(e) => handleUpdatePlanField(index, 'nameAr', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">NAME (EN)</label>
                    <input type="text" value={plan.nameEn} onChange={(e) => handleUpdatePlanField(index, 'nameEn', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">PRICE (SAR)</label>
                    <input type="number" value={plan.price} onChange={(e) => handleUpdatePlanField(index, 'price', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">SEARCH LIMIT</label>
                    <input type="number" value={plan.searchLimit} onChange={(e) => handleUpdatePlanField(index, 'searchLimit', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-600 mb-1 tracking-widest">STRIPE CHECKOUT URL</label>
                  <input type="url" value={plan.stripeUrl} onChange={(e) => handleUpdatePlanField(index, 'stripeUrl', e.target.value)} className="w-full px-4 py-3 bg-blue-50/30 border border-blue-100 rounded-xl text-[11px] font-mono text-blue-700" placeholder="https://buy.stripe.com/..." />
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{isRtl ? 'رابط العودة' : 'Required Success URL'}</span>
                    <button onClick={() => copyToClipboard(getSuccessUrl(plan.id))} className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full">{isRtl ? 'نسخ' : 'Copy'}</button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 break-all">{getSuccessUrl(plan.id)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SITE_SETTINGS' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in zoom-in">
             <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h2 className="text-2xl font-black">{isRtl ? 'إعدادات هوية الموقع' : 'Site Branding Settings'}</h2>
                <p className="text-slate-400 text-sm mt-2">{isRtl ? 'تحكم في الاسم والشعار الذي يظهر للمستخدمين' : 'Manage the site name and logo visible to users'}</p>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'اسم الموقع' : 'Site Name'}</label>
                  <input 
                    type="text" 
                    value={appConfig.siteName || ''}
                    onChange={(e) => setAppConfig({...appConfig, siteName: e.target.value})}
                    placeholder="تحليل بلس..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'رابط شعار الموقع (Image URL)' : 'Site Logo URL'}</label>
                  <input 
                    type="text" 
                    value={appConfig.siteLogo || ''}
                    onChange={(e) => setAppConfig({...appConfig, siteLogo: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:border-emerald-500 transition-all"
                  />
                  {appConfig.siteLogo && (
                    <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                       <p className="text-[10px] font-black text-slate-300 uppercase mb-2">Logo Preview</p>
                       <img src={appConfig.siteLogo} alt="Site Logo" className="h-12 w-auto object-contain" />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveAppConfig}
                    disabled={savingConfig}
                    className="w-full bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50"
                  >
                    {savingConfig ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (isRtl ? 'تحديث الهوية' : 'Update Branding')}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in zoom-in">
             <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-2xl font-black">{isRtl ? 'مفاتيح الربط والذكاء الاصطناعي' : 'AI & Search API Keys'}</h2>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'مفتاح Gemini API' : 'Gemini API Key'}</label>
                  <input 
                    type="password" 
                    value={appConfig.geminiApiKey}
                    onChange={(e) => setAppConfig({...appConfig, geminiApiKey: e.target.value})}
                    placeholder="AIzaSy..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'معرف محرك البحث' : 'Google Search ID'}</label>
                  <input 
                    type="text" 
                    value={appConfig.googleSearchId || ''}
                    onChange={(e) => setAppConfig({...appConfig, googleSearchId: e.target.value})}
                    placeholder="0123456789..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    onClick={handleSaveAppConfig}
                    disabled={savingConfig}
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50"
                  >
                    {savingConfig ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (isRtl ? 'حفظ إعدادات النظام' : 'Save System Keys')}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

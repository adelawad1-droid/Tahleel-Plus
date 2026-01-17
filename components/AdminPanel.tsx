
import React, { useEffect, useState } from 'react';
import { Language, UserProfile, PlanType, UserStatus, PlanConfig, AppConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAllUsers, updateUserPlan, getPlanConfigs, updatePlanConfigs, deleteUserRecord, resetUserSearches, getAppConfig, updateAppConfig } from '../services/userService';

interface Props {
  lang: Language;
}

type AdminTab = 'USERS' | 'PLANS' | 'SITE_SETTINGS' | 'SETTINGS';

interface ModalState {
  isOpen: boolean;
  type: 'CONFIRM' | 'ALERT';
  title: string;
  message: string;
  onConfirm?: () => void;
  color: 'blue' | 'rose' | 'emerald';
}

export const AdminPanel: React.FC<Props> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('USERS');
  const [settingsSubTab, setSettingsSubTab] = useState<'AR' | 'EN' | 'CORE'>('AR');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ 
    geminiApiKey: '', 
    siteNameAr: 'تحليل بلس', 
    siteNameEn: 'Tahleel Plus',
    siteLogo: '',
    siteFavicon: '',
    siteDescriptionAr: '',
    siteDescriptionEn: '',
    siteKeywordsAr: '',
    siteKeywordsEn: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Custom Modal State
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'ALERT',
    title: '',
    message: '',
    color: 'blue'
  });

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const showModal = (title: string, message: string, color: ModalState['color'] = 'blue', onConfirm?: () => void) => {
    setModal({
      isOpen: true,
      type: onConfirm ? 'CONFIRM' : 'ALERT',
      title,
      message,
      onConfirm,
      color
    });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

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
      showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetSearches = async (uid: string) => {
    showModal(
      isRtl ? 'تصفير العداد' : 'Reset Searches',
      isRtl ? 'هل تريد تصفير عداد البحث لهذا المستخدم؟' : 'Reset search count for this user?',
      'blue',
      async () => {
        setActionLoadingId(uid);
        try {
          await resetUserSearches(uid);
          await loadData(true);
          closeModal();
        } finally {
          setActionLoadingId(null);
        }
      }
    );
  };

  const handleDeleteUser = async (uid: string) => {
    showModal(
      isRtl ? 'حذف مستخدم' : 'Delete User',
      isRtl ? '⚠️ تحذير: سيتم حذف العضو تماماً. لا يمكن التراجع عن هذه العملية.' : '⚠️ Warning: Delete user permanently. This cannot be undone.',
      'rose',
      async () => {
        setActionLoadingId(uid);
        try {
          await deleteUserRecord(uid);
          await loadData(true);
          closeModal();
        } finally {
          setActionLoadingId(null);
        }
      }
    );
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
    showModal(
      isRtl ? 'حذف الباقة' : 'Delete Plan',
      isRtl ? 'هل أنت متأكد من حذف هذه الباقة؟ سيؤثر ذلك على المشتركين الحاليين.' : 'Are you sure you want to delete this plan? This will affect current subscribers.',
      'rose',
      () => {
        const newPlans = plans.filter((_, i) => i !== index);
        setPlans(newPlans);
        closeModal();
      }
    );
  };

  const savePlans = async () => {
    showModal(
      isRtl ? 'حفظ الباقات' : 'Save Plans',
      isRtl ? 'هل تريد حفظ التعديلات الجديدة على جميع الباقات؟' : 'Do you want to save the new changes to all plans?',
      'emerald',
      async () => {
        setSavingPlan(true);
        try {
          await updatePlanConfigs(plans);
          closeModal();
          showModal(isRtl ? 'تم الحفظ' : 'Saved', isRtl ? 'تم حفظ الباقات بنجاح' : 'Plans saved successfully', 'emerald');
        } catch (e: any) {
          showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'خطأ في الصلاحيات' : 'Permission Error', 'rose');
        } finally {
          setSavingPlan(false);
        }
      }
    );
  };

  const handleSaveAppConfig = async () => {
    setSavingConfig(true);
    try {
      await updateAppConfig(appConfig);
      showModal(isRtl ? 'تم التحديث' : 'Updated', isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully', 'emerald');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      showModal(isRtl ? 'خطأ' : 'Error', "Error saving settings", 'rose');
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
    showModal(isRtl ? 'تم النسخ' : 'Copied', isRtl ? 'تم نسخ الرابط! ضعه في خانة Success URL في Stripe' : 'URL copied! Paste it in the Success URL field in Stripe', 'blue');
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
      
      {/* --- CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
             <div className="p-10 text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-lg
                  ${modal.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                  ${modal.color === 'rose' ? 'bg-rose-50 text-rose-600' : ''}
                  ${modal.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
                `}>
                   {appConfig.siteLogo ? (
                     <img src={appConfig.siteLogo} alt="Logo" className="w-10 h-10 object-contain" />
                   ) : (
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   )}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">{modal.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{modal.message}</p>
             </div>
             
             <div className="flex border-t border-slate-50">
                {modal.type === 'CONFIRM' ? (
                  <>
                    <button 
                      onClick={closeModal}
                      className="flex-1 px-8 py-6 text-sm font-black text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                      onClick={modal.onConfirm}
                      className={`flex-1 px-8 py-6 text-sm font-black text-white transition-all
                        ${modal.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        ${modal.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                        ${modal.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      `}
                    >
                      {isRtl ? 'تأكيد' : 'Confirm'}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={closeModal}
                    className="w-full px-8 py-6 text-sm font-black text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {isRtl ? 'حسناً' : 'Okay'}
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
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
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-slate-900">{u.email}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded border border-blue-100 uppercase">
                            {plans.find(p => p.id === u.plan) ? (isRtl ? plans.find(p => p.id === u.plan)?.nameAr : plans.find(p => p.id === u.plan)?.nameEn) : u.plan}
                          </span>
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
                        <option key={p.id} value={p.id}>{isRtl ? p.nameAr : p.nameEn}</option>
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
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black">{isRtl ? 'إدارة باقات الدفع' : 'Payment Plans Management'}</h2>
            <div className="flex gap-4">
              <button onClick={handleAddPlan} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">+ {isRtl ? 'إضافة باقة' : 'Add Plan'}</button>
              <button onClick={savePlans} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl">{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6 shadow-sm hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">ID (PLAN NAME IN DB)</label>
                    <input type="text" value={plan.id} onChange={(e) => handleUpdatePlanField(index, 'id', e.target.value)} className="text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 w-full outline-none" />
                  </div>
                  <button onClick={() => handleDeletePlan(index)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">NAME (AR)</label>
                    <input type="text" value={plan.nameAr} onChange={(e) => handleUpdatePlanField(index, 'nameAr', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">NAME (EN)</label>
                    <input type="text" value={plan.nameEn} onChange={(e) => handleUpdatePlanField(index, 'nameEn', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">PRICE (SAR)</label>
                    <input type="number" value={plan.price} onChange={(e) => handleUpdatePlanField(index, 'price', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">SEARCH LIMIT</label>
                    <input type="number" value={plan.searchLimit} onChange={(e) => handleUpdatePlanField(index, 'searchLimit', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-600 mb-1 tracking-widest uppercase">STRIPE CHECKOUT URL</label>
                  <input type="url" value={plan.stripeUrl} onChange={(e) => handleUpdatePlanField(index, 'stripeUrl', e.target.value)} className="w-full px-4 py-3 bg-blue-50/30 border border-blue-100 rounded-xl text-[11px] font-mono text-blue-700 outline-none focus:border-blue-500" placeholder="https://buy.stripe.com/..." />
                </div>
                <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{isRtl ? 'رابط العودة' : 'Required Success URL'}</span>
                    <button onClick={() => copyToClipboard(getSuccessUrl(plan.id))} className="text-[10px] font-black bg-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-700 transition-all">{isRtl ? 'نسخ الرابط' : 'Copy'}</button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 break-all leading-relaxed">{getSuccessUrl(plan.id)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SITE_SETTINGS' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in zoom-in">
             <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h2 className="text-3xl font-black">{isRtl ? 'إعدادات هوية الموقع والـ SEO' : 'Site Branding & SEO Settings'}</h2>
                <p className="text-slate-400 text-sm mt-3 font-medium">{isRtl ? 'تحكم في كيفية ظهور موقعك في المتصفح ومحركات البحث' : 'Manage how your site appears in browsers and search engines'}</p>
             </div>

             <div className="flex justify-center mb-8">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                   <button onClick={() => setSettingsSubTab('AR')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${settingsSubTab === 'AR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{isRtl ? 'العربية' : 'Arabic'}</button>
                   <button onClick={() => setSettingsSubTab('EN')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${settingsSubTab === 'EN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{isRtl ? 'الإنجليزية' : 'English'}</button>
                   <button onClick={() => setSettingsSubTab('CORE')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${settingsSubTab === 'CORE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{isRtl ? 'الوسائط' : 'Branding'}</button>
                </div>
             </div>

             <div className="space-y-6">
                {settingsSubTab === 'AR' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'اسم الموقع (عربي)' : 'Site Name (AR)'}</label>
                      <input type="text" value={appConfig.siteNameAr || ''} onChange={(e) => setAppConfig({...appConfig, siteNameAr: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'وصف الموقع (عربي) - SEO' : 'Site Description (AR) - SEO'}</label>
                      <textarea value={appConfig.siteDescriptionAr || ''} onChange={(e) => setAppConfig({...appConfig, siteDescriptionAr: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" placeholder="أدخل وصفاً للمحرك لجذب المستخدمين ومحركات البحث..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'الكلمات الدلالية (عربي) - SEO' : 'Keywords (AR) - SEO'}</label>
                      <input type="text" value={appConfig.siteKeywordsAr || ''} onChange={(e) => setAppConfig({...appConfig, siteKeywordsAr: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" placeholder="كلمة، كلمة ثانية، تجارة الكترونية..." />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'EN' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Site Name (EN)</label>
                      <input type="text" value={appConfig.siteNameEn || ''} onChange={(e) => setAppConfig({...appConfig, siteNameEn: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Site Description (EN) - SEO</label>
                      <textarea value={appConfig.siteDescriptionEn || ''} onChange={(e) => setAppConfig({...appConfig, siteDescriptionEn: e.target.value})} rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Keywords (EN) - SEO</label>
                      <input type="text" value={appConfig.siteKeywordsEn || ''} onChange={(e) => setAppConfig({...appConfig, siteKeywordsEn: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500" placeholder="E-commerce, Analysis, KSA Market..." />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'CORE' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'رابط الشعار الرئيسي' : 'Site Logo URL'}</label>
                         <input type="text" value={appConfig.siteLogo || ''} onChange={(e) => setAppConfig({...appConfig, siteLogo: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:border-emerald-500" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{isRtl ? 'رابط أيقونة المتصفح (Favicon)' : 'Site Favicon URL'}</label>
                         <input type="text" value={appConfig.siteFavicon || ''} onChange={(e) => setAppConfig({...appConfig, siteFavicon: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:border-emerald-500" />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center bg-slate-50/50">
                         <p className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Logo Preview</p>
                         {appConfig.siteLogo ? <img src={appConfig.siteLogo} alt="Logo" className="h-16 w-auto object-contain" /> : <div className="h-16 w-16 bg-slate-200 rounded-xl animate-pulse"></div>}
                      </div>
                      <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center bg-slate-50/50">
                         <p className="text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">Favicon Preview</p>
                         {appConfig.siteFavicon ? <img src={appConfig.siteFavicon} alt="Favicon" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    onClick={handleSaveAppConfig}
                    disabled={savingConfig}
                    className="w-full bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50"
                  >
                    {savingConfig ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (isRtl ? 'تحديث إعدادات الموقع' : 'Update Site Branding')}
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
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-3xl font-black">{isRtl ? 'مفاتيح الربط والذكاء الاصطناعي' : 'AI & Search API Keys'}</h2>
                <p className="text-slate-400 text-sm mt-3 font-medium">{isRtl ? 'مفاتيح التشغيل الأساسية لمحركات البحث والتحليل' : 'Primary keys for search and analysis engines'}</p>
             </div>

             <div className="space-y-8">
                <div className="group relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مفتاح Gemini API' : 'Gemini API Key'}</label>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {t.getKey}
                    </a>
                  </div>
                  <input 
                    type="password" 
                    value={appConfig.geminiApiKey}
                    onChange={(e) => setAppConfig({...appConfig, geminiApiKey: e.target.value})}
                    placeholder="AIzaSy..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
                  <p className="text-[9px] text-slate-400 mt-2 italic">{isRtl ? 'يستخدم للتحليل الاستراتيجي وتوليد التقارير عبر نماذج Google Gemini' : 'Used for strategic analysis and report generation via Google Gemini models'}</p>
                </div>

                <div className="group relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'معرف محرك البحث (CX ID)' : 'Google Search ID (CX)'}</label>
                    <a 
                      href="https://programmablesearchengine.google.com/controlpanel/all" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {t.getKey}
                    </a>
                  </div>
                  <input 
                    type="text" 
                    value={appConfig.googleSearchId || ''}
                    onChange={(e) => setAppConfig({...appConfig, googleSearchId: e.target.value})}
                    placeholder="0123456789..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-blue-500 transition-all shadow-sm"
                  />
                  <p className="text-[9px] text-slate-400 mt-2 italic">{isRtl ? 'يستخدم لجلب بيانات المنافسين المباشرة من الويب (Search Engine ID)' : 'Used for fetching live competitor data from the web (Search Engine ID)'}</p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveAppConfig}
                    disabled={savingConfig}
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
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


import React, { useEffect, useState } from 'react';
import { Language, UserProfile, PlanType, UserStatus, PlanConfig, AppConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAllUsers, updateUserPlan, getPlanConfigs, updatePlanConfigs, deleteUserRecord, resetUserSearches, getAppConfig, updateAppConfig } from '../services/userService';

interface Props {
  lang: Language;
}

type AdminTab = 'USERS' | 'PLANS' | 'SITE_SETTINGS' | 'SYSTEM';

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
  const [isKeyConnected, setIsKeyConnected] = useState<boolean | null>(null);
  const [showRawKey, setShowRawKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  const checkApiKeyStatus = async (currentConfig?: AppConfig) => {
    try {
      const configToCheck = currentConfig || appConfig;
      const hasDbKey = !!configToCheck.geminiApiKey && configToCheck.geminiApiKey.length > 10;
      let hasStudioKey = false;
      if ((window as any).aistudio) {
        hasStudioKey = await (window as any).aistudio.hasSelectedApiKey();
      }
      setIsKeyConnected(hasDbKey || hasStudioKey);
    } catch (e) {
      console.error("Key Status Check Error:", e);
    }
  };

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
      if (configData) {
        setAppConfig(prev => ({ ...prev, ...configData }));
        await checkApiKeyStatus(configData);
      } else {
        await checkApiKeyStatus();
      }
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

  const handleUpdateFeature = (planIndex: number, lang: 'AR' | 'EN', featureIndex: number, value: string) => {
    const newPlans = [...plans];
    const field = lang === 'AR' ? 'featuresAr' : 'featuresEn';
    const features = [...newPlans[planIndex][field]];
    features[featureIndex] = value;
    newPlans[planIndex] = { ...newPlans[planIndex], [field]: features };
    setPlans(newPlans);
  };

  const handleAddFeature = (planIndex: number, lang: 'AR' | 'EN') => {
    const newPlans = [...plans];
    const field = lang === 'AR' ? 'featuresAr' : 'featuresEn';
    newPlans[planIndex][field] = [...newPlans[planIndex][field], ""];
    setPlans(newPlans);
  };

  const handleDeleteFeature = (planIndex: number, lang: 'AR' | 'EN', featureIndex: number) => {
    const newPlans = [...plans];
    const field = lang === 'AR' ? 'featuresAr' : 'featuresEn';
    newPlans[planIndex][field] = newPlans[planIndex][field].filter((_, i) => i !== featureIndex);
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
      await checkApiKeyStatus(appConfig);
      showModal(isRtl ? 'تم التحديث' : 'Updated', isRtl ? 'تم حفظ المفتاح وتفعيل محرك البحث بنجاح' : 'Key saved and Search Engine activated successfully', 'emerald');
    } catch (e) {
      showModal(isRtl ? 'خطأ' : 'Error', "Error saving settings", 'rose');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConnectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      await checkApiKeyStatus();
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
                    <button onClick={closeModal} className="flex-1 px-8 py-6 text-sm font-black text-slate-400 hover:bg-slate-50 transition-colors">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={modal.onConfirm} className={`flex-1 px-8 py-6 text-sm font-black text-white transition-all ${modal.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : ''} ${modal.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' : ''} ${modal.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>{isRtl ? 'تأكيد' : 'Confirm'}</button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full px-8 py-6 text-sm font-black text-blue-600 hover:bg-blue-50 transition-colors">{isRtl ? 'حسناً' : 'Okay'}</button>
                )}
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'USERS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'المستفيدين' : 'Users'}</button>
          <button onClick={() => setActiveTab('PLANS')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'PLANS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'الباقات' : 'Plans'}</button>
          <button onClick={() => setActiveTab('SITE_SETTINGS')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'SITE_SETTINGS' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'إعدادات الموقع' : 'Site Info'}</button>
          <button onClick={() => setActiveTab('SYSTEM')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'SYSTEM' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'النظام والربط' : 'System & API'}</button>
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
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-colors">{u.email[0].toUpperCase()}</div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-slate-900">{u.email}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded border border-blue-100 uppercase">{plans.find(p => p.id === u.plan) ? (isRtl ? plans.find(p => p.id === u.plan)?.nameAr : plans.find(p => p.id === u.plan)?.nameEn) : u.plan}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{u.searchCount} {isRtl ? 'بحث' : 'Searches'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <select value={u.plan} onChange={(e) => handleUpdateUser(u.uid, e.target.value, u.status)} className="bg-white border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 outline-none focus:border-blue-500 shadow-sm">
                      <option value="FREE">FREE</option>
                      {plans.map(p => (<option key={p.id} value={p.id}>{isRtl ? p.nameAr : p.nameEn}</option>))}
                      <option value="ELITE">ELITE</option>
                    </select>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleUpdateUser(u.uid, u.plan, u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE')} className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-emerald-50 hover:text-emerald-600'}`}>{u.status === 'ACTIVE' ? (isRtl ? 'إيقاف الحساب' : 'Suspend') : (isRtl ? 'تفعيل الحساب' : 'Activate')}</button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleResetSearches(u.uid)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg></button>
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
          <div className="grid grid-cols-1 gap-8">
            {plans.map((plan, planIdx) => (
              <div key={planIdx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-8 shadow-sm hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">ID (PLAN NAME IN DB)</label>
                    <input type="text" value={plan.id} onChange={(e) => handleUpdatePlanField(planIdx, 'id', e.target.value)} className="text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 w-full outline-none" />
                  </div>
                  <button onClick={() => handleDeletePlan(planIdx)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">NAME (AR)</label>
                        <input type="text" value={plan.nameAr} onChange={(e) => handleUpdatePlanField(planIdx, 'nameAr', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">NAME (EN)</label>
                        <input type="text" value={plan.nameEn} onChange={(e) => handleUpdatePlanField(planIdx, 'nameEn', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">PRICE (SAR)</label>
                        <input type="number" value={plan.price} onChange={(e) => handleUpdatePlanField(planIdx, 'price', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:border-blue-400 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">SEARCH LIMIT</label>
                        <input type="number" value={plan.searchLimit} onChange={(e) => handleUpdatePlanField(planIdx, 'searchLimit', Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:border-blue-400 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 mb-1 tracking-widest uppercase">STRIPE CHECKOUT URL</label>
                      <input type="url" value={plan.stripeUrl} onChange={(e) => handleUpdatePlanField(planIdx, 'stripeUrl', e.target.value)} className="w-full px-4 py-3 bg-blue-50/30 border border-blue-100 rounded-xl text-[11px] font-mono text-blue-700 outline-none focus:border-blue-500" placeholder="https://buy.stripe.com/..." />
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRtl ? 'رابط العودة' : 'Required Success URL'}</span>
                        <button onClick={() => copyToClipboard(getSuccessUrl(plan.id))} className="text-[8px] font-black bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-700 transition-all">{isRtl ? 'نسخ' : 'Copy'}</button>
                      </div>
                      <p className="text-[9px] font-mono text-slate-300 break-all">{getSuccessUrl(plan.id)}</p>
                    </div>
                  </div>

                  {/* Features Management Column */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Arabic Features */}
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'المميزات (عربي)' : 'Features (AR)'}</label>
                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {plan.featuresAr.map((feat, featIdx) => (
                           <div key={featIdx} className="flex gap-2">
                             <input 
                               type="text" 
                               value={feat} 
                               onChange={(e) => handleUpdateFeature(planIdx, 'AR', featIdx, e.target.value)}
                               className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                             />
                             <button onClick={() => handleDeleteFeature(planIdx, 'AR', featIdx)} className="p-1.5 text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                           </div>
                         ))}
                       </div>
                       <button onClick={() => handleAddFeature(planIdx, 'AR')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg>
                         {isRtl ? 'إضافة ميزة' : 'Add Feature'}
                       </button>
                    </div>

                    {/* English Features */}
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Features (EN)</label>
                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {plan.featuresEn.map((feat, featIdx) => (
                           <div key={featIdx} className="flex gap-2">
                             <input 
                               type="text" 
                               value={feat} 
                               onChange={(e) => handleUpdateFeature(planIdx, 'EN', featIdx, e.target.value)}
                               className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                             />
                             <button onClick={() => handleDeleteFeature(planIdx, 'EN', featIdx)} className="p-1.5 text-rose-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                           </div>
                         ))}
                       </div>
                       <button onClick={() => handleAddFeature(planIdx, 'EN')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg>
                         Add Feature
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SYSTEM' && (
        <div className="max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
              <div className="text-center">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-50">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">{isRtl ? 'ربط محرك البحث والـ API' : 'Search Engine & API Integration'}</h2>
                 <p className="text-slate-400 font-bold text-sm mt-3">{isRtl ? 'تحكم في مفاتيح الربط لتشغيل موديل Gemini 3 Pro المتقدم' : 'Manage your connection keys for the Gemini 3 Pro model'}</p>
              </div>
              <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 space-y-4">
                 <div className="flex justify-between items-center">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مفتاح Gemini API (تخزين قواعد البيانات)' : 'Gemini API Key (Database Storage)'}</label>
                   {appConfig.geminiApiKey && (<span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">{isRtl ? 'مخزن' : 'STORED'}</span>)}
                 </div>
                 <div className="relative">
                    <input type={showRawKey ? "text" : "password"} value={appConfig.geminiApiKey || ''} onChange={(e) => setAppConfig({...appConfig, geminiApiKey: e.target.value})} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-blue-400 outline-none focus:border-blue-500 transition-all" placeholder="AIzaSy..." />
                    <button onClick={() => setShowRawKey(!showRawKey)} className="absolute inset-y-0 end-0 px-4 text-slate-500 hover:text-white transition-colors">
                      {showRawKey ? (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>) : (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                    </button>
                 </div>
                 <button onClick={handleSaveAppConfig} disabled={savingConfig} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-900 transition-all active:scale-95 flex items-center justify-center gap-2">
                   {savingConfig ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRtl ? 'حفظ المفتاح في قاعدة البيانات' : 'Save Key to Database')}
                 </button>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'حالة النظام الإجمالية' : 'TOTAL SYSTEM STATUS'}</span>
                    {isKeyConnected ? (<span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>{isRtl ? 'متصل وجاهز للتحليل' : 'CONNECTED & READY'}</span>) : (<span className="flex items-center gap-2 text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100"><span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>{isRtl ? 'غير متصل (يتطلب مفتاح)' : 'NOT CONNECTED'}</span>)}
                 </div>
                 <div className="mt-4 p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-bold text-slate-400">{isRtl ? 'رابط AI Studio الخارجي' : 'External AI Studio Link'}</span>
                       {(window as any).aistudio && (isKeyConnected) ? (<span className="text-[8px] font-black text-emerald-500">ACTIVE</span>) : (<span className="text-[8px] font-black text-slate-300">INACTIVE</span>)}
                    </div>
                    <button onClick={handleConnectKey} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all">{isRtl ? 'ربط / تحديث مفتاح AI Studio الخارجي' : 'Link / Update External AI Studio Key'}</button>
                 </div>
              </div>
              <div className="text-center pt-4 border-t border-slate-50">
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]">{isRtl ? 'توثيق الفوترة والدفع (Google Cloud)' : 'Billing Documentation (Google Cloud)'}</a>
              </div>
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
                  <button onClick={handleSaveAppConfig} disabled={savingConfig} className="w-full bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50">{savingConfig ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (isRtl ? 'تحديث إعدادات الموقع' : 'Update Site Branding')}</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

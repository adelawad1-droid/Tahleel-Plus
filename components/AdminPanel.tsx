
import React, { useEffect, useState } from 'react';
import { Language, UserProfile, PlanType, UserStatus, PlanConfig, AppConfig, LibraryCategory, SavedAnalysis, AnalysisResult } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAllUsers, updateUserPlan, getPlanConfigs, updatePlanConfigs, deleteUserRecord, resetUserSearches, getAppConfig, updateAppConfig, getUserSavedAnalyses } from '../services/userService';
import { getCategories, createCategory, updateCategory, deleteCategory, getAllPublicAnalyses, publishAnalysis, unpublishAnalysis, updatePublishedAnalysis, getLibraryStats, getPublishedAnalysesByUser } from '../services/publicLibraryService';
import { auth } from '../services/firebase';

interface Props {
  lang: Language;
}

type AdminTab = 'USERS' | 'PLANS' | 'SITE_SETTINGS' | 'LIBRARY_CATEGORIES' | 'PUBLIC_LIBRARY' | 'SYSTEM';

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
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [publicAnalyses, setPublicAnalyses] = useState<any[]>([]);
  const [filterByCategory, setFilterByCategory] = useState<string>('');
  const [filterByPublisher, setFilterByPublisher] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views'>('newest');
  const [expandedPlanIndex, setExpandedPlanIndex] = useState<number | null>(null);
  const [selectedUserForPublish, setSelectedUserForPublish] = useState<string>('');
  const [userAnalyses, setUserAnalyses] = useState<SavedAnalysis[]>([]);
  const [libraryStats, setLibraryStats] = useState({ totalCategories: 0, totalAnalyses: 0, totalViews: 0 });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LibraryCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '' });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedAnalysisForPublish, setSelectedAnalysisForPublish] = useState<SavedAnalysis | null>(null);
  const [publishForm, setPublishForm] = useState({ categoryId: '', notes: '' });
  const [appConfig, setAppConfig] = useState<AppConfig>({ 
    geminiApiKey: '',
    googleSearchApiKey: '',
    googleSearchId: '',
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
      const [userData, planData, configData, categoriesData, pubAnalysesData, statsData] = await Promise.all([
        getAllUsers(),
        getPlanConfigs(),
        getAppConfig(),
        getCategories(),
        getAllPublicAnalyses(),
        getLibraryStats()
      ]);
      setUsers(userData);
      setPlans(planData);
      setCategories(categoriesData);
      setPublicAnalyses(pubAnalysesData);
      setLibraryStats(statsData);
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

  // Convert file to Base64
  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only', 'rose');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'حجم الملف كبير جداً. الحد الأقصى 500 كيلوبايت' : 'File size too large. Maximum 500KB', 'rose');
      return;
    }

    try {
      const base64 = await handleFileToBase64(file);
      setAppConfig({ ...appConfig, siteLogo: base64 });
      showModal(isRtl ? 'نجح' : 'Success', isRtl ? 'تم رفع الشعار بنجاح' : 'Logo uploaded successfully', 'emerald');
    } catch (err) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل رفع الملف' : 'Failed to upload file', 'rose');
    }
  };

  // Handle Favicon Upload
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only', 'rose');
      return;
    }

    // Validate file size (max 200KB for favicon)
    if (file.size > 200 * 1024) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'حجم الملف كبير جداً. الحد الأقصى 200 كيلوبايت' : 'File size too large. Maximum 200KB', 'rose');
      return;
    }

    try {
      const base64 = await handleFileToBase64(file);
      setAppConfig({ ...appConfig, siteFavicon: base64 });
      showModal(isRtl ? 'نجح' : 'Success', isRtl ? 'تم رفع الأيقونة بنجاح' : 'Favicon uploaded successfully', 'emerald');
    } catch (err) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل رفع الملف' : 'Failed to upload file', 'rose');
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
      durationMonths: 1,
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

  // Category Modal Functions
  const openCategoryModal = (category?: LibraryCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        descriptionAr: category.descriptionAr || '',
        descriptionEn: category.descriptionEn || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '' });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '' });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.nameAr.trim() || !categoryForm.nameEn.trim()) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يجب إدخال اسم القسم بالعربي والإنجليزي' : 'Category name is required in both languages', 'rose');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يجب تسجيل الدخول' : 'Must be logged in', 'rose');
        return;
      }

      if (editingCategory && editingCategory.id) {
        await updateCategory(editingCategory.id, categoryForm.nameAr, categoryForm.nameEn, categoryForm.descriptionAr, categoryForm.descriptionEn);
      } else {
        await createCategory(categoryForm.nameAr, categoryForm.nameEn, categoryForm.descriptionAr, categoryForm.descriptionEn, currentUser.uid);
      }

      const cats = await getCategories();
      setCategories(cats);
      closeCategoryModal();
      showModal(
        isRtl ? 'نجح' : 'Success',
        editingCategory ? (isRtl ? 'تم تحديث القسم بنجاح' : 'Category updated successfully') : (isRtl ? 'تم إنشاء القسم بنجاح' : 'Category created successfully'),
        'emerald'
      );
    } catch (err: any) {
      showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
    }
  };

  // Publish Modal Functions
  const openPublishModal = (analysis: SavedAnalysis) => {
    if (categories.length === 0) {
      showModal(isRtl ? 'تنبيه' : 'Warning', isRtl ? 'يجب إنشاء قسم أولاً' : 'Create a category first', 'rose');
      return;
    }
    setSelectedAnalysisForPublish(analysis);
    setPublishForm({ categoryId: '', notes: '' });
    setShowPublishModal(true);
  };

  const closePublishModal = () => {
    setShowPublishModal(false);
    setSelectedAnalysisForPublish(null);
    setPublishForm({ categoryId: '', notes: '' });
  };

  const handlePublishAnalysis = async () => {
    if (!publishForm.categoryId) {
      showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يجب اختيار قسم' : 'Please select a category', 'rose');
      return;
    }

    if (!selectedAnalysisForPublish) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showModal(isRtl ? 'خطأ' : 'Error', isRtl ? 'يجب تسجيل الدخول' : 'Must be logged in', 'rose');
        return;
      }

      await publishAnalysis(
        publishForm.categoryId,
        selectedAnalysisForPublish.data.itemName,
        selectedAnalysisForPublish.query,
        selectedAnalysisForPublish.data,
        currentUser.uid,
        currentUser.email || '',
        currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
        publishForm.notes
      );

      const pubAnalyses = await getAllPublicAnalyses();
      setPublicAnalyses(pubAnalyses);
      const stats = await getLibraryStats();
      setLibraryStats(stats);
      closePublishModal();
      showModal(isRtl ? 'نجح' : 'Success', isRtl ? 'تم النشر في مكتبة التحليلات' : 'Published to analysis library', 'emerald');
    } catch (err: any) {
      showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
    }
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
                     <img src={appConfig.siteLogo} alt={lang === 'ar' ? 'شعار الموقع' : 'Site Logo'} className="w-10 h-10 object-contain" loading="lazy" />
                   ) : (
                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label={lang === 'ar' ? 'أيقونة معلومات' : 'Info Icon'}>
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
          <button onClick={() => setActiveTab('LIBRARY_CATEGORIES')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'LIBRARY_CATEGORIES' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'أقسام مكتبة التحليلات' : 'Library Categories'}</button>
          <button onClick={() => setActiveTab('PUBLIC_LIBRARY')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${activeTab === 'PUBLIC_LIBRARY' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>{isRtl ? 'مكتبة التحليلات' : 'Analysis Library'}</button>
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

          {/* Plans Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'ID الباقة' : 'Plan ID'}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الاسم' : 'Name'}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'السعر' : 'Price'}</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'المدة' : 'Duration'}</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'البحوث' : 'Searches'}</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, planIdx) => (
                    <React.Fragment key={planIdx}>
                      <tr className={`${planIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${expandedPlanIndex === planIdx ? 'border-b-0' : 'border-b border-slate-100'}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            value={plan.id} 
                            onChange={(e) => handleUpdatePlanField(planIdx, 'id', e.target.value)} 
                            className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 w-full outline-none focus:border-blue-400"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <input 
                              type="text" 
                              value={plan.nameAr} 
                              onChange={(e) => handleUpdatePlanField(planIdx, 'nameAr', e.target.value)} 
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                              placeholder={isRtl ? 'الاسم بالعربي' : 'Arabic Name'}
                            />
                            <input 
                              type="text" 
                              value={plan.nameEn} 
                              onChange={(e) => handleUpdatePlanField(planIdx, 'nameEn', e.target.value)} 
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                              placeholder="English Name"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <input 
                              type="number" 
                              value={plan.price} 
                              onChange={(e) => handleUpdatePlanField(planIdx, 'price', Number(e.target.value))} 
                              className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:border-blue-400"
                            />
                            {plan.discountedPrice && (
                              <input 
                                type="number" 
                                value={plan.discountedPrice} 
                                onChange={(e) => handleUpdatePlanField(planIdx, 'discountedPrice', e.target.value ? Number(e.target.value) : undefined)} 
                                className="w-24 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-black outline-none focus:border-emerald-400"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            value={plan.durationMonths || 1} 
                            onChange={(e) => handleUpdatePlanField(planIdx, 'durationMonths', Number(e.target.value))} 
                            className="w-16 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:border-blue-400 text-center"
                            min="1"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            value={plan.searchLimit} 
                            onChange={(e) => handleUpdatePlanField(planIdx, 'searchLimit', Number(e.target.value))} 
                            className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:border-blue-400 text-center"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setExpandedPlanIndex(expandedPlanIndex === planIdx ? null : planIdx)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title={isRtl ? 'تفاصيل' : 'Details'}
                            >
                              <svg className={`w-5 h-5 transition-transform ${expandedPlanIndex === planIdx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePlan(planIdx)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title={isRtl ? 'حذف' : 'Delete'}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {expandedPlanIndex === planIdx && (
                        <tr className={planIdx % 2 === 0 ? 'bg-white border-b border-slate-200' : 'bg-slate-50 border-b border-slate-200'}>
                          <td colSpan={6} className="px-6 py-6">
                            <div className="space-y-6">
                              {/* Pricing Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{isRtl ? 'السعر الأصلي' : 'Original Price'}</label>
                                  <input 
                                    type="number" 
                                    value={plan.price} 
                                    onChange={(e) => handleUpdatePlanField(planIdx, 'price', Number(e.target.value))} 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black outline-none focus:border-blue-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">{isRtl ? 'السعر المخفض' : 'Discounted Price'}</label>
                                  <input 
                                    type="number" 
                                    value={plan.discountedPrice || ''} 
                                    onChange={(e) => handleUpdatePlanField(planIdx, 'discountedPrice', e.target.value ? Number(e.target.value) : undefined)} 
                                    className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-black outline-none focus:border-emerald-400"
                                    placeholder={isRtl ? 'اختياري' : 'Optional'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest">Stripe URL</label>
                                  <input 
                                    type="url" 
                                    value={plan.stripeUrl} 
                                    onChange={(e) => handleUpdatePlanField(planIdx, 'stripeUrl', e.target.value)} 
                                    className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-mono text-blue-700 outline-none focus:border-blue-500"
                                    placeholder="https://buy.stripe.com/..."
                                  />
                                </div>
                              </div>

                              {/* Success URL */}
                              <div className="p-4 bg-slate-900 text-white rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRtl ? 'رابط العودة المطلوب' : 'Required Success URL'}</span>
                                  <button onClick={() => copyToClipboard(getSuccessUrl(plan.id))} className="text-[8px] font-black bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-700 transition-all">
                                    {isRtl ? 'نسخ' : 'Copy'}
                                  </button>
                                </div>
                                <p className="text-[9px] font-mono text-slate-300 break-all">{getSuccessUrl(plan.id)}</p>
                              </div>

                              {/* Features */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Arabic Features */}
                                <div>
                                  <label className="block text-xs font-black text-slate-700 mb-3 uppercase tracking-widest">{isRtl ? 'المميزات (عربي)' : 'Features (Arabic)'}</label>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {plan.featuresAr.map((feat, featIdx) => (
                                      <div key={featIdx} className="flex gap-2">
                                        <input 
                                          type="text" 
                                          value={feat} 
                                          onChange={(e) => handleUpdateFeature(planIdx, 'AR', featIdx, e.target.value)}
                                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                                        />
                                        <button onClick={() => handleDeleteFeature(planIdx, 'AR', featIdx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={() => handleAddFeature(planIdx, 'AR')} className="mt-3 text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    {isRtl ? 'إضافة ميزة' : 'Add Feature'}
                                  </button>
                                </div>

                                {/* English Features */}
                                <div>
                                  <label className="block text-xs font-black text-slate-700 mb-3 uppercase tracking-widest">Features (English)</label>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {plan.featuresEn.map((feat, featIdx) => (
                                      <div key={featIdx} className="flex gap-2">
                                        <input 
                                          type="text" 
                                          value={feat} 
                                          onChange={(e) => handleUpdateFeature(planIdx, 'EN', featIdx, e.target.value)}
                                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-blue-400"
                                        />
                                        <button onClick={() => handleDeleteFeature(planIdx, 'EN', featIdx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button onClick={() => handleAddFeature(planIdx, 'EN')} className="mt-3 text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Feature
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LIBRARY_CATEGORIES' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">{isRtl ? 'أقسام مكتبة التحليلات' : 'Analysis Library Categories'}</h2>
              <button 
                onClick={() => openCategoryModal()}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg"
              >
                {isRtl ? '+ قسم جديد' : '+ New Category'}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'اسم القسم (عربي)' : 'Category Name (AR)'}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'اسم القسم (إنجليزي)' : 'Category Name (EN)'}</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الوصف' : 'Description'}</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{cat.nameAr}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{cat.nameEn}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{isRtl ? cat.descriptionAr : cat.descriptionEn}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openCategoryModal(cat)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title={isRtl ? 'تعديل' : 'Edit'}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              showModal(
                                isRtl ? 'حذف القسم' : 'Delete Category',
                                isRtl ? 'هل تريد حذف هذا القسم؟' : 'Delete this category?',
                                'rose',
                                async () => {
                                  try {
                                    if (cat.id) {
                                      await deleteCategory(cat.id);
                                      const cats = await getCategories();
                                      setCategories(cats);
                                      closeModal();
                                    }
                                  } catch (err: any) {
                                    closeModal();
                                    showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
                                  }
                                }
                              );
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold">{isRtl ? 'لا توجد أقسام بعد' : 'No categories yet'}</p>
                <p className="text-sm mt-2">{isRtl ? 'أنشئ أول قسم لبدء نشر التحاليل' : 'Create your first category to start publishing'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'PUBLIC_LIBRARY' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{isRtl ? 'مكتبة التحليلات' : 'Analysis Library'}</h2>
                <p className="text-sm text-slate-500 mt-2">
                  {isRtl ? `${libraryStats.totalAnalyses} تحليل منشور • ${libraryStats.totalViews} مشاهدة` : `${libraryStats.totalAnalyses} Published • ${libraryStats.totalViews} Views`}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('LIBRARY_CATEGORIES')}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                {isRtl ? 'إدارة الأقسام' : 'Manage Categories'}
              </button>
            </div>

            <div className="mb-8 space-y-4">
              <h3 className="font-black text-lg">{isRtl ? 'نشر تحليل جديد' : 'Publish New Analysis'}</h3>
              <div className="flex gap-4">
                <select
                  value={selectedUserForPublish}
                  onChange={(e) => setSelectedUserForPublish(e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                >
                  <option value="">{isRtl ? 'اختر مستخدم لعرض تحاليله' : 'Select user to see their analyses'}</option>
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.displayName || user.email} ({user.searchCount} {isRtl ? 'بحث' : 'searches'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (selectedUserForPublish) {
                      try {
                        const analyses = await getUserSavedAnalyses(selectedUserForPublish);
                        const publishedAnalyses = await getPublishedAnalysesByUser(selectedUserForPublish);
                        setUserAnalyses(analyses);
                        setPublicAnalyses(publishedAnalyses);
                        if (analyses.length === 0) {
                          showModal(isRtl ? 'تنبيه' : 'Info', isRtl ? 'هذا المستخدم ليس لديه تحليلات' : 'This user has no analyses', 'blue');
                        }
                      } catch (err: any) {
                        showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
                      }
                    }
                  }}
                  disabled={!selectedUserForPublish}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isRtl ? 'عرض التحاليل' : 'Load Analyses'}
                </button>
              </div>

              {userAnalyses.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-black text-slate-500 mb-3">{userAnalyses.length} {isRtl ? 'تحليل متاح' : 'analyses available'}</p>
                  {userAnalyses.map((analysis) => {
                    // Check if this analysis is published using stored flag and robust linking
                    const isPublished = 
                      analysis.isPublished === true ||
                      publicAnalyses.some(pub => 
                        (pub.savedAnalysisId && pub.savedAnalysisId === analysis.id) ||
                        (pub.normalizedQuery && analysis.normalizedQuery && pub.normalizedQuery === analysis.normalizedQuery) ||
                        (pub.query === analysis.query && pub.itemName === analysis.data.itemName)
                      );
                    
                    return (
                      <div key={analysis.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isPublished 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div>
                          <h4 className="font-bold">{analysis.data.itemName}</h4>
                          <p className="text-xs text-slate-500">{analysis.query}</p>
                        </div>
                        {isPublished ? (
                          <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">
                            {isRtl ? 'منشور' : 'Published'}
                          </span>
                        ) : (
                          <button
                            onClick={() => openPublishModal(analysis)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                          >
                            {isRtl ? 'نشر' : 'Publish'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selectedUserForPublish && userAnalyses.length === 0 ? (
                <div className="text-center py-8 px-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-amber-700 font-bold">{isRtl ? 'اضغط "عرض التحاليل" لتحميل المحفوظات' : 'Click "Load Analyses" to load saved analyses'}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-[250px]">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{isRtl ? 'الفرز حسب' : 'Sort By'}</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  >
                    <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest First'}</option>
                    <option value="oldest">{isRtl ? 'الأقدم أولاً' : 'Oldest First'}</option>
                    <option value="views">{isRtl ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[250px]">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{isRtl ? 'القسم' : 'Category'}</label>
                  <select 
                    value={filterByCategory}
                    onChange={(e) => setFilterByCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  >
                    <option value="">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id || ''}>
                        {isRtl ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[250px]">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{isRtl ? 'الناشر' : 'Publisher'}</label>
                  <select 
                    value={filterByPublisher}
                    onChange={(e) => setFilterByPublisher(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
                  >
                    <option value="">{isRtl ? 'جميع الناشرين' : 'All Publishers'}</option>
                    {[...new Set(publicAnalyses.map(p => p.publisherEmail).filter(Boolean))].map(email => {
                      const publisher = publicAnalyses.find(p => p.publisherEmail === email);
                      const displayName = publisher?.publisherName && publisher.publisherName.trim() 
                        ? publisher.publisherName 
                        : (publisher?.publisherEmail || email || '').split('@')[0];
                      return (
                        <option key={email} value={email}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'اسم المنتج' : 'Product Name'}</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'القسم' : 'Category'}</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الناشر' : 'Publisher'}</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'تاريخ النشر' : 'Published Date'}</th>
                      <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'المشاهدات' : 'Views'}</th>
                      <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-widest">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicAnalyses
                      .filter(pub => !filterByCategory || pub.categoryId === filterByCategory)
                      .filter(pub => !filterByPublisher || pub.publisherEmail === filterByPublisher)
                      .sort((a, b) => {
                        if (sortBy === 'newest') return (b.publishedDate || 0) - (a.publishedDate || 0);
                        if (sortBy === 'oldest') return (a.publishedDate || 0) - (b.publishedDate || 0);
                        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
                        return 0;
                      })
                      .map((pub, idx) => (
                        <tr key={pub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-900">{pub.itemName}</p>
                              <p className="text-xs text-slate-500 mt-1">{pub.query}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">
                              {isRtl ? pub.categoryNameAr : pub.categoryNameEn}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700">{pub.publisherName || pub.publisherEmail?.split('@')[0]}</p>
                            <p className="text-xs text-slate-400">{pub.publisherEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700">
                              {new Date(pub.publishedDate || 0).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(pub.publishedDate || 0).toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="font-bold text-slate-700">{pub.views || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  showModal(
                                    isRtl ? 'حذف التحليل' : 'Delete Analysis',
                                    isRtl ? 'هل تريد حذف هذا التحليل من المكتبة؟' : 'Delete this analysis from library?',
                                    'rose',
                                    async () => {
                                      try {
                                        if (pub.id) {
                                          await unpublishAnalysis(pub.id);
                                          const pubAnalyses = await getAllPublicAnalyses();
                                          setPublicAnalyses(pubAnalyses);
                                          const stats = await getLibraryStats();
                                          setLibraryStats(stats);
                                          closeModal();
                                        }
                                      } catch (err: any) {
                                        showModal(isRtl ? 'خطأ' : 'Error', err.message, 'rose');
                                      }
                                    }
                                  );
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title={isRtl ? 'حذف' : 'Delete'}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                              <button
                                onClick={() => showModal(
                                  isRtl ? 'التفاصيل' : 'Details',
                                  isRtl ? `المنتج: ${pub.itemName}\nالفئة: ${pub.categoryNameAr}\nالناشر: ${pub.publisherEmail}\nالملاحظات: ${pub.notes || 'لا توجد'}` : `Product: ${pub.itemName}\nCategory: ${pub.categoryNameEn}\nPublisher: ${pub.publisherEmail}\nNotes: ${pub.notes || 'None'}`,
                                  'blue'
                                )}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title={isRtl ? 'عرض التفاصيل' : 'View Details'}
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {publicAnalyses.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-bold">{isRtl ? 'لا توجد تحاليل منشورة' : 'No published analyses'}</p>
                  <p className="text-sm mt-2">{isRtl ? 'اختر مستخدم وانشر أول تحليل' : 'Select a user and publish the first analysis'}</p>
                </div>
              )}
            </div>
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

              <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 space-y-4">
                 <div className="flex justify-between items-center">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'مفتاح Google Custom Search API (اختياري)' : 'Google Custom Search API Key (Optional)'}</label>
                   {appConfig.googleSearchApiKey && (<span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">{isRtl ? 'مخزن' : 'STORED'}</span>)}
                 </div>
                 <input type={showRawKey ? "text" : "password"} value={appConfig.googleSearchApiKey || ''} onChange={(e) => setAppConfig({...appConfig, googleSearchApiKey: e.target.value})} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500 transition-all" placeholder="AIzaSy..." />
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{isRtl ? 'يستخدم لتعزيز دقة البحث عن المتاجر والمنافسين في السعودية. إضافته تحسّن جودة التقارير بشكل كبير.' : 'Used to enhance search accuracy for stores and competitors in Saudi Arabia. Adding it significantly improves report quality.'}</p>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 space-y-4">
                 <div className="flex justify-between items-center">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'معرّف محرك البحث (Search Engine ID)' : 'Search Engine ID'}</label>
                   {appConfig.googleSearchId && (<span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">{isRtl ? 'مخزن' : 'STORED'}</span>)}
                 </div>
                 <input type={showRawKey ? "text" : "password"} value={appConfig.googleSearchId || ''} onChange={(e) => setAppConfig({...appConfig, googleSearchId: e.target.value})} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-blue-400 outline-none focus:border-blue-500 transition-all" placeholder="0123456789abcdef..." />
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{isRtl ? 'معرّف محرك البحث المخصص من Google. يعمل مع مفتاح API أعلاه لجلب بيانات دقيقة من الإنترنت.' : 'Custom Search Engine ID from Google. Works with API key above to fetch accurate data from the web.'}</p>
                 <a href="https://programmablesearchengine.google.com/controlpanel/all" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black text-blue-400 hover:text-blue-300 transition-colors">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                   {isRtl ? 'إنشاء محرك بحث مخصص (مجاناً)' : 'Create Custom Search Engine (Free)'}
                 </a>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-[2rem] border border-blue-200">
                 <p className="text-sm font-bold text-blue-900 mb-4">{isRtl ? 'اضغط على الزر أدناه لحفظ جميع المفاتيح في قاعدة البيانات' : 'Click the button below to save all API keys to the database'}</p>
                 <button onClick={handleSaveAppConfig} disabled={savingConfig} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-black text-sm hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                   {savingConfig ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       {isRtl ? 'جاري الحفظ...' : 'Saving...'}
                     </>
                   ) : (
                     <>
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" /></svg>
                       {isRtl ? 'حفظ جميع المفاتيح في قاعدة البيانات' : 'Save All API Keys to Database'}
                     </>
                   )}
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in">
             {/* Header */}
             <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-10 py-8">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white">{isRtl ? 'إعدادات الموقع والهوية' : 'Site Settings & Branding'}</h2>
                      <p className="text-emerald-100 text-sm font-bold mt-1">{isRtl ? 'تحكم في المحتوى والوسائط وتحسين محركات البحث' : 'Manage content, media, and SEO optimization'}</p>
                   </div>
                </div>
             </div>

             {/* Tabs */}
             <div className="px-10 pt-8">
                <div className="flex justify-center">
                   <div className="inline-flex bg-white p-1.5 rounded-2xl border-2 border-slate-200 shadow-lg">
                      <button onClick={() => setSettingsSubTab('AR')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${settingsSubTab === 'AR' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                         {isRtl ? 'المحتوى العربي' : 'Arabic Content'}
                      </button>
                      <button onClick={() => setSettingsSubTab('EN')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${settingsSubTab === 'EN' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                         {isRtl ? 'المحتوى الإنجليزي' : 'English Content'}
                      </button>
                      <button onClick={() => setSettingsSubTab('CORE')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${settingsSubTab === 'CORE' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         {isRtl ? 'الشعار والوسائط' : 'Logo & Media'}
                      </button>
                   </div>
                </div>
             </div>

             {/* Content */}
             <div className="p-10">
                {settingsSubTab === 'AR' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Site Name AR */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">{isRtl ? 'اسم الموقع (عربي)' : 'Site Name (AR)'}</label>
                             <p className="text-[10px] text-slate-400 font-medium">{isRtl ? 'يظهر في عنوان المتصفح والنتائج' : 'Appears in browser title and results'}</p>
                          </div>
                       </div>
                       <input type="text" value={appConfig.siteNameAr || ''} onChange={(e) => setAppConfig({...appConfig, siteNameAr: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-base outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder={isRtl ? 'مثال: تحليل بلس - منصة التحليل المتقدم' : 'Example: Tahleel Plus - Advanced Analysis Platform'} />
                    </div>

                    {/* Description AR */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">{isRtl ? 'وصف الموقع (عربي)' : 'Site Description (AR)'}</label>
                             <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                {isRtl ? 'مهم لتحسين محركات البحث (SEO)' : 'Important for SEO optimization'}
                             </p>
                          </div>
                       </div>
                       <textarea value={appConfig.siteDescriptionAr || ''} onChange={(e) => setAppConfig({...appConfig, siteDescriptionAr: e.target.value})} rows={4} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-purple-500 focus:bg-white transition-all resize-none" placeholder={isRtl ? 'أدخل وصفاً شاملاً يشرح خدمات موقعك ويجذب الزوار من محركات البحث...' : 'Enter comprehensive description of your site services...'} />
                       <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">{isRtl ? 'الطول المثالي: 150-160 حرف' : 'Ideal length: 150-160 characters'}</span>
                          <span className={`font-black ${(appConfig.siteDescriptionAr?.length || 0) > 160 ? 'text-rose-500' : 'text-slate-400'}`}>{appConfig.siteDescriptionAr?.length || 0} / 160</span>
                       </div>
                    </div>

                    {/* Keywords AR */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">{isRtl ? 'الكلمات المفتاحية (عربي)' : 'Keywords (AR)'}</label>
                             <p className="text-[10px] text-slate-400 font-medium">{isRtl ? 'افصل الكلمات بفواصل (،)' : 'Separate keywords with commas'}</p>
                          </div>
                       </div>
                       <input type="text" value={appConfig.siteKeywordsAr || ''} onChange={(e) => setAppConfig({...appConfig, siteKeywordsAr: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-rose-500 focus:bg-white transition-all" placeholder={isRtl ? 'تحليل السوق، تجارة إلكترونية، دراسة جدوى، السعودية' : 'Market analysis, e-commerce, feasibility study, KSA'} />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'EN' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Site Name EN */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Site Name (English)</label>
                             <p className="text-[10px] text-slate-400 font-medium">Appears in browser title and results</p>
                          </div>
                       </div>
                       <input type="text" value={appConfig.siteNameEn || ''} onChange={(e) => setAppConfig({...appConfig, siteNameEn: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-base outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Example: Tahleel Plus - Advanced Market Analysis" />
                    </div>

                    {/* Description EN */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Site Description (English)</label>
                             <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Important for SEO optimization
                             </p>
                          </div>
                       </div>
                       <textarea value={appConfig.siteDescriptionEn || ''} onChange={(e) => setAppConfig({...appConfig, siteDescriptionEn: e.target.value})} rows={4} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-purple-500 focus:bg-white transition-all resize-none" placeholder="Enter comprehensive description explaining your site services and value proposition..." />
                       <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Ideal length: 150-160 characters</span>
                          <span className={`font-black ${(appConfig.siteDescriptionEn?.length || 0) > 160 ? 'text-rose-500' : 'text-slate-400'}`}>{appConfig.siteDescriptionEn?.length || 0} / 160</span>
                       </div>
                    </div>

                    {/* Keywords EN */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Keywords (English)</label>
                             <p className="text-[10px] text-slate-400 font-medium">Separate keywords with commas</p>
                          </div>
                       </div>
                       <input type="text" value={appConfig.siteKeywordsEn || ''} onChange={(e) => setAppConfig({...appConfig, siteKeywordsEn: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-rose-500 focus:bg-white transition-all" placeholder="Market Analysis, E-commerce, Business Intelligence, KSA, Saudi Arabia" />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'CORE' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Logo Section */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div className="flex-1">
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">{isRtl ? 'الشعار الرئيسي' : 'Main Logo'}</label>
                             <p className="text-[10px] text-slate-400 font-medium">{isRtl ? 'رفع ملف أو إدخال رابط URL' : 'Upload file or enter URL'}</p>
                          </div>
                          <label className="cursor-pointer">
                             <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                             <div className="px-6 py-2.5 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl font-black text-xs hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-200 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                {isRtl ? 'رفع ملف' : 'Upload'}
                             </div>
                          </label>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                             <label className="block text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider">{isRtl ? 'أو أدخل رابط URL' : 'Or enter URL'}</label>
                             <input type="text" value={appConfig.siteLogo || ''} onChange={(e) => setAppConfig({...appConfig, siteLogo: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-amber-500 focus:bg-white transition-all" placeholder="https://example.com/logo.png" />
                             <p className="mt-2 text-[9px] text-slate-400 font-medium">{isRtl ? 'الحد الأقصى للملف: 500 كيلوبايت' : 'Max file size: 500KB'}</p>
                          </div>
                          <div className="p-6 border-2 border-dashed border-amber-200 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-white min-h-[140px]">
                             {appConfig.siteLogo ? (
                                <div className="text-center">
                                   <img src={appConfig.siteLogo} alt={lang === 'ar' ? 'شعار الموقع' : 'Site Logo'} className="h-16 w-auto max-w-full object-contain mx-auto mb-2" loading="lazy" />
                                   <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{isRtl ? '✓ جاري العرض' : '✓ ACTIVE'}</span>
                                   <button onClick={() => setAppConfig({...appConfig, siteLogo: ''})} className="mt-2 text-[9px] font-bold text-rose-600 hover:text-rose-700 underline">
                                      {isRtl ? 'حذف' : 'Remove'}
                                   </button>
                                </div>
                             ) : (
                                <div className="text-center">
                                   <div className="h-16 w-16 bg-slate-200 rounded-xl animate-pulse mx-auto mb-2" role="img" aria-label={lang === 'ar' ? 'جاري تحميل الشعار' : 'Loading logo'}></div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase">{isRtl ? 'لا يوجد شعار' : 'No Logo'}</p>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Favicon Section */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          </div>
                          <div className="flex-1">
                             <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">{isRtl ? 'أيقونة المتصفح (Favicon)' : 'Browser Icon (Favicon)'}</label>
                             <p className="text-[10px] text-slate-400 font-medium">{isRtl ? 'تظهر في تبويب المتصفح (16x16 أو 32x32 بكسل)' : 'Appears in browser tab (16x16 or 32x32 pixels)'}</p>
                          </div>
                          <label className="cursor-pointer">
                             <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                             <div className="px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl font-black text-xs hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                {isRtl ? 'رفع ملف' : 'Upload'}
                             </div>
                          </label>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                             <label className="block text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider">{isRtl ? 'أو أدخل رابط URL' : 'Or enter URL'}</label>
                             <input type="text" value={appConfig.siteFavicon || ''} onChange={(e) => setAppConfig({...appConfig, siteFavicon: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all" placeholder="https://example.com/favicon.ico" />
                             <p className="mt-2 text-[9px] text-slate-400 font-medium">{isRtl ? 'الحد الأقصى للملف: 200 كيلوبايت' : 'Max file size: 200KB'}</p>
                          </div>
                          <div className="p-6 border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white min-h-[140px]">
                             {appConfig.siteFavicon ? (
                                <div className="text-center">
                                   <img src={appConfig.siteFavicon} alt={lang === 'ar' ? 'أيقونة الموقع' : 'Site Favicon'} className="h-12 w-12 object-contain mx-auto mb-2 ring-2 ring-slate-200 rounded-lg p-2 bg-white" loading="lazy" />
                                   <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{isRtl ? '✓ جاري العرض' : '✓ ACTIVE'}</span>
                                   <button onClick={() => setAppConfig({...appConfig, siteFavicon: ''})} className="mt-2 text-[9px] font-bold text-rose-600 hover:text-rose-700 underline">
                                      {isRtl ? 'حذف' : 'Remove'}
                                   </button>
                                </div>
                             ) : (
                                <div className="text-center">
                                   <div className="h-12 w-12 bg-slate-200 rounded-lg animate-pulse mx-auto mb-2" role="img" aria-label={lang === 'ar' ? 'جاري تحميل الأيقونة' : 'Loading icon'}></div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase">{isRtl ? 'لا توجد أيقونة' : 'No Icon'}</p>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-2xl">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-blue-900 mb-2">{isRtl ? 'نصائح للوسائط' : 'Media Tips'}</h4>
                             <ul className="space-y-1 text-xs text-blue-700 font-medium">
                                <li className="flex items-start gap-2">
                                   <span className="text-blue-500 mt-0.5">•</span>
                                   <span>{isRtl ? 'الشعار: يفضل PNG شفاف، الحجم الموصى به 200x50 بكسل' : 'Logo: Prefer transparent PNG, recommended size 200x50 pixels'}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                   <span className="text-blue-500 mt-0.5">•</span>
                                   <span>{isRtl ? 'الأيقونة: يجب أن تكون مربعة 32x32 أو 16x16 بكسل بصيغة ICO أو PNG' : 'Favicon: Must be square 32x32 or 16x16 pixels in ICO or PNG format'}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                   <span className="text-blue-500 mt-0.5">•</span>
                                   <span>{isRtl ? 'استخدم روابط HTTPS للأمان والسرعة' : 'Use HTTPS links for security and speed'}</span>
                                </li>
                             </ul>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-6">
                  <button onClick={handleSaveAppConfig} disabled={savingConfig} className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-6 rounded-2xl font-black text-lg hover:from-emerald-700 hover:to-emerald-800 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                     {savingConfig ? (
                        <>
                           <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                        </>
                     ) : (
                        <>
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           <span>{isRtl ? 'حفظ جميع الإعدادات' : 'Save All Settings'}</span>
                        </>
                     )}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full animate-in zoom-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-10 py-6 rounded-t-[2.5rem]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {editingCategory ? (isRtl ? 'تعديل القسم' : 'Edit Category') : (isRtl ? 'قسم جديد' : 'New Category')}
                  </h2>
                  <p className="text-blue-100 text-xs font-bold">
                    {isRtl ? 'املأ البيانات بالعربي والإنجليزي' : 'Fill data in both Arabic and English'}
                  </p>
                </div>
                <button
                  onClick={closeCategoryModal}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Arabic Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-black text-sm">ع</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{isRtl ? 'البيانات بالعربي' : 'Arabic Data'}</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      {isRtl ? 'اسم القسم' : 'Category Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.nameAr}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                      placeholder={isRtl ? 'مثال: الإلكترونيات' : 'Example: Electronics'}
                      className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      {isRtl ? 'الوصف (اختياري)' : 'Description (Optional)'}
                    </label>
                    <textarea
                      value={categoryForm.descriptionAr}
                      onChange={(e) => setCategoryForm({ ...categoryForm, descriptionAr: e.target.value })}
                      placeholder={isRtl ? 'وصف مختصر...' : 'Brief description...'}
                      rows={3}
                      className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* English Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 font-black text-sm">EN</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{isRtl ? 'البيانات بالإنجليزي' : 'English Data'}</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      {isRtl ? 'اسم القسم' : 'Category Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.nameEn}
                      onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                      placeholder="Example: Electronics"
                      className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                      {isRtl ? 'الوصف (اختياري)' : 'Description (Optional)'}
                    </label>
                    <textarea
                      value={categoryForm.descriptionEn}
                      onChange={(e) => setCategoryForm({ ...categoryForm, descriptionEn: e.target.value })}
                      placeholder="Brief description..."
                      rows={3}
                      className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-8">
                <button
                  onClick={closeCategoryModal}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-all"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-black hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  {editingCategory ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء القسم' : 'Create Category')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && selectedAnalysisForPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full animate-in zoom-in slide-in-from-bottom-4 flex flex-col max-h-[90vh] my-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-10 py-6 rounded-t-[2.5rem] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {isRtl ? 'نشر في المكتبة العامة' : 'Publish to Public Library'}
                  </h2>
                  <p className="text-emerald-100 text-xs font-bold">
                    {selectedAnalysisForPublish.data.itemName}
                  </p>
                </div>
                <button
                  onClick={closePublishModal}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form - Scrollable Content */}
            <div className="p-10 space-y-6 overflow-y-auto flex-grow">
              {/* Analysis Info */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-black text-sm text-slate-500 mb-2">{isRtl ? 'استعلام البحث' : 'Search Query'}</h3>
                <p className="text-slate-700 font-bold">{selectedAnalysisForPublish.query}</p>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">
                  {isRtl ? 'اختر القسم' : 'Select Category'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPublishForm({ ...publishForm, categoryId: cat.id! })}
                      className={`p-4 rounded-2xl border-2 transition-all text-start ${
                        publishForm.categoryId === cat.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-slate-900">{isRtl ? cat.nameAr : cat.nameEn}</h4>
                          {(cat.descriptionAr || cat.descriptionEn) && (
                            <p className="text-xs text-slate-500 mt-1">{isRtl ? cat.descriptionAr : cat.descriptionEn}</p>
                          )}
                        </div>
                        {publishForm.categoryId === cat.id && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 ml-2">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-3">
                  {isRtl ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </label>
                <textarea
                  value={publishForm.notes}
                  onChange={(e) => setPublishForm({ ...publishForm, notes: e.target.value })}
                  placeholder={isRtl ? 'أضف ملاحظات إضافية...' : 'Add additional notes...'}
                  rows={3}
                  className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="flex gap-4 p-10 bg-white border-t border-slate-100 rounded-b-[2.5rem] flex-shrink-0">
              <button
                onClick={closePublishModal}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-all"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handlePublishAnalysis}
                disabled={!publishForm.categoryId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRtl ? 'نشر الآن' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

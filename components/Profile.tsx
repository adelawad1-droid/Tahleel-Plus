
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
  updateEmail, 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { UserProfile, Language, PlanConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { updateUserDetails, deleteUserRecord } from '../services/userService';

interface Props {
  profile: UserProfile;
  plans: PlanConfig[];
  lang: Language;
  onRefresh: () => void;
}

export const Profile: React.FC<Props> = ({ profile, plans, lang, onRefresh }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [email, setEmail] = useState(profile.email);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReauth, setShowReauth] = useState(false);
  const [reauthAction, setReauthAction] = useState<'EMAIL' | 'PASSWORD' | 'DELETE' | null>(null);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Find plan details
  const currentPlan = plans.find(p => p.id === profile.plan);
  const searchLimit = currentPlan ? currentPlan.searchLimit : (profile.plan === 'ELITE' ? 99999 : 5);
  const usagePercent = Math.min(100, (profile.searchCount / searchLimit) * 100);
  const expiryDate = new Date(profile.expiryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US');

  const handleUpdateName = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserDetails(profile.uid, { displayName });
      setSuccess(isRtl ? "تم تحديث الاسم بنجاح" : "Name updated successfully");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerReauth = (action: 'EMAIL' | 'PASSWORD' | 'DELETE') => {
    setReauthAction(action);
    setShowReauth(true);
    setError(null);
    setSuccess(null);
  };

  const handleReauthAndAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !currentPassword) return;
    
    setLoading(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      if (reauthAction === 'EMAIL') {
        await updateEmail(auth.currentUser, email);
        await updateUserDetails(profile.uid, { email });
        setSuccess(isRtl ? "تم تحديث البريد الإلكتروني" : "Email updated successfully");
      } else if (reauthAction === 'PASSWORD') {
        await updatePassword(auth.currentUser, newPassword);
        setSuccess(isRtl ? "تم تغيير كلمة المرور" : "Password changed successfully");
      } else if (reauthAction === 'DELETE') {
        await deleteUserRecord(profile.uid);
        await deleteUser(auth.currentUser);
        window.location.reload();
        return;
      }
      
      setShowReauth(false);
      setCurrentPassword('');
      setNewPassword('');
      onRefresh();
    } catch (err: any) {
      setError(isRtl ? "كلمة المرور الحالية غير صحيحة" : "Incorrect current password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
           <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-100">
              {profile.displayName ? profile.displayName[0].toUpperCase() : profile.email[0].toUpperCase()}
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900">{t.profile}</h2>
              <p className="text-slate-400 font-bold text-sm">{profile.email}</p>
              <span className="inline-block mt-2 bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{profile.plan} PLAN</span>
           </div>
        </div>

        {/* Subscription Info Card */}
        <div className="mb-8 p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">{isRtl ? 'الباقة الحالية' : 'Current Plan'}</p>
                    <h3 className="text-2xl font-black">{currentPlan ? (isRtl ? currentPlan.nameAr : currentPlan.nameEn) : profile.plan}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</p>
                    <p className="font-bold text-sm">{expiryDate}</p>
                 </div>
              </div>
              
              <div className="space-y-3">
                 <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-400 uppercase tracking-widest">{isRtl ? 'استهلاك البحث' : 'Search Usage'}</span>
                    <span>{profile.searchCount} / {profile.plan === 'ELITE' ? (isRtl ? 'غير محدود' : 'Unlimited') : searchLimit}</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-black">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Update Name */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.displayName}</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
              />
              <button 
                onClick={handleUpdateName}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>

          {/* Update Email */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.email}</label>
            <div className="flex gap-3">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
              />
              <button 
                onClick={() => triggerReauth('EMAIL')}
                disabled={loading}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all"
              >
                {isRtl ? 'تحديث البريد' : 'Update Email'}
              </button>
            </div>
          </div>

          {/* Update Password */}
          <div className="pt-6 border-t border-slate-50 space-y-4">
            <h3 className="text-lg font-black text-slate-900">{t.changePassword}</h3>
            <div className="space-y-2">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.newPassword}</label>
               <div className="flex gap-3">
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
                    placeholder="••••••••"
                  />
                  <button 
                    onClick={() => triggerReauth('PASSWORD')}
                    disabled={loading || !newPassword}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {t.changePassword}
                  </button>
               </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-8 border-t border-rose-50 space-y-4">
             <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                <h3 className="text-lg font-black text-rose-600 mb-2">{t.deleteAccount}</h3>
                <p className="text-xs text-rose-500 font-bold mb-4">{t.deleteAccountWarning}</p>
                <button 
                  onClick={() => triggerReauth('DELETE')}
                  className="bg-rose-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-rose-700 transition-all"
                >
                  {t.deleteAccount}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Re-authentication Modal */}
      {showReauth && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
              <form onSubmit={handleReauthAndAction} className="p-10 space-y-6">
                 <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{t.reauthRequired}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-2">{isRtl ? 'يرجى إدخال كلمة المرور الحالية للتأكيد' : 'Please enter current password to confirm'}</p>
                 </div>

                 <input 
                   type="password"
                   required
                   autoFocus
                   value={currentPassword}
                   onChange={(e) => setCurrentPassword(e.target.value)}
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-center"
                   placeholder="••••••••"
                 />

                 <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowReauth(false)}
                      className="flex-1 py-4 text-sm font-black text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !currentPassword}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                      {loading ? '...' : (isRtl ? 'تأكيد العملية' : 'Confirm Action')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

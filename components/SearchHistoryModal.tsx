import React from 'react';

interface SearchHistoryModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  guestSearchCount: number;
  onClose: () => void;
  onProceedWithSearch: () => void;
  onLoginRedirect: () => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  lang,
  guestSearchCount,
  onClose,
  onProceedWithSearch,
  onLoginRedirect,
}) => {
  if (!isOpen) return null;

  const isRtl = lang === 'ar';
  const freeSearchesRemaining = 3 - guestSearchCount;

  const titles = {
    ar: 'فتح محرك البحث',
    en: 'Unlock Search Engine',
  };

  const descriptions = {
    ar: `لديك ${freeSearchesRemaining} عمليات بحث مجانية متبقية من أصل 3`,
    en: `You have ${freeSearchesRemaining} free searches remaining out of 3`,
  };

  const tryFreeText = {
    ar: 'استخدم التجربة المجانية',
    en: 'Use Free Trial',
  };

  const loginText = {
    ar: 'سجل دخولك للمزيد',
    en: 'Login for More',
  };

  const closeText = {
    ar: 'إغلاق',
    en: 'Close',
  };

  const benefitsTitle = {
    ar: 'مميزات الاشتراك:',
    en: 'Subscription Benefits:',
  };

  const benefits = {
    ar: [
      'عمليات بحث غير محدودة',
      'حفظ وتنظيم التحليلات',
      'تقارير مفصلة وعميقة',
      'دعم فني متقدم',
    ],
    en: [
      'Unlimited searches',
      'Save and organize analyses',
      'Detailed & deep reports',
      'Advanced technical support',
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in duration-300 ${isRtl ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 rounded-t-3xl">
          <div className="flex items-center justify-between gap-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-black text-white">{titles[lang]}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-6">
          {/* Free Searches Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                {freeSearchesRemaining}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">{descriptions[lang]}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {lang === 'ar'
                    ? 'ستنتهي التجارب المجانية قريباً'
                    : 'Free trials will soon expire'}
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-900">{benefitsTitle[lang]}</p>
            <ul className="space-y-2">
              {benefits[lang].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-8 py-6 rounded-b-3xl space-y-3 border-t border-slate-100">
          <button
            onClick={onProceedWithSearch}
            disabled={freeSearchesRemaining <= 0}
            className={`w-full px-6 py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              freeSearchesRemaining > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-slate-300 text-slate-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {tryFreeText[lang]}
          </button>

          <button
            onClick={onLoginRedirect}
            className="w-full px-6 py-3 rounded-2xl font-bold text-base transition-all bg-slate-200 text-slate-900 hover:bg-slate-300 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {loginText[lang]}
          </button>

          <button
            onClick={onClose}
            className="w-full px-6 py-2 rounded-2xl font-bold text-base transition-all text-slate-600 hover:text-slate-900 text-center"
          >
            {closeText[lang]}
          </button>
        </div>
      </div>
    </div>
  );
};

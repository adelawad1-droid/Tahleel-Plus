
import React, { useEffect, useState } from 'react';
import { Language, PlanType, PlanConfig } from '../types';
import { TRANSLATIONS } from '../constants';
import { getPlanConfigs } from '../services/userService';

interface Props {
  lang: Language;
  onSelect: (plan: PlanType) => void;
}

export const Pricing: React.FC<Props> = ({ lang, onSelect }) => {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    const fetchPlans = async () => {
      const data = await getPlanConfigs();
      setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan: PlanConfig) => {
    if (plan.id === 'FREE') {
      onSelect('FREE');
    } else if (plan.stripeUrl) {
      // Direct user to Stripe checkout
      window.location.href = plan.stripeUrl;
    } else {
      alert(isRtl ? 'رابط الدفع غير متوفر حالياً، يرجى التواصل مع الدعم' : 'Payment link unavailable, please contact support');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="py-12">
      <div className="text-center mb-16 animate-in fade-in duration-700">
        <h2 className="text-4xl font-black text-slate-900 mb-4">{t.pricingTitle}</h2>
        <p className="text-slate-500 max-w-xl mx-auto">{t.pricingSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative p-8 bg-white rounded-[2.5rem] border ${plan.isPopular ? 'border-blue-500 shadow-2xl shadow-blue-200 ring-4 ring-blue-50 scale-105 z-10' : 'border-slate-200'} transition-all hover:border-blue-400`}>
            {plan.isPopular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                {isRtl ? 'الأكثر طلباً' : 'Popular'}
              </span>
            )}
            <h3 className="text-xl font-black text-slate-900 mb-2">{isRtl ? plan.nameAr : plan.nameEn}</h3>
            <div className="flex items-baseline gap-2 mb-2">
              {plan.discountedPrice ? (
                <>
                  <span className="text-4xl font-black text-emerald-600">{plan.discountedPrice}</span>
                  <span className="text-slate-400 font-bold text-sm">{isRtl ? 'ر.س' : 'SAR'}</span>
                  <span className="text-lg font-black text-slate-400 line-through">{plan.price}</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 font-bold text-sm">{isRtl ? 'ر.س' : 'SAR'}</span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-500 font-bold mb-8">
              {isRtl ? `${plan.durationMonths || 1} شهر` : `${plan.durationMonths || 1} month${(plan.durationMonths || 1) > 1 ? 's' : ''}`}
            </p>
            <ul className="space-y-4 mb-10">
              {(isRtl ? plan.featuresAr : plan.featuresEn).map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleSubscribe(plan)}
              className={`w-full py-4 rounded-2xl text-white font-black transition-all active:scale-95 shadow-lg ${plan.id === 'ELITE' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {plan.id === 'FREE' ? (isRtl ? 'البدء مجاناً' : 'Start Free') : t.subscribeNow}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

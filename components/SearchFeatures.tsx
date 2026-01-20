import React from 'react';
import { Language } from '../types';
import { Search, TrendingUp, Users, Target, Zap, BarChart3, AlertCircle, Lightbulb } from 'lucide-react';

interface Props {
  lang: Language;
}

export const SearchFeatures: React.FC<Props> = ({ lang }) => {
  const isRtl = lang === 'ar';

  const features = [
    {
      icon: Search,
      titleAr: 'محرك بحث ذكي',
      titleEn: 'Smart Search',
      descAr: 'بحث متقدم عن المنتجات والأسواق',
      descEn: 'Advanced product & market search',
      color: 'from-blue-600 to-blue-700'
    },
    {
      icon: TrendingUp,
      titleAr: 'تحليل الاتجاهات',
      titleEn: 'Trend Analysis',
      descAr: 'تتبع اتجاهات السوق الحالية',
      descEn: 'Track market trends real-time',
      color: 'from-emerald-600 to-emerald-700'
    },
    {
      icon: Users,
      titleAr: 'تحليل المنافسين',
      titleEn: 'Competitor Analysis',
      descAr: 'دراسة شاملة للمنافسة السوقية',
      descEn: 'Complete competitive research',
      color: 'from-orange-600 to-orange-700'
    },
    {
      icon: BarChart3,
      titleAr: 'تقارير تفصيلية',
      titleEn: 'Detailed Reports',
      descAr: 'تقارير احترافية قابلة للطباعة',
      descEn: 'Professional printable reports',
      color: 'from-purple-600 to-purple-700'
    },
    {
      icon: Target,
      titleAr: 'أسعار السوق',
      titleEn: 'Price Analysis',
      descAr: 'مقارنة أسعار شاملة ودقيقة',
      descEn: 'Comprehensive price comparison',
      color: 'from-pink-600 to-pink-700'
    },
    {
      icon: Zap,
      titleAr: 'سرعة فائقة',
      titleEn: 'Lightning Fast',
      descAr: 'نتائج فورية بأقل من ثانية',
      descEn: 'Instant results in seconds',
      color: 'from-amber-600 to-amber-700'
    },
    {
      icon: AlertCircle,
      titleAr: 'تنبيهات السوق',
      titleEn: 'Market Alerts',
      descAr: 'إشعارات فورية بتغييرات السوق',
      descEn: 'Real-time market notifications',
      color: 'from-red-600 to-red-700'
    },
    {
      icon: Lightbulb,
      titleAr: 'رؤى ذكية',
      titleEn: 'AI Insights',
      descAr: 'توصيات ذكية بناءً على البيانات',
      descEn: 'Smart AI-powered recommendations',
      color: 'from-cyan-600 to-cyan-700'
    }
  ];

  return (
    <div className="w-full py-12 px-4">
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group animate-in fade-in slide-in-from-bottom-4 hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col items-center space-y-3 h-full">
                <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${feature.color} shadow-lg hover:shadow-2xl transition-shadow duration-300 flex items-center justify-center group-hover:scale-110`}>
                  <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}></div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight">
                    {isRtl ? feature.titleAr : feature.titleEn}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

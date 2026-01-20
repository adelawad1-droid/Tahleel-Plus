import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Language, UserProfile } from '../types';
import { REGIONS } from '../constants';
import { updateUserDetails } from '../services/userService';

interface Props {
  lang: Language;
  user: User | null;
  profile: UserProfile | null;
  guestRegion?: string;
  onRegionChange?: (region: string) => void;
}

export const RegionSelector: React.FC<Props> = ({ lang, user, profile, guestRegion = 'SA', onRegionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localRegion, setLocalRegion] = useState<string | null>(null);
  const isRtl = lang === 'ar';

  const currentRegion = localRegion || (user ? (profile?.region || 'SA') : guestRegion);
  const currentRegionData = REGIONS.find(r => r.code === currentRegion);
  const regionName = isRtl 
    ? currentRegionData?.nameAr || 'المملكة العربية السعودية'
    : currentRegionData?.nameEn || 'Saudi Arabia';
  const isRegionSet = true; // Region is always set now

  // Keep localRegion in sync when dropdown closes
  useEffect(() => {
    if (!isOpen && localRegion) {
      // Dropdown closed, localRegion will persist
      return;
    }
    // When dropdown opens or other prop changes
    if (!localRegion) {
      setLocalRegion(user ? (profile?.region || 'SA') : guestRegion);
    }
  }, [isOpen, user, profile?.region, guestRegion]);

  const handleRegionSelect = async (regionCode: string) => {
    // Update local state immediately for instant UI feedback
    setLocalRegion(regionCode);
    
    if (user) {
      setLoading(true);
      try {
        await updateUserDetails(user.uid, { region: regionCode });
        onRegionChange?.(regionCode);
        setIsOpen(false);
      } catch (error) {
        console.error('Error updating region:', error);
        // Revert on error
        setLocalRegion(null);
      } finally {
        setLoading(false);
      }
    } else {
      // For guests, just call the callback
      onRegionChange?.(regionCode);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Region Selector in Footer */}
      <div className="sticky bottom-0 z-40 w-full flex justify-center py-4 bg-white/95 backdrop-blur border-t border-slate-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 bg-blue-600 rounded-2xl border border-blue-700 transition-all font-bold text-sm relative text-white hover:bg-blue-700 ${
            !isRegionSet 
              ? 'animate-pulse' 
              : ''
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {!isRegionSet && (
            <div className="absolute inset-0 rounded-2xl bg-blue-400 opacity-10 animate-pulse"></div>
          )}
          <div className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white">
              {regionName}
            </span>
          </div>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-80 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                {isRtl ? 'اختر المنطقة / الدولة' : 'Select Region / Country'}
              </p>
            </div>

            {/* Regions List */}
            <div className="max-h-96 overflow-y-auto pt-2">
              {REGIONS.map(region => (
                <button
                  key={region.code}
                  onClick={() => handleRegionSelect(region.code)}
                  disabled={loading}
                  className={`w-full px-3 py-3 text-sm font-bold transition-all border-b border-slate-100 last:border-b-0 hover:bg-blue-50 flex items-center justify-between ${
                    currentRegion === region.code
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-600 pl-2'
                      : 'text-slate-700 hover:text-blue-600'
                  } disabled:opacity-50 cursor-pointer`}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  type="button"
                >
                  <span className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? region.nameAr : region.nameEn}</span>
                  {currentRegion === region.code && (
                    <svg className={`w-5 h-5 text-blue-600 flex-shrink-0 ${isRtl ? 'mr-2' : 'ml-2'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Footer Note */}
            {user && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold">
                  {isRtl 
                    ? 'ستتحسن نتائج البحث بناءً على المنطقة المختارة' 
                    : 'Search results will be optimized for your region'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};


import React from 'react';
import { Language } from '../types';

interface Props {
  current: Language;
  onToggle: (lang: Language) => void;
}

export const LanguageToggle: React.FC<Props> = ({ current, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(current === 'ar' ? 'en' : 'ar')}
      className="w-10 h-10 flex items-center justify-center text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      aria-label={current === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    </button>
  );
};

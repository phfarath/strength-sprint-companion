import React, { createContext, useContext, useMemo } from 'react';
import { dictionaries } from './dictionaries';
import { useAppContext } from '@/context/AppContext';

type I18nContextType = {
  t: (key: string) => string;
  lang: 'pt' | 'en';
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAppContext();
  const lang = (settings.appearance.language || 'pt') as 'pt' | 'en';

  const value = useMemo<I18nContextType>(() => {
    const dict = dictionaries[lang] || dictionaries.pt;
    return {
      t: (key: string) => dict[key] ?? key,
      lang,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};


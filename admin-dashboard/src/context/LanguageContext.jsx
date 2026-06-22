import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Always default to Khmer ('kh')
  const [language, setLanguage] = useState('kh');

  useEffect(() => {
    localStorage.setItem('lang', 'kh');
  }, []);

  const t = (key) => {
    // Force Khmer translation lookup, fallback to English translation or key if not found
    return translations['kh'][key] || translations['en'][key] || key;
  };

  const toggleLanguage = () => {
    // No-op to disable switching
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      <div style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

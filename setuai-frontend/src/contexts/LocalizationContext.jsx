import React, { createContext, useContext, useState, useEffect } from 'react';
import { languages, translations, defaultLanguage } from '../locales';

const LocalizationContext = createContext();

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export const LocalizationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('setuai-language');
    return savedLanguage && languages[savedLanguage] ? savedLanguage : defaultLanguage;
  });

  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Load translations for current language
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`../locales/${currentLanguage}.json`);
        setTranslations(translationModule.default);
      } catch (error) {
        console.error(`Failed to load translations for ${currentLanguage}:`, error);
        // Fallback to English
        const fallbackModule = await import(`../locales/en.json`);
        setTranslations(fallbackModule.default);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  const changeLanguage = (languageCode) => {
    if (languages[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('setuai-language', languageCode);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }

    if (typeof value === 'string') {
      // Replace parameters in the translation
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value || key;
  };

  const getCurrentLanguage = () => languages[currentLanguage];

  const getAvailableLanguages = () => Object.values(languages);

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguage,
    getAvailableLanguages,
    languages: Object.values(languages)
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}; 
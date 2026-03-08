import { useState, useCallback } from 'react';
import I18nContext from './I18nContext';
import fr from './fr';
import en from './en';

const translations = { fr, en };
const STORAGE_KEY = 'carvault_lang';

function getInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && translations[stored]) return stored;
  const browser = navigator.language?.split('-')[0];
  return translations[browser] ? browser : 'fr';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((newLang) => {
    if (!translations[newLang]) return;
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback((key, params = {}) => {
    let text = translations[lang]?.[key] || translations.fr[key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, availableLangs: Object.keys(translations) }}>
      {children}
    </I18nContext.Provider>
  );
}

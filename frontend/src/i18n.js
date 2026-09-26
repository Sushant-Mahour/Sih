import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import as from './locales/as/translation.json';
import bn from './locales/bn/translation.json';
import hi from './locales/hi/translation.json';
import mni from './locales/mni/translation.json';
import lus from './locales/lus/translation.json';
import kha from './locales/kha/translation.json';
import ne from './locales/ne/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      as: { translation: as },
      bn: { translation: bn },
      hi: { translation: hi },
      mni: { translation: mni },
      lus: { translation: lus },
      kha: { translation: kha },
      ne: { translation: ne }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ner_language',
      caches: ['localStorage']
    }
  });

// Keep html lang attribute in sync
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('ner_language', lng);
});

export default i18n;

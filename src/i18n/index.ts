import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { ar } from './locales/ar';

const savedLanguage = localStorage.getItem('logo_studio_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Keep <html> lang and dir attributes in sync with i18n language
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('logo_studio_lang', lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Set initial document attributes
document.documentElement.lang = savedLanguage;
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';

export default i18n;

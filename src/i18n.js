// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import enTranslations from "./locales/en.json";
import yoTranslations from "./locales/yo.json";
import igTranslations from "./locales/ig.json";
import haTranslations from "./locales/ha.json";
import swTranslations from "./locales/sw.json";
import frTranslations from "./locales/fr.json";

/**
 * Language metadata for UI display and configuration
 * Each language includes:
 * - name: English name of the language
 * - nativeName: Language name in its native script
 * - flag: Emoji flag for visual identification
 * - direction: Text direction (ltr = left-to-right, rtl = right-to-left)
 * - region: Primary region where language is spoken
 * - completeness: Translation completeness percentage (0-100)
 */
export const supportedLanguages = {
  en: { 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸',
    direction: 'ltr',
    region: 'Global',
    completeness: 100
  },
  yo: { 
    name: 'Yoruba', 
    nativeName: 'Yorùbá', 
    flag: '🇳🇬',
    direction: 'ltr',
    region: 'Nigeria',
    completeness: 100
  },
  ig: { 
    name: 'Igbo', 
    nativeName: 'Igbo', 
    flag: '🇳🇬',
    direction: 'ltr',
    region: 'Nigeria',
    completeness: 100
  },
  ha: { 
    name: 'Hausa', 
    nativeName: 'Hausa', 
    flag: '🇳🇬',
    direction: 'ltr',
    region: 'Nigeria',
    completeness: 100
  },
  sw: { 
    name: 'Swahili', 
    nativeName: 'Kiswahili', 
    flag: '🇰🇪',
    direction: 'ltr',
    region: 'East Africa',
    completeness: 100
  },
  fr: { 
    name: 'French', 
    nativeName: 'Français', 
    flag: '🇫🇷',
    direction: 'ltr',
    region: 'Global',
    completeness: 100
  }
};

const resources = {
  en: enTranslations,
  yo: yoTranslations,
  ig: igTranslations,
  ha: haTranslations,
  sw: swTranslations,
  fr: frTranslations
};

// Import language manager for consistent preference handling
import languageManager from "./utils/languageManager";

// Get saved language preference with validation and fallback handling
const initialLanguage = languageManager.loadLanguagePreference();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  
  // Namespace configuration
  defaultNS: 'translation',
  ns: ['translation'],
  
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
    formatSeparator: ',',
  },
  
  // React-specific settings
  react: {
    useSuspense: false, // Disable suspense for better error handling
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  },
  
  // Missing key handling
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lngs, ns, key, fallbackValue) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${key} for language: ${lngs[0]}`);
    }
  },
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Load settings
  load: 'languageOnly', // Load only 'en' not 'en-US'
  
  // Detection settings
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
    lookupLocalStorage: 'medadhere_language',
  },
});

// Export helper functions for language management

/**
 * Change the application language
 * @param {string} languageCode - Language code (e.g., 'en', 'yo', 'ig')
 * @returns {boolean} True if language was changed successfully
 */
export const changeLanguage = (languageCode) => {
  if (supportedLanguages[languageCode]) {
    // Use languageManager for consistent persistence
    const success = languageManager.changeLanguage(languageCode);
    if (success) {
      i18n.changeLanguage(languageCode);
      return true;
    }
  }
  console.warn(`Language ${languageCode} not supported or failed to save`);
  return false;
};

/**
 * Get the current language code
 * @returns {string} Current language code
 */
export const getCurrentLanguage = () => i18n.language;

/**
 * Get all supported language codes
 * @returns {string[]} Array of language codes
 */
export const getSupportedLanguageCodes = () => Object.keys(supportedLanguages);

/**
 * Get language metadata for a specific language
 * @param {string} languageCode - Language code
 * @returns {Object|null} Language metadata or null if not found
 */
export const getLanguageMetadata = (languageCode) => {
  return supportedLanguages[languageCode] || null;
};

/**
 * Get all supported languages with metadata
 * @returns {Object} Object with language codes as keys and metadata as values
 */
export const getAllLanguages = () => {
  return { ...supportedLanguages };
};

/**
 * Check if a language is supported
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if language is supported
 */
export const isLanguageSupported = (languageCode) => {
  return languageCode in supportedLanguages;
};

/**
 * Get language direction (ltr or rtl)
 * @param {string} languageCode - Language code
 * @returns {string} 'ltr' or 'rtl'
 */
export const getLanguageDirection = (languageCode) => {
  const lang = supportedLanguages[languageCode];
  return lang ? lang.direction : 'ltr';
};

/**
 * Get formatted language display name
 * @param {string} languageCode - Language code
 * @param {boolean} useNative - Whether to use native name (default: false)
 * @returns {string} Formatted language name
 */
export const getLanguageDisplayName = (languageCode, useNative = false) => {
  const lang = supportedLanguages[languageCode];
  if (!lang) return languageCode;
  
  if (useNative) {
    return `${lang.flag} ${lang.nativeName}`;
  }
  return `${lang.flag} ${lang.name}`;
};

/**
 * Get translation completeness for a language
 * @param {string} languageCode - Language code
 * @returns {number} Completeness percentage (0-100)
 */
export const getLanguageCompleteness = (languageCode) => {
  const lang = supportedLanguages[languageCode];
  return lang ? lang.completeness : 0;
};

/**
 * Get languages by region
 * @param {string} region - Region name
 * @returns {Object} Languages in the specified region
 */
export const getLanguagesByRegion = (region) => {
  return Object.entries(supportedLanguages)
    .filter(([_, lang]) => lang.region === region)
    .reduce((acc, [code, lang]) => {
      acc[code] = lang;
      return acc;
    }, {});
};

/**
 * Validate and sanitize language code
 * @param {string} languageCode - Language code to validate
 * @returns {string} Valid language code or fallback to 'en'
 */
export const validateLanguageCode = (languageCode) => {
  if (typeof languageCode !== 'string') return 'en';
  
  const normalized = languageCode.toLowerCase().trim();
  return isLanguageSupported(normalized) ? normalized : 'en';
};

export default i18n;
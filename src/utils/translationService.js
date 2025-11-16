// src/utils/translationService.js
// Future Google Translate API integration infrastructure
// Hybrid translation system: static UI translations + dynamic content translation

const TRANSLATION_CACHE_KEY = "medadhere_translation_cache";
const CACHE_EXPIRY_HOURS = 24;

/**
 * Translation Service for dynamic content translation
 * Designed for future Google Translate API integration
 * Provides caching and fallback mechanisms for offline support
 */
class TranslationService {
  constructor() {
    this.cacheAvailable = this.isCacheAvailable();
    this.apiEnabled = false; // Will be enabled when Google Translate API is configured
    this.cache = this.loadCache();
    this.logEvent("TranslationService initialized", { 
      cacheAvailable: this.cacheAvailable,
      apiEnabled: this.apiEnabled
    });
  }

  /**
   * Translate dynamic content (user-generated text)
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (default: 'en')
   * @returns {Promise<string>} Translated text
   */
  async translateContent(text, targetLanguage, sourceLanguage = 'en') {
    // If target is same as source, return original text
    if (targetLanguage === sourceLanguage) {
      return text;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
    const cached = this.getCachedTranslation(cacheKey);
    if (cached) {
      this.logEvent("Translation served from cache", { 
        text: text.substring(0, 50),
        targetLanguage,
        sourceLanguage
      });
      return cached;
    }

    // If API is not enabled, return original text with fallback message
    if (!this.apiEnabled) {
      this.logEvent("Translation API not enabled, returning original text", { 
        text: text.substring(0, 50),
        targetLanguage,
        level: "warn"
      });
      return text; // Fallback to original text
    }

    try {
      // Future Google Translate API call would go here
      const translatedText = await this.callTranslationAPI(text, targetLanguage, sourceLanguage);
      
      // Cache the translation
      this.cacheTranslation(cacheKey, translatedText);
      
      this.logEvent("Translation completed via API", { 
        text: text.substring(0, 50),
        targetLanguage,
        sourceLanguage
      });
      
      return translatedText;
    } catch (err) {
      this.logEvent("Translation API failed, using fallback", { 
        error: err.message,
        text: text.substring(0, 50),
        targetLanguage,
        level: "error"
      });
      
      // Fallback to original text
      return text;
    }
  }

  /**
   * Future Google Translate API integration point
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code
   * @returns {Promise<string>} Translated text
   */
  async callTranslationAPI(text, targetLanguage, sourceLanguage) {
    // This is where the actual Google Translate API call will be implemented
    // For now, return a placeholder to demonstrate the infrastructure
    
    // Example future implementation:
    /*
    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text'
      })
    });
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
    */
    
    // Placeholder implementation for infrastructure testing
    throw new Error("Google Translate API not yet configured");
  }

  /**
   * Enable translation API (to be called when API credentials are configured)
   * @param {string} apiKey - Google Translate API key
   */
  enableAPI(apiKey) {
    if (apiKey && apiKey.length > 0) {
      this.apiEnabled = true;
      this.apiKey = apiKey;
      this.logEvent("Translation API enabled", { apiKeyLength: apiKey.length });
    } else {
      this.logEvent("Invalid API key provided", { level: "error" });
    }
  }

  /**
   * Disable translation API
   */
  disableAPI() {
    this.apiEnabled = false;
    this.apiKey = null;
    this.logEvent("Translation API disabled");
  }

  /**
   * Generate cache key for translation
   * @param {string} text - Original text
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @returns {string} Cache key
   */
  getCacheKey(text, targetLanguage, sourceLanguage) {
    // Create a simple hash-like key (in production, use proper hashing)
    const combined = `${sourceLanguage}-${targetLanguage}-${text}`;
    return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Get cached translation
   * @param {string} cacheKey - Cache key
   * @returns {string|null} Cached translation or null
   */
  getCachedTranslation(cacheKey) {
    if (!this.cacheAvailable || !this.cache[cacheKey]) {
      return null;
    }

    const cached = this.cache[cacheKey];
    const now = new Date().getTime();
    const expiryTime = new Date(cached.timestamp).getTime() + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

    if (now > expiryTime) {
      // Cache expired, remove it
      delete this.cache[cacheKey];
      this.saveCache();
      return null;
    }

    return cached.translation;
  }

  /**
   * Cache a translation
   * @param {string} cacheKey - Cache key
   * @param {string} translation - Translated text
   */
  cacheTranslation(cacheKey, translation) {
    if (!this.cacheAvailable) {
      return;
    }

    this.cache[cacheKey] = {
      translation,
      timestamp: new Date().toISOString()
    };

    this.saveCache();
    this.cleanupExpiredCache();
  }

  /**
   * Load translation cache from localStorage
   * @returns {Object} Cache object
   */
  loadCache() {
    if (!this.cacheAvailable) {
      return {};
    }

    try {
      const stored = localStorage.getItem(TRANSLATION_CACHE_KEY);
      if (!stored) {
        return {};
      }
      
      const parsed = JSON.parse(stored);
      this.logEvent("Translation cache loaded", { 
        cacheSize: Object.keys(parsed).length 
      });
      return parsed;
    } catch (err) {
      this.logEvent("Failed to load translation cache", { 
        error: err.message,
        level: "error"
      });
      return {};
    }
  }

  /**
   * Save translation cache to localStorage
   */
  saveCache() {
    if (!this.cacheAvailable) {
      return;
    }

    try {
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(this.cache));
      this.logEvent("Translation cache saved", { 
        cacheSize: Object.keys(this.cache).length 
      });
    } catch (err) {
      this.logEvent("Failed to save translation cache", { 
        error: err.message,
        level: "error"
      });
      
      // If quota exceeded, clear some cache
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        this.clearOldCache();
        // Try saving again with reduced cache
        try {
          localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(this.cache));
        } catch (retryErr) {
          this.logEvent("Failed to save cache even after cleanup", { 
            error: retryErr.message,
            level: "error"
          });
        }
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = new Date().getTime();
    const expiryThreshold = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    let removedCount = 0;

    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      const cacheTime = new Date(cached.timestamp).getTime();
      
      if (now - cacheTime > expiryThreshold) {
        delete this.cache[key];
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.logEvent("Cleaned up expired cache entries", { removedCount });
      this.saveCache();
    }
  }

  /**
   * Clear old cache entries to free up space
   */
  clearOldCache() {
    const entries = Object.entries(this.cache);
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => {
      return new Date(a[1].timestamp) - new Date(b[1].timestamp);
    });

    // Remove oldest 50% of entries
    const toRemove = Math.floor(entries.length / 2);
    for (let i = 0; i < toRemove; i++) {
      delete this.cache[entries[i][0]];
    }

    this.logEvent("Cleared old cache entries due to storage constraints", { 
      removedCount: toRemove,
      remainingCount: Object.keys(this.cache).length
    });
  }

  /**
   * Clear all cached translations
   */
  clearCache() {
    this.cache = {};
    if (this.cacheAvailable) {
      try {
        localStorage.removeItem(TRANSLATION_CACHE_KEY);
        this.logEvent("Translation cache cleared");
      } catch (err) {
        this.logEvent("Failed to clear translation cache", { 
          error: err.message,
          level: "error"
        });
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const cacheSize = Object.keys(this.cache).length;
    const now = new Date().getTime();
    let validEntries = 0;
    let expiredEntries = 0;

    Object.values(this.cache).forEach(cached => {
      const cacheTime = new Date(cached.timestamp).getTime();
      const age = now - cacheTime;
      
      if (age > CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: cacheSize,
      validEntries,
      expiredEntries,
      cacheAvailable: this.cacheAvailable,
      apiEnabled: this.apiEnabled
    };
  }

  /**
   * Check if localStorage is available for caching
   * @returns {boolean} True if localStorage is available
   */
  isCacheAvailable() {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      const test = "__translation_cache_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Log translation service events
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "TranslationService",
      message,
      ...data
    };

    // Use appropriate log level
    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[TranslationService] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[TranslationService] ${message}`, logEntry);
        break;
      default:
        console.log(`[TranslationService] ${message}`, logEntry);
    }

    // Store recent logs in memory for debugging (keep last 30)
    if (!window.__translationServiceLogs) {
      window.__translationServiceLogs = [];
    }
    window.__translationServiceLogs.push(logEntry);
    if (window.__translationServiceLogs.length > 30) {
      window.__translationServiceLogs.shift();
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array} Array of recent log entries
   */
  getRecentLogs() {
    return window.__translationServiceLogs || [];
  }
}

// Create and export singleton instance
const translationService = new TranslationService();

export default translationService;

// Export individual methods for convenience
export const {
  translateContent,
  enableAPI,
  disableAPI,
  clearCache,
  getCacheStats,
  getRecentLogs
} = translationService;

// Development/debugging utilities
if (typeof window !== "undefined") {
  window.__medAdhereTranslationDebug = {
    translationService,
    getLogs: () => translationService.getRecentLogs(),
    getCacheStats: () => translationService.getCacheStats(),
    clearCache: () => translationService.clearCache(),
    testTranslation: async (text, targetLang) => {
      console.log("Testing translation infrastructure...");
      try {
        const result = await translationService.translateContent(text, targetLang);
        console.log("Translation result:", result);
        return result;
      } catch (err) {
        console.error("Translation test failed:", err);
        return text;
      }
    }
  };
}
// src/utils/languageManager.js
// Language preference management utility following existing localStorage patterns

const LANGUAGE_STORAGE_KEY = "medadhere_language";
const DEFAULT_LANGUAGE = "en";

/**
 * Language preference manager - handles persistence and validation
 * Follows patterns from usageLimiter.js for consistency
 */
class LanguageManager {
  constructor() {
    this.storageAvailable = this.isStorageAvailable();
    this.sessionLanguage = null; // Fallback for when localStorage is unavailable
    this.logEvent("LanguageManager initialized", { 
      storageAvailable: this.storageAvailable 
    });
  }

  /**
   * Load language preference from localStorage
   * @returns {string} Language code
   */
  loadLanguagePreference() {
    // If localStorage is not available, use session fallback
    if (!this.storageAvailable) {
      this.logEvent("localStorage unavailable, using session fallback", { level: "warn" });
      return this.sessionLanguage || DEFAULT_LANGUAGE;
    }

    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (!stored) {
        this.logEvent("No language preference found, using default");
        return DEFAULT_LANGUAGE;
      }

      // Validate the stored language code
      const supportedCodes = ['en', 'yo', 'ig', 'ha', 'sw', 'fr'];
      if (supportedCodes.includes(stored)) {
        this.logEvent("Language preference loaded successfully", { language: stored });
        return stored;
      } else {
        this.logEvent("Invalid language code found, using default", { 
          invalidCode: stored,
          level: "warn"
        });
        return DEFAULT_LANGUAGE;
      }
    } catch (err) {
      this.logEvent("Failed to load language preference", { 
        error: err.message,
        level: "error"
      });
      return DEFAULT_LANGUAGE;
    }
  }

  /**
   * Save language preference to localStorage
   * @param {string} languageCode - Language code to save
   * @returns {boolean} Success status
   */
  saveLanguagePreference(languageCode) {
    // Validate language code
    const supportedCodes = ['en', 'yo', 'ig', 'ha', 'sw', 'fr'];
    if (!supportedCodes.includes(languageCode)) {
      this.logEvent("Invalid language code provided", { 
        languageCode,
        level: "error"
      });
      return false;
    }

    // If localStorage is not available, save to session fallback
    if (!this.storageAvailable) {
      this.sessionLanguage = languageCode;
      this.logEvent("Saved language preference to session fallback", { 
        language: languageCode,
        level: "warn"
      });
      return true;
    }

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      this.logEvent("Language preference saved successfully", { language: languageCode });
      return true;
    } catch (err) {
      this.logEvent("Failed to save language preference", { 
        error: err.message,
        languageCode,
        level: "error"
      });
      
      // Graceful degradation - save to session
      this.sessionLanguage = languageCode;
      
      // Check if it's a quota exceeded error
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        this.notifyStorageIssue("Storage quota exceeded - language preference saved for session only");
      } else {
        this.notifyStorageIssue("Failed to save language preference - using session-only storage");
      }
      
      return true; // Still return true since we saved to session
    }
  }

  /**
   * Get current language preference with validation
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    if (this.storageAvailable) {
      try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        const supportedCodes = ['en', 'yo', 'ig', 'ha', 'sw', 'fr'];
        return supportedCodes.includes(stored) ? stored : DEFAULT_LANGUAGE;
      } catch (err) {
        this.logEvent("Error getting current language", { 
          error: err.message,
          level: "error"
        });
        return this.sessionLanguage || DEFAULT_LANGUAGE;
      }
    }
    return this.sessionLanguage || DEFAULT_LANGUAGE;
  }

  /**
   * Handle language change with validation and persistence
   * @param {string} languageCode - New language code
   * @returns {boolean} Success status
   */
  changeLanguage(languageCode) {
    const oldLanguage = this.getCurrentLanguage();
    
    if (this.saveLanguagePreference(languageCode)) {
      this.logEvent("Language changed successfully", {
        oldLanguage,
        newLanguage: languageCode
      });
      return true;
    }
    
    this.logEvent("Failed to change language", {
      oldLanguage,
      attemptedLanguage: languageCode,
      level: "error"
    });
    return false;
  }

  /**
   * Reset language preference to default
   */
  resetLanguagePreference() {
    try {
      if (this.storageAvailable) {
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      }
      this.sessionLanguage = null;
      this.logEvent("Language preference reset to default");
    } catch (err) {
      this.logEvent("Failed to reset language preference", {
        error: err.message,
        level: "error"
      });
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  isStorageAvailable() {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      const test = "__language_storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Log language-related events for debugging
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "LanguageManager",
      message,
      ...data
    };

    // Use appropriate log level
    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[LanguageManager] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[LanguageManager] ${message}`, logEntry);
        break;
      default:
        console.log(`[LanguageManager] ${message}`, logEntry);
    }

    // Store recent logs in memory for debugging (keep last 20)
    if (!window.__languageManagerLogs) {
      window.__languageManagerLogs = [];
    }
    window.__languageManagerLogs.push(logEntry);
    if (window.__languageManagerLogs.length > 20) {
      window.__languageManagerLogs.shift();
    }
  }

  /**
   * Notify user about storage-related issues
   * @param {string} message - User-friendly message
   */
  notifyStorageIssue(message) {
    try {
      console.warn(`[MedAdhere Language Storage Issue] ${message}`);
      
      // Store the notification for potential UI display
      if (!window.__languageStorageNotifications) {
        window.__languageStorageNotifications = [];
      }
      window.__languageStorageNotifications.push({
        message,
        timestamp: new Date().toISOString(),
        dismissed: false
      });

      // Keep only the last 3 notifications
      if (window.__languageStorageNotifications.length > 3) {
        window.__languageStorageNotifications.shift();
      }
    } catch (err) {
      console.warn("Language storage notification failed:", err);
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array} Array of recent log entries
   */
  getRecentLogs() {
    return window.__languageManagerLogs || [];
  }

  /**
   * Get pending storage notifications
   * @returns {Array} Array of storage notification messages
   */
  getStorageNotifications() {
    return window.__languageStorageNotifications || [];
  }
}

// Create and export singleton instance
const languageManager = new LanguageManager();

export default languageManager;

// Export individual methods for convenience
export const {
  loadLanguagePreference,
  saveLanguagePreference,
  getCurrentLanguage,
  changeLanguage,
  resetLanguagePreference,
  isStorageAvailable,
  getRecentLogs,
  getStorageNotifications
} = languageManager;

// Development/debugging utilities
if (typeof window !== "undefined") {
  window.__medAdhereLanguageDebug = {
    languageManager,
    getLogs: () => languageManager.getRecentLogs(),
    getStorageNotifications: () => languageManager.getStorageNotifications(),
    getCurrentLanguage: () => languageManager.getCurrentLanguage(),
    testStorageFailure: () => {
      // Temporarily disable localStorage to test fallback
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Simulated language storage failure");
      };
      console.log("localStorage.setItem disabled for language - test fallback behavior");
      return () => {
        localStorage.setItem = originalSetItem;
        console.log("localStorage.setItem restored for language");
      };
    }
  };
}
// src/utils/usageLimiter.js
// Usage limitation service for MedAdhere Premium system
// Manages free user limits (3 medications, 3 ADR reports) and premium status

const STORAGE_KEY = "medadhere_usage";
const FREE_MEDICATION_LIMIT = 3;
const FREE_ADR_LIMIT = 3;

/**
 * Default usage data structure
 */
const defaultUsageData = {
  medicationCount: 0,
  adrCount: 0,
  isPremium: false,
  premiumExpiry: null,
  lastUpdated: new Date().toISOString()
};

/**
 * UsageLimiter class - manages usage tracking and premium status
 */
class UsageLimiter {
  constructor() {
    this.storageAvailable = this.isStorageAvailable();
    this.sessionData = null; // Fallback for when localStorage is unavailable
    this.usageData = this.loadUsageFromStorage();
    this.logEvent("UsageLimiter initialized", { 
      storageAvailable: this.storageAvailable,
      initialData: this.usageData 
    });
  }

  /**
   * Load usage data from localStorage, following patterns from notifications.js
   * @returns {Object} Usage data object
   */
  loadUsageFromStorage() {
    // If localStorage is not available, use session fallback
    if (!this.storageAvailable) {
      this.logEvent("localStorage unavailable, using session fallback", { level: "warn" });
      this.notifyStorageIssue("Storage unavailable - using session-only tracking");
      return this.sessionData || { ...defaultUsageData };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.logEvent("No existing usage data found, using defaults");
        return { ...defaultUsageData };
      }
      
      const parsed = JSON.parse(stored);
      
      // Validate and merge with defaults to handle schema changes
      const usageData = {
        ...defaultUsageData,
        ...parsed,
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };

      // Validate premium expiry if exists
      if (usageData.premiumExpiry) {
        const expiryDate = new Date(usageData.premiumExpiry);
        if (expiryDate <= new Date()) {
          // Premium expired, revert to free user
          usageData.isPremium = false;
          usageData.premiumExpiry = null;
          this.logEvent("Premium subscription expired, reverting to free user", {
            expiry: usageData.premiumExpiry
          });
          this.saveUsageToStorage(usageData);
        }
      }

      this.logEvent("Usage data loaded successfully", { 
        medicationCount: usageData.medicationCount,
        adrCount: usageData.adrCount,
        isPremium: usageData.isPremium
      });
      return usageData;
    } catch (err) {
      this.logEvent("Failed to load usage data from localStorage", { 
        error: err.message,
        level: "error"
      });
      this.notifyStorageIssue("Failed to load usage data - using defaults");
      return { ...defaultUsageData };
    }
  }

  /**
   * Save usage data to localStorage
   * @param {Object} data - Usage data to save
   */
  saveUsageToStorage(data) {
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString()
    };

    // If localStorage is not available, save to session fallback
    if (!this.storageAvailable) {
      this.sessionData = dataToSave;
      this.usageData = dataToSave;
      this.logEvent("Saved usage data to session fallback", { 
        data: dataToSave,
        level: "warn"
      });
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      this.usageData = dataToSave;
      this.logEvent("Usage data saved successfully", { 
        medicationCount: dataToSave.medicationCount,
        adrCount: dataToSave.adrCount,
        isPremium: dataToSave.isPremium
      });
    } catch (err) {
      this.logEvent("Failed to save usage data to localStorage", { 
        error: err.message,
        level: "error"
      });
      
      // Graceful degradation - continue with in-memory data
      this.usageData = dataToSave;
      this.sessionData = dataToSave;
      
      // Check if it's a quota exceeded error
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        this.notifyStorageIssue("Storage quota exceeded - using session-only tracking");
      } else {
        this.notifyStorageIssue("Failed to save usage data - using session-only tracking");
      }
    }
  }

  /**
   * Check if user is premium (with expiry validation)
   * @returns {boolean} True if user has active premium subscription
   */
  isPremiumUser() {
    if (!this.usageData.isPremium) {
      return false;
    }

    // Check expiry if set
    if (this.usageData.premiumExpiry) {
      const expiryDate = new Date(this.usageData.premiumExpiry);
      if (expiryDate <= new Date()) {
        // Premium expired, update status
        this.usageData.isPremium = false;
        this.usageData.premiumExpiry = null;
        this.saveUsageToStorage(this.usageData);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user can add a new medication
   * @returns {boolean} True if user can add medication
   */
  canAddMedication() {
    if (this.isPremiumUser()) {
      return true;
    }
    return this.usageData.medicationCount < FREE_MEDICATION_LIMIT;
  }

  /**
   * Check if user can add a new ADR report
   * @returns {boolean} True if user can add ADR
   */
  canAddADR() {
    if (this.isPremiumUser()) {
      return true;
    }
    return this.usageData.adrCount < FREE_ADR_LIMIT;
  }

  /**
   * Increment medication count
   */
  incrementMedicationCount() {
    try {
      const oldCount = this.usageData.medicationCount;
      this.usageData.medicationCount += 1;
      this.saveUsageToStorage(this.usageData);
      this.logEvent("Medication count incremented", {
        oldCount,
        newCount: this.usageData.medicationCount
      });
    } catch (err) {
      this.logEvent("Failed to increment medication count", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, keep the in-memory count updated
      this.usageData.medicationCount += 1;
    }
  }

  /**
   * Increment ADR count
   */
  incrementADRCount() {
    try {
      const oldCount = this.usageData.adrCount;
      this.usageData.adrCount += 1;
      this.saveUsageToStorage(this.usageData);
      this.logEvent("ADR count incremented", {
        oldCount,
        newCount: this.usageData.adrCount
      });
    } catch (err) {
      this.logEvent("Failed to increment ADR count", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, keep the in-memory count updated
      this.usageData.adrCount += 1;
    }
  }

  /**
   * Decrement medication count (when medication is deleted)
   */
  decrementMedicationCount() {
    try {
      if (this.usageData.medicationCount > 0) {
        const oldCount = this.usageData.medicationCount;
        this.usageData.medicationCount -= 1;
        this.saveUsageToStorage(this.usageData);
        this.logEvent("Medication count decremented", {
          oldCount,
          newCount: this.usageData.medicationCount
        });
      } else {
        this.logEvent("Cannot decrement medication count - already at zero", {
          level: "warn"
        });
      }
    } catch (err) {
      this.logEvent("Failed to decrement medication count", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, keep the in-memory count updated
      if (this.usageData.medicationCount > 0) {
        this.usageData.medicationCount -= 1;
      }
    }
  }

  /**
   * Decrement ADR count (when ADR is deleted)
   */
  decrementADRCount() {
    try {
      if (this.usageData.adrCount > 0) {
        const oldCount = this.usageData.adrCount;
        this.usageData.adrCount -= 1;
        this.saveUsageToStorage(this.usageData);
        this.logEvent("ADR count decremented", {
          oldCount,
          newCount: this.usageData.adrCount
        });
      } else {
        this.logEvent("Cannot decrement ADR count - already at zero", {
          level: "warn"
        });
      }
    } catch (err) {
      this.logEvent("Failed to decrement ADR count", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, keep the in-memory count updated
      if (this.usageData.adrCount > 0) {
        this.usageData.adrCount -= 1;
      }
    }
  }

  /**
   * Get current usage statistics
   * @returns {Object} Current usage data
   */
  getUsageStats() {
    return {
      medicationCount: this.usageData.medicationCount,
      adrCount: this.usageData.adrCount,
      medicationLimit: this.isPremiumUser() ? null : FREE_MEDICATION_LIMIT,
      adrLimit: this.isPremiumUser() ? null : FREE_ADR_LIMIT,
      isPremium: this.isPremiumUser(),
      premiumExpiry: this.usageData.premiumExpiry
    };
  }

  /**
   * Set premium status (called after successful payment)
   * @param {Date|string|null} expiryDate - Premium expiry date, null for lifetime
   */
  setPremiumStatus(expiryDate = null) {
    try {
      const oldStatus = this.usageData.isPremium;
      const oldExpiry = this.usageData.premiumExpiry;
      
      this.usageData.isPremium = true;
      this.usageData.premiumExpiry = expiryDate ? new Date(expiryDate).toISOString() : null;
      this.saveUsageToStorage(this.usageData);
      
      this.logEvent("Premium status updated", {
        oldStatus,
        newStatus: true,
        oldExpiry,
        newExpiry: this.usageData.premiumExpiry
      });
    } catch (err) {
      this.logEvent("Failed to set premium status", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, keep the in-memory status updated
      this.usageData.isPremium = true;
      this.usageData.premiumExpiry = expiryDate ? new Date(expiryDate).toISOString() : null;
    }
  }

  /**
   * Synchronize usage counts with actual stored data
   * This should be called on app startup to ensure accuracy
   */
  synchronizeUsageCounts() {
    this.logEvent("Starting usage count synchronization");
    
    try {
      let actualMedicationCount = 0;
      let actualADRCount = 0;

      // If localStorage is available, count actual stored items
      if (this.storageAvailable) {
        try {
          const medications = JSON.parse(localStorage.getItem("medications")) || [];
          actualMedicationCount = medications.length;

          const adrs = JSON.parse(localStorage.getItem("adrReports")) || [];
          actualADRCount = adrs.length;
        } catch (parseErr) {
          this.logEvent("Failed to parse stored data during synchronization", {
            error: parseErr.message,
            level: "error"
          });
          // Continue with current counts if parsing fails
          actualMedicationCount = this.usageData.medicationCount;
          actualADRCount = this.usageData.adrCount;
        }
      } else {
        // If localStorage is not available, we can't synchronize with stored data
        // Keep current session counts
        this.logEvent("Cannot synchronize - localStorage unavailable", { level: "warn" });
        return;
      }

      // Update counts if they don't match
      let needsUpdate = false;
      const changes = {};

      if (this.usageData.medicationCount !== actualMedicationCount) {
        changes.medicationCount = {
          old: this.usageData.medicationCount,
          new: actualMedicationCount
        };
        this.usageData.medicationCount = actualMedicationCount;
        needsUpdate = true;
      }

      if (this.usageData.adrCount !== actualADRCount) {
        changes.adrCount = {
          old: this.usageData.adrCount,
          new: actualADRCount
        };
        this.usageData.adrCount = actualADRCount;
        needsUpdate = true;
      }

      if (needsUpdate) {
        this.saveUsageToStorage(this.usageData);
        this.logEvent("Usage counts synchronized - discrepancies found and corrected", {
          changes,
          finalCounts: {
            medications: actualMedicationCount,
            adrs: actualADRCount
          }
        });
      } else {
        this.logEvent("Usage counts synchronized - no changes needed", {
          counts: {
            medications: actualMedicationCount,
            adrs: actualADRCount
          }
        });
      }
    } catch (err) {
      this.logEvent("Failed to synchronize usage counts", {
        error: err.message,
        level: "error"
      });
      // Don't throw - graceful degradation
    }
  }

  /**
   * Reset usage data (for testing or admin purposes)
   */
  resetUsageData() {
    try {
      const oldData = { ...this.usageData };
      this.usageData = { ...defaultUsageData };
      this.saveUsageToStorage(this.usageData);
      this.logEvent("Usage data reset", {
        oldData,
        newData: this.usageData
      });
    } catch (err) {
      this.logEvent("Failed to reset usage data", {
        error: err.message,
        level: "error"
      });
      // Even if saving fails, reset the in-memory data
      this.usageData = { ...defaultUsageData };
      this.sessionData = { ...defaultUsageData };
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
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Log usage-related events for debugging and monitoring
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "UsageLimiter",
      message,
      ...data
    };

    // Use appropriate log level
    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[UsageLimiter] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[UsageLimiter] ${message}`, logEntry);
        break;
      default:
        console.log(`[UsageLimiter] ${message}`, logEntry);
    }

    // Store recent logs in memory for debugging (keep last 50)
    if (!window.__usageLimiterLogs) {
      window.__usageLimiterLogs = [];
    }
    window.__usageLimiterLogs.push(logEntry);
    if (window.__usageLimiterLogs.length > 50) {
      window.__usageLimiterLogs.shift();
    }
  }

  /**
   * Notify user about storage-related issues
   * @param {string} message - User-friendly message
   */
  notifyStorageIssue(message) {
    // Use a simple notification approach that doesn't rely on external dependencies
    // This follows the pattern from notifications.js but is more basic
    try {
      // Try to show a non-intrusive notification
      if (typeof window !== "undefined" && window.console) {
        console.warn(`[MedAdhere Storage Issue] ${message}`);
      }

      // For now, we'll just log the issue. In a full implementation, 
      // this could integrate with a toast notification system or 
      // show a banner in the UI. Since we want to avoid dependencies
      // and the existing notification system is for medication reminders,
      // we'll keep this simple and non-intrusive.
      
      // Store the notification for potential UI display
      if (!window.__storageNotifications) {
        window.__storageNotifications = [];
      }
      window.__storageNotifications.push({
        message,
        timestamp: new Date().toISOString(),
        dismissed: false
      });

      // Keep only the last 5 notifications
      if (window.__storageNotifications.length > 5) {
        window.__storageNotifications.shift();
      }
    } catch (err) {
      // Even notification failed - just log to console as last resort
      console.warn("Storage notification failed:", err);
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array} Array of recent log entries
   */
  getRecentLogs() {
    return window.__usageLimiterLogs || [];
  }

  /**
   * Get pending storage notifications
   * @returns {Array} Array of storage notification messages
   */
  getStorageNotifications() {
    return window.__storageNotifications || [];
  }

  /**
   * Dismiss a storage notification
   * @param {number} index - Index of notification to dismiss
   */
  dismissStorageNotification(index) {
    if (window.__storageNotifications && window.__storageNotifications[index]) {
      window.__storageNotifications[index].dismissed = true;
    }
  }
}

// Create and export singleton instance
const usageLimiter = new UsageLimiter();

export default usageLimiter;

// Export individual methods for convenience
export const {
  canAddMedication,
  canAddADR,
  incrementMedicationCount,
  incrementADRCount,
  decrementMedicationCount,
  decrementADRCount,
  isPremiumUser,
  getUsageStats,
  setPremiumStatus,
  synchronizeUsageCounts,
  resetUsageData,
  isStorageAvailable,
  getRecentLogs,
  getStorageNotifications,
  dismissStorageNotification
} = usageLimiter;

// Development/debugging utilities
// These are available in the browser console for troubleshooting
if (typeof window !== "undefined") {
  window.__medAdhereDebug = {
    usageLimiter,
    getLogs: () => usageLimiter.getRecentLogs(),
    getStorageNotifications: () => usageLimiter.getStorageNotifications(),
    getUsageStats: () => usageLimiter.getUsageStats(),
    testStorageFailure: () => {
      // Temporarily disable localStorage to test fallback
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Simulated storage failure");
      };
      console.log("localStorage.setItem disabled - test fallback behavior");
      return () => {
        localStorage.setItem = originalSetItem;
        console.log("localStorage.setItem restored");
      };
    }
  };
}
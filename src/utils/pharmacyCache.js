// src/utils/pharmacyCache.js
// Pharmacy search results caching utility
// Follows patterns from usageLimiter.js for consistency

const CACHE_STORAGE_KEY = "medadhere_pharmacy_cache";
const MAX_CACHE_ENTRIES = 50;
const CACHE_EXPIRY_HOURS = 24;

/**
 * Default cache structure
 */
const defaultCacheData = {
  searches: [],
  preferences: {
    defaultRadius: 10,
    unit: "km"
  }
};

/**
 * PharmacyCache class - manages offline caching of pharmacy search results
 */
class PharmacyCache {
  constructor() {
    this.storageAvailable = this.isStorageAvailable();
    this.sessionCache = null; // Fallback for when localStorage is unavailable
    this.cacheData = this.loadCache();
    this.logEvent("PharmacyCache initialized", { 
      storageAvailable: this.storageAvailable,
      cachedSearches: this.cacheData.searches.length
    });
  }

  /**
   * Load cache from localStorage
   * @returns {Object} Cache data object
   */
  loadCache() {
    if (!this.storageAvailable) {
      this.logEvent("localStorage unavailable, using session fallback", { level: "warn" });
      return this.sessionCache || { ...defaultCacheData };
    }

    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!stored) {
        this.logEvent("No existing cache found, using defaults");
        return { ...defaultCacheData };
      }
      
      const parsed = JSON.parse(stored);
      
      // Validate and merge with defaults
      const cacheData = {
        ...defaultCacheData,
        ...parsed,
        searches: parsed.searches || []
      };

      this.logEvent("Cache loaded successfully", { 
        searchCount: cacheData.searches.length
      });
      return cacheData;
    } catch (err) {
      this.logEvent("Failed to load cache from localStorage", { 
        error: err.message,
        level: "error"
      });
      return { ...defaultCacheData };
    }
  }

  /**
   * Save cache to localStorage
   * @param {Object} data - Cache data to save
   */
  saveCache(data) {
    if (!this.storageAvailable) {
      this.sessionCache = data;
      this.cacheData = data;
      this.logEvent("Saved cache to session fallback", { 
        searchCount: data.searches.length,
        level: "warn"
      });
      return;
    }

    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
      this.cacheData = data;
      this.logEvent("Cache saved successfully", { 
        searchCount: data.searches.length
      });
    } catch (err) {
      this.logEvent("Failed to save cache to localStorage", { 
        error: err.message,
        level: "error"
      });
      
      // Graceful degradation
      this.cacheData = data;
      this.sessionCache = data;
      
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        // Clear old entries and try again
        this.cleanupOldEntries();
      }
    }
  }

  /**
   * Cache pharmacy search results
   * @param {Object} location - User location {latitude, longitude, country}
   * @param {Array} results - Pharmacy search results
   * @param {number} radius - Search radius used
   */
  cacheResults(location, results, radius = 10) {
    try {
      const cacheEntry = {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          country: location.country || null
        },
        results: results,
        timestamp: new Date().toISOString(),
        radius: radius,
        resultCount: results.length
      };

      // Add to beginning of array (most recent first)
      this.cacheData.searches.unshift(cacheEntry);

      // Limit cache size
      if (this.cacheData.searches.length > MAX_CACHE_ENTRIES) {
        this.cacheData.searches = this.cacheData.searches.slice(0, MAX_CACHE_ENTRIES);
      }

      this.saveCache(this.cacheData);
      
      this.logEvent("Results cached", {
        resultCount: results.length,
        radius,
        totalCachedSearches: this.cacheData.searches.length
      });
    } catch (err) {
      this.logEvent("Failed to cache results", {
        error: err.message,
        level: "error"
      });
    }
  }

  /**
   * Get cached results for a location
   * @param {Object} location - User location {latitude, longitude}
   * @param {number} maxAgeHours - Maximum age of cache in hours (default: 24)
   * @returns {Object|null} Cached search or null
   */
  getCachedResults(location, maxAgeHours = CACHE_EXPIRY_HOURS) {
    try {
      const now = new Date().getTime();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      // Find a cached search near this location
      for (const search of this.cacheData.searches) {
        const cacheAge = now - new Date(search.timestamp).getTime();
        
        // Check if cache is not expired
        if (cacheAge > maxAge) {
          continue;
        }

        // Check if location is close enough (within 1km)
        const distance = this.calculateSimpleDistance(
          location.latitude,
          location.longitude,
          search.location.latitude,
          search.location.longitude
        );

        if (distance <= 1) { // Within 1km of cached location
          this.logEvent("Cache hit", {
            distance,
            cacheAge: Math.round(cacheAge / 1000 / 60), // minutes
            resultCount: search.results.length
          });
          
          return {
            ...search,
            isCached: true,
            cacheAge: cacheAge
          };
        }
      }

      this.logEvent("Cache miss", { 
        cachedSearches: this.cacheData.searches.length
      });
      return null;
    } catch (err) {
      this.logEvent("Error retrieving cached results", {
        error: err.message,
        level: "error"
      });
      return null;
    }
  }

  /**
   * Simple distance calculation for cache matching
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distance in km
   */
  calculateSimpleDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Clean up old cache entries
   */
  cleanupOldEntries() {
    try {
      const now = new Date().getTime();
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      const originalCount = this.cacheData.searches.length;
      
      // Remove expired entries
      this.cacheData.searches = this.cacheData.searches.filter(search => {
        const age = now - new Date(search.timestamp).getTime();
        return age <= maxAge;
      });

      // If still too many, keep only the most recent MAX_CACHE_ENTRIES
      if (this.cacheData.searches.length > MAX_CACHE_ENTRIES) {
        this.cacheData.searches = this.cacheData.searches.slice(0, MAX_CACHE_ENTRIES);
      }

      const removedCount = originalCount - this.cacheData.searches.length;
      
      if (removedCount > 0) {
        this.saveCache(this.cacheData);
        this.logEvent("Cleaned up old cache entries", { 
          removedCount,
          remainingCount: this.cacheData.searches.length
        });
      }
    } catch (err) {
      this.logEvent("Failed to cleanup cache", {
        error: err.message,
        level: "error"
      });
    }
  }

  /**
   * Clear all cached searches
   */
  clearCache() {
    try {
      this.cacheData = { ...defaultCacheData };
      this.saveCache(this.cacheData);
      this.logEvent("Cache cleared");
    } catch (err) {
      this.logEvent("Failed to clear cache", {
        error: err.message,
        level: "error"
      });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const now = new Date().getTime();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cacheData.searches.forEach(search => {
      const age = now - new Date(search.timestamp).getTime();
      const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      
      if (age > maxAge) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: this.cacheData.searches.length,
      validEntries,
      expiredEntries,
      maxEntries: MAX_CACHE_ENTRIES,
      expiryHours: CACHE_EXPIRY_HOURS,
      storageAvailable: this.storageAvailable
    };
  }

  /**
   * Get user preferences
   * @returns {Object} User preferences
   */
  getPreferences() {
    return { ...this.cacheData.preferences };
  }

  /**
   * Set user preferences
   * @param {Object} preferences - Preferences to update
   */
  setPreferences(preferences) {
    try {
      this.cacheData.preferences = {
        ...this.cacheData.preferences,
        ...preferences
      };
      this.saveCache(this.cacheData);
      this.logEvent("Preferences updated", { preferences });
    } catch (err) {
      this.logEvent("Failed to update preferences", {
        error: err.message,
        level: "error"
      });
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  isStorageAvailable() {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      const test = "__pharmacy_cache_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Log cache events
   * @param {string} message
   * @param {Object} data
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: "PharmacyCache",
      message,
      ...data
    };

    const level = data.level || "info";
    switch (level) {
      case "error":
        console.error(`[PharmacyCache] ${message}`, logEntry);
        break;
      case "warn":
        console.warn(`[PharmacyCache] ${message}`, logEntry);
        break;
      default:
        console.log(`[PharmacyCache] ${message}`, logEntry);
    }

    if (!window.__pharmacyCacheLogs) {
      window.__pharmacyCacheLogs = [];
    }
    window.__pharmacyCacheLogs.push(logEntry);
    if (window.__pharmacyCacheLogs.length > 30) {
      window.__pharmacyCacheLogs.shift();
    }
  }

  /**
   * Get recent logs
   * @returns {Array}
   */
  getRecentLogs() {
    return window.__pharmacyCacheLogs || [];
  }
}

// Create and export singleton instance
const pharmacyCache = new PharmacyCache();

export default pharmacyCache;

// Export individual methods
export const {
  cacheResults,
  getCachedResults,
  clearCache,
  getCacheStats,
  getPreferences,
  setPreferences,
  getRecentLogs
} = pharmacyCache;

// Development/debugging utilities
if (typeof window !== "undefined") {
  window.__medAdherePharmacyCacheDebug = {
    pharmacyCache,
    getLogs: () => pharmacyCache.getRecentLogs(),
    getStats: () => pharmacyCache.getCacheStats(),
    clearCache: () => pharmacyCache.clearCache()
  };
}
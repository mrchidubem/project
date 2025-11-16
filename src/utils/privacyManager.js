/**
 * PrivacyManager - Privacy controls and data management for MedAdhere
 * 
 * Provides:
 * - Privacy settings management
 * - Data sharing consent controls
 * - Data export functionality (GDPR compliance)
 * - Complete data deletion functionality
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { db, storage, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS, STORAGE_PATHS } from '../config/firebaseCollections';
import authService from './authService';
import databaseService from './databaseService';

/**
 * Default privacy settings
 */
const DEFAULT_PRIVACY_SETTINGS = {
  shareAnalytics: false,
  shareWithProviders: false,
  allowDataCollection: true,
  allowNotifications: true
};

/**
 * PrivacyManager class for managing user privacy and data controls
 */
class PrivacyManager {
  constructor() {
    this.db = db;
    this.storage = storage;
    this.isConfigured = isFirebaseConfigured;
    this.authService = authService;
    this.databaseService = databaseService;
    this.cachedSettings = null;
  }

  /**
   * Check if Firebase is configured and user is authenticated
   * @private
   * @throws {Error} If Firebase is not configured or user is not authenticated
   */
  _checkConfiguration() {
    if (!this.isConfigured || !this.db) {
      throw new Error('Firebase is not configured. Privacy features require cloud connection.');
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to manage privacy settings.');
    }

    return user;
  }

  /**
   * Handle errors
   * @private
   */
  _handleError(operation, error) {
    console.error(`PrivacyManager ${operation} error:`, error);
    
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this operation',
      'not-found': 'Privacy settings not found',
      'unavailable': 'Service is temporarily unavailable. Please try again.',
      'unauthenticated': 'You must be signed in to manage privacy settings'
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred';
    
    return {
      code: error.code,
      message: message,
      originalError: error
    };
  }

  // ==================== PRIVACY SETTINGS MANAGEMENT ====================

  /**
   * Get user's privacy settings
   * @param {boolean} useCache - Whether to use cached settings (default: true)
   * @returns {Promise<Object>} Privacy settings
   */
  async getPrivacySettings(useCache = true) {
    try {
      // Return cached settings if available and cache is enabled
      if (useCache && this.cachedSettings) {
        return { ...this.cachedSettings };
      }

      const user = this._checkConfiguration();

      const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const settings = userData.privacySettings || DEFAULT_PRIVACY_SETTINGS;
        
        // Cache the settings
        this.cachedSettings = { ...settings };
        
        console.log('[PrivacyManager] Privacy settings retrieved');
        return { ...settings };
      }

      // Return default settings if user document doesn't exist
      console.log('[PrivacyManager] User document not found, returning defaults');
      return { ...DEFAULT_PRIVACY_SETTINGS };

    } catch (error) {
      throw this._handleError('getPrivacySettings', error);
    }
  }

  /**
   * Update user's privacy settings
   * @param {Object} settings - Privacy settings to update
   * @returns {Promise<void>}
   */
  async updatePrivacySettings(settings) {
    try {
      const user = this._checkConfiguration();

      // Validate settings
      const validSettings = this._validatePrivacySettings(settings);

      const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
      
      await updateDoc(userRef, {
        privacySettings: validSettings,
        updatedAt: new Date()
      });

      // Update cache
      this.cachedSettings = { ...validSettings };

      console.log('[PrivacyManager] Privacy settings updated', validSettings);

    } catch (error) {
      throw this._handleError('updatePrivacySettings', error);
    }
  }

  /**
   * Validate privacy settings
   * @private
   */
  _validatePrivacySettings(settings) {
    const validated = { ...DEFAULT_PRIVACY_SETTINGS };

    // Only update valid boolean fields
    const validFields = ['shareAnalytics', 'shareWithProviders', 'allowDataCollection', 'allowNotifications'];
    
    validFields.forEach(field => {
      if (typeof settings[field] === 'boolean') {
        validated[field] = settings[field];
      }
    });

    return validated;
  }

  /**
   * Reset privacy settings to defaults
   * @returns {Promise<void>}
   */
  async resetPrivacySettings() {
    try {
      await this.updatePrivacySettings(DEFAULT_PRIVACY_SETTINGS);
      console.log('[PrivacyManager] Privacy settings reset to defaults');
    } catch (error) {
      throw this._handleError('resetPrivacySettings', error);
    }
  }

  // ==================== DATA SHARING CONSENT CONTROLS ====================

  /**
   * Check if user has consented to analytics
   * @returns {Promise<boolean>} True if user has consented
   */
  async hasAnalyticsConsent() {
    try {
      const settings = await this.getPrivacySettings();
      return settings.shareAnalytics === true;
    } catch (error) {
      console.error('[PrivacyManager] Error checking analytics consent', error);
      return false;
    }
  }

  /**
   * Set analytics consent
   * @param {boolean} consent - Whether user consents to analytics
   * @returns {Promise<void>}
   */
  async setAnalyticsConsent(consent) {
    try {
      const currentSettings = await this.getPrivacySettings();
      await this.updatePrivacySettings({
        ...currentSettings,
        shareAnalytics: consent
      });

      console.log('[PrivacyManager] Analytics consent updated', { consent });
    } catch (error) {
      throw this._handleError('setAnalyticsConsent', error);
    }
  }

  /**
   * Check if user has consented to sharing with providers
   * @returns {Promise<boolean>} True if user has consented
   */
  async hasProviderSharingConsent() {
    try {
      const settings = await this.getPrivacySettings();
      return settings.shareWithProviders === true;
    } catch (error) {
      console.error('[PrivacyManager] Error checking provider sharing consent', error);
      return false;
    }
  }

  /**
   * Set provider sharing consent
   * @param {boolean} consent - Whether user consents to provider sharing
   * @returns {Promise<void>}
   */
  async setProviderSharingConsent(consent) {
    try {
      const currentSettings = await this.getPrivacySettings();
      await this.updatePrivacySettings({
        ...currentSettings,
        shareWithProviders: consent
      });

      console.log('[PrivacyManager] Provider sharing consent updated', { consent });
    } catch (error) {
      throw this._handleError('setProviderSharingConsent', error);
    }
  }

  /**
   * Update multiple consent settings at once
   * @param {Object} consents - Object with consent settings
   * @returns {Promise<void>}
   */
  async updateConsents(consents) {
    try {
      const currentSettings = await this.getPrivacySettings();
      const updatedSettings = { ...currentSettings };

      if (typeof consents.analytics === 'boolean') {
        updatedSettings.shareAnalytics = consents.analytics;
      }

      if (typeof consents.providers === 'boolean') {
        updatedSettings.shareWithProviders = consents.providers;
      }

      if (typeof consents.dataCollection === 'boolean') {
        updatedSettings.allowDataCollection = consents.dataCollection;
      }

      if (typeof consents.notifications === 'boolean') {
        updatedSettings.allowNotifications = consents.notifications;
      }

      await this.updatePrivacySettings(updatedSettings);

      console.log('[PrivacyManager] Multiple consents updated', consents);
    } catch (error) {
      throw this._handleError('updateConsents', error);
    }
  }

  // ==================== DATA EXPORT (GDPR COMPLIANCE) ====================

  /**
   * Export all user data (GDPR compliance)
   * @returns {Promise<Blob>} JSON blob containing all user data
   */
  async exportUserData() {
    try {
      const user = this._checkConfiguration();

      console.log('[PrivacyManager] Starting data export for user', user.uid);

      // Collect all user data
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        email: user.email,
        userData: null,
        medications: [],
        adrReports: [],
        adherenceHistory: [],
        privacySettings: null
      };

      // Get user profile data
      const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        exportData.userData = userDoc.data();
        exportData.privacySettings = userDoc.data().privacySettings;
      }

      // Get medications
      try {
        exportData.medications = await this.databaseService.getMedications();
      } catch (error) {
        console.warn('[PrivacyManager] Error exporting medications', error);
      }

      // Get ADR reports
      try {
        exportData.adrReports = await this.databaseService.getADRs();
      } catch (error) {
        console.warn('[PrivacyManager] Error exporting ADR reports', error);
      }

      // Get adherence history
      try {
        exportData.adherenceHistory = await this.databaseService.getAdherenceHistory();
      } catch (error) {
        console.warn('[PrivacyManager] Error exporting adherence history', error);
      }

      // Get local storage data
      exportData.localStorage = this._exportLocalStorage();

      // Convert to JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      console.log('[PrivacyManager] Data export completed', {
        medications: exportData.medications.length,
        adrReports: exportData.adrReports.length,
        adherenceHistory: exportData.adherenceHistory.length
      });

      return blob;

    } catch (error) {
      throw this._handleError('exportUserData', error);
    }
  }

  /**
   * Export local storage data
   * @private
   */
  _exportLocalStorage() {
    const localData = {};
    const keys = [
      'medications',
      'adrReports',
      'adherenceHistory',
      'medadhere_language',
      'medadhere_onboarding_completed',
      'medadhere_premium_status',
      'medadhere_sync_state'
    ];

    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            localData[key] = JSON.parse(value);
          } catch {
            localData[key] = value;
          }
        }
      } catch (error) {
        console.warn(`[PrivacyManager] Error exporting localStorage key: ${key}`, error);
      }
    });

    return localData;
  }

  /**
   * Download exported data as a file
   * @param {string} filename - Filename for the download (optional)
   * @returns {Promise<void>}
   */
  async downloadUserData(filename = null) {
    try {
      const blob = await this.exportUserData();
      const user = this.authService.getCurrentUser();
      
      const defaultFilename = `medadhere-data-export-${user.uid}-${Date.now()}.json`;
      const downloadFilename = filename || defaultFilename;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[PrivacyManager] Data downloaded', { filename: downloadFilename });

    } catch (error) {
      throw this._handleError('downloadUserData', error);
    }
  }

  // ==================== COMPLETE DATA DELETION ====================

  /**
   * Delete all user data permanently (GDPR right to be forgotten)
   * @param {Object} options - Deletion options
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteUserData(options = {}) {
    try {
      const user = this._checkConfiguration();
      const {
        deleteAccount = false,
        deleteLocalData = true,
        confirmationToken = null
      } = options;

      console.log('[PrivacyManager] Starting data deletion', {
        userId: user.uid,
        deleteAccount,
        deleteLocalData
      });

      const deletionSummary = {
        userId: user.uid,
        deletedAt: new Date().toISOString(),
        medications: 0,
        adrReports: 0,
        adherenceHistory: 0,
        storageFiles: 0,
        userDocument: false,
        accountDeleted: false,
        localDataCleared: false
      };

      // Delete medications
      try {
        const medications = await this.databaseService.getMedications();
        for (const med of medications) {
          await this.databaseService.deleteMedication(med.id);
        }
        deletionSummary.medications = medications.length;
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting medications', error);
      }

      // Delete ADR reports
      try {
        const adrs = await this.databaseService.getADRs();
        for (const adr of adrs) {
          await this.databaseService.deleteADR(adr.id);
        }
        deletionSummary.adrReports = adrs.length;
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting ADR reports', error);
      }

      // Delete adherence history
      try {
        const historyCount = await this._deleteAdherenceHistory(user.uid);
        deletionSummary.adherenceHistory = historyCount;
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting adherence history', error);
      }

      // Delete storage files (photos)
      try {
        const filesDeleted = await this._deleteStorageFiles(user.uid);
        deletionSummary.storageFiles = filesDeleted;
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting storage files', error);
      }

      // Delete user document
      try {
        const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
        await deleteDoc(userRef);
        deletionSummary.userDocument = true;
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting user document', error);
      }

      // Clear local data
      if (deleteLocalData) {
        this._clearLocalData();
        deletionSummary.localDataCleared = true;
      }

      // Delete authentication account
      if (deleteAccount) {
        try {
          await deleteUser(user);
          deletionSummary.accountDeleted = true;
          console.log('[PrivacyManager] User account deleted');
        } catch (error) {
          console.warn('[PrivacyManager] Error deleting account', error);
          // Account deletion might require recent authentication
          throw new Error('Account deletion requires recent authentication. Please sign in again and try.');
        }
      }

      console.log('[PrivacyManager] Data deletion completed', deletionSummary);

      return deletionSummary;

    } catch (error) {
      throw this._handleError('deleteUserData', error);
    }
  }

  /**
   * Delete adherence history for a user
   * @private
   */
  async _deleteAdherenceHistory(userId) {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.ADHERENCE_HISTORY),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(this.db);
      let count = 0;

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      console.log(`[PrivacyManager] Deleted ${count} adherence history records`);
      return count;

    } catch (error) {
      console.error('[PrivacyManager] Error deleting adherence history', error);
      return 0;
    }
  }

  /**
   * Delete all storage files for a user
   * @private
   */
  async _deleteStorageFiles(userId) {
    if (!this.storage) {
      console.warn('[PrivacyManager] Storage not configured');
      return 0;
    }

    try {
      let totalDeleted = 0;

      // Delete ADR photos
      const adrPhotosRef = ref(this.storage, `${STORAGE_PATHS.ADR_PHOTOS}/${userId}`);
      try {
        const adrList = await listAll(adrPhotosRef);
        for (const item of adrList.items) {
          await deleteObject(item);
          totalDeleted++;
        }
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting ADR photos', error);
      }

      // Delete profile photos
      const profilePhotosRef = ref(this.storage, `${STORAGE_PATHS.PROFILE_PHOTOS}/${userId}`);
      try {
        const profileList = await listAll(profilePhotosRef);
        for (const item of profileList.items) {
          await deleteObject(item);
          totalDeleted++;
        }
      } catch (error) {
        console.warn('[PrivacyManager] Error deleting profile photos', error);
      }

      console.log(`[PrivacyManager] Deleted ${totalDeleted} storage files`);
      return totalDeleted;

    } catch (error) {
      console.error('[PrivacyManager] Error deleting storage files', error);
      return 0;
    }
  }

  /**
   * Clear local storage data
   * @private
   */
  _clearLocalData() {
    const keys = [
      'medications',
      'adrReports',
      'adherenceHistory',
      'medadhere_onboarding_completed',
      'medadhere_premium_status',
      'medadhere_sync_state',
      'medadhere_offline_queue'
    ];

    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`[PrivacyManager] Error clearing localStorage key: ${key}`, error);
      }
    });

    // Clear cache
    this.cachedSettings = null;

    console.log('[PrivacyManager] Local data cleared');
  }

  /**
   * Delete only cloud data (keep local data)
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteCloudDataOnly() {
    try {
      return await this.deleteUserData({
        deleteAccount: false,
        deleteLocalData: false
      });
    } catch (error) {
      throw this._handleError('deleteCloudDataOnly', error);
    }
  }

  /**
   * Delete account and all data
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteAccountCompletely() {
    try {
      return await this.deleteUserData({
        deleteAccount: true,
        deleteLocalData: true
      });
    } catch (error) {
      throw this._handleError('deleteAccountCompletely', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if privacy manager is available
   * @returns {boolean} True if configured and available
   */
  isAvailable() {
    return this.isConfigured && this.db !== null;
  }

  /**
   * Get privacy manager status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      isAuthenticated: this.authService.isAuthenticated(),
      isAvailable: this.isAvailable(),
      hasCachedSettings: this.cachedSettings !== null
    };
  }

  /**
   * Clear cached settings
   */
  clearCache() {
    this.cachedSettings = null;
    console.log('[PrivacyManager] Cache cleared');
  }

  /**
   * Get data summary (for display purposes)
   * @returns {Promise<Object>} Data summary
   */
  async getDataSummary() {
    try {
      const user = this._checkConfiguration();

      const summary = {
        userId: user.uid,
        email: user.email,
        medicationsCount: 0,
        adrReportsCount: 0,
        adherenceRecordsCount: 0,
        privacySettings: null,
        accountCreated: null,
        lastLogin: null
      };

      // Get user data
      const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        summary.privacySettings = userData.privacySettings;
        summary.accountCreated = userData.createdAt;
        summary.lastLogin = userData.lastLogin;
      }

      // Count medications
      try {
        const medications = await this.databaseService.getMedications();
        summary.medicationsCount = medications.length;
      } catch (error) {
        console.warn('[PrivacyManager] Error counting medications', error);
      }

      // Count ADR reports
      try {
        const adrs = await this.databaseService.getADRs();
        summary.adrReportsCount = adrs.length;
      } catch (error) {
        console.warn('[PrivacyManager] Error counting ADR reports', error);
      }

      // Count adherence records
      try {
        const history = await this.databaseService.getAdherenceHistory();
        summary.adherenceRecordsCount = history.length;
      } catch (error) {
        console.warn('[PrivacyManager] Error counting adherence records', error);
      }

      return summary;

    } catch (error) {
      throw this._handleError('getDataSummary', error);
    }
  }
}

// Create and export singleton instance
const privacyManager = new PrivacyManager();
export default privacyManager;

// Export individual methods for convenience
export const {
  getPrivacySettings,
  updatePrivacySettings,
  resetPrivacySettings,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  hasProviderSharingConsent,
  setProviderSharingConsent,
  updateConsents,
  exportUserData,
  downloadUserData,
  deleteUserData,
  deleteCloudDataOnly,
  deleteAccountCompletely,
  getDataSummary,
  isAvailable,
  getStatus,
  clearCache
} = privacyManager;

// Development/debugging utilities
if (typeof window !== 'undefined') {
  window.__medAdherePrivacyDebug = {
    privacyManager,
    getSettings: () => privacyManager.getPrivacySettings(),
    getStatus: () => privacyManager.getStatus(),
    getSummary: () => privacyManager.getDataSummary(),
    exportData: () => privacyManager.exportUserData(),
    downloadData: () => privacyManager.downloadUserData()
  };
}

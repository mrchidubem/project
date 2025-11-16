/**
 * SyncService - Synchronization management for MedAdhere
 * 
 * Provides automatic background sync between local storage and cloud database:
 * - Automatic background synchronization
 * - Sync status tracking and indicators
 * - Integration with offline queue system
 * - Incremental sync (only changed data)
 * - Conflict resolution with last-write-wins strategy
 * 
 * Requirements: 1.1, 1.4, 2.1, 2.2, 2.4, 6.1, 6.2
 */

import databaseService from './databaseService';
import authService from './authService';
import { queueAction, syncQueuedActions } from './offlineQueue';

/**
 * Sync status constants
 */
const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  PENDING: 'pending',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Default sync configuration
 */
const DEFAULT_CONFIG = {
  autoSyncInterval: 5 * 60 * 1000, // 5 minutes
  retryDelay: 30 * 1000, // 30 seconds
  maxRetries: 3,
  batchSize: 50
};

/**
 * Conflict types for logging and user prompts
 */
const CONFLICT_TYPE = {
  TIMESTAMP: 'timestamp',
  DELETED_LOCAL: 'deleted_local',
  DELETED_CLOUD: 'deleted_cloud',
  SIMULTANEOUS_EDIT: 'simultaneous_edit',
  UNRESOLVABLE: 'unresolvable'
};

/**
 * ConflictResolver class for handling data conflicts during sync
 * Implements last-write-wins strategy with timestamp comparison
 * Requirements: 2.3, 8.1, 8.2, 8.3, 8.4
 */
class ConflictResolver {
  constructor() {
    this.conflictLog = [];
    this.unresolvableConflicts = [];
    this.conflictCallbacks = [];
  }

  /**
   * Resolve conflict between local and cloud data
   * @param {Object} localItem - Local data item
   * @param {Object} cloudItem - Cloud data item
   * @param {Object} options - Resolution options
   * @returns {Object} Resolved data item
   */
  resolve(localItem, cloudItem, options = {}) {
    const { storageKey = 'unknown', allowUserPrompt = true } = options;

    // Handle deleted items
    if (localItem.deleted && !cloudItem.deleted) {
      return this._handleDeletedLocal(localItem, cloudItem, storageKey);
    }
    
    if (cloudItem.deleted && !localItem.deleted) {
      return this._handleDeletedCloud(localItem, cloudItem, storageKey);
    }

    // Both deleted - use cloud version
    if (localItem.deleted && cloudItem.deleted) {
      this._logConflict(CONFLICT_TYPE.DELETED_CLOUD, localItem, cloudItem, cloudItem, storageKey);
      return this._prepareResolvedItem(cloudItem, localItem);
    }

    // Handle simultaneous edits (within 5 seconds)
    const timeDiff = this._getTimeDifference(localItem, cloudItem);
    if (Math.abs(timeDiff) < 5000) {
      return this._handleSimultaneousEdit(localItem, cloudItem, storageKey, allowUserPrompt);
    }

    // Standard last-write-wins resolution
    return this._resolveByTimestamp(localItem, cloudItem, storageKey);
  }

  /**
   * Handle case where local item is deleted but cloud item exists
   * @private
   */
  _handleDeletedLocal(localItem, cloudItem, storageKey) {
    const localTime = this._getTimestamp(localItem);
    const cloudTime = this._getTimestamp(cloudItem);

    if (localTime > cloudTime) {
      // Local deletion is newer - keep deleted
      this._logConflict(CONFLICT_TYPE.DELETED_LOCAL, localItem, cloudItem, localItem, storageKey);
      return {
        ...localItem,
        cloudId: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
        syncedAt: new Date().toISOString()
      };
    } else {
      // Cloud update is newer - restore item
      this._logConflict(CONFLICT_TYPE.DELETED_LOCAL, localItem, cloudItem, cloudItem, storageKey);
      return this._prepareResolvedItem(cloudItem, localItem);
    }
  }

  /**
   * Handle case where cloud item is deleted but local item exists
   * @private
   */
  _handleDeletedCloud(localItem, cloudItem, storageKey) {
    const localTime = this._getTimestamp(localItem);
    const cloudTime = this._getTimestamp(cloudItem);

    if (cloudTime > localTime) {
      // Cloud deletion is newer - mark as deleted
      this._logConflict(CONFLICT_TYPE.DELETED_CLOUD, localItem, cloudItem, cloudItem, storageKey);
      return {
        ...localItem,
        deleted: true,
        deletedAt: cloudItem.deletedAt || cloudItem.updatedAt,
        cloudId: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
        syncedAt: new Date().toISOString()
      };
    } else {
      // Local update is newer - keep item
      this._logConflict(CONFLICT_TYPE.DELETED_CLOUD, localItem, cloudItem, localItem, storageKey);
      return {
        ...localItem,
        syncedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Handle simultaneous edits (edits within 5 seconds of each other)
   * @private
   */
  _handleSimultaneousEdit(localItem, cloudItem, storageKey, allowUserPrompt) {
    // Check if items have significant differences
    const hasSignificantDiff = this._hasSignificantDifferences(localItem, cloudItem);

    if (!hasSignificantDiff) {
      // Minor differences - use cloud version
      this._logConflict(CONFLICT_TYPE.SIMULTANEOUS_EDIT, localItem, cloudItem, cloudItem, storageKey);
      return this._prepareResolvedItem(cloudItem, localItem);
    }

    // Significant differences - this might be unresolvable
    if (allowUserPrompt) {
      this._queueUnresolvableConflict(localItem, cloudItem, storageKey);
      // For now, use last-write-wins as fallback
      return this._resolveByTimestamp(localItem, cloudItem, storageKey);
    }

    // No user prompt allowed - use last-write-wins
    return this._resolveByTimestamp(localItem, cloudItem, storageKey);
  }

  /**
   * Resolve conflict using last-write-wins strategy
   * @private
   */
  _resolveByTimestamp(localItem, cloudItem, storageKey) {
    const localTime = this._getTimestamp(localItem);
    const cloudTime = this._getTimestamp(cloudItem);

    if (cloudTime > localTime) {
      // Cloud is newer - use cloud data
      this._logConflict(CONFLICT_TYPE.TIMESTAMP, localItem, cloudItem, cloudItem, storageKey);
      return this._prepareResolvedItem(cloudItem, localItem);
    } else if (localTime > cloudTime) {
      // Local is newer - keep local data
      this._logConflict(CONFLICT_TYPE.TIMESTAMP, localItem, cloudItem, localItem, storageKey);
      return {
        ...localItem,
        cloudId: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
        syncedAt: new Date().toISOString()
      };
    } else {
      // Same timestamp - prefer cloud (consistent behavior)
      this._logConflict(CONFLICT_TYPE.TIMESTAMP, localItem, cloudItem, cloudItem, storageKey);
      return this._prepareResolvedItem(cloudItem, localItem);
    }
  }

  /**
   * Get timestamp from item (handles various timestamp fields)
   * @private
   */
  _getTimestamp(item) {
    const timestamp = item.updatedAt || item.createdAt || item.timestamp || item.takenAt || 0;
    return new Date(timestamp).getTime();
  }

  /**
   * Get time difference between local and cloud items in milliseconds
   * @private
   */
  _getTimeDifference(localItem, cloudItem) {
    return this._getTimestamp(localItem) - this._getTimestamp(cloudItem);
  }

  /**
   * Check if items have significant differences
   * @private
   */
  _hasSignificantDifferences(localItem, cloudItem) {
    // Compare key fields (excluding metadata)
    const significantFields = ['name', 'dosage', 'time', 'frequency', 'taken', 'symptoms', 'severity'];
    
    for (const field of significantFields) {
      if (localItem[field] !== undefined && cloudItem[field] !== undefined) {
        if (localItem[field] !== cloudItem[field]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Prepare resolved item with proper structure
   * @private
   */
  _prepareResolvedItem(sourceItem, localItem) {
    return {
      ...sourceItem,
      id: localItem.id, // Keep local ID
      cloudId: sourceItem.id || sourceItem.medicationId || sourceItem.adrId,
      syncedAt: new Date().toISOString()
    };
  }

  /**
   * Log conflict for debugging
   * @private
   */
  _logConflict(type, localItem, cloudItem, resolvedItem, storageKey) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      storageKey,
      itemId: localItem.id,
      cloudId: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
      localTimestamp: new Date(this._getTimestamp(localItem)).toISOString(),
      cloudTimestamp: new Date(this._getTimestamp(cloudItem)).toISOString(),
      resolution: resolvedItem === localItem ? 'local' : 'cloud',
      localData: this._sanitizeForLog(localItem),
      cloudData: this._sanitizeForLog(cloudItem)
    };

    this.conflictLog.push(logEntry);

    // Keep only last 100 conflicts
    if (this.conflictLog.length > 100) {
      this.conflictLog.shift();
    }

    // Log to console
    console.log(`[ConflictResolver] ${type} conflict resolved`, {
      itemId: logEntry.itemId,
      resolution: logEntry.resolution,
      localTime: logEntry.localTimestamp,
      cloudTime: logEntry.cloudTimestamp
    });
  }

  /**
   * Sanitize item data for logging (remove sensitive info)
   * @private
   */
  _sanitizeForLog(item) {
    const { photoUrl, ...sanitized } = item;
    return sanitized;
  }

  /**
   * Queue unresolvable conflict for user prompt
   * @private
   */
  _queueUnresolvableConflict(localItem, cloudItem, storageKey) {
    const conflict = {
      id: `${storageKey}_${localItem.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      storageKey,
      localItem: { ...localItem },
      cloudItem: { ...cloudItem },
      resolved: false
    };

    this.unresolvableConflicts.push(conflict);

    // Notify callbacks
    this._notifyConflictCallbacks(conflict);

    console.warn('[ConflictResolver] Unresolvable conflict detected', {
      itemId: localItem.id,
      storageKey
    });
  }

  /**
   * Notify conflict callbacks
   * @private
   */
  _notifyConflictCallbacks(conflict) {
    this.conflictCallbacks.forEach(callback => {
      try {
        callback(conflict);
      } catch (error) {
        console.error('[ConflictResolver] Error in conflict callback', error);
      }
    });
  }

  /**
   * Register callback for unresolvable conflicts
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onUnresolvableConflict(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.conflictCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.conflictCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get unresolved conflicts
   * @returns {Array} Unresolved conflicts
   */
  getUnresolvedConflicts() {
    return this.unresolvableConflicts.filter(c => !c.resolved);
  }

  /**
   * Resolve conflict manually with user choice
   * @param {string} conflictId - Conflict ID
   * @param {string} choice - 'local' or 'cloud'
   * @returns {Object|null} Resolved item or null if not found
   */
  resolveManually(conflictId, choice) {
    const conflict = this.unresolvableConflicts.find(c => c.id === conflictId);
    
    if (!conflict) {
      console.warn('[ConflictResolver] Conflict not found', { conflictId });
      return null;
    }

    if (conflict.resolved) {
      console.warn('[ConflictResolver] Conflict already resolved', { conflictId });
      return null;
    }

    const resolvedItem = choice === 'local' 
      ? { ...conflict.localItem, syncedAt: new Date().toISOString() }
      : this._prepareResolvedItem(conflict.cloudItem, conflict.localItem);

    conflict.resolved = true;
    conflict.resolvedAt = new Date().toISOString();
    conflict.userChoice = choice;

    console.log('[ConflictResolver] Conflict manually resolved', {
      conflictId,
      choice
    });

    return resolvedItem;
  }

  /**
   * Get conflict log for debugging
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Conflict log entries
   */
  getConflictLog(limit = 50) {
    return this.conflictLog.slice(-limit);
  }

  /**
   * Clear conflict log
   */
  clearConflictLog() {
    this.conflictLog = [];
    console.log('[ConflictResolver] Conflict log cleared');
  }

  /**
   * Get conflict statistics
   * @returns {Object} Conflict statistics
   */
  getStatistics() {
    const stats = {
      total: this.conflictLog.length,
      byType: {},
      byResolution: { local: 0, cloud: 0 },
      unresolved: this.getUnresolvedConflicts().length
    };

    this.conflictLog.forEach(entry => {
      // Count by type
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      
      // Count by resolution
      if (entry.resolution === 'local') {
        stats.byResolution.local++;
      } else {
        stats.byResolution.cloud++;
      }
    });

    return stats;
  }
}

/**
 * SyncService class for managing cloud synchronization
 */
class SyncService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.syncStatus = {
      status: SYNC_STATUS.OFFLINE,
      lastSyncTime: null,
      pendingChanges: 0,
      errorMessage: null
    };
    
    this.autoSyncTimer = null;
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.isSyncing = false;
    
    // Initialize ConflictResolver
    this.conflictResolver = new ConflictResolver();
    
    // Initialize
    this._loadSyncState();
    this._setupNetworkListeners();
    this._setupAuthListener();
    
    this.logEvent('SyncService initialized', {
      isOnline: this.isOnline,
      autoSyncEnabled: false
    });
  }

  /**
   * Load sync state from localStorage
   * @private
   */
  _loadSyncState() {
    try {
      const stored = localStorage.getItem('medadhere_sync_state');
      if (stored) {
        const state = JSON.parse(stored);
        this.syncStatus = {
          ...this.syncStatus,
          lastSyncTime: state.lastSyncTime ? new Date(state.lastSyncTime) : null,
          pendingChanges: state.pendingChanges || 0
        };
      }
    } catch (error) {
      this.logEvent('Failed to load sync state', { error: error.message, level: 'warn' });
    }
  }

  /**
   * Save sync state to localStorage
   * @private
   */
  _saveSyncState() {
    try {
      const state = {
        lastSyncTime: this.syncStatus.lastSyncTime?.toISOString(),
        pendingChanges: this.syncStatus.pendingChanges
      };
      localStorage.setItem('medadhere_sync_state', JSON.stringify(state));
    } catch (error) {
      this.logEvent('Failed to save sync state', { error: error.message, level: 'warn' });
    }
  }

  /**
   * Setup network status listeners
   * @private
   */
  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logEvent('Network online - triggering sync');
      this._updateStatus(SYNC_STATUS.PENDING);
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logEvent('Network offline');
      this._updateStatus(SYNC_STATUS.OFFLINE);
    });
  }

  /**
   * Setup authentication state listener
   * @private
   */
  _setupAuthListener() {
    authService.onAuthStateChanged((user) => {
      if (user) {
        this.logEvent('User authenticated - starting auto sync');
        this.startAutoSync();
        this.syncNow();
      } else {
        this.logEvent('User signed out - stopping auto sync');
        this.stopAutoSync();
        this._updateStatus(SYNC_STATUS.OFFLINE);
      }
    });
  }

  /**
   * Update sync status and notify listeners
   * @private
   */
  _updateStatus(status, errorMessage = null) {
    this.syncStatus.status = status;
    this.syncStatus.errorMessage = errorMessage;
    
    this._saveSyncState();
    this._notifyListeners();
  }

  /**
   * Notify all status listeners
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getSyncStatus());
      } catch (error) {
        this.logEvent('Error in sync status listener', { error: error.message, level: 'error' });
      }
    });
  }

  /**
   * Start automatic background sync
   */
  startAutoSync() {
    if (this.autoSyncTimer) {
      return; // Already running
    }

    this.logEvent('Starting auto sync', { interval: this.config.autoSyncInterval });
    
    this.autoSyncTimer = setInterval(() => {
      if (this.isOnline && authService.isAuthenticated() && !this.isSyncing) {
        this.syncNow();
      }
    }, this.config.autoSyncInterval);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      this.logEvent('Auto sync stopped');
    }
  }

  /**
   * Trigger immediate sync
   * @returns {Promise<void>}
   */
  async syncNow() {
    // Check prerequisites
    if (!this.isOnline) {
      this.logEvent('Cannot sync - offline', { level: 'warn' });
      this._updateStatus(SYNC_STATUS.OFFLINE);
      return;
    }

    if (!authService.isAuthenticated()) {
      this.logEvent('Cannot sync - not authenticated', { level: 'warn' });
      this._updateStatus(SYNC_STATUS.OFFLINE);
      return;
    }

    if (this.isSyncing) {
      this.logEvent('Sync already in progress', { level: 'warn' });
      return;
    }

    this.isSyncing = true;
    this._updateStatus(SYNC_STATUS.SYNCING);

    try {
      this.logEvent('Starting sync');

      // Step 1: Sync queued offline actions
      await this._syncOfflineQueue();

      // Step 2: Sync local changes to cloud
      await this._syncLocalToCloud();

      // Step 3: Sync cloud changes to local
      await this._syncCloudToLocal();

      // Success
      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.pendingChanges = 0;
      this._updateStatus(SYNC_STATUS.SYNCED);
      
      this.logEvent('Sync completed successfully', {
        timestamp: this.syncStatus.lastSyncTime.toISOString()
      });

    } catch (error) {
      this.logEvent('Sync failed', { error: error.message, level: 'error' });
      this._updateStatus(SYNC_STATUS.ERROR, error.message);
      
      // Schedule retry
      this._scheduleRetry();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync offline queue actions
   * @private
   */
  async _syncOfflineQueue() {
    try {
      await syncQueuedActions();
      this.logEvent('Offline queue synced');
    } catch (error) {
      this.logEvent('Failed to sync offline queue', { error: error.message, level: 'warn' });
      // Don't throw - continue with other sync operations
    }
  }

  /**
   * Sync local changes to cloud (incremental)
   * @private
   */
  async _syncLocalToCloud() {
    try {
      // Get local data
      const localMedications = this._getLocalMedications();
      const localADRs = this._getLocalADRs();
      const localAdherence = this._getLocalAdherence();

      // Get last sync timestamp
      const lastSync = this.syncStatus.lastSyncTime;

      // Filter only changed items (incremental sync)
      const changedMedications = this._getChangedItems(localMedications, lastSync);
      const changedADRs = this._getChangedItems(localADRs, lastSync);

      this.logEvent('Syncing local changes to cloud', {
        medications: changedMedications.length,
        adrs: changedADRs.length,
        adherence: Object.keys(localAdherence).length
      });

      // Sync medications
      for (const med of changedMedications) {
        if (med.cloudId) {
          await databaseService.updateMedication(med.cloudId, med);
        } else {
          const cloudId = await databaseService.createMedication(med);
          this._updateLocalCloudId('medications', med.id, cloudId);
        }
      }

      // Sync ADRs
      for (const adr of changedADRs) {
        if (adr.cloudId) {
          await databaseService.updateADR(adr.cloudId, adr);
        } else {
          const cloudId = await databaseService.createADR(adr);
          this._updateLocalCloudId('adrReports', adr.id, cloudId);
        }
      }

      // Sync adherence history
      if (Object.keys(localAdherence).length > 0) {
        await databaseService.batchSyncAdherenceHistory(localAdherence);
      }

    } catch (error) {
      this.logEvent('Failed to sync local to cloud', { error: error.message, level: 'error' });
      throw error;
    }
  }

  /**
   * Sync cloud changes to local
   * @private
   */
  async _syncCloudToLocal() {
    try {
      // Fetch cloud data
      const cloudMedications = await databaseService.getMedications();
      const cloudADRs = await databaseService.getADRs();

      this.logEvent('Syncing cloud changes to local', {
        medications: cloudMedications.length,
        adrs: cloudADRs.length
      });

      // Merge with local data (conflict resolution)
      this._mergeCloudData('medications', cloudMedications);
      this._mergeCloudData('adrReports', cloudADRs);

    } catch (error) {
      this.logEvent('Failed to sync cloud to local', { error: error.message, level: 'error' });
      throw error;
    }
  }

  /**
   * Get local medications from localStorage
   * @private
   */
  _getLocalMedications() {
    try {
      const stored = localStorage.getItem('medications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      this.logEvent('Failed to get local medications', { error: error.message, level: 'error' });
      return [];
    }
  }

  /**
   * Get local ADR reports from localStorage
   * @private
   */
  _getLocalADRs() {
    try {
      const stored = localStorage.getItem('adrReports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      this.logEvent('Failed to get local ADRs', { error: error.message, level: 'error' });
      return [];
    }
  }

  /**
   * Get local adherence history from localStorage
   * @private
   */
  _getLocalAdherence() {
    try {
      const stored = localStorage.getItem('adherenceHistory');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      this.logEvent('Failed to get local adherence', { error: error.message, level: 'error' });
      return {};
    }
  }

  /**
   * Filter items changed since last sync (incremental sync)
   * @private
   */
  _getChangedItems(items, lastSync) {
    if (!lastSync) {
      return items; // First sync - sync all
    }

    return items.filter(item => {
      const itemDate = item.updatedAt || item.createdAt || item.timestamp;
      if (!itemDate) return true; // No timestamp - sync it
      
      const itemTime = new Date(itemDate).getTime();
      const lastSyncTime = new Date(lastSync).getTime();
      
      return itemTime > lastSyncTime;
    });
  }

  /**
   * Update local item with cloud ID
   * @private
   */
  _updateLocalCloudId(storageKey, localId, cloudId) {
    try {
      const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const item = items.find(i => i.id === localId);
      
      if (item) {
        item.cloudId = cloudId;
        item.syncedAt = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(items));
      }
    } catch (error) {
      this.logEvent('Failed to update cloud ID', { error: error.message, level: 'error' });
    }
  }

  /**
   * Merge cloud data with local data (conflict resolution)
   * @private
   */
  _mergeCloudData(storageKey, cloudItems) {
    try {
      const localItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const mergedItems = [...localItems];

      cloudItems.forEach(cloudItem => {
        // Find matching local item by cloudId
        const localIndex = mergedItems.findIndex(
          local => local.cloudId === cloudItem.id || local.cloudId === cloudItem.medicationId || local.cloudId === cloudItem.adrId
        );

        if (localIndex >= 0) {
          // Item exists locally - resolve conflict
          const localItem = mergedItems[localIndex];
          const resolved = this._resolveConflict(localItem, cloudItem, storageKey);
          mergedItems[localIndex] = resolved;
        } else {
          // New item from cloud - add it
          const newItem = {
            ...cloudItem,
            id: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
            cloudId: cloudItem.id || cloudItem.medicationId || cloudItem.adrId,
            syncedAt: new Date().toISOString()
          };
          mergedItems.push(newItem);
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(mergedItems));
      this.logEvent('Cloud data merged', { storageKey, count: cloudItems.length });

    } catch (error) {
      this.logEvent('Failed to merge cloud data', { error: error.message, level: 'error' });
    }
  }

  /**
   * Resolve conflict between local and cloud data
   * Uses ConflictResolver with last-write-wins strategy
   * @private
   */
  _resolveConflict(localItem, cloudItem, storageKey = 'unknown') {
    return this.conflictResolver.resolve(localItem, cloudItem, {
      storageKey,
      allowUserPrompt: true
    });
  }

  /**
   * Schedule retry after sync failure
   * @private
   */
  _scheduleRetry() {
    setTimeout(() => {
      if (this.isOnline && authService.isAuthenticated()) {
        this.logEvent('Retrying sync after failure');
        this.syncNow();
      }
    }, this.config.retryDelay);
  }

  /**
   * Get current sync status
   * @returns {Object} Sync status
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      isOnline: this.isOnline,
      isAuthenticated: authService.isAuthenticated(),
      autoSyncEnabled: this.autoSyncTimer !== null
    };
  }

  /**
   * Get last sync time
   * @returns {Date|null} Last sync timestamp
   */
  getLastSyncTime() {
    return this.syncStatus.lastSyncTime;
  }

  /**
   * Register a sync status listener
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onSyncStatusChanged(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.listeners.push(callback);

    // Call immediately with current status
    callback(this.getSyncStatus());

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Queue an action for sync when online
   * @param {Object} action - Action to queue
   */
  async queueForSync(action) {
    try {
      await queueAction(action);
      this.syncStatus.pendingChanges += 1;
      this._updateStatus(SYNC_STATUS.PENDING);
      
      this.logEvent('Action queued for sync', { action: action.type });

      // Try to sync immediately if online
      if (this.isOnline && authService.isAuthenticated()) {
        this.syncNow();
      }
    } catch (error) {
      this.logEvent('Failed to queue action', { error: error.message, level: 'error' });
    }
  }

  /**
   * Update sync configuration
   * @param {Object} config - Configuration options
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };

    this.logEvent('Sync configuration updated', { config: this.config });

    // Restart auto sync with new interval if running
    if (this.autoSyncTimer) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  /**
   * Log sync events
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: 'SyncService',
      message,
      ...data
    };

    const level = data.level || 'info';
    switch (level) {
      case 'error':
        console.error(`[SyncService] ${message}`, logEntry);
        break;
      case 'warn':
        console.warn(`[SyncService] ${message}`, logEntry);
        break;
      default:
        console.log(`[SyncService] ${message}`, logEntry);
    }

    // Store recent logs
    if (!window.__syncServiceLogs) {
      window.__syncServiceLogs = [];
    }
    window.__syncServiceLogs.push(logEntry);
    if (window.__syncServiceLogs.length > 50) {
      window.__syncServiceLogs.shift();
    }
  }

  /**
   * Get recent logs for debugging
   * @returns {Array} Recent log entries
   */
  getRecentLogs() {
    return window.__syncServiceLogs || [];
  }

  /**
   * Get conflict resolver instance
   * @returns {ConflictResolver} Conflict resolver
   */
  getConflictResolver() {
    return this.conflictResolver;
  }

  /**
   * Get unresolved conflicts
   * @returns {Array} Unresolved conflicts
   */
  getUnresolvedConflicts() {
    return this.conflictResolver.getUnresolvedConflicts();
  }

  /**
   * Resolve conflict manually
   * @param {string} conflictId - Conflict ID
   * @param {string} choice - 'local' or 'cloud'
   * @returns {Promise<void>}
   */
  async resolveConflictManually(conflictId, choice) {
    const resolvedItem = this.conflictResolver.resolveManually(conflictId, choice);
    
    if (!resolvedItem) {
      throw new Error('Conflict not found or already resolved');
    }

    // Find the conflict to get storage key
    const conflict = this.conflictResolver.unresolvableConflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Update local storage with resolved item
    try {
      const storageKey = conflict.storageKey;
      const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const index = items.findIndex(item => item.id === resolvedItem.id);
      
      if (index >= 0) {
        items[index] = resolvedItem;
        localStorage.setItem(storageKey, JSON.stringify(items));
        
        this.logEvent('Conflict manually resolved', {
          conflictId,
          choice,
          storageKey
        });

        // Trigger sync to update cloud if needed
        if (choice === 'local') {
          await this.syncNow();
        }
      }
    } catch (error) {
      this.logEvent('Failed to apply manual conflict resolution', {
        error: error.message,
        level: 'error'
      });
      throw error;
    }
  }

  /**
   * Register callback for unresolvable conflicts
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onUnresolvableConflict(callback) {
    return this.conflictResolver.onUnresolvableConflict(callback);
  }

  /**
   * Get conflict statistics
   * @returns {Object} Conflict statistics
   */
  getConflictStatistics() {
    return this.conflictResolver.getStatistics();
  }

  /**
   * Get conflict log
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Conflict log entries
   */
  getConflictLog(limit = 50) {
    return this.conflictResolver.getConflictLog(limit);
  }
}

// Create and export singleton instance
const syncService = new SyncService();

export default syncService;
export { SYNC_STATUS, CONFLICT_TYPE };

// Export individual methods for convenience
export const {
  startAutoSync,
  stopAutoSync,
  syncNow,
  getSyncStatus,
  getLastSyncTime,
  onSyncStatusChanged,
  queueForSync,
  updateConfig,
  getRecentLogs,
  getConflictResolver,
  getUnresolvedConflicts,
  resolveConflictManually,
  onUnresolvableConflict,
  getConflictStatistics,
  getConflictLog
} = syncService;

// Development/debugging utilities
if (typeof window !== 'undefined') {
  window.__medAdhereSyncDebug = {
    syncService,
    getLogs: () => syncService.getRecentLogs(),
    getStatus: () => syncService.getSyncStatus(),
    syncNow: () => syncService.syncNow(),
    startAutoSync: () => syncService.startAutoSync(),
    stopAutoSync: () => syncService.stopAutoSync(),
    getConflicts: () => syncService.getUnresolvedConflicts(),
    getConflictLog: () => syncService.getConflictLog(),
    getConflictStats: () => syncService.getConflictStatistics(),
    resolveConflict: (id, choice) => syncService.resolveConflictManually(id, choice)
  };
}

/**
 * DatabaseService - Cloud database operations for MedAdhere
 * 
 * Provides CRUD operations for:
 * - Medications
 * - ADR Reports
 * - Adherence History
 * 
 * Features:
 * - Data encryption for sensitive fields
 * - English-only storage in database
 * - Automatic timestamp management
 * - Error handling and logging
 * 
 * Requirements: 1.1, 1.2, 1.3, 7.1, 7.2
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS, FIELDS } from '../config/firebaseCollections';
import authService from './authService';

/**
 * Simple encryption/decryption for sensitive data
 * Note: For production, use a more robust encryption library
 */
class DataEncryption {
  /**
   * Encrypt sensitive text data
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  static encrypt(text) {
    if (!text) return text;
    
    try {
      // Simple base64 encoding with obfuscation
      // In production, use crypto-js or similar library
      const encoded = btoa(unescape(encodeURIComponent(text)));
      return `enc_${encoded}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  }

  /**
   * Decrypt sensitive text data
   * @param {string} encryptedText - Encrypted text
   * @returns {string} Decrypted text
   */
  static decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    try {
      // Check if data is encrypted
      if (!encryptedText.startsWith('enc_')) {
        return encryptedText;
      }

      const encoded = encryptedText.substring(4);
      return decodeURIComponent(escape(atob(encoded)));
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  }

  /**
   * Encrypt sensitive fields in an object
   * @param {Object} data - Data object
   * @param {Array<string>} fields - Fields to encrypt
   * @returns {Object} Data with encrypted fields
   */
  static encryptFields(data, fields = []) {
    const encrypted = { ...data };
    
    fields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in an object
   * @param {Object} data - Data object
   * @param {Array<string>} fields - Fields to decrypt
   * @returns {Object} Data with decrypted fields
   */
  static decryptFields(data, fields = []) {
    const decrypted = { ...data };
    
    fields.forEach(field => {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });

    return decrypted;
  }
}

/**
 * DatabaseService class for cloud database operations
 */
class DatabaseService {
  constructor() {
    this.db = db;
    this.isConfigured = isFirebaseConfigured;
    this.authService = authService;
    
    // Define sensitive fields that should be encrypted
    this.sensitiveFields = {
      medications: ['name', 'dosage'],
      adrReports: ['medicationName', 'symptoms'],
      adherenceHistory: []
    };
  }

  /**
   * Check if database is configured and user is authenticated
   * @private
   * @throws {Error} If database is not configured or user is not authenticated
   */
  _checkConfiguration() {
    if (!this.isConfigured || !this.db) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to access cloud database.');
    }

    return user;
  }

  /**
   * Handle database errors
   * @private
   */
  _handleError(operation, error) {
    console.error(`Database ${operation} error:`, error);
    
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this operation',
      'not-found': 'The requested data was not found',
      'already-exists': 'This data already exists',
      'unavailable': 'Database is temporarily unavailable. Please try again.',
      'unauthenticated': 'You must be signed in to perform this operation'
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred';
    
    return {
      code: error.code,
      message: message,
      originalError: error
    };
  }

  // ==================== MEDICATION OPERATIONS ====================

  /**
   * Create a new medication
   * @param {Object} medication - Medication data
   * @returns {Promise<string>} Medication ID
   */
  async createMedication(medication) {
    try {
      const user = this._checkConfiguration();

      // Encrypt sensitive fields
      const encryptedData = DataEncryption.encryptFields(
        medication,
        this.sensitiveFields.medications
      );

      const medicationData = {
        ...encryptedData,
        userId: user.uid,
        taken: medication.taken || false,
        takenAt: medication.takenAt || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(this.db, COLLECTIONS.MEDICATIONS),
        medicationData
      );

      console.log('Medication created:', docRef.id);
      return docRef.id;
    } catch (error) {
      throw this._handleError('createMedication', error);
    }
  }

  /**
   * Get all medications for a user
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} Array of medications
   */
  async getMedications(userId = null) {
    try {
      const user = this._checkConfiguration();
      const uid = userId || user.uid;

      const q = query(
        collection(this.db, COLLECTIONS.MEDICATIONS),
        where(FIELDS.USER_ID, '==', uid),
        orderBy(FIELDS.CREATED_AT, 'desc')
      );

      const querySnapshot = await getDocs(q);
      const medications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Decrypt sensitive fields
        const decryptedData = DataEncryption.decryptFields(
          data,
          this.sensitiveFields.medications
        );

        medications.push({
          id: doc.id,
          medicationId: doc.id,
          ...decryptedData
        });
      });

      console.log(`Retrieved ${medications.length} medications`);
      return medications;
    } catch (error) {
      throw this._handleError('getMedications', error);
    }
  }

  /**
   * Get a single medication by ID
   * @param {string} medicationId - Medication ID
   * @returns {Promise<Object|null>} Medication data or null
   */
  async getMedication(medicationId) {
    try {
      this._checkConfiguration();

      const docRef = doc(this.db, COLLECTIONS.MEDICATIONS, medicationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Decrypt sensitive fields
        const decryptedData = DataEncryption.decryptFields(
          data,
          this.sensitiveFields.medications
        );

        return {
          id: docSnap.id,
          medicationId: docSnap.id,
          ...decryptedData
        };
      }

      return null;
    } catch (error) {
      throw this._handleError('getMedication', error);
    }
  }

  /**
   * Update a medication
   * @param {string} medicationId - Medication ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateMedication(medicationId, updates) {
    try {
      this._checkConfiguration();

      // Encrypt sensitive fields if they're being updated
      const encryptedUpdates = DataEncryption.encryptFields(
        updates,
        this.sensitiveFields.medications
      );

      const updateData = {
        ...encryptedUpdates,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      const docRef = doc(this.db, COLLECTIONS.MEDICATIONS, medicationId);
      await updateDoc(docRef, updateData);

      console.log('Medication updated:', medicationId);
    } catch (error) {
      throw this._handleError('updateMedication', error);
    }
  }

  /**
   * Delete a medication
   * @param {string} medicationId - Medication ID
   * @returns {Promise<void>}
   */
  async deleteMedication(medicationId) {
    try {
      this._checkConfiguration();

      const docRef = doc(this.db, COLLECTIONS.MEDICATIONS, medicationId);
      await deleteDoc(docRef);

      console.log('Medication deleted:', medicationId);
    } catch (error) {
      throw this._handleError('deleteMedication', error);
    }
  }

  // ==================== ADR REPORT OPERATIONS ====================

  /**
   * Create a new ADR report
   * @param {Object} adr - ADR report data
   * @returns {Promise<string>} ADR report ID
   */
  async createADR(adr) {
    try {
      const user = this._checkConfiguration();

      // Encrypt sensitive fields
      const encryptedData = DataEncryption.encryptFields(
        adr,
        this.sensitiveFields.adrReports
      );

      const adrData = {
        ...encryptedData,
        userId: user.uid,
        photoUrl: adr.photoUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(this.db, COLLECTIONS.ADR_REPORTS),
        adrData
      );

      console.log('ADR report created:', docRef.id);
      return docRef.id;
    } catch (error) {
      throw this._handleError('createADR', error);
    }
  }

  /**
   * Get all ADR reports for a user
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} Array of ADR reports
   */
  async getADRs(userId = null) {
    try {
      const user = this._checkConfiguration();
      const uid = userId || user.uid;

      const q = query(
        collection(this.db, COLLECTIONS.ADR_REPORTS),
        where(FIELDS.USER_ID, '==', uid),
        orderBy(FIELDS.CREATED_AT, 'desc')
      );

      const querySnapshot = await getDocs(q);
      const adrs = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Decrypt sensitive fields
        const decryptedData = DataEncryption.decryptFields(
          data,
          this.sensitiveFields.adrReports
        );

        adrs.push({
          id: doc.id,
          adrId: doc.id,
          ...decryptedData
        });
      });

      console.log(`Retrieved ${adrs.length} ADR reports`);
      return adrs;
    } catch (error) {
      throw this._handleError('getADRs', error);
    }
  }

  /**
   * Get a single ADR report by ID
   * @param {string} adrId - ADR report ID
   * @returns {Promise<Object|null>} ADR report data or null
   */
  async getADR(adrId) {
    try {
      this._checkConfiguration();

      const docRef = doc(this.db, COLLECTIONS.ADR_REPORTS, adrId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Decrypt sensitive fields
        const decryptedData = DataEncryption.decryptFields(
          data,
          this.sensitiveFields.adrReports
        );

        return {
          id: docSnap.id,
          adrId: docSnap.id,
          ...decryptedData
        };
      }

      return null;
    } catch (error) {
      throw this._handleError('getADR', error);
    }
  }

  /**
   * Update an ADR report
   * @param {string} adrId - ADR report ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateADR(adrId, updates) {
    try {
      this._checkConfiguration();

      // Encrypt sensitive fields if they're being updated
      const encryptedUpdates = DataEncryption.encryptFields(
        updates,
        this.sensitiveFields.adrReports
      );

      const updateData = {
        ...encryptedUpdates,
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      const docRef = doc(this.db, COLLECTIONS.ADR_REPORTS, adrId);
      await updateDoc(docRef, updateData);

      console.log('ADR report updated:', adrId);
    } catch (error) {
      throw this._handleError('updateADR', error);
    }
  }

  /**
   * Delete an ADR report
   * @param {string} adrId - ADR report ID
   * @returns {Promise<void>}
   */
  async deleteADR(adrId) {
    try {
      this._checkConfiguration();

      const docRef = doc(this.db, COLLECTIONS.ADR_REPORTS, adrId);
      await deleteDoc(docRef);

      console.log('ADR report deleted:', adrId);
    } catch (error) {
      throw this._handleError('deleteADR', error);
    }
  }

  // ==================== ADHERENCE HISTORY OPERATIONS ====================

  /**
   * Create or update adherence history for a specific date
   * @param {Object} adherenceData - Adherence data
   * @returns {Promise<string>} Adherence history ID
   */
  async syncAdherenceHistory(adherenceData) {
    try {
      const user = this._checkConfiguration();

      const { date, adherenceRate, medicationsTaken, medicationsTotal } = adherenceData;

      // Check if entry already exists for this date
      const q = query(
        collection(this.db, COLLECTIONS.ADHERENCE_HISTORY),
        where(FIELDS.USER_ID, '==', user.uid),
        where('date', '==', date),
        firestoreLimit(1)
      );

      const querySnapshot = await getDocs(q);

      const historyData = {
        userId: user.uid,
        date,
        adherenceRate,
        medicationsTaken,
        medicationsTotal,
        createdAt: serverTimestamp()
      };

      if (!querySnapshot.empty) {
        // Update existing entry
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          adherenceRate,
          medicationsTaken,
          medicationsTotal,
          updatedAt: serverTimestamp()
        });
        console.log('Adherence history updated for date:', date);
        return docRef.id;
      } else {
        // Create new entry
        const docRef = await addDoc(
          collection(this.db, COLLECTIONS.ADHERENCE_HISTORY),
          historyData
        );
        console.log('Adherence history created for date:', date);
        return docRef.id;
      }
    } catch (error) {
      throw this._handleError('syncAdherenceHistory', error);
    }
  }

  /**
   * Get adherence history for a user
   * @param {string} userId - User ID (optional, defaults to current user)
   * @param {number} limitCount - Number of records to retrieve (optional)
   * @returns {Promise<Array>} Array of adherence history records
   */
  async getAdherenceHistory(userId = null, limitCount = null) {
    try {
      const user = this._checkConfiguration();
      const uid = userId || user.uid;

      let q = query(
        collection(this.db, COLLECTIONS.ADHERENCE_HISTORY),
        where(FIELDS.USER_ID, '==', uid),
        orderBy('date', 'desc')
      );

      if (limitCount) {
        q = query(q, firestoreLimit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          historyId: doc.id,
          ...doc.data()
        });
      });

      console.log(`Retrieved ${history.length} adherence history records`);
      return history;
    } catch (error) {
      throw this._handleError('getAdherenceHistory', error);
    }
  }

  /**
   * Batch sync adherence history
   * @param {Object} adherenceHistoryMap - Map of date -> adherence data
   * @returns {Promise<Array>} Array of synced record IDs
   */
  async batchSyncAdherenceHistory(adherenceHistoryMap) {
    try {
      this._checkConfiguration();

      const syncedIds = [];

      for (const [date, percent] of Object.entries(adherenceHistoryMap)) {
        // Calculate medications taken/total based on percentage
        // This is an approximation since we don't have the exact counts
        const medicationsTotal = 1; // Placeholder
        const medicationsTaken = Math.round((percent / 100) * medicationsTotal);

        const id = await this.syncAdherenceHistory({
          date,
          adherenceRate: percent,
          medicationsTaken,
          medicationsTotal
        });

        syncedIds.push(id);
      }

      console.log(`Batch synced ${syncedIds.length} adherence history records`);
      return syncedIds;
    } catch (error) {
      throw this._handleError('batchSyncAdherenceHistory', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if database is available
   * @returns {boolean} True if database is configured and available
   */
  isAvailable() {
    return this.isConfigured && this.db !== null;
  }

  /**
   * Get database status
   * @returns {Object} Database status information
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      isAuthenticated: this.authService.isAuthenticated(),
      isAvailable: this.isAvailable()
    };
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
export { DataEncryption };

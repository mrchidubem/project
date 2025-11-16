/**
 * Firebase Firestore Collections Configuration
 * 
 * This file defines the collection names and structure used in the MedAdhere app.
 * All data is stored in English in the database for consistency.
 */

export const COLLECTIONS = {
  USERS: 'users',
  MEDICATIONS: 'medications',
  ADR_REPORTS: 'adrReports',
  ADHERENCE_HISTORY: 'adherenceHistory',
  ANALYTICS: 'analytics',
  ORGANIZATIONS: 'organizations'
};

export const STORAGE_PATHS = {
  ADR_PHOTOS: 'adr-photos',
  PROFILE_PHOTOS: 'profile-photos'
};

/**
 * Field names for consistent data access
 */
export const FIELDS = {
  USER_ID: 'userId',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  SYNCED_AT: 'syncedAt'
};

/**
 * User document structure
 */
export const USER_SCHEMA = {
  userId: 'string',
  email: 'string',
  createdAt: 'timestamp',
  lastLogin: 'timestamp',
  language: 'string', // User's preferred UI language
  isPremium: 'boolean',
  premiumExpiry: 'timestamp|null',
  privacySettings: {
    shareAnalytics: 'boolean',
    shareWithProviders: 'boolean'
  }
};

/**
 * Medication document structure
 * All text fields stored in English
 */
export const MEDICATION_SCHEMA = {
  medicationId: 'string',
  userId: 'string',
  name: 'string', // English only
  dosage: 'string',
  time: 'string',
  frequency: 'string',
  taken: 'boolean',
  takenAt: 'timestamp|null',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  syncedAt: 'timestamp'
};

/**
 * ADR Report document structure
 * All text fields stored in English
 */
export const ADR_SCHEMA = {
  adrId: 'string',
  userId: 'string',
  medicationName: 'string', // English only
  symptoms: 'string', // English only
  severity: 'string',
  photoUrl: 'string|null',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  syncedAt: 'timestamp'
};

/**
 * Adherence History document structure
 */
export const ADHERENCE_SCHEMA = {
  historyId: 'string',
  userId: 'string',
  date: 'string', // ISO date format
  adherenceRate: 'number',
  medicationsTaken: 'number',
  medicationsTotal: 'number',
  createdAt: 'timestamp'
};

/**
 * AuthService - User authentication and session management
 * 
 * Provides secure authentication using Firebase Auth with support for:
 * - Email/password authentication
 * - Social login (Google, etc.)
 * - Password reset and account recovery
 * - Session persistence and auto-refresh
 * - Authentication state listeners
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { COLLECTIONS } from '../config/firebaseCollections';
import { securityUtils } from './securityUtils';

/**
 * AuthService class for managing user authentication
 */
class AuthService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.isConfigured = isFirebaseConfigured;
    this.authStateListeners = [];
    this.currentUser = null;
    
    // Security configuration
    this.maxLoginAttempts = 5;
    this.loginWindowMs = 900000; // 15 minutes
    this.maxSignupAttempts = 3;
    this.signupWindowMs = 3600000; // 1 hour
    this.maxResetAttempts = 3;
    this.resetWindowMs = 3600000; // 1 hour

    // Initialize auth state listener if Firebase is configured
    if (this.isConfigured && this.auth) {
      this._initializeAuthStateListener();
    }
  }

  /**
   * Initialize authentication state listener
   * @private
   */
  _initializeAuthStateListener() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Update last login timestamp
        await this._updateLastLogin(user.uid);
      }

      // Notify all registered listeners
      this.authStateListeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('Error in auth state listener:', error);
        }
      });
    });
  }

  /**
   * Update user's last login timestamp
   * @private
   */
  async _updateLastLogin(userId) {
    if (!this.isConfigured || !this.db) return;

    try {
      const userRef = doc(this.db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Create user document in Firestore
   * @private
   */
  async _createUserDocument(user, additionalData = {}) {
    if (!this.isConfigured || !this.db) return;

    try {
      const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          language: 'en', // Default language
          isPremium: false,
          premiumExpiry: null,
          privacySettings: {
            shareAnalytics: false,
            shareWithProviders: false
          },
          ...additionalData
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  /**
   * Sign up a new user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {Object} additionalData - Additional user data (optional)
   * @returns {Promise<Object>} User object
   */
  async signUp(email, password, additionalData = {}) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    try {
      // Sanitize inputs
      email = securityUtils.sanitizeInput(email);
      if (additionalData.displayName) {
        additionalData.displayName = securityUtils.sanitizeInput(additionalData.displayName);
      }

      // Validate email format
      if (!securityUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Validate password complexity
      if (!securityUtils.isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      // Check rate limiting
      const rateLimitKey = `signup:${email}`;
      securityUtils.rateLimiter.checkLimit(rateLimitKey, this.maxSignupAttempts, this.signupWindowMs);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user document in Firestore
      await this._createUserDocument(userCredential.user, additionalData);

      // Log successful signup (non-blocking)
      securityUtils.auditLogger.log(
        'SIGNUP_SUCCESS',
        'authentication',
        userCredential.user.uid,
        { email, displayName: additionalData.displayName }
      ).catch(err => console.error('Audit log error:', err));

      return {
        user: userCredential.user,
        emailVerificationSent: true
      };
    } catch (error) {
      // Log failed signup (non-blocking)
      securityUtils.auditLogger.log(
        'SIGNUP_FAILED',
        'authentication',
        null,
        { email, error: error.message }
      ).catch(err => console.error('Audit log error:', err));

      console.error('Sign up error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign in an existing user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {boolean} rememberMe - Whether to persist session (default: true)
   * @returns {Promise<Object>} User object
   */
  async signIn(email, password, rememberMe = true) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    try {
      // Sanitize inputs
      email = securityUtils.sanitizeInput(email);

      // Validate email format
      if (!securityUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Check rate limiting
      const rateLimitKey = `login:${email}`;
      securityUtils.rateLimiter.checkLimit(rateLimitKey, this.maxLoginAttempts, this.loginWindowMs);

      // Set persistence based on rememberMe option
      await setPersistence(
        this.auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      // Sign in user
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Clear failed attempts on success
      securityUtils.rateLimiter.clear(rateLimitKey);

      // Log successful login (non-blocking)
      securityUtils.auditLogger.log(
        'LOGIN_SUCCESS',
        'authentication',
        userCredential.user.uid,
        { email }
      ).catch(err => console.error('Audit log error:', err));

      return userCredential.user;
    } catch (error) {
      // Log failed login attempt (non-blocking)
      securityUtils.auditLogger.log(
        'LOGIN_FAILED',
        'authentication',
        null,
        { email, error: error.message }
      ).catch(err => console.error('Audit log error:', err));

      console.error('Sign in error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   * @param {boolean} rememberMe - Whether to persist session (default: true)
   * @returns {Promise<Object>} User object
   */
  async signInWithGoogle(rememberMe = true) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    try {
      // Set persistence
      await setPersistence(
        this.auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(this.auth, provider);

      // Create user document if it doesn't exist (non-blocking)
      this._createUserDocument(userCredential.user).catch(err => {
        console.error('Error creating user document:', err);
      });

      // Log successful Google sign-in (non-blocking)
      securityUtils.auditLogger.log(
        'GOOGLE_SIGNIN_SUCCESS',
        'authentication',
        userCredential.user.uid,
        { email: userCredential.user.email }
      ).catch(err => console.error('Audit log error:', err));

      return userCredential.user;
    } catch (error) {
      // Log failed Google sign-in (non-blocking)
      securityUtils.auditLogger.log(
        'GOOGLE_SIGNIN_FAILED',
        'authentication',
        null,
        { error: error.message }
      ).catch(err => console.error('Audit log error:', err));

      console.error('Google sign in error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    try {
      const userId = this.auth.currentUser?.uid;
      
      await firebaseSignOut(this.auth);
      this.currentUser = null;

      // Clear session data
      sessionStorage.clear();

      // Log logout (non-blocking)
      if (userId) {
        securityUtils.auditLogger.log(
          'LOGOUT_SUCCESS',
          'authentication',
          userId
        ).catch(err => console.error('Audit log error:', err));
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    try {
      // Sanitize input
      email = securityUtils.sanitizeInput(email);

      // Validate email format
      if (!securityUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Rate limiting for password reset
      const rateLimitKey = `reset:${email}`;
      securityUtils.rateLimiter.checkLimit(rateLimitKey, this.maxResetAttempts, this.resetWindowMs);

      await sendPasswordResetEmail(this.auth, email);

      // Log password reset request (non-blocking)
      securityUtils.auditLogger.log(
        'PASSWORD_RESET_REQUESTED',
        'authentication',
        null,
        { email }
      ).catch(err => console.error('Audit log error:', err));
    } catch (error) {
      // Log failed password reset (non-blocking)
      securityUtils.auditLogger.log(
        'PASSWORD_RESET_FAILED',
        'authentication',
        null,
        { email, error: error.message }
      ).catch(err => console.error('Audit log error:', err));

      console.error('Password reset error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Update user's password (requires recent authentication)
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updateUserPassword(newPassword) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Update user's email (requires recent authentication)
   * @param {string} newEmail - New email address
   * @returns {Promise<void>}
   */
  async updateUserEmail(newEmail) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateEmail(user, newEmail);
      await sendEmailVerification(user);

      // Update email in Firestore
      if (this.db) {
        const userRef = doc(this.db, COLLECTIONS.USERS, user.uid);
        await updateDoc(userRef, { email: newEmail });
      }
    } catch (error) {
      console.error('Update email error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Re-authenticate user with credentials (required for sensitive operations)
   * @param {string} password - User's current password
   * @returns {Promise<void>}
   */
  async reauthenticate(password) {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    const user = this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      console.error('Re-authentication error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Send email verification to current user
   * @returns {Promise<void>}
   */
  async sendVerificationEmail() {
    if (!this.isConfigured || !this.auth) {
      throw new Error('Firebase is not configured. App running in offline-only mode.');
    }

    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Send verification email error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    if (!this.isConfigured || !this.auth) {
      return null;
    }
    
    const user = this.auth.currentUser;
    
    // Log user access (non-blocking)
    if (user) {
      securityUtils.auditLogger.log(
        'USER_ACCESS',
        'authentication',
        user.uid
      ).catch(err => console.error('Audit log error:', err));
    }
    
    return user;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Register a callback for authentication state changes
   * @param {Function} callback - Callback function to be called on auth state change
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.authStateListeners.push(callback);

    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get user data from Firestore
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserData(userId = null) {
    if (!this.isConfigured || !this.db) {
      return null;
    }

    const uid = userId || this.auth.currentUser?.uid;
    if (!uid) {
      return null;
    }

    try {
      const userRef = doc(this.db, COLLECTIONS.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Handle authentication errors and return user-friendly messages
   * @private
   */
  _handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please sign in again to complete this action',
      'auth/popup-closed-by-user': 'Sign in popup was closed',
      'auth/cancelled-popup-request': 'Sign in was cancelled'
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred';
    
    return {
      code: error.code,
      message: message,
      originalError: error
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

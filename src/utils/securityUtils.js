import DOMPurify from 'dompurify';

/**
 * Security Utilities Service
 * Provides input validation, sanitization, rate limiting, and audit logging
 */
export const securityUtils = {
  /**
   * Sanitize string input to prevent XSS attacks
   * @param {string} input - The input to sanitize
   * @returns {string} - Sanitized input
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous content
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    }).trim();
  },

  /**
   * Validate medication data
   * @param {Object} medication - Medication object to validate
   * @returns {string[]} - Array of error messages (empty if valid)
   */
  validateMedication: (medication) => {
    const errors = [];
    
    // Name validation
    if (!medication.name || typeof medication.name !== 'string') {
      errors.push('Medication name is required');
    } else if (medication.name.length < 2 || medication.name.length > 100) {
      errors.push('Medication name must be 2-100 characters');
    } else if (!/^[a-zA-Z0-9\s\-\.\(\)]+$/.test(medication.name)) {
      errors.push('Medication name contains invalid characters');
    }
    
    // Dosage validation
    if (!medication.dosage || typeof medication.dosage !== 'string') {
      errors.push('Dosage is required');
    } else if (!/^\d+(\.\d+)?\s*(mg|ml|g|units?|tablets?)$/i.test(medication.dosage)) {
      errors.push('Invalid dosage format (e.g., "10 mg", "5 ml")');
    }
    
    // Frequency validation
    if (medication.frequency !== undefined) {
      if (typeof medication.frequency !== 'number') {
        errors.push('Frequency must be a number');
      } else if (medication.frequency < 1 || medication.frequency > 24) {
        errors.push('Frequency must be between 1 and 24 times per day');
      }
    }
    
    return errors;
  },

  /**
   * Validate ADR report data
   * @param {Object} report - ADR report object to validate
   * @returns {string[]} - Array of error messages (empty if valid)
   */
  validateADRReport: (report) => {
    const errors = [];
    
    // Medication name
    if (!report.medicationName || typeof report.medicationName !== 'string') {
      errors.push('Medication name is required');
    } else if (report.medicationName.length < 2 || report.medicationName.length > 100) {
      errors.push('Medication name must be 2-100 characters');
    }
    
    // Reaction description
    if (!report.reaction || typeof report.reaction !== 'string') {
      errors.push('Reaction description is required');
    } else if (report.reaction.length < 10 || report.reaction.length > 1000) {
      errors.push('Reaction description must be 10-1000 characters');
    }
    
    // Severity validation
    if (!['mild', 'moderate', 'severe'].includes(report.severity)) {
      errors.push('Invalid severity level (must be mild, moderate, or severe)');
    }
    
    return errors;
  },

  /**
   * Rate limiter for preventing abuse
   */
  rateLimiter: {
    attempts: new Map(),
    
    /**
     * Check if operation is within rate limit
     * @param {string} key - Unique key for the operation
     * @param {number} maxAttempts - Maximum attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {boolean} - True if within limit
     * @throws {Error} - If rate limit exceeded
     */
    checkLimit: (key, maxAttempts = 5, windowMs = 300000) => {
      const now = Date.now();
      const attempts = securityUtils.rateLimiter.attempts.get(key) || [];
      
      // Clean old attempts outside the time window
      const validAttempts = attempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        const nextAttemptTime = validAttempts[0] + windowMs;
        const waitTime = Math.ceil((nextAttemptTime - now) / 1000 / 60);
        throw new Error(`Rate limit exceeded. Please try again in ${waitTime} minute${waitTime !== 1 ? 's' : ''}.`);
      }
      
      validAttempts.push(now);
      securityUtils.rateLimiter.attempts.set(key, validAttempts);
      return true;
    },
    
    /**
     * Clear rate limit for a specific key
     * @param {string} key - The key to clear
     */
    clear: (key) => {
      securityUtils.rateLimiter.attempts.delete(key);
    }
  },

  /**
   * Audit logger for security events
   */
  auditLogger: {
    /**
     * Log a security event
     * @param {string} action - The action being performed
     * @param {string} resource - The resource being accessed
     * @param {string|null} userId - The user ID (null if not authenticated)
     * @param {Object} additionalData - Additional data to log
     */
    log: async (action, resource, userId, additionalData = {}) => {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action,
        resource,
        userId,
        ipAddress: await securityUtils.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: securityUtils.getSessionId(),
        ...additionalData
      };
      
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log('🔒 AUDIT LOG:', auditEntry);
      }
      
      // In production, this should send to a secure audit service
      // For now, we'll store in sessionStorage for demonstration
      try {
        const logs = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
        logs.push(auditEntry);
        // Keep only last 100 logs in session storage
        if (logs.length > 100) {
          logs.shift();
        }
        sessionStorage.setItem('auditLogs', JSON.stringify(logs));
      } catch (error) {
        console.error('Failed to store audit log:', error);
      }
      
      return auditEntry;
    },
    
    /**
     * Get recent audit logs (for admin/debugging)
     * @param {number} limit - Number of logs to retrieve
     * @returns {Array} - Array of audit log entries
     */
    getLogs: (limit = 50) => {
      try {
        const logs = JSON.parse(sessionStorage.getItem('auditLogs') || '[]');
        return logs.slice(-limit);
      } catch (error) {
        console.error('Failed to retrieve audit logs:', error);
        return [];
      }
    }
  },

  /**
   * Get client IP address (approximation)
   * @returns {Promise<string>} - IP address or 'unknown'
   */
  getClientIP: async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  },

  /**
   * Generate or retrieve session ID
   * @returns {string} - Session ID
   */
  getSessionId: () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password complexity
   * @param {string} password - Password to validate
   * @returns {boolean} - True if password meets complexity requirements
   */
  isValidPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Get password strength description
   * @param {string} password - Password to check
   * @returns {Object} - Strength info with score and message
   */
  getPasswordStrength: (password) => {
    if (!password) return { score: 0, message: 'Password required' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    const messages = {
      0: 'Very weak',
      1: 'Weak',
      2: 'Fair',
      3: 'Good',
      4: 'Strong',
      5: 'Very strong'
    };
    
    return {
      score,
      message: messages[score],
      checks,
      isValid: score >= 5
    };
  }
};

export default securityUtils;

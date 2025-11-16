import { securityUtils } from './securityUtils';
import authService from './authService';

/**
 * Security Middleware
 * Provides composable middleware functions for protecting operations
 */
export const securityMiddleware = {
  /**
   * Require authentication middleware
   * Wraps an operation to ensure user is authenticated
   * @param {Function} operation - The operation to protect
   * @returns {Function} - Wrapped operation
   */
  requireAuth: (operation) => {
    return async (...args) => {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }
      
      // Log the operation
      await securityUtils.auditLogger.log(
        'PROTECTED_OPERATION',
        operation.name || 'anonymous_operation',
        user.uid
      );
      
      return operation(...args);
    };
  },

  /**
   * Validate inputs middleware
   * Wraps an operation to validate and sanitize inputs
   * @param {Function} validator - Validation function that returns array of errors
   * @returns {Function} - Middleware function
   */
  validateInputs: (validator) => {
    return (operation) => {
      return async (data, ...args) => {
        // Sanitize all string inputs
        const sanitizedData = Object.keys(data).reduce((acc, key) => {
          acc[key] = typeof data[key] === 'string' 
            ? securityUtils.sanitizeInput(data[key]) 
            : data[key];
          return acc;
        }, {});
        
        // Validate the data
        const errors = validator(sanitizedData);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
        
        return operation(sanitizedData, ...args);
      };
    };
  },

  /**
   * Rate limiting middleware
   * Wraps an operation to enforce rate limits
   * @param {string} key - Base key for rate limiting
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Function} - Middleware function
   */
  rateLimit: (key, maxAttempts = 10, windowMs = 60000) => {
    return (operation) => {
      return async (...args) => {
        const user = authService.getCurrentUser();
        const rateLimitKey = `${key}:${user?.uid || 'anonymous'}`;
        
        securityUtils.rateLimiter.checkLimit(rateLimitKey, maxAttempts, windowMs);
        
        return operation(...args);
      };
    };
  },

  /**
   * Audit logging middleware
   * Wraps an operation to automatically log it
   * @param {string} action - Action name for audit log
   * @param {string} resource - Resource being accessed
   * @returns {Function} - Middleware function
   */
  auditLog: (action, resource) => {
    return (operation) => {
      return async (...args) => {
        const user = authService.getCurrentUser();
        const startTime = Date.now();
        
        try {
          const result = await operation(...args);
          
          // Log successful operation
          await securityUtils.auditLogger.log(
            action,
            resource,
            user?.uid || null,
            { 
              success: true,
              duration: Date.now() - startTime
            }
          );
          
          return result;
        } catch (error) {
          // Log failed operation
          await securityUtils.auditLogger.log(
            action,
            resource,
            user?.uid || null,
            { 
              success: false,
              error: error.message,
              duration: Date.now() - startTime
            }
          );
          
          throw error;
        }
      };
    };
  },

  /**
   * Compose multiple middleware functions
   * Applies middleware from right to left (like function composition)
   * @param {...Function} middlewares - Middleware functions to compose
   * @returns {Function} - Composed middleware function
   */
  compose: (...middlewares) => {
    return (operation) => {
      return middlewares.reduceRight(
        (wrapped, middleware) => middleware(wrapped),
        operation
      );
    };
  }
};

/**
 * Example usage:
 * 
 * // Single middleware
 * const protectedOperation = securityMiddleware.requireAuth(myOperation);
 * 
 * // Multiple middleware with composition
 * const secureOperation = securityMiddleware.compose(
 *   securityMiddleware.requireAuth,
 *   securityMiddleware.rateLimit('addMedication', 10, 60000),
 *   securityMiddleware.auditLog('ADD_MEDICATION', 'medications')
 * )(myOperation);
 * 
 * // With validation
 * const validatedOperation = securityMiddleware.validateInputs(
 *   securityUtils.validateMedication
 * )(myOperation);
 */

export default securityMiddleware;

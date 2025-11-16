import { useEffect } from 'react';
import './Toast.css';

/**
 * Toast Component
 * 
 * A temporary notification that appears and auto-dismisses.
 * Mobile-optimized with touch-friendly dismiss.
 * 
 * Note: For production, consider using a toast context/provider system.
 * 
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info'} props.variant - Toast type
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {number} props.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {boolean} props.dismissible - Whether toast can be manually dismissed
 * @param {Function} props.onDismiss - Dismiss handler
 * @param {'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'} props.position - Toast position
 * @param {string} props.className - Additional CSS classes
 */
const Toast = ({
  variant = 'info',
  title,
  message,
  duration = 5000,
  dismissible = true,
  onDismiss,
  position = 'top-right',
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const classNames = [
    'toast',
    `toast--${variant}`,
    `toast--${position}`,
    className
  ].filter(Boolean).join(' ');

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div className={classNames} role="alert" {...props}>
      <div className="toast__icon" aria-hidden="true">
        {icons[variant]}
      </div>
      
      <div className="toast__content">
        {title && (
          <div className="toast__title">
            {title}
          </div>
        )}
        {message && (
          <div className="toast__message">
            {message}
          </div>
        )}
      </div>
      
      {dismissible && (
        <button
          className="toast__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      {duration > 0 && (
        <div className="toast__progress" style={{ animationDuration: `${duration}ms` }} />
      )}
    </div>
  );
};

export default Toast;

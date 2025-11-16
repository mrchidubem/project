import './Alert.css';

/**
 * Alert Component
 * 
 * An inline message component for displaying important information.
 * Mobile-optimized with clear visual hierarchy.
 * 
 * @param {Object} props
 * @param {'success' | 'warning' | 'error' | 'info'} props.variant - Alert type
 * @param {string} props.title - Alert title
 * @param {React.ReactNode} props.children - Alert content
 * @param {boolean} props.dismissible - Whether alert can be dismissed
 * @param {Function} props.onDismiss - Dismiss handler
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {string} props.className - Additional CSS classes
 */
const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  ...props
}) => {
  const classNames = [
    'alert',
    `alert--${variant}`,
    className
  ].filter(Boolean).join(' ');

  const defaultIcons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={classNames} role="alert" {...props}>
      {displayIcon && (
        <div className="alert__icon" aria-hidden="true">
          {displayIcon}
        </div>
      )}
      
      <div className="alert__content">
        {title && (
          <div className="alert__title">
            {title}
          </div>
        )}
        {children && (
          <div className="alert__message">
            {children}
          </div>
        )}
      </div>
      
      {dismissible && (
        <button
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          type="button"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
